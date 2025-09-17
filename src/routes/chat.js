import express from 'express';
import { body, validationResult } from 'express-validator';
import { config } from '../config/index.js';
import { logInfo, logError } from '../utils/logger.js';
import gptService from '../services/gptService.js';
import knowledgeService from '../services/knowledgeService.js';

const router = express.Router();

/**
 * 发送消息到聊天机器人
 * POST /chat/message
 */
router.post('/message', [
  body('message')
    .trim()
    .isLength({ min: 1, max: 1000 })
    .withMessage('消息长度必须在 1-1000 字符之间'),
  body('userId')
    .optional()
    .isLength({ min: 1, max: 100 })
    .withMessage('用户ID长度必须在 1-100 字符之间'),
  body('sessionId')
    .optional()
    .isLength({ min: 1, max: 100 })
    .withMessage('会话ID长度必须在 1-100 字符之间')
], async (req, res) => {
  try {
    // 验证输入
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: '输入验证失败',
        details: errors.array()
      });
    }

    const { message, userId, sessionId } = req.body;
    
    // 生成用户ID（如果没有提供）
    const finalUserId = userId || generateUserId(req);
    const finalSessionId = sessionId || generateSessionId(req);

    logInfo('Chat message received', { 
      userId: finalUserId, 
      sessionId: finalSessionId,
      messageLength: message.length,
      ip: req.ip 
    });

    // 首先尝试从固定问答中查找答案
    const faqResult = knowledgeService.getSmartAnswer(message);
    let aiResponse;
    let isAppointment = false;
    let quickReplies = null;

    if (faqResult.found && faqResult.answer) {
      // 使用固定问答的答案
      aiResponse = faqResult.answer;
      quickReplies = faqResult.suggestions;
      logInfo('FAQ answer found', { 
        userId: finalUserId, 
        query: message,
        source: 'knowledge_base'
      });
    } else {
      // 如果没有找到固定答案，使用 AI 生成回复
      aiResponse = await gptService.generateResponse(
        message, 
        finalUserId, 
        'web'
      );
      
      // 检查是否为预约查询
      isAppointment = gptService.isAppointmentQuery(message);
      quickReplies = isAppointment ? getAppointmentQuickReplies() : null;
      
      logInfo('AI response generated', { 
        userId: finalUserId, 
        query: message,
        source: 'gpt_service'
      });
    }

    logInfo('Chat response generated', { 
      userId: finalUserId, 
      sessionId: finalSessionId,
      responseLength: aiResponse.length,
      isAppointment 
    });

    // 返回响应
    res.json({
      success: true,
      data: {
        message: aiResponse,
        userId: finalUserId,
        sessionId: finalSessionId,
        timestamp: new Date().toISOString(),
        isAppointment,
        quickReplies: quickReplies
      }
    });

  } catch (error) {
    logError('Error processing chat message', error, { 
      userId: req.body.userId,
      ip: req.ip 
    });

    res.status(500).json({
      success: false,
      error: '服务器内部错误',
      message: '处理您的消息时出现了问题，请稍后再试。'
    });
  }
});

/**
 * 清除用户会话历史
 * DELETE /chat/session/:userId
 */
router.delete('/session/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId || userId.length > 100) {
      return res.status(400).json({
        success: false,
        error: '无效的用户ID'
      });
    }

    // 清除对话历史
    gptService.clearConversationHistory(userId);

    logInfo('Session cleared', { userId, ip: req.ip });

    res.json({
      success: true,
      message: '会话历史已清除'
    });

  } catch (error) {
    logError('Error clearing session', error, { 
      userId: req.params.userId,
      ip: req.ip 
    });

    res.status(500).json({
      success: false,
      error: '服务器内部错误'
    });
  }
});

/**
 * 获取聊天统计信息
 * GET /chat/stats
 */
router.get('/stats', async (req, res) => {
  try {
    const stats = gptService.getStats();

    logInfo('Chat stats requested', { ip: req.ip });

    res.json({
      success: true,
      data: {
        activeConversations: stats.activeConversations,
        totalUsers: stats.totalUsers,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    logError('Error getting chat stats', error, { ip: req.ip });

    res.status(500).json({
      success: false,
      error: '服务器内部错误'
    });
  }
});

/**
 * 健康检查
 * GET /chat/health
 */
router.get('/health', async (req, res) => {
  try {
    // 检查 OpenAI API 连接
    const testResponse = await gptService.generateResponse(
      'Hello', 
      'health-check', 
      'web'
    );

    res.json({
      success: true,
      data: {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        services: {
          openai: 'connected',
          gpt: 'working'
        }
      }
    });

  } catch (error) {
    logError('Health check failed', error);

    res.status(503).json({
      success: false,
      data: {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        services: {
          openai: 'disconnected',
          gpt: 'error'
        },
        error: error.message
      }
    });
  }
});

/**
 * 获取预约相关的快速回复选项
 * @returns {Array} 快速回复选项
 */
function getAppointmentQuickReplies() {
  return [
    { title: '📞 电话预约', payload: 'APPOINTMENT_PHONE' },
    { title: '🌐 在线预约', payload: 'APPOINTMENT_ONLINE' },
    { title: '💬 客服咨询', payload: 'APPOINTMENT_SERVICE' },
    { title: '📋 查看服务', payload: 'VIEW_SERVICES' }
  ];
}

/**
 * 生成用户ID
 * @param {Object} req - 请求对象
 * @returns {string} 用户ID
 */
function generateUserId(req) {
  // 基于 IP 地址和时间戳生成用户ID
  const ip = req.ip || req.connection.remoteAddress || 'unknown';
  const timestamp = Date.now();
  return `web_${ip.replace(/[^a-zA-Z0-9]/g, '')}_${timestamp}`;
}

/**
 * 生成会话ID
 * @param {Object} req - 请求对象
 * @returns {string} 会话ID
 */
function generateSessionId(req) {
  // 基于时间戳和随机数生成会话ID
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 15);
  return `session_${timestamp}_${random}`;
}

export default router;
