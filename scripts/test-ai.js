#!/usr/bin/env node

/**
 * AI 功能测试脚本
 * 用于测试聊天机器人的 AI 功能
 */

import fetch from 'node-fetch';

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

async function testAI(baseUrl) {
  log('\n🧪 AI 聊天机器人功能测试', 'cyan');
  log('=====================================', 'cyan');

  const testCases = [
    {
      name: '基础问候',
      message: '你好',
      expected: 'greeting'
    },
    {
      name: '预约服务',
      message: '我想预约服务',
      expected: 'appointment'
    },
    {
      name: '诊所信息',
      message: '你们的诊所地址在哪里？',
      expected: 'clinic_info'
    },
    {
      name: '医生信息',
      message: '有哪些医生？',
      expected: 'doctor_info'
    },
    {
      name: '健康咨询',
      message: '我最近头痛，应该怎么办？',
      expected: 'health_advice'
    }
  ];

  let passedTests = 0;
  let totalTests = testCases.length;

  for (const testCase of testCases) {
    log(`\n📝 测试: ${testCase.name}`, 'blue');
    log(`输入: "${testCase.message}"`, 'yellow');

    try {
      const response = await fetch(`${baseUrl}/chat/message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: testCase.message,
          userId: `test_user_${Date.now()}`,
          sessionId: `test_session_${Date.now()}`
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.success) {
        log(`✅ 响应: "${data.response}"`, 'green');
        passedTests++;
      } else {
        log(`❌ 错误: ${data.error || '未知错误'}`, 'red');
      }

    } catch (error) {
      log(`❌ 请求失败: ${error.message}`, 'red');
    }

    // 等待一秒避免请求过快
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  // 测试结果
  log('\n📊 测试结果', 'cyan');
  log('=====================================', 'cyan');
  log(`通过测试: ${passedTests}/${totalTests}`, passedTests === totalTests ? 'green' : 'yellow');
  
  if (passedTests === totalTests) {
    log('🎉 所有测试通过！AI 功能正常工作', 'green');
  } else {
    log('⚠️ 部分测试失败，请检查配置', 'yellow');
  }

  return passedTests === totalTests;
}

async function testHealth(baseUrl) {
  log('\n🏥 健康检查测试', 'cyan');
  log('=====================================', 'cyan');

  try {
    const response = await fetch(`${baseUrl}/health`);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    
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

    return true;
  } catch (error) {
    log(`❌ 健康检查失败: ${error.message}`, 'red');
    return false;
  }
}

async function main() {
  const baseUrl = process.argv[2] || 'https://y-eb6kvuxsg-david-cais-projects-ae09bbdf.vercel.app';
  
  log(`🔗 测试 URL: ${baseUrl}`, 'blue');

  // 健康检查
  const healthOk = await testHealth(baseUrl);
  
  if (!healthOk) {
    log('\n❌ 健康检查失败，请检查部署状态', 'red');
    process.exit(1);
  }

  // AI 功能测试
  const aiOk = await testAI(baseUrl);

  // 总结
  log('\n🎯 测试总结', 'cyan');
  log('=====================================', 'cyan');
  
  if (healthOk && aiOk) {
    log('🎉 所有测试通过！聊天机器人系统运行正常', 'green');
    log('\n📋 下一步:', 'yellow');
    log('1. 访问 Web 界面: https://your-domain.vercel.app/ai-chat.html', 'cyan');
    log('2. 集成到你的网站: 复制 complete-solution.html 中的代码', 'cyan');
    log('3. 配置 Meta 平台: 设置 Messenger/Instagram webhook', 'cyan');
  } else {
    log('⚠️ 部分测试失败，请检查配置', 'yellow');
    log('\n🔧 故障排除:', 'yellow');
    log('1. 检查环境变量是否正确设置', 'cyan');
    log('2. 确认 OpenAI API Key 有效且有余额', 'cyan');
    log('3. 查看 Vercel 部署日志', 'cyan');
  }
}

// 运行测试
main().catch(error => {
  log(`❌ 测试过程中出现错误: ${error.message}`, 'red');
  process.exit(1);
});
