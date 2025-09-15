/**
 * 多平台聊天机器人 SDK
 * 用于在网站上集成聊天功能
 */

class ChatbotSDK {
  constructor(options = {}) {
    this.apiUrl = options.apiUrl || 'https://y-dkhr1576t-david-cais-projects-ae09bbdf.vercel.app';
    this.position = options.position || 'bottom-right';
    this.theme = options.theme || 'default';
    this.language = options.language || 'zh-CN';
    this.autoOpen = options.autoOpen || false;
    this.delay = options.delay || 3000;
    
    this.isOpen = false;
    this.isInitialized = false;
    
    this.init();
  }

  init() {
    if (this.isInitialized) return;
    
    this.createChatButton();
    this.createChatWindow();
    this.bindEvents();
    
    if (this.autoOpen) {
      setTimeout(() => this.open(), this.delay);
    }
    
    this.isInitialized = true;
  }

  createChatButton() {
    this.chatButton = document.createElement('button');
    this.chatButton.id = 'chatbot-toggle';
    this.chatButton.innerHTML = '💬';
    this.chatButton.style.cssText = `
      position: fixed;
      ${this.position.includes('bottom') ? 'bottom: 20px;' : 'top: 20px;'}
      ${this.position.includes('right') ? 'right: 20px;' : 'left: 20px;'}
      width: 60px;
      height: 60px;
      border-radius: 50%;
      background: linear-gradient(135deg, #4F46E5, #7C3AED);
      color: white;
      border: none;
      cursor: pointer;
      z-index: 10000;
      box-shadow: 0 4px 20px rgba(0,0,0,0.15);
      font-size: 24px;
      transition: all 0.3s ease;
      display: flex;
      align-items: center;
      justify-content: center;
    `;

    this.chatButton.addEventListener('mouseenter', () => {
      this.chatButton.style.transform = 'scale(1.1)';
    });

    this.chatButton.addEventListener('mouseleave', () => {
      this.chatButton.style.transform = 'scale(1)';
    });

    document.body.appendChild(this.chatButton);
  }

  createChatWindow() {
    this.chatWindow = document.createElement('div');
    this.chatWindow.id = 'chatbot-window';
    this.chatWindow.style.cssText = `
      position: fixed;
      ${this.position.includes('bottom') ? 'bottom: 90px;' : 'top: 90px;'}
      ${this.position.includes('right') ? 'right: 20px;' : 'left: 20px;'}
      width: 400px;
      height: 600px;
      border-radius: 10px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.15);
      display: none;
      z-index: 10000;
      background: white;
      overflow: hidden;
    `;

    // 创建头部
    const header = document.createElement('div');
    header.style.cssText = `
      background: linear-gradient(135deg, #4F46E5, #7C3AED);
      color: white;
      padding: 15px 20px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    `;
    header.innerHTML = `
      <div>
        <h3 style="margin: 0; font-size: 16px;">诊所客服助手</h3>
        <span style="font-size: 12px; opacity: 0.9;">在线</span>
      </div>
      <button id="chatbot-close" style="
        background: none;
        border: none;
        color: white;
        font-size: 20px;
        cursor: pointer;
        padding: 5px;
      ">×</button>
    `;

    // 创建 iframe
    const iframe = document.createElement('iframe');
    iframe.src = this.apiUrl;
    iframe.style.cssText = `
      width: 100%;
      height: calc(100% - 60px);
      border: none;
    `;

    this.chatWindow.appendChild(header);
    this.chatWindow.appendChild(iframe);
    document.body.appendChild(this.chatWindow);
  }

  bindEvents() {
    this.chatButton.addEventListener('click', () => this.toggle());
    
    const closeButton = document.getElementById('chatbot-close');
    closeButton.addEventListener('click', () => this.close());

    // 点击外部关闭
    document.addEventListener('click', (e) => {
      if (this.isOpen && 
          !this.chatWindow.contains(e.target) && 
          !this.chatButton.contains(e.target)) {
        this.close();
      }
    });
  }

  open() {
    this.chatWindow.style.display = 'block';
    this.isOpen = true;
    this.chatButton.innerHTML = '✕';
  }

  close() {
    this.chatWindow.style.display = 'none';
    this.isOpen = false;
    this.chatButton.innerHTML = '💬';
  }

  toggle() {
    if (this.isOpen) {
      this.close();
    } else {
      this.open();
    }
  }

  // 发送消息到聊天机器人
  async sendMessage(message) {
    try {
      const response = await fetch(`${this.apiUrl}/chat/message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message })
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('发送消息失败:', error);
      return { success: false, error: error.message };
    }
  }

  // 销毁聊天机器人
  destroy() {
    if (this.chatButton) {
      this.chatButton.remove();
    }
    if (this.chatWindow) {
      this.chatWindow.remove();
    }
    this.isInitialized = false;
  }
}

// 自动初始化
if (typeof window !== 'undefined') {
  window.ChatbotSDK = ChatbotSDK;
  
  // 自动初始化（如果页面有 chatbot-config 脚本标签）
  document.addEventListener('DOMContentLoaded', () => {
    const configScript = document.querySelector('script[type="application/json"][data-chatbot-config]');
    if (configScript) {
      try {
        const config = JSON.parse(configScript.textContent);
        window.chatbot = new ChatbotSDK(config);
      } catch (error) {
        console.error('聊天机器人配置错误:', error);
      }
    }
  });
}
