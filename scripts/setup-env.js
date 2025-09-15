#!/usr/bin/env node

/**
 * 环境变量配置脚本
 * 用于快速配置 Vercel 环境变量
 */

import { execSync } from 'child_process';
import readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// 颜色输出
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function setupEnvironment() {
  log('\n🚀 聊天机器人环境变量配置工具', 'cyan');
  log('=====================================', 'cyan');
  
  try {
    // 检查 Vercel CLI
    log('\n📋 检查 Vercel CLI...', 'blue');
    try {
      execSync('npx vercel --version', { stdio: 'pipe' });
      log('✅ Vercel CLI 已安装', 'green');
    } catch (error) {
      log('❌ Vercel CLI 未安装，请先安装: npm install -g vercel', 'red');
      process.exit(1);
    }

    // 检查是否已登录
    log('\n🔐 检查 Vercel 登录状态...', 'blue');
    try {
      execSync('npx vercel whoami', { stdio: 'pipe' });
      log('✅ 已登录 Vercel', 'green');
    } catch (error) {
      log('❌ 请先登录 Vercel: npx vercel login', 'red');
      process.exit(1);
    }

    // 收集环境变量
    log('\n📝 请输入环境变量值:', 'yellow');
    log('(按 Enter 跳过可选变量)', 'yellow');

    const envVars = {};

    // OpenAI API Key (必需)
    envVars.OPENAI_API_KEY = await question('🔑 OpenAI API Key (必需): ');
    if (!envVars.OPENAI_API_KEY) {
      log('❌ OpenAI API Key 是必需的', 'red');
      process.exit(1);
    }

    // Meta 配置 (可选)
    envVars.META_PAGE_ACCESS_TOKEN = await question('📱 Meta Page Access Token (可选): ');
    envVars.META_VERIFY_TOKEN = await question('🔐 Meta Verify Token (可选): ');
    envVars.META_APP_SECRET = await question('🔒 Meta App Secret (可选): ');

    // 其他配置
    envVars.NODE_ENV = await question('🌍 Node Environment (默认: production): ') || 'production';

    // 确认配置
    log('\n📋 配置确认:', 'yellow');
    log(`OpenAI API Key: ${envVars.OPENAI_API_KEY.substring(0, 10)}...`, 'green');
    log(`Meta Page Access Token: ${envVars.META_PAGE_ACCESS_TOKEN ? '已设置' : '未设置'}`, 'green');
    log(`Meta Verify Token: ${envVars.META_VERIFY_TOKEN || '未设置'}`, 'green');
    log(`Meta App Secret: ${envVars.META_APP_SECRET ? '已设置' : '未设置'}`, 'green');
    log(`Node Environment: ${envVars.NODE_ENV}`, 'green');

    const confirm = await question('\n❓ 确认设置这些环境变量? (y/N): ');
    if (confirm.toLowerCase() !== 'y' && confirm.toLowerCase() !== 'yes') {
      log('❌ 配置已取消', 'red');
      process.exit(0);
    }

    // 设置环境变量
    log('\n⚙️ 设置环境变量...', 'blue');
    
    for (const [key, value] of Object.entries(envVars)) {
      if (value) {
        try {
          log(`设置 ${key}...`, 'blue');
          execSync(`npx vercel env add ${key}`, {
            input: value,
            stdio: 'pipe'
          });
          log(`✅ ${key} 设置成功`, 'green');
        } catch (error) {
          log(`❌ ${key} 设置失败: ${error.message}`, 'red');
        }
      }
    }

    // 重新部署
    log('\n🚀 重新部署到生产环境...', 'blue');
    const deployConfirm = await question('❓ 是否立即重新部署? (y/N): ');
    if (deployConfirm.toLowerCase() === 'y' || deployConfirm.toLowerCase() === 'yes') {
      try {
        execSync('npx vercel --prod', { stdio: 'inherit' });
        log('✅ 部署成功!', 'green');
      } catch (error) {
        log('❌ 部署失败，请手动运行: npx vercel --prod', 'red');
      }
    }

    // 完成
    log('\n🎉 配置完成!', 'green');
    log('=====================================', 'green');
    log('📋 下一步:', 'yellow');
    log('1. 测试健康检查: curl https://your-domain.vercel.app/health', 'cyan');
    log('2. 测试 AI 聊天: 访问 https://your-domain.vercel.app/ai-chat.html', 'cyan');
    log('3. 查看完整指南: SETUP_GUIDE.md', 'cyan');

  } catch (error) {
    log(`❌ 配置过程中出现错误: ${error.message}`, 'red');
    process.exit(1);
  } finally {
    rl.close();
  }
}

// 运行配置
setupEnvironment();
