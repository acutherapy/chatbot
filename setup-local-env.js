#!/usr/bin/env node

/**
 * 本地环境变量设置脚本
 */

import fs from 'fs';
import path from 'path';
import readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function setupLocalEnv() {
  console.log('🔧 设置本地开发环境变量');
  console.log('=====================================');
  
  const envPath = path.join(process.cwd(), '.env');
  
  // 检查是否已存在 .env 文件
  if (fs.existsSync(envPath)) {
    const overwrite = await question('⚠️ .env 文件已存在，是否覆盖？(y/N): ');
    if (overwrite.toLowerCase() !== 'y' && overwrite.toLowerCase() !== 'yes') {
      console.log('❌ 设置已取消');
      rl.close();
      return;
    }
  }
  
  console.log('\n📝 请输入环境变量值:');
  console.log('(按 Enter 跳过可选变量)');
  
  const openaiKey = await question('🔑 OpenAI API Key (必需): ');
  if (!openaiKey) {
    console.log('❌ OpenAI API Key 是必需的');
    rl.close();
    return;
  }
  
  const metaPageToken = await question('📱 Meta Page Access Token (可选): ');
  const metaVerifyToken = await question('🔐 Meta Verify Token (可选): ');
  const metaAppSecret = await question('🔒 Meta App Secret (可选): ');
  
  // 创建 .env 文件内容
  const envContent = `# 本地开发环境变量
# 注意：这个文件包含敏感信息，不要提交到 Git

# OpenAI 配置
OPENAI_API_KEY=${openaiKey}

# Meta 平台配置 (可选)
META_PAGE_ACCESS_TOKEN=${metaPageToken || ''}
META_VERIFY_TOKEN=${metaVerifyToken || ''}
META_APP_SECRET=${metaAppSecret || ''}

# 服务器配置
PORT=3000
NODE_ENV=development
`;
  
  try {
    fs.writeFileSync(envPath, envContent);
    console.log('\n✅ .env 文件创建成功！');
    console.log('📋 下一步:');
    console.log('1. 启动本地服务器: npm run dev');
    console.log('2. 测试功能: npm run test-local');
    console.log('3. 访问界面: http://localhost:3000');
  } catch (error) {
    console.log(`❌ 创建 .env 文件失败: ${error.message}`);
  }
  
  rl.close();
}

setupLocalEnv();
