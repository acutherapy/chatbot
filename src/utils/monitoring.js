import winston from 'winston';
import { config } from '../config/index.js';

// 创建监控日志器
const monitoringLogger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.simple()
    }),
    new winston.transports.File({ 
      filename: 'logs/monitoring.log',
      maxsize: 5242880, // 5MB
      maxFiles: 5
    })
  ]
});

// 性能指标收集
class PerformanceMonitor {
  constructor() {
    this.metrics = {
      requestCount: 0,
      errorCount: 0,
      averageResponseTime: 0,
      responseTimeSum: 0,
      startTime: Date.now()
    };
    this.alerts = [];
  }

  // 记录请求
  recordRequest(responseTime, success = true) {
    this.metrics.requestCount++;
    this.metrics.responseTimeSum += responseTime;
    this.metrics.averageResponseTime = this.metrics.responseTimeSum / this.metrics.requestCount;
    
    if (!success) {
      this.metrics.errorCount++;
    }

    // 检查是否需要告警
    this.checkAlerts(responseTime, success);
  }

  // 检查告警条件
  checkAlerts(responseTime, success) {
    const errorRate = this.metrics.errorCount / this.metrics.requestCount;
    
    // 错误率告警
    if (errorRate > 0.1) { // 错误率超过10%
      this.triggerAlert('HIGH_ERROR_RATE', {
        errorRate: errorRate,
        threshold: 0.1,
        message: `错误率过高: ${(errorRate * 100).toFixed(1)}%`
      });
    }

    // 响应时间告警
    if (responseTime > 5000) { // 响应时间超过5秒
      this.triggerAlert('SLOW_RESPONSE', {
        responseTime: responseTime,
        threshold: 5000,
        message: `响应时间过慢: ${responseTime}ms`
      });
    }

    // 平均响应时间告警
    if (this.metrics.averageResponseTime > 3000) { // 平均响应时间超过3秒
      this.triggerAlert('HIGH_AVERAGE_RESPONSE_TIME', {
        averageResponseTime: this.metrics.averageResponseTime,
        threshold: 3000,
        message: `平均响应时间过高: ${this.metrics.averageResponseTime.toFixed(0)}ms`
      });
    }
  }

  // 触发告警
  triggerAlert(type, data) {
    const alert = {
      type,
      timestamp: new Date().toISOString(),
      data,
      id: `${type}_${Date.now()}`
    };

    // 避免重复告警（5分钟内相同类型的告警只发送一次）
    const recentAlert = this.alerts.find(a => 
      a.type === type && 
      Date.now() - new Date(a.timestamp).getTime() < 5 * 60 * 1000
    );

    if (!recentAlert) {
      this.alerts.push(alert);
      this.sendAlert(alert);
    }
  }

  // 发送告警
  async sendAlert(alert) {
    monitoringLogger.error('ALERT_TRIGGERED', alert);

    // 发送到 Slack（如果配置了）
    if (config.monitoring.slackWebhook) {
      await this.sendSlackAlert(alert);
    }

    // 发送邮件（如果配置了）
    if (config.monitoring.email) {
      await this.sendEmailAlert(alert);
    }
  }

  // 发送 Slack 告警
  async sendSlackAlert(alert) {
    try {
      const message = {
        text: '🚨 聊天机器人告警',
        attachments: [{
          color: 'danger',
          fields: [
            {
              title: '告警类型',
              value: alert.type,
              short: true
            },
            {
              title: '时间',
              value: alert.timestamp,
              short: true
            },
            {
              title: '详情',
              value: alert.data.message,
              short: false
            }
          ]
        }]
      };

      await fetch(config.monitoring.slackWebhook, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(message)
      });
    } catch (error) {
      monitoringLogger.error('Failed to send Slack alert', error);
    }
  }

  // 发送邮件告警
  async sendEmailAlert(alert) {
    // 这里可以集成邮件服务，如 SendGrid, AWS SES 等
    monitoringLogger.info('Email alert would be sent', alert);
  }

  // 获取性能指标
  getMetrics() {
    const uptime = Date.now() - this.metrics.startTime;
    return {
      ...this.metrics,
      uptime,
      errorRate: this.metrics.errorCount / this.metrics.requestCount,
      requestsPerMinute: (this.metrics.requestCount / (uptime / 60000)).toFixed(2)
    };
  }

  // 重置指标
  reset() {
    this.metrics = {
      requestCount: 0,
      errorCount: 0,
      averageResponseTime: 0,
      responseTimeSum: 0,
      startTime: Date.now()
    };
  }
}

// 创建全局监控实例
export const performanceMonitor = new PerformanceMonitor();

// 健康检查监控
export class HealthMonitor {
  constructor() {
    this.checks = new Map();
    this.startPeriodicChecks();
  }

  // 注册健康检查
  registerCheck(name, checkFunction, interval = 60000) {
    this.checks.set(name, {
      function: checkFunction,
      interval,
      lastCheck: null,
      lastResult: null,
      nextCheck: Date.now()
    });
  }

  // 执行健康检查
  async runCheck(name) {
    const check = this.checks.get(name);
    if (!check) return;

    try {
      const result = await check.function();
      check.lastResult = {
        status: 'healthy',
        data: result,
        timestamp: new Date().toISOString()
      };
      check.lastCheck = Date.now();
      check.nextCheck = Date.now() + check.interval;

      monitoringLogger.info(`Health check passed: ${name}`, result);
    } catch (error) {
      check.lastResult = {
        status: 'unhealthy',
        error: error.message,
        timestamp: new Date().toISOString()
      };
      check.lastCheck = Date.now();
      check.nextCheck = Date.now() + check.interval;

      monitoringLogger.error(`Health check failed: ${name}`, error);
      
      // 触发告警
      performanceMonitor.triggerAlert('HEALTH_CHECK_FAILED', {
        checkName: name,
        error: error.message,
        message: `健康检查失败: ${name}`
      });
    }
  }

  // 开始定期检查
  startPeriodicChecks() {
    setInterval(() => {
      const now = Date.now();
      for (const [name, check] of this.checks) {
        if (now >= check.nextCheck) {
          this.runCheck(name);
        }
      }
    }, 10000); // 每10秒检查一次
  }

  // 获取所有健康检查状态
  getStatus() {
    const status = {};
    for (const [name, check] of this.checks) {
      status[name] = check.lastResult;
    }
    return status;
  }
}

// 创建全局健康监控实例
export const healthMonitor = new HealthMonitor();

// 注册默认健康检查
healthMonitor.registerCheck('database', async () => {
  // 这里可以添加数据库连接检查
  return { connected: true };
});

healthMonitor.registerCheck('openai', async () => {
  // 检查 OpenAI API 连接
  if (!config.openai.apiKey) {
    throw new Error('OpenAI API key not configured');
  }
  return { configured: true };
});

healthMonitor.registerCheck('memory', async () => {
  const memUsage = process.memoryUsage();
  const heapUsedMB = memUsage.heapUsed / 1024 / 1024;
  
  if (heapUsedMB > 500) { // 内存使用超过500MB
    throw new Error(`Memory usage too high: ${heapUsedMB.toFixed(1)}MB`);
  }
  
  return { 
    heapUsed: heapUsedMB,
    heapTotal: memUsage.heapTotal / 1024 / 1024,
    rss: memUsage.rss / 1024 / 1024
  };
});

// 导出监控工具函数
export const logPerformance = (operation, duration, success = true) => {
  performanceMonitor.recordRequest(duration, success);
  monitoringLogger.info('Performance metric', {
    operation,
    duration,
    success,
    timestamp: new Date().toISOString()
  });
};

export const logError = (error, context = {}) => {
  monitoringLogger.error('Application error', {
    error: error.message,
    stack: error.stack,
    context,
    timestamp: new Date().toISOString()
  });
};

export const logInfo = (message, data = {}) => {
  monitoringLogger.info(message, {
    ...data,
    timestamp: new Date().toISOString()
  });
};