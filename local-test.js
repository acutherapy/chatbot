#!/usr/bin/env node

/**
 * 本地测试脚本
 * 用于测试聊天机器人功能
 */

import fetch from 'node-fetch';
import { validateConfig } from './src/config/index.js';

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

async function testLocalServer() {
  log('\n🧪 本地服务器测试', 'cyan');
  log('=====================================', 'cyan');

  const baseUrl = 'http://localhost:3000';

  // 测试健康检查
  log('\n🏥 测试健康检查...', 'blue');
  try {
    const response = await fetch(`${baseUrl}/health`);
    const data = await response.json();
    
    if (response.ok) {
      log('✅ 健康检查通过', 'green');
      log(`状态: ${data.status}`, 'green');
      log(`运行时间: ${Math.round(data.uptime)} 秒`, 'green');
      
      if (data.services) {
        log('\n📋 服务状态:', 'blue');
        for (const [service, status] of Object.entries(data.services)) {
          const statusColor = status === 'configured' || status === 'loaded' || status === 'connected' ? 'green' : 'yellow';
          log(`  ${service}: ${status}`, statusColor);
        }
      }
    } else {
      log(`❌ 健康检查失败: ${response.status}`, 'red');
    }
  } catch (error) {
    log(`❌ 健康检查请求失败: ${error.message}`, 'red');
    log('💡 请确保本地服务器正在运行: npm run dev', 'yellow');
    return false;
  }

  // 测试 AI 聊天
  log('\n🤖 测试 AI 聊天...', 'blue');
  const testMessages = [
    '你好',
    '我想预约服务',
    '你们的诊所地址在哪里？'
  ];

  for (const message of testMessages) {
    log(`\n📝 测试消息: "${message}"`, 'yellow');
    
    try {
      const response = await fetch(`${baseUrl}/chat/message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: message,
          userId: `test_user_${Date.now()}`,
          sessionId: `test_session_${Date.now()}`
        })
      });

      const data = await response.json();
      
      if (response.ok && data.success) {
        log(`✅ AI 回复: "${data.response}"`, 'green');
      } else {
        log(`❌ AI 回复失败: ${data.error || '未知错误'}`, 'red');
      }
    } catch (error) {
      log(`❌ 请求失败: ${error.message}`, 'red');
    }

    // 等待一秒避免请求过快
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  return true;
}

async function main() {
  log('🚀 聊天机器人本地测试工具', 'cyan');
  log('=====================================', 'cyan');
  
  // 检查配置
  log('\n📋 检查配置...', 'blue');
  const configValid = validateConfig();
  
  if (configValid) {
    log('✅ 配置验证通过', 'green');
  } else {
    log('⚠️ 配置验证失败，运行在有限模式', 'yellow');
    log('💡 请设置 OPENAI_API_KEY 环境变量以获得完整功能', 'yellow');
  }

  // 测试本地服务器
  const serverOk = await testLocalServer();
  
  if (serverOk) {
    log('\n🎉 本地测试完成！', 'green');
    log('=====================================', 'green');
    log('📋 下一步:', 'yellow');
    log('1. 访问本地界面: http://localhost:3000', 'cyan');
    log('2. 测试 AI 聊天: http://localhost:3000/ai-chat.html', 'cyan');
    log('3. 查看完整解决方案: http://localhost:3000/complete-solution.html', 'cyan');
  } else {
    log('\n⚠️ 本地测试失败', 'yellow');
    log('=====================================', 'yellow');
    log('🔧 故障排除:', 'yellow');
    log('1. 启动本地服务器: npm run dev', 'cyan');
    log('2. 检查端口 3000 是否被占用', 'cyan');
    log('3. 检查环境变量配置', 'cyan');
  }
}

// 运行测试
main().catch(error => {
  log(`❌ 测试过程中出现错误: ${error.message}`, 'red');
  process.exit(1);
});
