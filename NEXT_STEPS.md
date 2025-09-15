# 🚀 下一步：完整配置 AI 聊天机器人

## 📋 当前状态

✅ **已完成**:
- 完整的聊天机器人系统架构
- Vercel 部署配置
- 环境变量配置工具
- 测试脚本和演示页面
- 本地开发环境设置

⚠️ **需要配置**:
- OpenAI API Key (本地和 Vercel)
- 本地环境变量设置

---

## 🎯 立即开始 (5 分钟)

### 步骤 1: 设置本地环境变量

```bash
# 运行本地环境设置脚本
npm run setup-local
```

按提示输入你的 OpenAI API Key。

### 步骤 2: 启动本地服务器

```bash
# 启动开发服务器
npm run dev
```

### 步骤 3: 测试本地功能

```bash
# 在另一个终端运行测试
npm run test-local
```

### 步骤 4: 访问本地界面

打开浏览器访问:
- **主页面**: http://localhost:3000/complete-solution.html
- **AI 聊天**: http://localhost:3000/ai-chat.html
- **简单测试**: http://localhost:3000/test-simple.html

---

## 🌐 部署到生产环境

### 步骤 1: 配置 Vercel 环境变量

```bash
# 运行 Vercel 环境配置脚本
npm run setup
```

### 步骤 2: 重新部署

```bash
# 部署到生产环境
npm run deploy
```

### 步骤 3: 测试生产环境

```bash
# 测试生产环境 (使用最新部署 URL)
npm run test-ai https://your-latest-deployment.vercel.app
```

---

## 🔧 故障排除

### 问题 1: 本地服务器启动失败
**错误**: `OPENAI_API_KEY environment variable is missing`

**解决**:
```bash
npm run setup-local
```

### 问题 2: Vercel 部署有认证保护
**原因**: Vercel 项目设置了部署保护

**解决**: 
1. 访问 [Vercel Dashboard](https://vercel.com/dashboard)
2. 选择项目 → Settings → General
3. 关闭 "Deployment Protection"

### 问题 3: AI 不回复
**原因**: OpenAI API Key 无效或余额不足

**解决**:
1. 检查 API Key 是否正确
2. 确认 OpenAI 账户有足够余额
3. 检查 API 使用限制

---

## 📊 测试和验证

### 本地测试
```bash
# 健康检查
curl http://localhost:3000/health

# AI 聊天测试
curl -X POST http://localhost:3000/chat/message \
  -H "Content-Type: application/json" \
  -d '{"message": "你好", "userId": "test_user"}'
```

### 生产环境测试
```bash
# 替换为你的实际部署 URL
curl https://your-domain.vercel.app/health
```

---

## 🎨 自定义和扩展

### 1. 修改 AI 提示词
编辑 `src/services/gptService.js` 中的 `systemPrompt`

### 2. 更新知识库
编辑 `data/faq.json` 文件

### 3. 自定义界面
修改 `public/` 目录下的 HTML/CSS 文件

### 4. 添加新功能
在 `src/services/` 目录下添加新的服务

---

## 📱 集成到网站

### 方法 1: 使用完整 AI 系统
1. 访问 http://localhost:3000/complete-solution.html
2. 复制 "完整 AI 系统" 的代码
3. 粘贴到你的网站 HTML 中

### 方法 2: 使用简单版本
1. 访问 http://localhost:3000/complete-solution.html
2. 复制 "简单内联版本" 的代码
3. 粘贴到你的网站 HTML 中

---

## 🔗 重要链接

- **GitHub 仓库**: https://github.com/acutherapy/chatbot
- **OpenAI Platform**: https://platform.openai.com/api-keys
- **Vercel Dashboard**: https://vercel.com/dashboard
- **Meta for Developers**: https://developers.facebook.com/

---

## 📞 支持

如果遇到问题：

1. 查看 [SETUP_GUIDE.md](./SETUP_GUIDE.md) 详细配置指南
2. 检查 [GitHub Issues](https://github.com/acutherapy/chatbot/issues)
3. 运行 `npm run test-local` 诊断问题

---

**🎉 现在就开始配置你的 AI 聊天机器人吧！**
