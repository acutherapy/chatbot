// 测试环境配置
export const testConfig = {
  server: {
    port: 3001,
    host: 'localhost'
  },
  openai: {
    apiKey: 'test-key',
    model: 'gpt-3.5-turbo',
    maxTokens: 150,
    temperature: 0.7
  },
  meta: {
    appId: 'test-app-id',
    appSecret: 'test-app-secret',
    accessToken: 'test-access-token'
  },
  rateLimit: {
    windowMs: 15 * 60 * 1000,
    maxRequests: 100
  },
  logging: {
    level: 'error', // 测试时只记录错误
    logDir: './test-logs'
  },
  monitoring: {
    enabled: false,
    slackWebhook: null,
    email: null,
    metricsRetention: 1
  },
  security: {
    corsOrigin: '*',
    helmet: {
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", "data:", "https:"]
        }
      }
    }
  }
};
