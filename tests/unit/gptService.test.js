import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the config module
vi.mock('../../src/config/index.js', () => ({
  config: {
    openai: {
      apiKey: 'test-key',
      model: 'gpt-3.5-turbo',
      maxTokens: 150,
      temperature: 0.7
    },
    logging: {
      level: 'error'
    }
  }
}));

// Mock the logger
vi.mock('../../src/utils/logger.js', () => ({
  logInfo: vi.fn(),
  logError: vi.fn()
}));

describe('GPT Service', () => {
  let gptService;

  beforeEach(async () => {
    // Clear all mocks
    vi.clearAllMocks();
    
    // Import the service instance after mocking
    gptService = await import('../../src/services/gptService.js');
    gptService = gptService.default;
  });

  describe('Fallback Response', () => {
    it('should provide intelligent fallback responses', () => {
      const appointmentMessage = '我想预约服务';
      const response = gptService.getFallbackResponse(null, appointmentMessage);
      
      expect(response).toContain('预约');
      expect(response).toContain('热线');
    });

    it('should handle address queries', () => {
      const addressMessage = '你们诊所地址在哪里？';
      const response = gptService.getFallbackResponse(null, addressMessage);
      
      expect(response).toContain('地址');
      expect(response).toContain('营业时间');
    });

    it('should handle doctor queries', () => {
      const doctorMessage = '有哪些医生？';
      const response = gptService.getFallbackResponse(null, doctorMessage);
      
      expect(response).toContain('医生');
      expect(response).toContain('经验');
    });

    it('should handle price queries', () => {
      const priceMessage = '价格是多少？';
      const response = gptService.getFallbackResponse(null, priceMessage);
      
      expect(response).toContain('价格');
      expect(response).toContain('收费');
    });

    it('should handle time queries', () => {
      const timeMessage = '营业时间是什么时候？';
      const response = gptService.getFallbackResponse(null, timeMessage);
      
      expect(response).toContain('时间');
      expect(response).toContain('营业');
    });

    it('should provide generic response for unknown queries', () => {
      const unknownMessage = '这是一个随机问题';
      const response = gptService.getFallbackResponse(null, unknownMessage);
      
      expect(response).toBeDefined();
      expect(response.length).toBeGreaterThan(0);
      // 检查是否包含常见的客服用语
      const hasCommonPhrases = response.includes('感谢') || 
                              response.includes('您好') || 
                              response.includes('客服') ||
                              response.includes('帮助');
      expect(hasCommonPhrases).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should handle API quota errors', () => {
      const error = { code: 'insufficient_quota' };
      const response = gptService.getFallbackResponse(error, 'test message');
      
      expect(response).toContain('服务暂时不可用');
    });

    it('should handle rate limit errors', () => {
      const error = { code: 'rate_limit_exceeded' };
      const response = gptService.getFallbackResponse(error, 'test message');
      
      expect(response).toContain('请求过于频繁');
    });

    it('should handle timeout errors', () => {
      const error = { message: 'timeout occurred' };
      const response = gptService.getFallbackResponse(error, 'test message');
      
      expect(response).toContain('请求超时');
    });
  });

  describe('Appointment Detection', () => {
    it('should detect appointment queries', () => {
      const appointmentQueries = [
        '我想预约',
        '如何预约服务',
        'book an appointment',
        'schedule a visit'
      ];

      appointmentQueries.forEach(query => {
        expect(gptService.isAppointmentQuery(query)).toBe(true);
      });
    });

    it('should not detect non-appointment queries', () => {
      const nonAppointmentQueries = [
        '你好',
        '谢谢',
        '再见',
        '天气怎么样'
      ];

      nonAppointmentQueries.forEach(query => {
        expect(gptService.isAppointmentQuery(query)).toBe(false);
      });
    });
  });

  describe('Appointment Response', () => {
    it('should provide comprehensive appointment information', () => {
      const response = gptService.getAppointmentResponse();
      
      expect(response).toContain('预约');
      expect(response).toContain('电话');
      expect(response).toContain('在线');
      expect(response).toContain('客服');
    });
  });
});