import OpenAI from 'openai';
import { config } from '../config/index.js';
import { logInfo, logError } from '../utils/logger.js';

class GPTService {
  constructor() {
    // 只有在有有效 API Key 时才初始化 OpenAI
    if (config.openai.apiKey && config.openai.apiKey !== 'your_openai_api_key_here' && config.openai.apiKey !== 'sk-test-key-placeholder') {
      this.openai = new OpenAI({
        apiKey: config.openai.apiKey
      });
      this.isConfigured = true;
    } else {
      this.openai = null;
      this.isConfigured = false;
      console.warn('⚠️ OpenAI API Key not configured, GPT service running in fallback mode');
    }
    
    // System prompt for clinic chatbot
    this.systemPrompt = `你是一个专业的诊所客服助手，专门为患者提供医疗信息咨询和预约服务。

你的职责包括：
1. 回答关于诊所服务、医生信息、治疗项目的问题
2. 协助患者进行预约安排
3. 提供诊所地址、营业时间等基本信息
4. 解释常见医疗流程和注意事项

重要规则：
- 只提供一般性医疗信息，不进行具体诊断
- 遇到复杂医疗问题时，建议患者咨询专业医生
- 保持友好、专业、耐心的服务态度
- 使用简洁明了的中文回复
- 如果无法回答某个问题，诚实告知并建议联系诊所

当用户询问预约相关问题时，可以提供预约链接或建议联系诊所进行详细安排。`;

    this.conversationHistory = new Map(); // 存储用户对话历史
  }

  /**
   * 生成 AI 回复
   * @param {string} userMessage - 用户消息
   * @param {string} userId - 用户ID
   * @param {string} platform - 平台类型 (web, messenger, instagram)
   * @returns {Promise<string>} AI 回复
   */
  async generateResponse(userMessage, userId, platform = 'web') {
    try {
      logInfo('Generating GPT response', { userId, platform, messageLength: userMessage.length });

      // 如果 OpenAI 未配置，使用 fallback 响应
      if (!this.isConfigured) {
        return this.getFallbackResponse(null, userMessage);
      }

      // 获取用户对话历史
      const conversationHistory = this.getConversationHistory(userId);
      
      // 构建消息数组
      const messages = [
        { role: 'system', content: this.systemPrompt },
        ...conversationHistory,
        { role: 'user', content: userMessage }
      ];

      // 调用 OpenAI API
      const completion = await this.openai.chat.completions.create({
        model: config.openai.model,
        messages: messages,
        max_tokens: config.openai.maxTokens,
        temperature: config.openai.temperature,
        presence_penalty: 0.1,
        frequency_penalty: 0.1
      });

      const response = completion.choices[0]?.message?.content?.trim();
      
      if (!response) {
        throw new Error('Empty response from OpenAI');
      }

      // 保存对话历史
      this.saveConversationHistory(userId, userMessage, response);

      logInfo('GPT response generated successfully', { 
        userId, 
        responseLength: response.length,
        tokensUsed: completion.usage?.total_tokens 
      });

      return response;

    } catch (error) {
      logError('Error generating GPT response', error, { userId, platform });
      
      // 返回友好的错误消息
      return this.getFallbackResponse(error, userMessage);
    }
  }

  /**
   * 获取用户对话历史
   * @param {string} userId - 用户ID
   * @returns {Array} 对话历史数组
   */
  getConversationHistory(userId) {
    const history = this.conversationHistory.get(userId) || [];
    
    // 限制历史记录长度，避免 token 超限
    const maxHistoryLength = 10; // 保留最近 10 轮对话
    return history.slice(-maxHistoryLength);
  }

  /**
   * 保存对话历史
   * @param {string} userId - 用户ID
   * @param {string} userMessage - 用户消息
   * @param {string} aiResponse - AI 回复
   */
  saveConversationHistory(userId, userMessage, aiResponse) {
    const history = this.conversationHistory.get(userId) || [];
    
    history.push(
      { role: 'user', content: userMessage },
      { role: 'assistant', content: aiResponse }
    );

    // 限制历史记录长度
    const maxHistoryLength = 20; // 最多保留 20 条消息
    if (history.length > maxHistoryLength) {
      history.splice(0, history.length - maxHistoryLength);
    }

    this.conversationHistory.set(userId, history);
  }

  /**
   * 清除用户对话历史
   * @param {string} userId - 用户ID
   */
  clearConversationHistory(userId) {
    this.conversationHistory.delete(userId);
    logInfo('Conversation history cleared', { userId });
  }

  /**
   * 获取错误时的备用回复
   * @param {Error} error - 错误对象
   * @returns {string} 备用回复
   */
  getFallbackResponse(error, userMessage) {
    // 智能 fallback 响应
    const message = userMessage ? userMessage.toLowerCase() : '';
    
    // 根据用户消息内容提供相关回复
    if (message.includes('预约') || message.includes('预约')) {
      return '感谢您的预约咨询！请拨打我们的预约热线：400-xxx-xxxx，或访问我们的网站进行在线预约。';
    }
    
    if (message.includes('地址') || message.includes('位置') || message.includes('在哪里')) {
      return '我们的诊所地址是：北京市朝阳区xxx街道xxx号。营业时间：周一至周日 8:00-20:00。';
    }
    
    if (message.includes('医生') || message.includes('专家')) {
      return '我们有多位经验丰富的医生为您服务。您可以访问我们的网站查看医生介绍，或致电咨询具体医生排班。';
    }
    
    if (message.includes('价格') || message.includes('费用') || message.includes('收费')) {
      return '我们的收费标准透明合理。具体价格请致电咨询或到院了解。我们提供多种支付方式。';
    }
    
    if (message.includes('时间') || message.includes('营业') || message.includes('几点')) {
      return '我们的营业时间是：周一至周日 8:00-20:00。节假日正常营业。';
    }
    
    // 根据错误类型返回不同的回复
    if (error) {
      if (error.code === 'insufficient_quota') {
        return '抱歉，服务暂时不可用。请稍后再试或直接联系我们的客服。';
      }
      
      if (error.code === 'rate_limit_exceeded') {
        return '请求过于频繁，请稍等片刻后再试。';
      }
      
      if (error.message?.includes('timeout')) {
        return '请求超时，请重试。如果问题持续，请联系我们的客服。';
      }
    }
    
    // 通用 fallback 响应
    const fallbackResponses = [
      '感谢您的咨询！我是诊所客服助手，目前正在学习阶段。如需详细帮助，请致电：400-xxx-xxxx。',
      '您好！我是诊所智能客服。如需人工服务，请拨打客服热线或访问我们的网站。',
      '感谢您的消息！我们的专业团队会为您提供优质服务。请致电咨询或到院就诊。',
      '您好！我是诊所客服助手。如需预约或咨询，请致电：400-xxx-xxxx。'
    ];

    return fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)];
  }

  /**
   * 检查是否为预约相关查询
   * @param {string} message - 用户消息
   * @returns {boolean} 是否为预约查询
   */
  isAppointmentQuery(message) {
    const appointmentKeywords = [
      '预约', '预定', '挂号', '看医生', '看病', '就诊',
      'appointment', 'book', 'schedule', 'visit'
    ];
    
    return appointmentKeywords.some(keyword => 
      message.toLowerCase().includes(keyword.toLowerCase())
    );
  }

  /**
   * 获取预约相关的标准回复
   * @returns {string} 预约回复
   */
  getAppointmentResponse() {
    return `感谢您的咨询！关于预约服务，您可以通过以下方式联系我们：

📞 电话预约：请拨打我们的客服热线
🌐 在线预约：访问我们的官网预约系统
💬 客服咨询：我们的客服团队会协助您安排

请提供您的姓名、联系方式、希望预约的时间和服务类型，我们会尽快为您安排。`;
  }

  /**
   * 获取服务统计信息
   * @returns {Object} 统计信息
   */
  getStats() {
    return {
      activeConversations: this.conversationHistory.size,
      totalUsers: this.conversationHistory.size
    };
  }
}

// 创建单例实例
const gptService = new GPTService();

export default gptService;
