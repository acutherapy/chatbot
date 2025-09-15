/**
 * 聊天功能集成测试
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import fetch from 'node-fetch';
import { TEST_CONFIG, TEST_DATA, testUtils } from '../setup.js';

describe('Chat Integration Tests', () => {
  let serverProcess;

  beforeAll(async () => {
    // 启动测试服务器
    // 这里可以启动一个测试实例
    await testUtils.delay(2000); // 等待服务器启动
  });

  afterAll(async () => {
    // 清理测试服务器
    if (serverProcess) {
      serverProcess.kill();
    }
  });

  describe('Health Check', () => {
    it('应该返回健康状态', async () => {
      const response = await fetch(`${TEST_CONFIG.baseUrl}/health`);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.status).toBe('healthy');
      expect(data.timestamp).toBeDefined();
      expect(data.uptime).toBeDefined();
    });
  });

  describe('Chat API', () => {
    it('应该处理基本聊天消息', async () => {
      const testMessage = '你好';
      const response = await fetch(`${TEST_CONFIG.baseUrl}/chat/message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: testMessage,
          userId: TEST_CONFIG.testUserId,
          sessionId: TEST_CONFIG.testSessionId
        })
      });

      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.response).toBeDefined();
      expect(typeof data.response).toBe('string');
      expect(data.response.length).toBeGreaterThan(0);
    });

    it('应该保持对话上下文', async () => {
      const userId = testUtils.generateTestUser();
      const sessionId = testUtils.generateTestSession();

      // 第一条消息
      const response1 = await fetch(`${TEST_CONFIG.baseUrl}/chat/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: '我叫张三',
          userId,
          sessionId
        })
      });

      const data1 = await response1.json();
      expect(data1.success).toBe(true);

      // 第二条消息 - 应该记住上下文
      const response2 = await fetch(`${TEST_CONFIG.baseUrl}/chat/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: '我刚才说了什么？',
          userId,
          sessionId
        })
      });

      const data2 = await response2.json();
      expect(data2.success).toBe(true);
      // 这里可以添加更具体的上下文检查
    });

    it('应该处理无效输入', async () => {
      const response = await fetch(`${TEST_CONFIG.baseUrl}/chat/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: '', // 空消息
          userId: TEST_CONFIG.testUserId
        })
      });

      expect(response.status).toBe(400);
    });

    it('应该处理超长消息', async () => {
      const longMessage = 'a'.repeat(2000); // 超过限制的消息
      
      const response = await fetch(`${TEST_CONFIG.baseUrl}/chat/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: longMessage,
          userId: TEST_CONFIG.testUserId
        })
      });

      expect(response.status).toBe(400);
    });
  });

  describe('FAQ Integration', () => {
    it('应该从知识库返回相关答案', async () => {
      const faqQueries = [
        '诊所地址',
        '营业时间',
        '预约方式',
        '医生信息'
      ];

      for (const query of faqQueries) {
        const response = await fetch(`${TEST_CONFIG.baseUrl}/chat/message`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: query,
            userId: testUtils.generateTestUser()
          })
        });

        const data = await response.json();
        expect(data.success).toBe(true);
        expect(data.response).toBeDefined();
      }
    });
  });

  describe('Error Handling', () => {
    it('应该处理网络错误', async () => {
      // 模拟网络错误
      const originalFetch = global.fetch;
      global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

      const response = await fetch(`${TEST_CONFIG.baseUrl}/chat/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: '测试消息',
          userId: TEST_CONFIG.testUserId
        })
      });

      // 恢复原始 fetch
      global.fetch = originalFetch;

      // 应该返回错误响应而不是崩溃
      expect(response.status).toBeGreaterThanOrEqual(400);
    });
  });
});
