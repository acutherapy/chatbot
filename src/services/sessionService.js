import { logInfo, logError } from '../utils/logger.js';

class SessionService {
  constructor() {
    // 内存存储会话数据（生产环境建议使用 Redis 或数据库）
    this.sessions = new Map();
    this.userSessions = new Map(); // 用户ID -> 会话ID 映射
    
    // 会话配置
    this.config = {
      maxSessionAge: 24 * 60 * 60 * 1000, // 24小时
      maxSessionsPerUser: 5, // 每个用户最多5个会话
      cleanupInterval: 60 * 60 * 1000, // 1小时清理一次
    };
    
    // 启动定期清理
    this.startCleanupTimer();
  }

  /**
   * 创建新会话
   * @param {string} userId - 用户ID
   * @param {string} platform - 平台类型
   * @param {Object} metadata - 会话元数据
   * @returns {string} 会话ID
   */
  createSession(userId, platform = 'web', metadata = {}) {
    try {
      const sessionId = this.generateSessionId();
      const now = Date.now();
      
      const session = {
        id: sessionId,
        userId: userId,
        platform: platform,
        createdAt: now,
        lastActivity: now,
        messageCount: 0,
        metadata: {
          userAgent: metadata.userAgent || '',
          ip: metadata.ip || '',
          referrer: metadata.referrer || '',
          ...metadata
        },
        context: {
          currentTopic: null,
          userPreferences: {},
          conversationHistory: [],
          quickReplies: [],
        }
      };

      // 存储会话
      this.sessions.set(sessionId, session);
      
      // 更新用户会话映射
      this.updateUserSessions(userId, sessionId);
      
      logInfo('Session created', { 
        sessionId, 
        userId, 
        platform,
        totalSessions: this.sessions.size 
      });

      return sessionId;

    } catch (error) {
      logError('Error creating session', error, { userId, platform });
      throw error;
    }
  }

  /**
   * 获取会话信息
   * @param {string} sessionId - 会话ID
   * @returns {Object|null} 会话信息
   */
  getSession(sessionId) {
    try {
      const session = this.sessions.get(sessionId);
      
      if (!session) {
        return null;
      }

      // 检查会话是否过期
      if (this.isSessionExpired(session)) {
        this.deleteSession(sessionId);
        return null;
      }

      // 更新最后活动时间
      session.lastActivity = Date.now();
      
      return session;

    } catch (error) {
      logError('Error getting session', error, { sessionId });
      return null;
    }
  }

  /**
   * 更新会话信息
   * @param {string} sessionId - 会话ID
   * @param {Object} updates - 更新数据
   * @returns {boolean} 是否更新成功
   */
  updateSession(sessionId, updates) {
    try {
      const session = this.sessions.get(sessionId);
      
      if (!session) {
        return false;
      }

      // 更新会话数据
      Object.assign(session, updates);
      session.lastActivity = Date.now();

      logInfo('Session updated', { sessionId, updates: Object.keys(updates) });
      
      return true;

    } catch (error) {
      logError('Error updating session', error, { sessionId });
      return false;
    }
  }

  /**
   * 删除会话
   * @param {string} sessionId - 会话ID
   * @returns {boolean} 是否删除成功
   */
  deleteSession(sessionId) {
    try {
      const session = this.sessions.get(sessionId);
      
      if (!session) {
        return false;
      }

      // 从用户会话映射中移除
      const userSessions = this.userSessions.get(session.userId);
      if (userSessions) {
        const index = userSessions.indexOf(sessionId);
        if (index > -1) {
          userSessions.splice(index, 1);
        }
        
        // 如果用户没有其他会话，删除用户映射
        if (userSessions.length === 0) {
          this.userSessions.delete(session.userId);
        }
      }

      // 删除会话
      this.sessions.delete(sessionId);
      
      logInfo('Session deleted', { 
        sessionId, 
        userId: session.userId,
        remainingSessions: this.sessions.size 
      });
      
      return true;

    } catch (error) {
      logError('Error deleting session', error, { sessionId });
      return false;
    }
  }

  /**
   * 获取用户的所有会话
   * @param {string} userId - 用户ID
   * @returns {Array} 会话列表
   */
  getUserSessions(userId) {
    try {
      const sessionIds = this.userSessions.get(userId) || [];
      const sessions = [];
      
      for (const sessionId of sessionIds) {
        const session = this.getSession(sessionId);
        if (session) {
          sessions.push(session);
        }
      }
      
      // 按最后活动时间排序
      sessions.sort((a, b) => b.lastActivity - a.lastActivity);
      
      return sessions;

    } catch (error) {
      logError('Error getting user sessions', error, { userId });
      return [];
    }
  }

  /**
   * 添加消息到会话上下文
   * @param {string} sessionId - 会话ID
   * @param {string} role - 角色 (user/assistant)
   * @param {string} content - 消息内容
   * @param {Object} metadata - 消息元数据
   */
  addMessageToSession(sessionId, role, content, metadata = {}) {
    try {
      const session = this.getSession(sessionId);
      
      if (!session) {
        return false;
      }

      const message = {
        role: role,
        content: content,
        timestamp: Date.now(),
        metadata: metadata
      };

      // 添加到会话上下文
      session.context.conversationHistory.push(message);
      session.messageCount++;

      // 限制历史记录长度
      const maxHistoryLength = 50;
      if (session.context.conversationHistory.length > maxHistoryLength) {
        session.context.conversationHistory = session.context.conversationHistory.slice(-maxHistoryLength);
      }

      // 更新会话
      this.updateSession(sessionId, { lastActivity: Date.now() });
      
      return true;

    } catch (error) {
      logError('Error adding message to session', error, { sessionId, role });
      return false;
    }
  }

  /**
   * 获取会话的对话历史
   * @param {string} sessionId - 会话ID
   * @param {number} limit - 限制数量
   * @returns {Array} 对话历史
   */
  getSessionHistory(sessionId, limit = 20) {
    try {
      const session = this.getSession(sessionId);
      
      if (!session) {
        return [];
      }

      const history = session.context.conversationHistory;
      
      // 返回最近的对话
      return limit ? history.slice(-limit) : history;

    } catch (error) {
      logError('Error getting session history', error, { sessionId });
      return [];
    }
  }

  /**
   * 更新用户会话映射
   * @param {string} userId - 用户ID
   * @param {string} sessionId - 会话ID
   */
  updateUserSessions(userId, sessionId) {
    try {
      let userSessions = this.userSessions.get(userId) || [];
      
      // 添加新会话
      if (!userSessions.includes(sessionId)) {
        userSessions.push(sessionId);
      }
      
      // 限制每个用户的会话数量
      if (userSessions.length > this.config.maxSessionsPerUser) {
        // 删除最旧的会话
        const oldestSessionId = userSessions.shift();
        this.deleteSession(oldestSessionId);
      }
      
      this.userSessions.set(userId, userSessions);

    } catch (error) {
      logError('Error updating user sessions', error, { userId, sessionId });
    }
  }

  /**
   * 检查会话是否过期
   * @param {Object} session - 会话对象
   * @returns {boolean} 是否过期
   */
  isSessionExpired(session) {
    const now = Date.now();
    const age = now - session.lastActivity;
    return age > this.config.maxSessionAge;
  }

  /**
   * 生成会话ID
   * @returns {string} 会话ID
   */
  generateSessionId() {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 15);
    return `session_${timestamp}_${random}`;
  }

  /**
   * 清理过期会话
   */
  cleanupExpiredSessions() {
    try {
      const now = Date.now();
      const expiredSessions = [];
      
      // 找出过期会话
      for (const [sessionId, session] of this.sessions) {
        if (this.isSessionExpired(session)) {
          expiredSessions.push(sessionId);
        }
      }
      
      // 删除过期会话
      let deletedCount = 0;
      for (const sessionId of expiredSessions) {
        if (this.deleteSession(sessionId)) {
          deletedCount++;
        }
      }
      
      if (deletedCount > 0) {
        logInfo('Cleaned up expired sessions', { 
          deletedCount,
          remainingSessions: this.sessions.size 
        });
      }

    } catch (error) {
      logError('Error cleaning up expired sessions', error);
    }
  }

  /**
   * 启动定期清理定时器
   */
  startCleanupTimer() {
    setInterval(() => {
      this.cleanupExpiredSessions();
    }, this.config.cleanupInterval);
  }

  /**
   * 获取会话统计信息
   * @returns {Object} 统计信息
   */
  getStats() {
    try {
      const now = Date.now();
      let activeSessions = 0;
      let totalMessages = 0;
      const platformStats = {};
      
      for (const session of this.sessions.values()) {
        if (!this.isSessionExpired(session)) {
          activeSessions++;
          totalMessages += session.messageCount;
          
          const platform = session.platform;
          platformStats[platform] = (platformStats[platform] || 0) + 1;
        }
      }
      
      return {
        totalSessions: this.sessions.size,
        activeSessions: activeSessions,
        totalUsers: this.userSessions.size,
        totalMessages: totalMessages,
        platformStats: platformStats,
        lastCleanup: now
      };

    } catch (error) {
      logError('Error getting session stats', error);
      return {
        totalSessions: 0,
        activeSessions: 0,
        totalUsers: 0,
        totalMessages: 0,
        platformStats: {},
        lastCleanup: Date.now()
      };
    }
  }

  /**
   * 清除用户的所有会话
   * @param {string} userId - 用户ID
   * @returns {number} 删除的会话数量
   */
  clearUserSessions(userId) {
    try {
      const sessionIds = this.userSessions.get(userId) || [];
      let deletedCount = 0;
      
      for (const sessionId of sessionIds) {
        if (this.deleteSession(sessionId)) {
          deletedCount++;
        }
      }
      
      logInfo('Cleared user sessions', { userId, deletedCount });
      
      return deletedCount;

    } catch (error) {
      logError('Error clearing user sessions', error, { userId });
      return 0;
    }
  }
}

// 创建单例实例
const sessionService = new SessionService();

export default sessionService;
