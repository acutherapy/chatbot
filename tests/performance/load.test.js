import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { chromium } from 'playwright';

describe('Performance Tests', () => {
  let browser;
  let page;

  beforeAll(async () => {
    browser = await chromium.launch();
    page = await browser.newPage();
  });

  afterAll(async () => {
    await browser.close();
  });

  describe('API Performance', () => {
    it('should handle concurrent requests efficiently', async () => {
      const baseUrl = process.env.TEST_BASE_URL || 'http://localhost:3000';
      const concurrentRequests = 10;
      const requests = [];

      const startTime = Date.now();

      // 创建并发请求
      for (let i = 0; i < concurrentRequests; i++) {
        requests.push(
          fetch(`${baseUrl}/chat/message`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              message: `测试消息 ${i}`,
              userId: `test_user_${i}`
            })
          })
        );
      }

      // 等待所有请求完成
      const responses = await Promise.all(requests);
      const endTime = Date.now();
      const totalTime = endTime - startTime;

      // 验证所有请求都成功
      responses.forEach(response => {
        expect(response.ok).toBe(true);
      });

      // 验证响应时间合理（平均每个请求不超过2秒）
      const avgTimePerRequest = totalTime / concurrentRequests;
      expect(avgTimePerRequest).toBeLessThan(2000);

      console.log(`并发请求测试: ${concurrentRequests} 个请求，总时间: ${totalTime}ms，平均: ${avgTimePerRequest}ms`);
    });

    it('should handle high message volume', async () => {
      const baseUrl = process.env.TEST_BASE_URL || 'http://localhost:3000';
      const messageCount = 50;
      const requests = [];

      const startTime = Date.now();

      // 发送大量消息
      for (let i = 0; i < messageCount; i++) {
        requests.push(
          fetch(`${baseUrl}/chat/message`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              message: `批量测试消息 ${i} - 这是一个较长的测试消息，用来测试系统处理长消息的能力。`,
              userId: 'bulk_test_user'
            })
          })
        );
      }

      const responses = await Promise.all(requests);
      const endTime = Date.now();
      const totalTime = endTime - startTime;

      // 验证成功率
      const successCount = responses.filter(r => r.ok).length;
      const successRate = successCount / messageCount;
      expect(successRate).toBeGreaterThan(0.95); // 95% 成功率

      console.log(`批量消息测试: ${messageCount} 条消息，成功率: ${(successRate * 100).toFixed(1)}%，总时间: ${totalTime}ms`);
    });

    it('should maintain response time under load', async () => {
      const baseUrl = process.env.TEST_BASE_URL || 'http://localhost:3000';
      const testDuration = 10000; // 10秒
      const requests = [];
      const responseTimes = [];

      const startTime = Date.now();
      let requestCount = 0;

      // 持续发送请求
      const sendRequest = async () => {
        const requestStart = Date.now();
        try {
          const response = await fetch(`${baseUrl}/chat/message`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              message: `压力测试消息 ${requestCount}`,
              userId: 'stress_test_user'
            })
          });
          
          const requestEnd = Date.now();
          responseTimes.push(requestEnd - requestStart);
          requestCount++;
          
          return response.ok;
        } catch (error) {
          console.error('Request failed:', error);
          return false;
        }
      };

      // 每100ms发送一个请求
      const interval = setInterval(async () => {
        if (Date.now() - startTime < testDuration) {
          requests.push(sendRequest());
        } else {
          clearInterval(interval);
        }
      }, 100);

      // 等待测试完成
      await new Promise(resolve => setTimeout(resolve, testDuration + 1000));

      // 等待所有请求完成
      const results = await Promise.all(requests);
      const endTime = Date.now();

      // 计算统计信息
      const successCount = results.filter(r => r).length;
      const successRate = successCount / results.length;
      const avgResponseTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
      const maxResponseTime = Math.max(...responseTimes);
      const minResponseTime = Math.min(...responseTimes);

      // 验证性能指标
      expect(successRate).toBeGreaterThan(0.9); // 90% 成功率
      expect(avgResponseTime).toBeLessThan(3000); // 平均响应时间小于3秒
      expect(maxResponseTime).toBeLessThan(10000); // 最大响应时间小于10秒

      console.log('压力测试结果:');
      console.log(`- 总请求数: ${results.length}`);
      console.log(`- 成功率: ${(successRate * 100).toFixed(1)}%`);
      console.log(`- 平均响应时间: ${avgResponseTime.toFixed(0)}ms`);
      console.log(`- 最大响应时间: ${maxResponseTime}ms`);
      console.log(`- 最小响应时间: ${minResponseTime}ms`);
    });
  });

  describe('Memory Usage', () => {
    it('should not have memory leaks during extended use', async () => {
      const baseUrl = process.env.TEST_BASE_URL || 'http://localhost:3000';
      const iterations = 100;
      const initialMemory = process.memoryUsage();

      // 发送大量请求
      for (let i = 0; i < iterations; i++) {
        await fetch(`${baseUrl}/chat/message`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            message: `内存测试消息 ${i}`,
            userId: 'memory_test_user'
          })
        });

        // 每10个请求检查一次内存
        if (i % 10 === 0) {
          const currentMemory = process.memoryUsage();
          const memoryIncrease = currentMemory.heapUsed - initialMemory.heapUsed;
          const memoryIncreaseMB = memoryIncrease / 1024 / 1024;
          
          // 内存增长不应超过100MB
          expect(memoryIncreaseMB).toBeLessThan(100);
        }
      }

      const finalMemory = process.memoryUsage();
      const totalMemoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed;
      const totalMemoryIncreaseMB = totalMemoryIncrease / 1024 / 1024;

      console.log(`内存使用测试: 初始 ${(initialMemory.heapUsed / 1024 / 1024).toFixed(1)}MB，最终 ${(finalMemory.heapUsed / 1024 / 1024).toFixed(1)}MB，增长 ${totalMemoryIncreaseMB.toFixed(1)}MB`);
    });
  });

  describe('Error Handling Under Load', () => {
    it('should handle malformed requests gracefully', async () => {
      const baseUrl = process.env.TEST_BASE_URL || 'http://localhost:3000';
      const malformedRequests = [
        // 空消息
        { message: '', userId: 'test_user' },
        // 超长消息
        { message: 'a'.repeat(2000), userId: 'test_user' },
        // 无效JSON
        'invalid json',
        // 缺少必需字段
        { userId: 'test_user' },
        // 无效用户ID
        { message: 'test', userId: '' }
      ];

      const results = await Promise.allSettled(
        malformedRequests.map(request => 
          fetch(`${baseUrl}/chat/message`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: typeof request === 'string' ? request : JSON.stringify(request)
          })
        )
      );

      // 所有请求都应该有响应（即使是错误响应）
      results.forEach((result, index) => {
        expect(result.status).toBe('fulfilled');
        if (result.status === 'fulfilled') {
          const response = result.value;
          // 错误请求应该返回4xx状态码
          if (index < malformedRequests.length - 1) { // 除了最后一个
            expect(response.status).toBeGreaterThanOrEqual(400);
            expect(response.status).toBeLessThan(500);
          }
        }
      });

      console.log(`错误处理测试: ${malformedRequests.length} 个异常请求全部正确处理`);
    });
  });
});