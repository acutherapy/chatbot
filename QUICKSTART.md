# 🚀 快速启动指南

## 1. 环境配置

### 复制环境变量文件
```bash
cp env.example .env
```

### 编辑 .env 文件
```env
# OpenAI 配置 (必需)
OPENAI_API_KEY=sk-your-openai-api-key-here

# Meta 平台配置 (必需)
META_PAGE_ACCESS_TOKEN=your-meta-page-access-token
META_VERIFY_TOKEN=your-custom-verify-token

# 可选配置
META_APP_SECRET=your-meta-app-secret
PORT=3000
NODE_ENV=development
```

## 2. 获取 API 密钥

### OpenAI API Key
1. 访问 [OpenAI Platform](https://platform.openai.com/)
2. 登录并创建 API Key
3. 复制 Key 到 `.env` 文件

### Meta 平台配置
1. 访问 [Meta for Developers](https://developers.facebook.com/)
2. 创建新应用
3. 添加 Messenger 产品
4. 获取 Page Access Token
5. 设置 Webhook URL: `https://your-domain.com/webhook`

## 3. 启动项目

### 开发模式
```bash
npm run dev
```

### 生产模式
```bash
npm start
```

## 4. 测试功能

### 运行测试脚本
```bash
node test-setup.js
```

### 访问应用
- 聊天界面: http://localhost:3000
- 健康检查: http://localhost:3000/health
- API 状态: http://localhost:3000/api/status

## 5. 部署到生产环境

### Vercel 部署
1. 连接 GitHub 仓库
2. 配置环境变量
3. 自动部署

### Docker 部署
```bash
docker build -t chatbot .
docker run -p 3000:3000 --env-file .env chatbot
```

## 6. 配置 Meta Webhook

### Webhook URL
```
https://your-domain.com/webhook
```

### 验证令牌
使用 `.env` 中设置的 `META_VERIFY_TOKEN`

### 订阅字段
- `messages`
- `messaging_postbacks`
- `messaging_optins`

## 7. 自定义配置

### 修改 FAQ
编辑 `data/faq.json` 文件

### 自定义系统提示
编辑 `src/services/gptService.js` 中的 `systemPrompt`

### 添加新功能
在 `src/routes/` 目录下创建新的路由文件

## 8. 监控和维护

### 查看日志
```bash
tail -f logs/combined.log
```

### 健康检查
```bash
curl http://localhost:3000/health
```

### 重新加载知识库
```bash
curl -X POST http://localhost:3000/api/knowledge/reload
```

## 9. 故障排除

### 常见问题
1. **环境变量未设置**: 检查 `.env` 文件
2. **OpenAI API 错误**: 验证 API Key 和余额
3. **Meta Webhook 失败**: 检查 URL 和验证令牌
4. **知识库加载失败**: 检查 `data/faq.json` 格式

### 调试模式
设置 `NODE_ENV=development` 启用详细日志

## 10. 下一步

- 📚 阅读完整 [README.md](README.md)
- 🔧 自定义 FAQ 和系统提示
- 🎨 修改前端界面样式
- 📱 配置更多平台集成
- 📊 添加监控和分析功能

---

**需要帮助？** 查看 [README.md](README.md) 或创建 Issue。
