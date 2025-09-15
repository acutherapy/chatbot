/**
 * 聊天机器人端到端测试
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { chromium } from 'playwright';
import { TEST_CONFIG, testUtils } from '../setup.js';

describe('Chatbot E2E Tests', () => {
  let browser;
  let page;

  beforeAll(async () => {
    browser = await chromium.launch({ headless: true });
    page = await browser.newPage();
  });

  afterAll(async () => {
    if (browser) {
      await browser.close();
    }
  });

  describe('Web Interface', () => {
    it('应该加载聊天界面', async () => {
      await page.goto(`${TEST_CONFIG.baseUrl}/ai-chat.html`);
      
      // 检查页面标题
      const title = await page.title();
      expect(title).toContain('AI 聊天机器人');

      // 检查聊天按钮是否存在
      const chatButton = await page.locator('#aiChatbotToggle');
      await expect(chatButton).toBeVisible();

      // 检查初始欢迎消息
      const welcomeMessage = await page.locator('.message-bubble').first();
      await expect(welcomeMessage).toBeVisible();
    });

    it('应该能够发送和接收消息', async () => {
      await page.goto(`${TEST_CONFIG.baseUrl}/ai-chat.html`);
      
      // 点击聊天按钮打开窗口
      await page.click('#aiChatbotToggle');
      
      // 等待聊天窗口出现
      await page.waitForSelector('#aiChatbotWindow', { state: 'visible' });
      
      // 输入测试消息
      const testMessage = '你好，我想预约服务';
      await page.fill('#aiChatbotInput', testMessage);
      
      // 发送消息
      await page.click('#aiSendBtn');
      
      // 等待用户消息出现
      await page.waitForSelector('.user-message .message-bubble', { state: 'visible' });
      
      // 验证用户消息
      const userMessage = await page.locator('.user-message .message-bubble').last();
      await expect(userMessage).toContainText(testMessage);
      
      // 等待 AI 回复
      await page.waitForSelector('.bot-message .message-bubble', { timeout: 10000 });
      
      // 验证 AI 回复
      const botMessage = await page.locator('.bot-message .message-bubble').last();
      await expect(botMessage).toBeVisible();
      
      const botResponse = await botMessage.textContent();
      expect(botResponse.length).toBeGreaterThan(0);
    });

    it('应该支持快速回复', async () => {
      await page.goto(`${TEST_CONFIG.baseUrl}/ai-chat.html`);
      
      // 打开聊天窗口
      await page.click('#aiChatbotToggle');
      await page.waitForSelector('#aiChatbotWindow', { state: 'visible' });
      
      // 点击快速回复按钮
      const quickReplyButton = await page.locator('button[onclick*="sendAIQuickReply"]').first();
      await quickReplyButton.click();
      
      // 等待消息发送
      await page.waitForSelector('.user-message .message-bubble', { state: 'visible' });
      
      // 验证快速回复被发送
      const userMessage = await page.locator('.user-message .message-bubble').last();
      await expect(userMessage).toBeVisible();
    });

    it('应该支持键盘快捷键', async () => {
      await page.goto(`${TEST_CONFIG.baseUrl}/ai-chat.html`);
      
      // 打开聊天窗口
      await page.click('#aiChatbotToggle');
      await page.waitForSelector('#aiChatbotWindow', { state: 'visible' });
      
      // 输入消息并按 Enter 发送
      const testMessage = '测试键盘快捷键';
      await page.fill('#aiChatbotInput', testMessage);
      await page.press('#aiChatbotInput', 'Enter');
      
      // 验证消息被发送
      await page.waitForSelector('.user-message .message-bubble', { state: 'visible' });
      const userMessage = await page.locator('.user-message .message-bubble').last();
      await expect(userMessage).toContainText(testMessage);
    });

    it('应该显示打字指示器', async () => {
      await page.goto(`${TEST_CONFIG.baseUrl}/ai-chat.html`);
      
      // 打开聊天窗口
      await page.click('#aiChatbotToggle');
      await page.waitForSelector('#aiChatbotWindow', { state: 'visible' });
      
      // 发送消息
      await page.fill('#aiChatbotInput', '测试打字指示器');
      await page.click('#aiSendBtn');
      
      // 检查打字指示器是否出现
      const typingIndicator = await page.locator('#typingIndicator');
      await expect(typingIndicator).toBeVisible();
      
      // 等待打字指示器消失
      await page.waitForSelector('#typingIndicator', { state: 'hidden', timeout: 10000 });
    });

    it('应该支持关闭聊天窗口', async () => {
      await page.goto(`${TEST_CONFIG.baseUrl}/ai-chat.html`);
      
      // 打开聊天窗口
      await page.click('#aiChatbotToggle');
      await page.waitForSelector('#aiChatbotWindow', { state: 'visible' });
      
      // 点击关闭按钮
      await page.click('#aiChatbotClose');
      
      // 验证聊天窗口关闭
      await page.waitForSelector('#aiChatbotWindow', { state: 'hidden' });
    });
  });

  describe('Responsive Design', () => {
    it('应该在移动设备上正常工作', async () => {
      // 设置移动设备视口
      await page.setViewportSize({ width: 375, height: 667 });
      
      await page.goto(`${TEST_CONFIG.baseUrl}/ai-chat.html`);
      
      // 检查聊天按钮在移动设备上可见
      const chatButton = await page.locator('#aiChatbotToggle');
      await expect(chatButton).toBeVisible();
      
      // 打开聊天窗口
      await page.click('#aiChatbotToggle');
      await page.waitForSelector('#aiChatbotWindow', { state: 'visible' });
      
      // 检查聊天窗口在移动设备上的布局
      const chatWindow = await page.locator('#aiChatbotWindow');
      const boundingBox = await chatWindow.boundingBox();
      expect(boundingBox.width).toBeLessThanOrEqual(375);
    });
  });

  describe('Error Handling', () => {
    it('应该处理网络错误', async () => {
      // 模拟网络错误
      await page.route('**/chat/message', route => {
        route.abort('failed');
      });
      
      await page.goto(`${TEST_CONFIG.baseUrl}/ai-chat.html`);
      
      // 打开聊天窗口
      await page.click('#aiChatbotToggle');
      await page.waitForSelector('#aiChatbotWindow', { state: 'visible' });
      
      // 发送消息
      await page.fill('#aiChatbotInput', '测试网络错误');
      await page.click('#aiSendBtn');
      
      // 等待错误消息
      await page.waitForSelector('.message-bubble', { timeout: 10000 });
      
      // 验证错误处理
      const errorMessage = await page.locator('.bot-message .message-bubble').last();
      const errorText = await errorMessage.textContent();
      expect(errorText).toContain('网络');
    });
  });
});
