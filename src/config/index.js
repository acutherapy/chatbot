import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables - 优先使用 .env.local，然后使用 .env
dotenv.config({ path: join(__dirname, '../../.env.local') });
dotenv.config({ path: join(__dirname, '../../.env') });

export const config = {
  // Server Configuration
  port: process.env.PORT || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  
  // OpenAI Configuration
  openai: {
    apiKey: process.env.OPENAI_API_KEY,
    model: process.env.OPENAI_MODEL || 'gpt-3.5-turbo',
    maxTokens: parseInt(process.env.OPENAI_MAX_TOKENS) || 1000,
    temperature: parseFloat(process.env.OPENAI_TEMPERATURE) || 0.7
  },
  
  // Meta Platform Configuration
  meta: {
    pageAccessToken: process.env.META_PAGE_ACCESS_TOKEN,
    verifyToken: process.env.META_VERIFY_TOKEN,
    appSecret: process.env.META_APP_SECRET,
    webhookUrl: process.env.WEBHOOK_URL
  },
  
  // Session Configuration
  session: {
    secret: process.env.SESSION_SECRET || 'your-secret-key-change-in-production',
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  },
  
  // Rate Limiting
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100
  },
  
  // Logging
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    logDir: join(__dirname, '../../logs')
  },

  // 监控配置
  monitoring: {
    enabled: process.env.MONITORING_ENABLED === 'true',
    slackWebhook: process.env.SLACK_WEBHOOK_URL,
    email: process.env.ALERT_EMAIL,
    metricsRetention: parseInt(process.env.METRICS_RETENTION_DAYS) || 7
  },
  
  // Security
  security: {
    corsOrigin: process.env.CORS_ORIGIN || '*',
    helmet: {
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ['\'self\''],
          styleSrc: ['\'self\'', '\'unsafe-inline\''],
          scriptSrc: ['\'self\''],
          imgSrc: ['\'self\'', 'data:', 'https:']
        }
      }
    }
  },
  
  // Paths
  paths: {
    public: join(__dirname, '../../public'),
    data: join(__dirname, '../../data'),
    logs: join(__dirname, '../../logs')
  }
};

// Validation
export const validateConfig = () => {
  const required = [
    'OPENAI_API_KEY',
    'META_PAGE_ACCESS_TOKEN',
    'META_VERIFY_TOKEN'
  ];
  
  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    console.warn(`⚠️ Missing environment variables: ${missing.join(', ')}`);
    console.log('🔄 Running in limited mode...');
    return false;
  }
  
  return true;
};

export default config;
