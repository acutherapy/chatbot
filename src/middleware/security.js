/**
 * 安全中间件
 */

import crypto from 'crypto';
import { logInfo, logError } from '../utils/logger.js';

/**
 * 验证 Meta Webhook 签名
 */
export const verifyMetaSignature = (req, res, next) => {
  try {
    const signature = req.headers['x-hub-signature-256'];
    const appSecret = process.env.META_APP_SECRET;
    
    if (!signature || !appSecret) {
      logError('Missing signature or app secret for Meta webhook');
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    const expectedSignature = 'sha256=' + crypto
      .createHmac('sha256', appSecret)
      .update(JSON.stringify(req.body))
      .digest('hex');
    
    if (signature !== expectedSignature) {
      logError('Invalid Meta webhook signature');
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    next();
  } catch (error) {
    logError('Error verifying Meta signature', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * 数据脱敏中间件
 */
export const sanitizeData = (req, res, next) => {
  try {
    // 脱敏用户输入中的敏感信息
    if (req.body && req.body.message) {
      req.body.originalMessage = req.body.message;
      req.body.message = sanitizeMessage(req.body.message);
    }
    
    next();
  } catch (error) {
    logError('Error sanitizing data', error);
    next();
  }
};

/**
 * 脱敏消息内容
 */
function sanitizeMessage(message) {
  if (!message || typeof message !== 'string') {
    return message;
  }
  
  // 移除手机号码
  let sanitized = message.replace(/\b1[3-9]\d{9}\b/g, '***-****-****');
  
  // 移除邮箱地址
  sanitized = sanitized.replace(/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}/g, '***@***.***');
  
  // 移除身份证号码
  sanitized = sanitized.replace(/\b\d{17}[\dXx]\b/g, '***-****-****-****-***');
  
  // 移除银行卡号
  sanitized = sanitized.replace(/\b\d{16,19}\b/g, '****-****-****-****');
  
  return sanitized;
}

/**
 * 请求频率限制
 */
export const rateLimit = (windowMs = 15 * 60 * 1000, max = 100) => {
  const requests = new Map();
  
  return (req, res, next) => {
    const key = req.ip || req.connection.remoteAddress;
    const now = Date.now();
    const windowStart = now - windowMs;
    
    // 清理过期记录
    if (requests.has(key)) {
      const userRequests = requests.get(key).filter(time => time > windowStart);
      requests.set(key, userRequests);
    } else {
      requests.set(key, []);
    }
    
    const userRequests = requests.get(key);
    
    if (userRequests.length >= max) {
      logError(`Rate limit exceeded for IP: ${key}`);
      return res.status(429).json({
        error: 'Too many requests',
        retryAfter: Math.ceil(windowMs / 1000)
      });
    }
    
    userRequests.push(now);
    next();
  };
};

/**
 * 输入验证和清理
 */
export const validateInput = (req, res, next) => {
  try {
    // 验证消息长度
    if (req.body.message && req.body.message.length > 1000) {
      return res.status(400).json({
        error: 'Message too long',
        maxLength: 1000
      });
    }
    
    // 验证用户ID格式
    if (req.body.userId && !/^[a-zA-Z0-9_-]+$/.test(req.body.userId)) {
      return res.status(400).json({
        error: 'Invalid user ID format'
      });
    }
    
    // 清理HTML标签
    if (req.body.message) {
      req.body.message = req.body.message.replace(/<[^>]*>/g, '');
    }
    
    next();
  } catch (error) {
    logError('Error validating input', error);
    res.status(400).json({ error: 'Invalid input' });
  }
};

/**
 * 安全头设置
 */
export const securityHeaders = (req, res, next) => {
  // 设置安全头
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // 对于API请求，设置CORS头
  if (req.path.startsWith('/api/') || req.path.startsWith('/chat/')) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  }
  
  next();
};
