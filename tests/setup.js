/**
 * 测试环境设置
 */

import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { beforeAll, afterAll } from 'vitest';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 加载环境变量
config({ path: join(__dirname, '../.env') });

// 设置测试环境
beforeAll(async () => {
  // 设置测试环境变量
  process.env.NODE_ENV = 'test';
  process.env.OPENAI_API_KEY = process.env.OPENAI_API_KEY || 'test-key';
  process.env.META_APP_ID = process.env.META_APP_ID || 'test-app-id';
  process.env.META_APP_SECRET = process.env.META_APP_SECRET || 'test-app-secret';
  process.env.META_ACCESS_TOKEN = process.env.META_ACCESS_TOKEN || 'test-access-token';
  process.env.LOG_LEVEL = 'error';
  process.env.MONITORING_ENABLED = 'false';
});

afterAll(async () => {
  // 清理测试环境
  delete process.env.NODE_ENV;
  delete process.env.LOG_LEVEL;
  delete process.env.MONITORING_ENABLED;
});

// 测试配置
export const TEST_CONFIG = {
  baseUrl: process.env.TEST_BASE_URL || 'http://localhost:3000',
  timeout: 10000,
  retries: 3,
  testUserId: 'test_user_' + Date.now(),
  testSessionId: 'test_session_' + Date.now()
};

// 测试数据
export const TEST_DATA = {
  messages: [
    '你好',
    '我想预约服务',
    '你们的诊所地址在哪里？',
    '有哪些医生？',
    '我最近头痛，应该怎么办？'
  ],
  expectedResponses: [
    'greeting',
    'appointment',
    'clinic_info',
    'doctor_info',
    'health_advice'
  ]
};

// 工具函数
export const testUtils = {
  async delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  },

  generateTestUser() {
    return `test_user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  },

  generateTestSession() {
    return `test_session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  },

  sanitizeLogData(data) {
    // 移除敏感信息用于日志记录
    const sanitized = { ...data };
    if (sanitized.message) {
      sanitized.message = sanitized.message.replace(/\b\d{3,}\b/g, '***');
      sanitized.message = sanitized.message.replace(/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}/g, '***@***.***');
    }
    return sanitized;
  }
};
