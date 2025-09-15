import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// 导入配置和中间件
import { config, validateConfig } from './config/index.js';
import { requestLogger, errorLogger } from './utils/logger.js';

// 导入路由
import webhookRouter from './routes/webhook.js';
import chatRouter from './routes/chat.js';

// 导入服务
import messageSender from './services/messageSender.js';
import knowledgeService from './services/knowledgeService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 验证配置（在 Vercel 环境中跳过严格验证）
try {
  validateConfig();
  console.log('✅ Configuration validated successfully');
} catch (error) {
  console.warn('⚠️ Configuration validation failed:', error.message);
  console.log('🔄 Continuing in production mode...');
}

// 创建 Express 应用
const app = express();

// 安全中间件
app.use(helmet(config.security.helmet));

// CORS 配置
app.use(cors({
  origin: config.security.corsOrigin,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// 请求解析中间件
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 请求日志中间件
app.use(requestLogger);

// 速率限制
const limiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.maxRequests,
  message: {
    error: '请求过于频繁，请稍后再试',
    retryAfter: Math.ceil(config.rateLimit.windowMs / 1000)
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // 跳过 webhook 验证请求
    return req.path === '/webhook' && req.method === 'GET';
  }
});

app.use(limiter);

// 静态文件服务
app.use(express.static(join(__dirname, '../public')));

// API 路由
app.use('/webhook', webhookRouter);
app.use('/chat', chatRouter);

// 健康检查端点
app.get('/health', async (req, res) => {
  try {
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      services: {
        openai: 'connected',
        knowledgeBase: 'loaded',
        messageSender: 'ready'
      }
    };

    // 检查 Meta API 连接
    try {
      const isValid = await messageSender.validateAccessToken();
      health.services.meta = isValid ? 'connected' : 'disconnected';
    } catch (error) {
      health.services.meta = 'error';
    }

    // 检查知识库
    const kbStats = knowledgeService.getStats();
    health.services.knowledgeBase = kbStats.totalFAQ > 0 ? 'loaded' : 'empty';

    res.json(health);
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
});

// API 状态端点
app.get('/api/status', (req, res) => {
  res.json({
    name: 'Multi-Platform Chatbot',
    version: '1.0.0',
    environment: config.nodeEnv,
    timestamp: new Date().toISOString(),
    endpoints: {
      webhook: '/webhook',
      chat: '/chat',
      health: '/health',
      static: '/'
    }
  });
});

// 知识库管理端点
app.get('/api/knowledge/stats', (req, res) => {
  try {
    const stats = knowledgeService.getStats();
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to get knowledge base stats'
    });
  }
});

app.post('/api/knowledge/reload', (req, res) => {
  try {
    knowledgeService.reloadKnowledgeBase();
    res.json({
      success: true,
      message: 'Knowledge base reloaded successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to reload knowledge base'
    });
  }
});

// 根路径 - 返回聊天界面
app.get('/', (req, res) => {
  res.sendFile(join(__dirname, '../public/index.html'));
});

// 404 处理
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `路径 ${req.originalUrl} 不存在`,
    timestamp: new Date().toISOString()
  });
});

// 错误处理中间件
app.use(errorLogger);

// 全局错误处理
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  
  res.status(err.status || 500).json({
    error: 'Internal Server Error',
    message: config.nodeEnv === 'development' ? err.message : '服务器内部错误',
    timestamp: new Date().toISOString(),
    ...(config.nodeEnv === 'development' && { stack: err.stack })
  });
});

// 优雅关闭处理
const gracefulShutdown = (signal) => {
  console.log(`\n🔄 收到 ${signal} 信号，开始优雅关闭...`);
  
  server.close(() => {
    console.log('✅ HTTP 服务器已关闭');
    
    // 清理资源
    console.log('🧹 清理资源...');
    
    // 这里可以添加数据库连接关闭等清理操作
    
    console.log('✅ 优雅关闭完成');
    process.exit(0);
  });
  
  // 强制关闭超时
  setTimeout(() => {
    console.error('❌ 强制关闭服务器');
    process.exit(1);
  }, 10000);
};

// 监听关闭信号
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// 未捕获的异常处理
process.on('uncaughtException', (err) => {
  console.error('❌ 未捕获的异常:', err);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ 未处理的 Promise 拒绝:', reason);
  process.exit(1);
});

// 启动服务器
const server = app.listen(config.port, () => {
  console.log(`
🚀 多平台聊天机器人服务器已启动！

📊 服务器信息:
   • 端口: ${config.port}
   • 环境: ${config.nodeEnv}
   • 时间: ${new Date().toLocaleString('zh-CN')}

🔗 访问地址:
   • 聊天界面: http://localhost:${config.port}
   • 健康检查: http://localhost:${config.port}/health
   • API 状态: http://localhost:${config.port}/api/status
   • Webhook: http://localhost:${config.port}/webhook

📚 知识库:
   • FAQ 数量: ${knowledgeService.getStats().totalFAQ}
   • 分类数量: ${knowledgeService.getStats().totalCategories}

💡 提示:
   • 使用 Ctrl+C 优雅关闭服务器
   • 查看日志文件了解运行状态
   • 配置环境变量后重启服务器
  `);
});

// 导出应用（用于测试）
export default app;
