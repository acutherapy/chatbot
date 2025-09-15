import axios from 'axios';
import { config } from '../config/index.js';
import { logInfo, logError } from '../utils/logger.js';

class MessageSender {
  constructor() {
    this.pageAccessToken = config.meta.pageAccessToken;
    this.graphApiUrl = 'https://graph.facebook.com/v18.0';
  }

  /**
   * 发送文本消息到 Messenger
   * @param {string} recipientId - 接收者ID
   * @param {string} message - 消息内容
   * @param {string} platform - 平台类型 (messenger, instagram)
   * @returns {Promise<Object>} API 响应
   */
  async sendTextMessage(recipientId, message, platform = 'messenger') {
    try {
      logInfo('Sending text message', { recipientId, platform, messageLength: message.length });

      const endpoint = platform === 'instagram' 
        ? `${this.graphApiUrl}/me/messages`
        : `${this.graphApiUrl}/me/messages`;

      const payload = {
        recipient: { id: recipientId },
        message: { text: message },
        messaging_type: 'RESPONSE',
      };

      const response = await axios.post(endpoint, payload, {
        params: {
          access_token: this.pageAccessToken,
        },
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 10000, // 10 seconds timeout
      });

      logInfo('Text message sent successfully', { 
        recipientId, 
        platform, 
        messageId: response.data.message_id 
      });

      return response.data;

    } catch (error) {
      logError('Error sending text message', error, { recipientId, platform });
      throw this.handleApiError(error);
    }
  }

  /**
   * 发送快速回复消息
   * @param {string} recipientId - 接收者ID
   * @param {string} text - 消息文本
   * @param {Array} quickReplies - 快速回复选项
   * @param {string} platform - 平台类型
   * @returns {Promise<Object>} API 响应
   */
  async sendQuickReply(recipientId, text, quickReplies, platform = 'messenger') {
    try {
      logInfo('Sending quick reply', { recipientId, platform, repliesCount: quickReplies.length });

      const endpoint = `${this.graphApiUrl}/me/messages`;

      const payload = {
        recipient: { id: recipientId },
        message: {
          text: text,
          quick_replies: quickReplies.map((reply, index) => ({
            content_type: 'text',
            title: reply.title,
            payload: reply.payload || `QUICK_REPLY_${index}`,
          })),
        },
        messaging_type: 'RESPONSE',
      };

      const response = await axios.post(endpoint, payload, {
        params: {
          access_token: this.pageAccessToken,
        },
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 10000,
      });

      logInfo('Quick reply sent successfully', { recipientId, platform });

      return response.data;

    } catch (error) {
      logError('Error sending quick reply', error, { recipientId, platform });
      throw this.handleApiError(error);
    }
  }

  /**
   * 发送模板消息
   * @param {string} recipientId - 接收者ID
   * @param {Object} template - 模板对象
   * @param {string} platform - 平台类型
   * @returns {Promise<Object>} API 响应
   */
  async sendTemplate(recipientId, template, platform = 'messenger') {
    try {
      logInfo('Sending template message', { recipientId, platform, templateType: template.template_type });

      const endpoint = `${this.graphApiUrl}/me/messages`;

      const payload = {
        recipient: { id: recipientId },
        message: {
          attachment: {
            type: 'template',
            payload: template,
          },
        },
        messaging_type: 'RESPONSE',
      };

      const response = await axios.post(endpoint, payload, {
        params: {
          access_token: this.pageAccessToken,
        },
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 10000,
      });

      logInfo('Template message sent successfully', { recipientId, platform });

      return response.data;

    } catch (error) {
      logError('Error sending template message', error, { recipientId, platform });
      throw this.handleApiError(error);
    }
  }

  /**
   * 发送预约相关的快速回复
   * @param {string} recipientId - 接收者ID
   * @param {string} platform - 平台类型
   * @returns {Promise<Object>} API 响应
   */
  async sendAppointmentQuickReply(recipientId, platform = 'messenger') {
    const quickReplies = [
      { title: '📞 电话预约', payload: 'APPOINTMENT_PHONE' },
      { title: '🌐 在线预约', payload: 'APPOINTMENT_ONLINE' },
      { title: '💬 客服咨询', payload: 'APPOINTMENT_SERVICE' },
      { title: '📋 查看服务', payload: 'VIEW_SERVICES' },
    ];

    const message = `感谢您的咨询！请选择您需要的服务：`;

    return this.sendQuickReply(recipientId, message, quickReplies, platform);
  }

  /**
   * 发送服务信息模板
   * @param {string} recipientId - 接收者ID
   * @param {string} platform - 平台类型
   * @returns {Promise<Object>} API 响应
   */
  async sendServicesTemplate(recipientId, platform = 'messenger') {
    const template = {
      template_type: 'generic',
      elements: [
        {
          title: '🏥 我们的服务',
          subtitle: '专业医疗团队，贴心服务体验',
          image_url: 'https://via.placeholder.com/300x200/4F46E5/FFFFFF?text=Medical+Services',
          buttons: [
            {
              type: 'web_url',
              url: 'https://your-clinic-website.com/services',
              title: '查看详情',
            },
            {
              type: 'postback',
              title: '立即预约',
              payload: 'BOOK_APPOINTMENT',
            },
          ],
        },
        {
          title: '👨‍⚕️ 医生团队',
          subtitle: '经验丰富的专业医生',
          image_url: 'https://via.placeholder.com/300x200/059669/FFFFFF?text=Doctor+Team',
          buttons: [
            {
              type: 'web_url',
              url: 'https://your-clinic-website.com/doctors',
              title: '了解医生',
            },
            {
              type: 'postback',
              title: '预约咨询',
              payload: 'CONSULT_DOCTOR',
            },
          ],
        },
      ],
    };

    return this.sendTemplate(recipientId, template, platform);
  }

  /**
   * 发送欢迎消息
   * @param {string} recipientId - 接收者ID
   * @param {string} platform - 平台类型
   * @returns {Promise<Object>} API 响应
   */
  async sendWelcomeMessage(recipientId, platform = 'messenger') {
    const message = `👋 欢迎来到我们的诊所！

我是您的专属客服助手，可以为您提供：
• 📋 服务咨询
• 📅 预约安排  
• 🏥 诊所信息
• 💡 健康建议

请告诉我您需要什么帮助？`;

    const quickReplies = [
      { title: '📅 预约服务', payload: 'BOOK_APPOINTMENT' },
      { title: '📋 查看服务', payload: 'VIEW_SERVICES' },
      { title: '📍 诊所信息', payload: 'CLINIC_INFO' },
      { title: '💬 其他咨询', payload: 'OTHER_INQUIRY' },
    ];

    return this.sendQuickReply(recipientId, message, quickReplies, platform);
  }

  /**
   * 处理 API 错误
   * @param {Error} error - 错误对象
   * @returns {Error} 处理后的错误
   */
  handleApiError(error) {
    if (error.response) {
      const { status, data } = error.response;
      
      switch (status) {
        case 400:
          return new Error(`Bad Request: ${data.error?.message || 'Invalid request'}`);
        case 401:
          return new Error('Unauthorized: Invalid access token');
        case 403:
          return new Error('Forbidden: Insufficient permissions');
        case 404:
          return new Error('Not Found: User or page not found');
        case 429:
          return new Error('Rate Limited: Too many requests');
        case 500:
          return new Error('Internal Server Error: Facebook API error');
        default:
          return new Error(`API Error ${status}: ${data.error?.message || 'Unknown error'}`);
      }
    }
    
    if (error.code === 'ECONNABORTED') {
      return new Error('Request timeout: Facebook API is not responding');
    }
    
    return new Error(`Network Error: ${error.message}`);
  }

  /**
   * 验证访问令牌
   * @returns {Promise<boolean>} 令牌是否有效
   */
  async validateAccessToken() {
    try {
      const response = await axios.get(`${this.graphApiUrl}/me`, {
        params: {
          access_token: this.pageAccessToken,
          fields: 'id,name',
        },
        timeout: 5000,
      });

      logInfo('Access token validated successfully', { 
        pageId: response.data.id, 
        pageName: response.data.name 
      });

      return true;

    } catch (error) {
      logError('Access token validation failed', error);
      return false;
    }
  }

  /**
   * 获取页面信息
   * @returns {Promise<Object>} 页面信息
   */
  async getPageInfo() {
    try {
      const response = await axios.get(`${this.graphApiUrl}/me`, {
        params: {
          access_token: this.pageAccessToken,
          fields: 'id,name,about,phone,website,location',
        },
        timeout: 5000,
      });

      return response.data;

    } catch (error) {
      logError('Error getting page info', error);
      throw this.handleApiError(error);
    }
  }
}

// 创建单例实例
const messageSender = new MessageSender();

export default messageSender;
