/**
 * 性能压力测试
 */

import { describe, it, expect } from 'vitest';
import fetch from 'node-fetch';
import { TEST_CONFIG, testUtils } from '../setup.js';

describe('Performance Tests', () => {
  describe('Concurrent Requests', () => {
    it('应该处理并发聊天请求', async () => {
      const concurrentRequests = 10;
      const testMessage = '并发测试消息';
      
      const promises = Array.from({ length: concurrentRequests }, (_, i) => {
        const userId = `load_test_user_${i}`;
        const sessionId = `load_test_session_${i}`;
        
        return fetch(`${TEST_CONFIG.baseUrl}/chat/message`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: testMessage,
            userId,
            sessionId
          })
        });
      });

      const startTime = Date.now();
      const responses = await Promise.all(promises);
      const endTime = Date.now();
      
      const responseTime = endTime - startTime;
      
      // 验证所有请求都成功
      responses.forEach(response => {
        expect(response.status).toBe(200);
      });
      
      // 验证响应时间在合理范围内
      expect(responseTime).toBeLessThan(10000); // 10秒内完成
      
      console.log(`并发 ${concurrentRequests} 个请求，总耗时: ${responseTime}ms`);
    });

    it('应该处理高频率请求', async () => {
      const requestCount = 50;
      const requestsPerSecond = 10;
      const delay = 1000 / requestsPerSecond;
      
      const results = [];
      const startTime = Date.now();
      
      for (let i = 0; i < requestCount; i++) {
        const requestStart = Date.now();
        
        const response = await fetch(`${TEST_CONFIG.baseUrl}/chat/message`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: `高频测试消息 ${i}`,
            userId: `freq_test_user_${i}`
          })
        });
        
        const requestEnd = Date.now();
        const requestTime = requestEnd - requestStart;
        
        results.push({
          status: response.status,
          responseTime: requestTime,
          success: response.status === 200
        });
        
        // 控制请求频率
        if (i < requestCount - 1) {
          await testUtils.delay(delay);
        }
      }
      
      const endTime = Date.now();
      const totalTime = endTime - startTime;
      
      // 统计结果
      const successCount = results.filter(r => r.success).length;
      const avgResponseTime = results.reduce((sum, r) => sum + r.responseTime, 0) / results.length;
      const maxResponseTime = Math.max(...results.map(r => r.responseTime));
      
      console.log(`高频测试结果:`);
      console.log(`- 总请求数: ${requestCount}`);
      console.log(`- 成功请求数: ${successCount}`);
      console.log(`- 成功率: ${(successCount / requestCount * 100).toFixed(2)}%`);
      console.log(`- 平均响应时间: ${avgResponseTime.toFixed(2)}ms`);
      console.log(`- 最大响应时间: ${maxResponseTime}ms`);
      console.log(`- 总耗时: ${totalTime}ms`);
      
      // 验证性能指标
      expect(successCount / requestCount).toBeGreaterThan(0.95); // 95% 成功率
      expect(avgResponseTime).toBeLessThan(5000); // 平均响应时间小于5秒
      expect(maxResponseTime).toBeLessThan(10000); // 最大响应时间小于10秒
    });
  });

  describe('Memory Usage', () => {
    it('应该监控内存使用情况', async () => {
      const iterations = 100;
      const memorySnapshots = [];
      
      for (let i = 0; i < iterations; i++) {
        // 发送请求
        const response = await fetch(`${TEST_CONFIG.baseUrl}/chat/message`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: `内存测试消息 ${i}`,
            userId: `memory_test_user_${i}`
          })
        });
        
        expect(response.status).toBe(200);
        
        // 每10次请求记录一次内存使用
        if (i % 10 === 0) {
          const healthResponse = await fetch(`${TEST_CONFIG.baseUrl}/health`);
          const healthData = await healthResponse.json();
          
          if (healthData.memory) {
            memorySnapshots.push({
              iteration: i,
              memory: healthData.memory
            });
          }
        }
        
        // 短暂延迟
        await testUtils.delay(100);
      }
      
      // 分析内存使用趋势
      if (memorySnapshots.length > 1) {
        const initialMemory = memorySnapshots[0].memory.heapUsed;
        const finalMemory = memorySnapshots[memorySnapshots.length - 1].memory.heapUsed;
        const memoryGrowth = finalMemory - initialMemory;
        
        console.log(`内存使用分析:`);
        console.log(`- 初始内存: ${(initialMemory / 1024 / 1024).toFixed(2)} MB`);
        console.log(`- 最终内存: ${(finalMemory / 1024 / 1024).toFixed(2)} MB`);
        console.log(`- 内存增长: ${(memoryGrowth / 1024 / 1024).toFixed(2)} MB`);
        
        // 验证内存增长在合理范围内
        expect(memoryGrowth / 1024 / 1024).toBeLessThan(100); // 内存增长小于100MB
      }
    });
  });

  describe('Response Time Distribution', () => {
    it('应该分析响应时间分布', async () => {
      const requestCount = 30;
      const responseTimes = [];
      
      for (let i = 0; i < requestCount; i++) {
        const startTime = Date.now();
        
        const response = await fetch(`${TEST_CONFIG.baseUrl}/chat/message`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: `响应时间测试 ${i}`,
            userId: `response_test_user_${i}`
          })
        });
        
        const endTime = Date.now();
        const responseTime = endTime - startTime;
        
        expect(response.status).toBe(200);
        responseTimes.push(responseTime);
        
        await testUtils.delay(200);
      }
      
      // 计算统计指标
      const sortedTimes = responseTimes.sort((a, b) => a - b);
      const avgTime = responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length;
      const p50 = sortedTimes[Math.floor(sortedTimes.length * 0.5)];
      const p90 = sortedTimes[Math.floor(sortedTimes.length * 0.9)];
      const p95 = sortedTimes[Math.floor(sortedTimes.length * 0.95)];
      const p99 = sortedTimes[Math.floor(sortedTimes.length * 0.99)];
      
      console.log(`响应时间分布:`);
      console.log(`- 平均响应时间: ${avgTime.toFixed(2)}ms`);
      console.log(`- P50 (中位数): ${p50}ms`);
      console.log(`- P90: ${p90}ms`);
      console.log(`- P95: ${p95}ms`);
      console.log(`- P99: ${p99}ms`);
      
      // 验证性能指标
      expect(avgTime).toBeLessThan(3000); // 平均响应时间小于3秒
      expect(p90).toBeLessThan(5000); // 90% 请求在5秒内完成
      expect(p95).toBeLessThan(8000); // 95% 请求在8秒内完成
    });
  });
});
