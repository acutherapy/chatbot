# ⚡ 快速开始指南

## 🎯 5 分钟配置完整 AI 聊天机器人

### 步骤 1: 获取 OpenAI API Key (2 分钟)

1. 访问 [OpenAI Platform](https://platform.openai.com/api-keys)
2. 点击 "Create new secret key"
3. 复制 API Key (格式: `sk-...`)

### 步骤 2: 运行配置脚本 (1 分钟)

```bash
# 运行交互式配置脚本
npm run setup
```

按提示输入你的 OpenAI API Key，其他选项可以跳过。

### 步骤 3: 测试功能 (1 分钟)

```bash
# 测试 AI 功能
npm run test-ai
```

### 步骤 4: 集成到网站 (1 分钟)

访问: https://your-domain.vercel.app/complete-solution.html

复制 "完整 AI 系统" 的代码到你的网站。

---

## 🚀 就这么简单！

现在你有了一个功能完整的 AI 聊天机器人：

- ✅ 真正的 AI 对话 (OpenAI GPT)
- ✅ 知识库检索
- ✅ 会话记忆
- ✅ 美观的聊天界面
- ✅ 快速回复功能

---

## 📋 常用命令

```bash
# 配置环境变量
npm run setup

# 测试 AI 功能
npm run test-ai

# 部署到生产环境
npm run deploy

# 查看环境变量
npm run env:ls

# 添加环境变量
npm run env:add VARIABLE_NAME
```

---

## 🔧 故障排除

### 问题: 测试失败
**解决**: 检查 OpenAI API Key 是否正确设置

### 问题: 部署失败
**解决**: 运行 `npm run deploy` 重新部署

### 问题: AI 不回复
**解决**: 检查 OpenAI 账户余额

---

## 📚 更多信息

- 详细配置指南: [SETUP_GUIDE.md](./SETUP_GUIDE.md)
- 完整解决方案: [complete-solution.html](./public/complete-solution.html)
- 源码仓库: [GitHub](https://github.com/acutherapy/chatbot)

---

**🎉 享受你的 AI 聊天机器人吧！**
