# API 文档

## 基础信息

- **Base URL**: `https://your-domain.vercel.app`
- **Content-Type**: `application/json`
- **认证**: 无需认证（公开API）

## 响应格式

### 成功响应
```json
{
  "success": true,
  "data": {
    // 具体数据
  },
  "timestamp": "2024-09-15T22:31:35.353Z"
}
```

### 错误响应
```json
{
  "success": false,
  "error": "错误描述",
  "code": "ERROR_CODE",
  "timestamp": "2024-09-15T22:31:35.353Z"
}
```

## 端点列表

### 1. 健康检查

**GET** `/health`

检查系统健康状态。

#### 响应示例
```json
{
  "status": "healthy",
  "timestamp": "2024-09-15T22:31:29.783Z",
  "uptime": 9.1146095,
  "memory": {
    "rss": 89096192,
    "heapTotal": 20561920,
    "heapUsed": 18051720,
    "external": 3737414,
    "arrayBuffers": 67872
  },
  "services": {
    "knowledgeBase": "loaded",
    "messageSender": "ready",
    "openai": "configured",
    "meta": "not_configured"
  }
}
```

### 2. 聊天消息

**POST** `/chat/message`

发送消息给聊天机器人。

#### 请求参数
```json
{
  "message": "用户消息内容",
  "userId": "用户ID（可选）",
  "sessionId": "会话ID（可选）"
}
```

#### 响应示例
```json
{
  "success": true,
  "data": {
    "message": "AI回复内容",
    "userId": "test_user",
    "sessionId": "session_1757975495352_q32cz2orhjf",
    "timestamp": "2024-09-15T22:31:35.353Z",
    "isAppointment": true,
    "quickReplies": [
      {
        "title": "📞 电话预约",
        "payload": "APPOINTMENT_PHONE"
      },
      {
        "title": "🌐 在线预约",
        "payload": "APPOINTMENT_ONLINE"
      }
    ]
  }
}
```

#### 错误响应
```json
{
  "success": false,
  "error": "消息长度必须在 1-1000 字符之间",
  "code": "VALIDATION_ERROR",
  "details": [
    {
      "field": "message",
      "message": "消息长度必须在 1-1000 字符之间"
    }
  ]
}
```

### 3. 快速回复

**POST** `/chat/quick-reply`

处理快速回复按钮点击。

#### 请求参数
```json
{
  "payload": "APPOINTMENT_PHONE",
  "userId": "用户ID",
  "sessionId": "会话ID"
}
```

#### 响应示例
```json
{
  "success": true,
  "data": {
    "message": "感谢您选择电话预约！请拨打我们的预约热线：400-xxx-xxxx",
    "userId": "test_user",
    "sessionId": "session_1757975495352_q32cz2orhjf",
    "timestamp": "2024-09-15T22:31:35.353Z"
  }
}
```

### 4. 会话历史

**GET** `/chat/history/:userId`

获取用户会话历史。

#### 路径参数
- `userId`: 用户ID

#### 查询参数
- `limit`: 返回消息数量限制（默认：50）
- `offset`: 偏移量（默认：0）

#### 响应示例
```json
{
  "success": true,
  "data": {
    "userId": "test_user",
    "messages": [
      {
        "id": "msg_1",
        "content": "用户消息",
        "sender": "user",
        "timestamp": "2024-09-15T22:31:35.353Z"
      },
      {
        "id": "msg_2",
        "content": "AI回复",
        "sender": "bot",
        "timestamp": "2024-09-15T22:31:35.353Z"
      }
    ],
    "total": 2,
    "hasMore": false
  }
}
```

### 5. 知识库搜索

**GET** `/knowledge/search`

搜索知识库内容。

#### 查询参数
- `q`: 搜索关键词
- `category`: 分类筛选（可选）
- `limit`: 返回结果数量（默认：10）

#### 响应示例
```json
{
  "success": true,
  "data": {
    "query": "预约",
    "results": [
      {
        "id": "faq_1",
        "question": "如何预约服务？",
        "answer": "您可以通过以下方式预约...",
        "category": "预约",
        "relevance": 0.95
      }
    ],
    "total": 1
  }
}
```

## 错误代码

| 代码 | 描述 | HTTP状态码 |
|------|------|------------|
| `VALIDATION_ERROR` | 输入验证失败 | 400 |
| `MESSAGE_TOO_LONG` | 消息过长 | 400 |
| `MESSAGE_TOO_SHORT` | 消息过短 | 400 |
| `RATE_LIMIT_EXCEEDED` | 请求频率过高 | 429 |
| `OPENAI_ERROR` | OpenAI API错误 | 502 |
| `META_API_ERROR` | Meta API错误 | 502 |
| `INTERNAL_ERROR` | 内部服务器错误 | 500 |
| `SERVICE_UNAVAILABLE` | 服务不可用 | 503 |

## 限制和配额

### 请求限制
- **频率限制**: 每分钟最多100个请求
- **消息长度**: 1-1000字符
- **会话超时**: 30分钟无活动后自动过期

### 数据保留
- **聊天记录**: 保留30天
- **会话数据**: 保留7天
- **日志数据**: 保留7天

## 使用示例

### JavaScript (Fetch)
```javascript
// 发送消息
const response = await fetch('/chat/message', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    message: '我想预约服务',
    userId: 'user_123'
  })
});

const data = await response.json();
console.log(data.data.message);
```

### cURL
```bash
# 健康检查
curl https://your-domain.vercel.app/health

# 发送消息
curl -X POST https://your-domain.vercel.app/chat/message \
  -H "Content-Type: application/json" \
  -d '{"message": "我想预约服务", "userId": "user_123"}'
```

### Python
```python
import requests

# 发送消息
response = requests.post(
    'https://your-domain.vercel.app/chat/message',
    json={
        'message': '我想预约服务',
        'userId': 'user_123'
    }
)

data = response.json()
print(data['data']['message'])
```

## 更新日志

### v1.0.0 (2024-09-15)
- 初始版本发布
- 支持基本聊天功能
- 支持快速回复
- 支持会话历史
- 支持知识库搜索

## 支持

如有问题，请联系：
- 邮箱: support@yourclinic.com
- 文档: https://your-domain.vercel.app/docs
- GitHub: https://github.com/acutherapy/chatbot
