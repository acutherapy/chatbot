// Vercel 无服务器函数入口点
import express from 'express';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 创建 Express 应用
const app = express();

// 基本中间件
app.use(cors({
  origin: '*',
  credentials: false
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 允许 iframe 嵌入
app.use((req, res, next) => {
  res.removeHeader('X-Frame-Options');
  res.setHeader('X-Frame-Options', 'ALLOWALL');
  next();
});

// 静态文件服务
app.use(express.static(join(__dirname, '../public')));

// 允许跨域访问 SDK
app.use('/js/chatbot-sdk.js', (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.sendFile(join(__dirname, '../public/js/chatbot-sdk.js'));
});

// 基本路由
app.get('/', (req, res) => {
  res.sendFile(join(__dirname, '../public/index.html'));
});

// 嵌入页面路由
app.get('/embed.html', (req, res) => {
  res.setHeader('X-Frame-Options', 'ALLOWALL');
  res.setHeader('Content-Security-Policy', "frame-ancestors *");
  res.sendFile(join(__dirname, '../public/embed.html'));
});

// 简单嵌入页面路由
app.get('/simple-embed.html', (req, res) => {
  res.setHeader('X-Frame-Options', 'ALLOWALL');
  res.setHeader('Content-Security-Policy', "frame-ancestors *");
  res.sendFile(join(__dirname, '../public/simple-embed.html'));
});

app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    message: 'Chatbot server is running'
  });
});

app.get('/api/status', (req, res) => {
  res.json({
    name: 'Multi-Platform Chatbot',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString()
  });
});

// 聊天 API
app.post('/chat/message', (req, res) => {
  const { message } = req.body;
  
  if (!message) {
    return res.status(400).json({
      success: false,
      error: 'Message is required'
    });
  }

  // 简单的回复逻辑（暂时不使用 GPT）
  const responses = [
    '感谢您的消息！我们的客服团队会尽快回复您。',
    '您好！我是诊所客服助手，有什么可以帮助您的吗？',
    '请稍等，我正在为您查询相关信息...',
    '感谢您的咨询，我们会为您提供专业的医疗服务。'
  ];

  const randomResponse = responses[Math.floor(Math.random() * responses.length)];

  res.json({
    success: true,
    data: {
      message: randomResponse,
      timestamp: new Date().toISOString()
    }
  });
});

// Webhook 端点
app.get('/webhook', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === process.env.META_VERIFY_TOKEN) {
    res.status(200).send(challenge);
  } else {
    res.status(403).json({ error: 'Forbidden' });
  }
});

app.post('/webhook', (req, res) => {
  // 简单的 webhook 处理
  console.log('Webhook received:', req.body);
  res.status(200).send('EVENT_RECEIVED');
});

// 404 处理
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `路径 ${req.originalUrl} 不存在`,
    timestamp: new Date().toISOString()
  });
});

// 错误处理
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: '服务器内部错误',
    timestamp: new Date().toISOString()
  });
});

// 导出给 Vercel
export default app;
