import express from 'express';
import crypto from 'crypto';
import { config } from '../config/index.js';
import { logInfo, logError } from '../utils/logger.js';
import gptService from '../services/gptService.js';
import messageSender from '../services/messageSender.js';

const router = express.Router();

/**
 * Webhook 验证 - GET 请求
 * Meta 平台会发送 GET 请求来验证 webhook
 */
router.get('/', (req, res) => {
  try {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    logInfo('Webhook verification request', { mode, token: token ? 'provided' : 'missing' });

    // 验证模式是否为 'subscribe'
    if (mode === 'subscribe') {
      // 验证验证令牌
      if (token === config.meta.verifyToken) {
        logInfo('Webhook verification successful');
        res.status(200).send(challenge);
      } else {
        logError('Webhook verification failed - invalid token');
        res.status(403).json({ error: 'Forbidden' });
      }
    } else {
      logError('Webhook verification failed - invalid mode', null, { mode });
      res.status(403).json({ error: 'Forbidden' });
    }
  } catch (error) {
    logError('Webhook verification error', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

/**
 * Webhook 接收消息 - POST 请求
 * Meta 平台会发送 POST 请求来传递消息
 */
router.post('/', async (req, res) => {
  try {
    // 验证请求签名（可选但推荐）
    if (!verifyRequestSignature(req)) {
      logError('Invalid request signature');
      return res.status(403).json({ error: 'Forbidden' });
    }

    const body = req.body;
    logInfo('Webhook received', { 
      object: body.object,
      entriesCount: body.entry?.length || 0 
    });

    // 检查是否为页面订阅
    if (body.object === 'page') {
      // 处理每个条目
      for (const entry of body.entry) {
        await processPageEntry(entry);
      }
    } else if (body.object === 'instagram') {
      // 处理 Instagram 消息
      for (const entry of body.entry) {
        await processInstagramEntry(entry);
      }
    }

    // 响应 200 OK
    res.status(200).send('EVENT_RECEIVED');

  } catch (error) {
    logError('Webhook processing error', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

/**
 * 处理页面条目（Messenger）
 * @param {Object} entry - 页面条目
 */
async function processPageEntry(entry) {
  try {
    const pageId = entry.id;
    const timeOfEvent = entry.time;

    logInfo('Processing page entry', { pageId, timeOfEvent });

    // 处理消息
    if (entry.messaging) {
      for (const event of entry.messaging) {
        await processMessagingEvent(event, 'messenger');
      }
    }

    // 处理帖子
    if (entry.changes) {
      for (const change of entry.changes) {
        await processPageChange(change);
      }
    }

  } catch (error) {
    logError('Error processing page entry', error, { pageId: entry.id });
  }
}

/**
 * 处理 Instagram 条目
 * @param {Object} entry - Instagram 条目
 */
async function processInstagramEntry(entry) {
  try {
    const instagramId = entry.id;
    const timeOfEvent = entry.time;

    logInfo('Processing Instagram entry', { instagramId, timeOfEvent });

    // 处理消息
    if (entry.messaging) {
      for (const event of entry.messaging) {
        await processMessagingEvent(event, 'instagram');
      }
    }

  } catch (error) {
    logError('Error processing Instagram entry', error, { instagramId: entry.id });
  }
}

/**
 * 处理消息事件
 * @param {Object} event - 消息事件
 * @param {string} platform - 平台类型
 */
async function processMessagingEvent(event, platform) {
  try {
    const senderId = event.sender.id;
    const recipientId = event.recipient.id;

    logInfo('Processing messaging event', { 
      senderId, 
      recipientId, 
      platform,
      eventType: Object.keys(event).filter(key => key !== 'sender' && key !== 'recipient')
    });

    // 处理接收到的消息
    if (event.message) {
      await handleReceivedMessage(event.message, senderId, platform);
    }

    // 处理快速回复
    if (event.postback) {
      await handlePostback(event.postback, senderId, platform);
    }

    // 处理消息已读
    if (event.read) {
      await handleMessageRead(event.read, senderId, platform);
    }

    // 处理消息传递
    if (event.delivery) {
      await handleMessageDelivery(event.delivery, senderId, platform);
    }

  } catch (error) {
    logError('Error processing messaging event', error, { 
      senderId: event.sender?.id, 
      platform 
    });
  }
}

/**
 * 处理接收到的消息
 * @param {Object} message - 消息对象
 * @param {string} senderId - 发送者ID
 * @param {string} platform - 平台类型
 */
async function handleReceivedMessage(message, senderId, platform) {
  try {
    const messageId = message.mid;
    const timestamp = message.timestamp;

    // 处理文本消息
    if (message.text) {
      const userMessage = message.text;
      
      logInfo('Received text message', { 
        senderId, 
        platform, 
        messageId, 
        messageLength: userMessage.length 
      });

      // 生成 AI 回复
      const aiResponse = await gptService.generateResponse(userMessage, senderId, platform);

      // 发送回复
      await messageSender.sendTextMessage(senderId, aiResponse, platform);

      // 如果是预约相关查询，发送快速回复
      if (gptService.isAppointmentQuery(userMessage)) {
        setTimeout(async () => {
          try {
            await messageSender.sendAppointmentQuickReply(senderId, platform);
          } catch (error) {
            logError('Error sending appointment quick reply', error, { senderId, platform });
          }
        }, 1000); // 延迟 1 秒发送
      }
    }

    // 处理附件消息
    if (message.attachments) {
      await handleAttachments(message.attachments, senderId, platform);
    }

  } catch (error) {
    logError('Error handling received message', error, { senderId, platform });
    
    // 发送错误消息
    try {
      await messageSender.sendTextMessage(
        senderId, 
        '抱歉，处理您的消息时出现了问题。请稍后再试。', 
        platform
      );
    } catch (sendError) {
      logError('Error sending error message', sendError, { senderId, platform });
    }
  }
}

/**
 * 处理附件消息
 * @param {Array} attachments - 附件数组
 * @param {string} senderId - 发送者ID
 * @param {string} platform - 平台类型
 */
async function handleAttachments(attachments, senderId, platform) {
  try {
    logInfo('Received attachments', { senderId, platform, attachmentsCount: attachments.length });

    for (const attachment of attachments) {
      if (attachment.type === 'image') {
        await messageSender.sendTextMessage(
          senderId,
          '感谢您发送的图片！我目前主要处理文字消息。如果您有任何问题，请用文字描述，我会尽力帮助您。',
          platform
        );
      } else if (attachment.type === 'video') {
        await messageSender.sendTextMessage(
          senderId,
          '感谢您发送的视频！我目前主要处理文字消息。如果您有任何问题，请用文字描述，我会尽力帮助您。',
          platform
        );
      } else {
        await messageSender.sendTextMessage(
          senderId,
          '感谢您发送的文件！我目前主要处理文字消息。如果您有任何问题，请用文字描述，我会尽力帮助您。',
          platform
        );
      }
    }

  } catch (error) {
    logError('Error handling attachments', error, { senderId, platform });
  }
}

/**
 * 处理快速回复
 * @param {Object} postback - 快速回复对象
 * @param {string} senderId - 发送者ID
 * @param {string} platform - 平台类型
 */
async function handlePostback(postback, senderId, platform) {
  try {
    const payload = postback.payload;
    const title = postback.title;

    logInfo('Received postback', { senderId, platform, payload, title });

    switch (payload) {
    case 'GET_STARTED':
      await messageSender.sendWelcomeMessage(senderId, platform);
      break;

    case 'BOOK_APPOINTMENT':
      await messageSender.sendAppointmentQuickReply(senderId, platform);
      break;

    case 'VIEW_SERVICES':
      await messageSender.sendServicesTemplate(senderId, platform);
      break;

    case 'APPOINTMENT_PHONE':
      await messageSender.sendTextMessage(
        senderId,
        '📞 电话预约\n\n请拨打我们的客服热线：\n☎️ 400-123-4567\n\n工作时间：周一至周日 9:00-18:00\n\n我们的客服团队会协助您安排最合适的就诊时间。',
        platform
      );
      break;

    case 'APPOINTMENT_ONLINE':
      await messageSender.sendTextMessage(
        senderId,
        '🌐 在线预约\n\n请访问我们的官网预约系统：\n🔗 https://your-clinic-website.com/booking\n\n您可以在线选择医生、时间和服务类型，系统会自动为您安排。',
        platform
      );
      break;

    case 'APPOINTMENT_SERVICE':
      await messageSender.sendTextMessage(
        senderId,
        '💬 客服咨询\n\n我们的专业客服团队随时为您服务：\n\n• 服务咨询\n• 预约安排\n• 价格查询\n• 就诊指导\n\n请告诉我您需要什么帮助？',
        platform
      );
      break;

    case 'CLINIC_INFO':
      await messageSender.sendTextMessage(
        senderId,
        '📍 诊所信息\n\n🏥 诊所名称：XX医疗中心\n📍 地址：XX市XX区XX路123号\n☎️ 电话：400-123-4567\n🕒 营业时间：周一至周日 9:00-18:00\n🚗 停车：免费停车位\n🚇 地铁：XX站A出口步行5分钟',
        platform
      );
      break;

    default:
      await messageSender.sendTextMessage(
        senderId,
        '感谢您的选择！如果您有其他问题，请随时告诉我。',
        platform
      );
    }

  } catch (error) {
    logError('Error handling postback', error, { senderId, platform, payload: postback.payload });
  }
}

/**
 * 处理消息已读
 * @param {Object} read - 已读对象
 * @param {string} senderId - 发送者ID
 * @param {string} platform - 平台类型
 */
async function handleMessageRead(read, senderId, platform) {
  logInfo('Message read', { 
    senderId, 
    platform, 
    watermark: read.watermark 
  });
}

/**
 * 处理消息传递
 * @param {Object} delivery - 传递对象
 * @param {string} senderId - 发送者ID
 * @param {string} platform - 平台类型
 */
async function handleMessageDelivery(delivery, senderId, platform) {
  logInfo('Message delivered', { 
    senderId, 
    platform, 
    watermark: delivery.watermark 
  });
}

/**
 * 处理页面变更
 * @param {Object} change - 变更对象
 */
async function processPageChange(change) {
  logInfo('Page change received', { 
    field: change.field,
    value: change.value 
  });
}

/**
 * 验证请求签名
 * @param {Object} req - 请求对象
 * @returns {boolean} 签名是否有效
 */
function verifyRequestSignature(req) {
  try {
    const signature = req.get('X-Hub-Signature-256');
    
    if (!signature || !config.meta.appSecret) {
      logInfo('Skipping signature verification - signature or app secret not provided');
      return true; // 如果没有配置签名验证，则跳过
    }

    const expectedSignature = 'sha256=' + crypto
      .createHmac('sha256', config.meta.appSecret)
      .update(JSON.stringify(req.body))
      .digest('hex');

    const isValid = crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );

    if (!isValid) {
      logError('Invalid request signature', null, { 
        provided: signature,
        expected: expectedSignature 
      });
    }

    return isValid;

  } catch (error) {
    logError('Error verifying request signature', error);
    return false;
  }
}

export default router;
