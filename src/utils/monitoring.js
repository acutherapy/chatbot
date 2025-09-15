/**
 * 监控和告警系统
 */

import winston from 'winston';
import { logInfo, logError } from './logger.js';

// 创建监控日志器
const monitoringLogger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'logs/monitoring.log' }),
    new winston.transports.Console({
      format: winston.format.simple()
    })
  ]
});

// 性能指标存储
const metrics = {
  requestCount: 0,
  errorCount: 0,
  responseTimes: [],
  memoryUsage: [],
  apiCalls: {
    openai: { success: 0, failure: 0, totalTime: 0 },
    meta: { success: 0, failure: 0, totalTime: 0 }
  }
};

/**
 * 记录请求指标
 */
export function recordRequest(req, res, responseTime) {
  metrics.requestCount++;
  metrics.responseTimes.push(responseTime);
  
  // 保持最近1000个响应时间
  if (metrics.responseTimes.length > 1000) {
    metrics.responseTimes.shift();
  }
  
  // 记录内存使用
  const memUsage = process.memoryUsage();
  metrics.memoryUsage.push({
    timestamp: Date.now(),
    heapUsed: memUsage.heapUsed,
    heapTotal: memUsage.heapTotal,
    external: memUsage.external
  });
  
  // 保持最近100个内存快照
  if (metrics.memoryUsage.length > 100) {
    metrics.memoryUsage.shift();
  }
  
  // 记录请求日志
  monitoringLogger.info('Request completed', {
    method: req.method,
    url: req.url,
    statusCode: res.statusCode,
    responseTime,
    userAgent: req.get('User-Agent'),
    ip: req.ip
  });
  
  // 检查异常情况
  checkAnomalies();
}

/**
 * 记录错误
 */
export function recordError(error, context = {}) {
  metrics.errorCount++;
  
  monitoringLogger.error('Error occurred', {
    error: error.message,
    stack: error.stack,
    context
  });
  
  // 检查错误率
  const errorRate = metrics.errorCount / metrics.requestCount;
  if (errorRate > 0.1) { // 错误率超过10%
    sendAlert('High error rate detected', {
      errorRate: (errorRate * 100).toFixed(2) + '%',
      totalRequests: metrics.requestCount,
      totalErrors: metrics.errorCount
    });
  }
}

/**
 * 记录API调用
 */
export function recordApiCall(service, success, responseTime) {
  metrics.apiCalls[service].totalTime += responseTime;
  
  if (success) {
    metrics.apiCalls[service].success++;
  } else {
    metrics.apiCalls[service].failure++;
    
    // 检查API失败率
    const totalCalls = metrics.apiCalls[service].success + metrics.apiCalls[service].failure;
    const failureRate = metrics.apiCalls[service].failure / totalCalls;
    
    if (failureRate > 0.2) { // 失败率超过20%
      sendAlert(`${service} API high failure rate`, {
        service,
        failureRate: (failureRate * 100).toFixed(2) + '%',
        totalCalls,
        failures: metrics.apiCalls[service].failure
      });
    }
  }
}

/**
 * 检查异常情况
 */
function checkAnomalies() {
  // 检查响应时间
  if (metrics.responseTimes.length > 10) {
    const avgResponseTime = metrics.responseTimes.reduce((a, b) => a + b, 0) / metrics.responseTimes.length;
    const maxResponseTime = Math.max(...metrics.responseTimes);
    
    if (avgResponseTime > 5000) { // 平均响应时间超过5秒
      sendAlert('High average response time', {
        avgResponseTime: avgResponseTime.toFixed(2) + 'ms',
        maxResponseTime: maxResponseTime + 'ms'
      });
    }
  }
  
  // 检查内存使用
  if (metrics.memoryUsage.length > 0) {
    const latestMemory = metrics.memoryUsage[metrics.memoryUsage.length - 1];
    const memoryUsageMB = latestMemory.heapUsed / 1024 / 1024;
    
    if (memoryUsageMB > 500) { // 内存使用超过500MB
      sendAlert('High memory usage', {
        memoryUsage: memoryUsageMB.toFixed(2) + 'MB',
        heapTotal: (latestMemory.heapTotal / 1024 / 1024).toFixed(2) + 'MB'
      });
    }
  }
}

/**
 * 发送告警
 */
function sendAlert(title, data) {
  const alert = {
    timestamp: new Date().toISOString(),
    title,
    data,
    severity: 'warning'
  };
  
  monitoringLogger.warn('Alert triggered', alert);
  
  // 这里可以集成实际的告警系统
  // 例如：发送邮件、Slack通知、短信等
  console.log('🚨 ALERT:', title, data);
  
  // 示例：发送到外部监控服务
  // sendToMonitoringService(alert);
}

/**
 * 获取系统指标
 */
export function getMetrics() {
  const avgResponseTime = metrics.responseTimes.length > 0 
    ? metrics.responseTimes.reduce((a, b) => a + b, 0) / metrics.responseTimes.length 
    : 0;
    
  const errorRate = metrics.requestCount > 0 
    ? (metrics.errorCount / metrics.requestCount) * 100 
    : 0;
    
  const latestMemory = metrics.memoryUsage.length > 0 
    ? metrics.memoryUsage[metrics.memoryUsage.length - 1] 
    : null;
    
  return {
    requestCount: metrics.requestCount,
    errorCount: metrics.errorCount,
    errorRate: errorRate.toFixed(2) + '%',
    avgResponseTime: avgResponseTime.toFixed(2) + 'ms',
    memoryUsage: latestMemory ? {
      heapUsed: (latestMemory.heapUsed / 1024 / 1024).toFixed(2) + 'MB',
      heapTotal: (latestMemory.heapTotal / 1024 / 1024).toFixed(2) + 'MB'
    } : null,
    apiCalls: Object.keys(metrics.apiCalls).reduce((acc, service) => {
      const serviceMetrics = metrics.apiCalls[service];
      const totalCalls = serviceMetrics.success + serviceMetrics.failure;
      acc[service] = {
        totalCalls,
        successRate: totalCalls > 0 ? ((serviceMetrics.success / totalCalls) * 100).toFixed(2) + '%' : '0%',
        avgResponseTime: totalCalls > 0 ? (serviceMetrics.totalTime / totalCalls).toFixed(2) + 'ms' : '0ms'
      };
      return acc;
    }, {})
  };
}

/**
 * 健康检查
 */
export function healthCheck() {
  const metrics = getMetrics();
  const memUsage = process.memoryUsage();
  
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: {
      used: (memUsage.heapUsed / 1024 / 1024).toFixed(2) + 'MB',
      total: (memUsage.heapTotal / 1024 / 1024).toFixed(2) + 'MB',
      external: (memUsage.external / 1024 / 1024).toFixed(2) + 'MB'
    },
    metrics
  };
  
  // 检查健康状态
  if (parseFloat(metrics.errorRate) > 10) {
    health.status = 'degraded';
    health.issues = ['High error rate'];
  }
  
  if (parseFloat(metrics.avgResponseTime) > 5000) {
    health.status = health.status === 'healthy' ? 'degraded' : 'unhealthy';
    health.issues = [...(health.issues || []), 'High response time'];
  }
  
  if (parseFloat(metrics.memoryUsage?.heapUsed) > 1000) {
    health.status = 'unhealthy';
    health.issues = [...(health.issues || []), 'High memory usage'];
  }
  
  return health;
}

/**
 * 重置指标
 */
export function resetMetrics() {
  metrics.requestCount = 0;
  metrics.errorCount = 0;
  metrics.responseTimes = [];
  metrics.memoryUsage = [];
  Object.keys(metrics.apiCalls).forEach(service => {
    metrics.apiCalls[service] = { success: 0, failure: 0, totalTime: 0 };
  });
}
