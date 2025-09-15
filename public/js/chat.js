// 聊天机器人 JavaScript 代码
class ChatBot {
    constructor() {
        this.userId = this.generateUserId();
        this.sessionId = this.generateSessionId();
        this.isTyping = false;
        this.messageQueue = [];
        
        this.initializeElements();
        this.bindEvents();
        this.loadUserPreferences();
    }

    // 初始化 DOM 元素
    initializeElements() {
        this.chatMessages = document.getElementById('chatMessages');
        this.messageInput = document.getElementById('messageInput');
        this.sendButton = document.getElementById('sendButton');
        this.charCount = document.getElementById('charCount');
        this.typingIndicator = document.getElementById('typingIndicator');
        this.loadingOverlay = document.getElementById('loadingOverlay');
        this.errorToast = document.getElementById('errorToast');
        this.errorMessage = document.getElementById('errorMessage');
        this.clearChatBtn = document.getElementById('clearChat');
        this.quickReplies = document.getElementById('quickReplies');
    }

    // 绑定事件监听器
    bindEvents() {
        // 发送按钮点击
        this.sendButton.addEventListener('click', () => this.sendMessage());
        
        // 输入框回车发送
        this.messageInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });
        
        // 输入框内容变化
        this.messageInput.addEventListener('input', () => {
            this.updateCharCount();
            this.updateSendButton();
            this.autoResizeTextarea();
        });
        
        // 清除聊天
        this.clearChatBtn.addEventListener('click', () => this.clearChat());
        
        // 快速回复按钮
        this.quickReplies.addEventListener('click', (e) => {
            if (e.target.classList.contains('quick-reply-btn')) {
                const payload = e.target.dataset.payload;
                this.handleQuickReply(payload);
            }
        });
        
        // 错误提示关闭
        document.addEventListener('click', (e) => {
            if (e.target.closest('.toast-close')) {
                this.hideError();
            }
        });
    }

    // 生成用户ID
    generateUserId() {
        const timestamp = Date.now();
        const random = Math.random().toString(36).substring(2, 15);
        return `web_user_${timestamp}_${random}`;
    }

    // 生成会话ID
    generateSessionId() {
        const timestamp = Date.now();
        const random = Math.random().toString(36).substring(2, 15);
        return `session_${timestamp}_${random}`;
    }

    // 发送消息
    async sendMessage() {
        const message = this.messageInput.value.trim();
        
        if (!message || this.isTyping) {
            return;
        }

        // 添加用户消息到界面
        this.addMessage(message, 'user');
        
        // 清空输入框
        this.messageInput.value = '';
        this.updateCharCount();
        this.updateSendButton();
        this.autoResizeTextarea();
        
        // 隐藏快速回复
        this.hideQuickReplies();
        
        // 显示加载状态
        this.showLoading();
        
        try {
            // 发送到后端
            const response = await this.sendToBackend(message);
            
            // 添加机器人回复
            this.addMessage(response.message, 'bot');
            
            // 显示快速回复（如果是预约相关）
            if (response.quickReplies) {
                this.showQuickReplies(response.quickReplies);
            }
            
        } catch (error) {
            console.error('发送消息失败:', error);
            this.showError('发送消息失败，请重试');
            this.addMessage('抱歉，我暂时无法回复您的消息。请稍后再试。', 'bot');
        } finally {
            this.hideLoading();
        }
    }

    // 发送消息到后端
    async sendToBackend(message) {
        const response = await fetch('/chat/message', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                message: message,
                userId: this.userId,
                sessionId: this.sessionId
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || '请求失败');
        }

        const data = await response.json();
        
        if (!data.success) {
            throw new Error(data.error || '服务器错误');
        }

        return data.data;
    }

    // 添加消息到聊天界面
    addMessage(content, sender) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${sender}-message`;
        
        const avatar = document.createElement('div');
        avatar.className = 'message-avatar';
        avatar.innerHTML = sender === 'bot' ? '<i class="fas fa-robot"></i>' : '<i class="fas fa-user"></i>';
        
        const messageContent = document.createElement('div');
        messageContent.className = 'message-content';
        
        const messageBubble = document.createElement('div');
        messageBubble.className = 'message-bubble';
        messageBubble.innerHTML = this.formatMessage(content);
        
        const messageTime = document.createElement('div');
        messageTime.className = 'message-time';
        messageTime.textContent = this.getCurrentTime();
        
        messageContent.appendChild(messageBubble);
        messageContent.appendChild(messageTime);
        
        messageDiv.appendChild(avatar);
        messageDiv.appendChild(messageContent);
        
        this.chatMessages.appendChild(messageDiv);
        this.scrollToBottom();
    }

    // 格式化消息内容
    formatMessage(content) {
        // 处理换行
        content = content.replace(/\n/g, '<br>');
        
        // 处理链接
        content = content.replace(
            /(https?:\/\/[^\s]+)/g, 
            '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>'
        );
        
        // 处理电话号码
        content = content.replace(
            /(\d{3,4}-\d{3,4}-\d{3,4})/g,
            '<a href="tel:$1">$1</a>'
        );
        
        return content;
    }

    // 获取当前时间
    getCurrentTime() {
        const now = new Date();
        return now.toLocaleTimeString('zh-CN', { 
            hour: '2-digit', 
            minute: '2-digit' 
        });
    }

    // 滚动到底部
    scrollToBottom() {
        setTimeout(() => {
            this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
        }, 100);
    }

    // 处理快速回复
    handleQuickReply(payload) {
        let message = '';
        
        switch (payload) {
            case 'BOOK_APPOINTMENT':
                message = '我想预约服务';
                break;
            case 'VIEW_SERVICES':
                message = '请介绍一下你们的服务';
                break;
            case 'CLINIC_INFO':
                message = '请提供诊所的基本信息';
                break;
            case 'OTHER_INQUIRY':
                message = '我有其他问题需要咨询';
                break;
            default:
                message = payload;
        }
        
        this.messageInput.value = message;
        this.updateCharCount();
        this.updateSendButton();
        this.sendMessage();
    }

    // 显示快速回复
    showQuickReplies(replies) {
        this.quickReplies.innerHTML = '';
        
        replies.forEach(reply => {
            const button = document.createElement('button');
            button.className = 'quick-reply-btn';
            button.textContent = reply.title;
            button.dataset.payload = reply.payload;
            this.quickReplies.appendChild(button);
        });
        
        this.quickReplies.style.display = 'flex';
    }

    // 隐藏快速回复
    hideQuickReplies() {
        this.quickReplies.style.display = 'none';
    }

    // 更新字符计数
    updateCharCount() {
        const count = this.messageInput.value.length;
        this.charCount.textContent = `${count}/1000`;
        
        if (count > 900) {
            this.charCount.style.color = '#EF4444';
        } else if (count > 800) {
            this.charCount.style.color = '#F59E0B';
        } else {
            this.charCount.style.color = '#64748B';
        }
    }

    // 更新发送按钮状态
    updateSendButton() {
        const hasText = this.messageInput.value.trim().length > 0;
        this.sendButton.disabled = !hasText || this.isTyping;
    }

    // 自动调整输入框高度
    autoResizeTextarea() {
        this.messageInput.style.height = 'auto';
        this.messageInput.style.height = Math.min(this.messageInput.scrollHeight, 120) + 'px';
    }

    // 显示加载状态
    showLoading() {
        this.isTyping = true;
        this.loadingOverlay.style.display = 'flex';
        this.updateSendButton();
    }

    // 隐藏加载状态
    hideLoading() {
        this.isTyping = false;
        this.loadingOverlay.style.display = 'none';
        this.updateSendButton();
    }

    // 显示错误提示
    showError(message) {
        this.errorMessage.textContent = message;
        this.errorToast.style.display = 'flex';
        
        // 3秒后自动隐藏
        setTimeout(() => {
            this.hideError();
        }, 5000);
    }

    // 隐藏错误提示
    hideError() {
        this.errorToast.style.display = 'none';
    }

    // 清除聊天记录
    async clearChat() {
        if (!confirm('确定要清除所有聊天记录吗？')) {
            return;
        }

        try {
            // 清除后端会话
            await fetch(`/chat/session/${this.userId}`, {
                method: 'DELETE'
            });
            
            // 清除界面
            const messages = this.chatMessages.querySelectorAll('.message:not(:first-child)');
            messages.forEach(message => message.remove());
            
            // 隐藏快速回复
            this.hideQuickReplies();
            
            // 重新生成会话ID
            this.sessionId = this.generateSessionId();
            
            console.log('聊天记录已清除');
            
        } catch (error) {
            console.error('清除聊天记录失败:', error);
            this.showError('清除聊天记录失败');
        }
    }

    // 加载用户偏好设置
    loadUserPreferences() {
        // 从 localStorage 加载用户偏好
        const savedUserId = localStorage.getItem('chatbot_userId');
        if (savedUserId) {
            this.userId = savedUserId;
        } else {
            localStorage.setItem('chatbot_userId', this.userId);
        }
        
        // 加载主题偏好
        const theme = localStorage.getItem('chatbot_theme');
        if (theme === 'dark') {
            document.body.classList.add('dark-theme');
        }
    }

    // 保存用户偏好设置
    saveUserPreferences() {
        localStorage.setItem('chatbot_userId', this.userId);
    }
}

// 全局函数
function hideError() {
    if (window.chatBot) {
        window.chatBot.hideError();
    }
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
    window.chatBot = new ChatBot();
    
    // 保存用户偏好
    window.addEventListener('beforeunload', () => {
        if (window.chatBot) {
            window.chatBot.saveUserPreferences();
        }
    });
});

// 处理网络错误
window.addEventListener('online', () => {
    console.log('网络连接已恢复');
});

window.addEventListener('offline', () => {
    if (window.chatBot) {
        window.chatBot.showError('网络连接已断开，请检查网络设置');
    }
});

// 处理页面可见性变化
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        // 页面隐藏时暂停某些操作
        console.log('页面已隐藏');
    } else {
        // 页面显示时恢复操作
        console.log('页面已显示');
    }
});
