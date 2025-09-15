/**
 * GPT 服务单元测试
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import GPTService from '../../src/services/gptService.js';
import { config } from '../../src/config/index.js';

// Mock OpenAI
vi.mock('openai', () => ({
  default: vi.fn().mockImplementation(() => ({
    chat: {
      completions: {
        create: vi.fn()
      }
    }
  }))
}));

// Mock config
vi.mock('../../src/config/index.js', () => ({
  config: {
    openai: {
      apiKey: 'test-api-key',
      model: 'gpt-3.5-turbo',
      maxTokens: 1000,
      temperature: 0.7
    }
  }
}));

describe('GPTService', () => {
  let gptService;
  let mockOpenAI;

  beforeEach(() => {
    vi.clearAllMocks();
    gptService = new GPTService();
    mockOpenAI = gptService.openai;
  });

  describe('generateResponse', () => {
    it('应该成功生成回复', async () => {
      const mockResponse = {
        choices: [{
          message: {
            content: '你好！我是诊所客服助手，有什么可以帮助您的吗？'
          }
        }],
        usage: {
          total_tokens: 50
        }
      };

      mockOpenAI.chat.completions.create.mockResolvedValue(mockResponse);

      const result = await gptService.generateResponse('你好', 'test_user', 'web');

      expect(result).toBe('你好！我是诊所客服助手，有什么可以帮助您的吗？');
      expect(mockOpenAI.chat.completions.create).toHaveBeenCalledWith({
        model: 'gpt-3.5-turbo',
        messages: expect.arrayContaining([
          expect.objectContaining({ role: 'system' }),
          expect.objectContaining({ role: 'user', content: '你好' })
        ]),
        max_tokens: 1000,
        temperature: 0.7,
        presence_penalty: 0.1,
        frequency_penalty: 0.1
      });
    });

    it('应该处理 API 错误', async () => {
      mockOpenAI.chat.completions.create.mockRejectedValue(new Error('API Error'));

      const result = await gptService.generateResponse('你好', 'test_user', 'web');

      expect(result).toContain('抱歉');
      expect(typeof result).toBe('string');
    });

    it('应该处理空回复', async () => {
      const mockResponse = {
        choices: [{
          message: {
            content: ''
          }
        }]
      };

      mockOpenAI.chat.completions.create.mockResolvedValue(mockResponse);

      const result = await gptService.generateResponse('你好', 'test_user', 'web');

      expect(result).toContain('抱歉');
    });
  });

  describe('conversationHistory', () => {
    it('应该保存和获取对话历史', () => {
      const userId = 'test_user';
      const userMessage = '你好';
      const botResponse = '你好！有什么可以帮助您的吗？';

      gptService.saveConversationHistory(userId, userMessage, botResponse);
      const history = gptService.getConversationHistory(userId);

      expect(history).toHaveLength(2);
      expect(history[0]).toEqual({ role: 'user', content: userMessage });
      expect(history[1]).toEqual({ role: 'assistant', content: botResponse });
    });

    it('应该限制对话历史长度', () => {
      const userId = 'test_user';
      
      // 添加超过限制的对话
      for (let i = 0; i < 20; i++) {
        gptService.saveConversationHistory(userId, `消息${i}`, `回复${i}`);
      }

      const history = gptService.getConversationHistory(userId);
      expect(history.length).toBeLessThanOrEqual(10); // 假设限制为10
    });
  });

  describe('isAppointmentQuery', () => {
    it('应该识别预约查询', () => {
      const appointmentQueries = [
        '我想预约',
        '预约服务',
        '什么时候可以预约',
        '如何预约医生'
      ];

      appointmentQueries.forEach(query => {
        expect(gptService.isAppointmentQuery(query)).toBe(true);
      });
    });

    it('应该识别非预约查询', () => {
      const nonAppointmentQueries = [
        '你好',
        '诊所地址',
        '医生信息',
        '营业时间'
      ];

      nonAppointmentQueries.forEach(query => {
        expect(gptService.isAppointmentQuery(query)).toBe(false);
      });
    });
  });
});
