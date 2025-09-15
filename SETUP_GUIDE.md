# 🚀 完整聊天机器人系统配置指南

## 📋 配置步骤概览

1. **获取 OpenAI API Key**
2. **配置 Meta 平台 (可选)**
3. **在 Vercel 中设置环境变量**
4. **重新部署系统**
5. **测试 AI 功能**

---

## 1. 🔑 获取 OpenAI API Key

### 步骤 1.1: 注册 OpenAI 账户
1. 访问 [OpenAI Platform](https://platform.openai.com/)
2. 注册或登录账户
3. 完成身份验证

### 步骤 1.2: 创建 API Key
1. 进入 [API Keys 页面](https://platform.openai.com/api-keys)
2. 点击 "Create new secret key"
3. 输入名称（如：chatbot-clinic）
4. 选择权限（建议选择 "All"）
5. 点击 "Create secret key"
6. **重要**: 立即复制并保存 API Key，页面关闭后无法再次查看

### 步骤 1.3: 充值账户
1. 进入 [Billing 页面](https://platform.openai.com/account/billing)
2. 添加支付方式
3. 充值至少 $5（建议 $10-20 用于测试）

---

## 2. 📱 配置 Meta 平台 (可选)

### 步骤 2.1: 创建 Meta 应用
1. 访问 [Meta for Developers](https://developers.facebook.com/)
2. 点击 "My Apps" → "Create App"
3. 选择 "Business" 类型
4. 填写应用信息：
   - App Name: Clinic Chatbot
   - App Contact Email: your-email@example.com
   - Business Account: 选择或创建

### 步骤 2.2: 添加 Messenger 产品
1. 在应用面板中，找到 "Add Product"
2. 点击 Messenger 的 "Set up"
3. 在 Messenger 设置页面：
   - 生成 Page Access Token
   - 设置 Webhook URL: `https://your-domain.vercel.app/webhook`
   - 设置 Verify Token: 自定义字符串（如：clinic_verify_2024）

### 步骤 2.3: 配置 Instagram (可选)
1. 在应用面板中添加 Instagram Basic Display
2. 配置 Instagram 账户
3. 获取 Instagram Access Token

---

## 3. ⚙️ 在 Vercel 中设置环境变量

### 方法 1: 通过 Vercel CLI (推荐)

```bash
# 设置 OpenAI API Key
npx vercel env add OPENAI_API_KEY

# 设置 Meta 配置
npx vercel env add META_PAGE_ACCESS_TOKEN
npx vercel env add META_VERIFY_TOKEN
npx vercel env add META_APP_SECRET

# 设置其他配置
npx vercel env add NODE_ENV production
```

### 方法 2: 通过 Vercel Dashboard

1. 访问 [Vercel Dashboard](https://vercel.com/dashboard)
2. 选择你的项目
3. 进入 "Settings" → "Environment Variables"
4. 添加以下变量：

| 变量名 | 值 | 描述 |
|--------|-----|------|
| `OPENAI_API_KEY` | `sk-...` | OpenAI API Key |
| `META_PAGE_ACCESS_TOKEN` | `EAA...` | Meta Page Access Token |
| `META_VERIFY_TOKEN` | `clinic_verify_2024` | Webhook 验证令牌 |
| `META_APP_SECRET` | `your_app_secret` | Meta 应用密钥 |
| `NODE_ENV` | `production` | 环境类型 |

---

## 4. 🔄 重新部署系统

```bash
# 重新部署到生产环境
npx vercel --prod
```

---

## 5. 🧪 测试 AI 功能

### 测试 1: 健康检查
```bash
curl https://your-domain.vercel.app/health
```

### 测试 2: AI 聊天
```bash
curl -X POST https://your-domain.vercel.app/chat/message \
  -H "Content-Type: application/json" \
  -d '{"message": "你好，我想预约服务", "userId": "test_user"}'
```

### 测试 3: Web 界面
访问: `https://your-domain.vercel.app/ai-chat.html`

---

## 🔧 故障排除

### 问题 1: 401 认证错误
**原因**: 环境变量未正确设置
**解决**: 检查 Vercel 环境变量配置，确保所有必需的变量都已添加

### 问题 2: OpenAI API 错误
**原因**: API Key 无效或账户余额不足
**解决**: 
- 检查 API Key 是否正确
- 确认账户有足够余额
- 检查 API 使用限制

### 问题 3: Meta Webhook 验证失败
**原因**: Verify Token 不匹配
**解决**: 确保 Vercel 中的 `META_VERIFY_TOKEN` 与 Meta 应用中的设置一致

### 问题 4: 部署失败
**原因**: 环境变量格式错误
**解决**: 检查环境变量值，确保没有多余的空格或特殊字符

---

## 📊 监控和维护

### 监控指标
- API 调用次数
- 响应时间
- 错误率
- 用户活跃度

### 定期维护
- 检查 OpenAI 账户余额
- 更新 FAQ 知识库
- 监控系统日志
- 优化 AI 提示词

---

## 🎯 下一步

配置完成后，你可以：

1. **自定义 AI 提示词**: 修改 `src/services/gptService.js` 中的 `systemPrompt`
2. **更新知识库**: 编辑 `data/faq.json` 文件
3. **添加新功能**: 扩展聊天机器人功能
4. **集成更多平台**: 添加 WhatsApp、Telegram 等

---

## 📞 支持

如果遇到问题，请：

1. 检查 [GitHub Issues](https://github.com/acutherapy/chatbot/issues)
2. 查看 [Vercel 文档](https://vercel.com/docs)
3. 参考 [OpenAI API 文档](https://platform.openai.com/docs)

---

**🎉 配置完成后，你就拥有了一个功能完整的 AI 聊天机器人系统！**
