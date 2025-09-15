# 多平台聊天机器人 🤖

一个支持 Messenger、Instagram 和网站的多平台聊天机器人，专为诊所客服设计。

## ✨ 功能特性

- 🌐 **多平台支持**: Messenger、Instagram、网站聊天
- 🤖 **AI 驱动**: 基于 OpenAI GPT 的智能对话
- 📚 **知识库**: 内置 FAQ 和智能检索系统
- 💬 **会话管理**: 上下文记忆和会话持久化
- 🔒 **安全可靠**: 完整的错误处理和安全防护
- 📊 **监控日志**: 详细的请求日志和性能监控
- 🎨 **现代 UI**: 响应式聊天界面设计

## 🏗️ 项目结构

```
chatbot/
├── src/
│   ├── config/          # 配置文件
│   ├── routes/          # API 路由
│   ├── services/        # 业务逻辑服务
│   ├── middleware/      # 中间件
│   ├── utils/           # 工具函数
│   └── server.js        # 主服务器文件
├── public/              # 静态文件
│   ├── css/            # 样式文件
│   ├── js/             # 前端脚本
│   └── index.html      # 聊天界面
├── data/               # 数据文件
│   └── faq.json        # FAQ 知识库
├── logs/               # 日志文件
├── package.json        # 项目配置
└── README.md          # 项目文档
```

## 🚀 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量

复制 `env.example` 文件为 `.env` 并填入配置：

```bash
cp env.example .env
```

编辑 `.env` 文件：

```env
# OpenAI 配置
OPENAI_API_KEY=your_openai_api_key_here

# Meta 平台配置
META_PAGE_ACCESS_TOKEN=your_meta_page_access_token_here
META_VERIFY_TOKEN=your_meta_verify_token_here
META_APP_SECRET=your_meta_app_secret_here

# 服务器配置
PORT=3000
NODE_ENV=development
```

### 3. 启动开发服务器

```bash
npm run dev
```

### 4. 访问应用

- 聊天界面: http://localhost:3000
- 健康检查: http://localhost:3000/health
- API 状态: http://localhost:3000/api/status

## 🔧 配置说明

### OpenAI 配置

1. 访问 [OpenAI Platform](https://platform.openai.com/)
2. 创建 API Key
3. 将 Key 添加到环境变量 `OPENAI_API_KEY`

### Meta 平台配置

1. 访问 [Meta for Developers](https://developers.facebook.com/)
2. 创建应用并启用 Messenger 和 Instagram
3. 获取 Page Access Token
4. 配置 Webhook URL: `https://your-domain.com/webhook`
5. 设置验证令牌

### 环境变量说明

| 变量名 | 说明 | 必需 |
|--------|------|------|
| `OPENAI_API_KEY` | OpenAI API 密钥 | ✅ |
| `META_PAGE_ACCESS_TOKEN` | Meta 页面访问令牌 | ✅ |
| `META_VERIFY_TOKEN` | Webhook 验证令牌 | ✅ |
| `META_APP_SECRET` | Meta 应用密钥 | ❌ |
| `PORT` | 服务器端口 | ❌ |
| `NODE_ENV` | 运行环境 | ❌ |

## 📱 平台集成

### Messenger 集成

1. 在 Meta Developer 控制台创建应用
2. 添加 Messenger 产品
3. 配置 Webhook URL: `https://your-domain.com/webhook`
4. 设置验证令牌
5. 获取 Page Access Token

### Instagram 集成

1. 在同一个应用中添加 Instagram Basic Display
2. 配置相同的 Webhook URL
3. 确保 Page Access Token 有 Instagram 权限

### 网站集成

网站聊天功能已内置，直接访问根路径即可使用。

## 🛠️ 开发指南

### 添加新的 FAQ

编辑 `data/faq.json` 文件：

```json
{
  "id": "new_faq",
  "question": "新问题",
  "answer": "新答案",
  "keywords": ["关键词1", "关键词2"],
  "category": "分类名称",
  "priority": 1
}
```

### 自定义系统提示

编辑 `src/services/gptService.js` 中的 `systemPrompt`：

```javascript
this.systemPrompt = `你的自定义系统提示...`;
```

### 添加新的 API 端点

在 `src/routes/` 目录下创建新的路由文件，并在 `src/server.js` 中注册。

## 📊 监控和日志

### 日志文件

- `logs/combined.log`: 所有日志
- `logs/error.log`: 错误日志

### 健康检查

访问 `/health` 端点查看服务状态：

```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "uptime": 3600,
  "services": {
    "openai": "connected",
    "meta": "connected",
    "knowledgeBase": "loaded"
  }
}
```

## 🚀 部署指南

### Vercel 部署

1. 连接 GitHub 仓库到 Vercel
2. 配置环境变量
3. 部署

### Docker 部署

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
```

### 环境变量配置

确保在生产环境中设置所有必需的环境变量。

## 🔒 安全考虑

- ✅ 请求签名验证
- ✅ 速率限制
- ✅ CORS 配置
- ✅ 安全头部
- ✅ 输入验证
- ✅ 错误处理

## 📈 性能优化

- ✅ 连接池管理
- ✅ 缓存机制
- ✅ 异步处理
- ✅ 错误重试
- ✅ 日志轮转

## 🐛 故障排除

### 常见问题

1. **OpenAI API 错误**
   - 检查 API Key 是否正确
   - 确认账户有足够余额
   - 检查网络连接

2. **Meta Webhook 验证失败**
   - 确认验证令牌匹配
   - 检查 Webhook URL 可访问性
   - 验证 HTTPS 证书

3. **知识库加载失败**
   - 检查 `data/faq.json` 文件格式
   - 确认文件权限正确

### 调试模式

设置 `NODE_ENV=development` 启用详细日志。

## 📝 更新日志

### v1.0.0 (2024-01-01)
- ✨ 初始版本发布
- 🌐 支持 Messenger、Instagram、网站
- 🤖 集成 OpenAI GPT
- 📚 内置知识库系统
- 💬 会话管理功能

## 🤝 贡献指南

1. Fork 项目
2. 创建功能分支
3. 提交更改
4. 推送到分支
5. 创建 Pull Request

## 📄 许可证

MIT License - 查看 [LICENSE](LICENSE) 文件了解详情。

## 📞 支持

如有问题，请：

1. 查看 [FAQ](data/faq.json)
2. 检查 [Issues](../../issues)
3. 创建新的 Issue

---

**注意**: 这是一个示例项目，请根据实际需求进行定制和部署。
