import { readFileSync } from 'fs';
import { join } from 'path';
import { logInfo, logError } from '../utils/logger.js';

class KnowledgeService {
  constructor() {
    this.faqData = null;
    this.searchIndex = new Map();
    this.loadKnowledgeBase();
  }

  /**
   * 加载知识库数据
   */
  loadKnowledgeBase() {
    try {
      const faqPath = join(process.cwd(), 'data', 'faq.json');
      const data = readFileSync(faqPath, 'utf8');
      this.faqData = JSON.parse(data);
      
      // 构建搜索索引
      this.buildSearchIndex();
      
      logInfo('Knowledge base loaded', { 
        faqCount: this.faqData.faq.length,
        categoriesCount: this.faqData.categories.length 
      });
      
    } catch (error) {
      logError('Error loading knowledge base', error);
      this.faqData = { faq: [], categories: [], quickReplies: [] };
    }
  }

  /**
   * 构建搜索索引
   */
  buildSearchIndex() {
    this.searchIndex.clear();
    
    this.faqData.faq.forEach(item => {
      // 索引问题
      this.addToIndex(item.question, item.id);
      
      // 索引关键词
      if (item.keywords) {
        item.keywords.forEach(keyword => {
          this.addToIndex(keyword, item.id);
        });
      }
      
      // 索引答案中的关键词
      const answerKeywords = this.extractKeywords(item.answer);
      answerKeywords.forEach(keyword => {
        this.addToIndex(keyword, item.id);
      });
    });
  }

  /**
   * 添加到搜索索引
   * @param {string} text - 文本
   * @param {string} id - FAQ ID
   */
  addToIndex(text, id) {
    const keywords = this.tokenize(text);
    
    keywords.forEach(keyword => {
      if (!this.searchIndex.has(keyword)) {
        this.searchIndex.set(keyword, new Set());
      }
      this.searchIndex.get(keyword).add(id);
    });
  }

  /**
   * 分词处理
   * @param {string} text - 文本
   * @returns {Array} 关键词数组
   */
  tokenize(text) {
    return text
      .toLowerCase()
      .replace(/[^\u4e00-\u9fa5a-zA-Z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 1)
      .map(word => word.trim());
  }

  /**
   * 从文本中提取关键词
   * @param {string} text - 文本
   * @returns {Array} 关键词数组
   */
  extractKeywords(text) {
    // 简单的关键词提取，可以后续优化
    const keywords = [];
    
    // 提取医疗相关关键词
    const medicalTerms = [
      '预约', '挂号', '就诊', '医生', '检查', '治疗', '药物', '费用',
      '医保', '体检', '急诊', '门诊', '住院', '手术', '康复'
    ];
    
    medicalTerms.forEach(term => {
      if (text.includes(term)) {
        keywords.push(term);
      }
    });
    
    return keywords;
  }

  /**
   * 搜索FAQ
   * @param {string} query - 查询文本
   * @param {number} limit - 返回结果数量限制
   * @returns {Array} 匹配的FAQ项目
   */
  searchFAQ(query, limit = 5) {
    try {
      if (!query || !this.faqData) {
        return [];
      }

      const queryKeywords = this.tokenize(query);
      const scores = new Map();
      
      // 计算每个FAQ的匹配分数
      this.faqData.faq.forEach(item => {
        let score = 0;
        
        // 完全匹配问题
        if (item.question.toLowerCase().includes(query.toLowerCase())) {
          score += 10;
        }
        
        // 关键词匹配
        queryKeywords.forEach(keyword => {
          if (this.searchIndex.has(keyword)) {
            const matchingIds = this.searchIndex.get(keyword);
            if (matchingIds.has(item.id)) {
              score += 5;
            }
          }
          
          // 问题中包含关键词
          if (item.question.toLowerCase().includes(keyword)) {
            score += 3;
          }
          
          // 答案中包含关键词
          if (item.answer.toLowerCase().includes(keyword)) {
            score += 1;
          }
        });
        
        if (score > 0) {
          scores.set(item.id, score);
        }
      });
      
      // 按分数排序并返回结果
      const sortedResults = Array.from(scores.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, limit)
        .map(([id, score]) => {
          const item = this.faqData.faq.find(faq => faq.id === id);
          return { ...item, score };
        });
      
      logInfo('FAQ search completed', { 
        query, 
        resultsCount: sortedResults.length,
        topScore: sortedResults[0]?.score || 0 
      });
      
      return sortedResults;
      
    } catch (error) {
      logError('Error searching FAQ', error, { query });
      return [];
    }
  }

  /**
   * 获取FAQ答案
   * @param {string} id - FAQ ID
   * @returns {Object|null} FAQ项目
   */
  getFAQById(id) {
    try {
      return this.faqData.faq.find(item => item.id === id) || null;
    } catch (error) {
      logError('Error getting FAQ by ID', error, { id });
      return null;
    }
  }

  /**
   * 获取分类下的FAQ
   * @param {string} category - 分类名称
   * @returns {Array} FAQ列表
   */
  getFAQByCategory(category) {
    try {
      return this.faqData.faq.filter(item => item.category === category);
    } catch (error) {
      logError('Error getting FAQ by category', error, { category });
      return [];
    }
  }

  /**
   * 获取所有分类
   * @returns {Array} 分类列表
   */
  getCategories() {
    try {
      return this.faqData.categories || [];
    } catch (error) {
      logError('Error getting categories', error);
      return [];
    }
  }

  /**
   * 获取快速回复选项
   * @param {string} category - 分类名称（可选）
   * @returns {Array} 快速回复列表
   */
  getQuickReplies(category = null) {
    try {
      let replies = this.faqData.quickReplies || [];
      
      if (category) {
        replies = replies.filter(reply => reply.category === category);
      }
      
      return replies;
    } catch (error) {
      logError('Error getting quick replies', error, { category });
      return [];
    }
  }

  /**
   * 智能回答用户问题
   * @param {string} question - 用户问题
   * @returns {Object} 回答结果
   */
  getSmartAnswer(question) {
    try {
      const searchResults = this.searchFAQ(question, 3);
      
      if (searchResults.length === 0) {
        return {
          found: false,
          answer: null,
          suggestions: this.getQuickReplies()
        };
      }
      
      const bestMatch = searchResults[0];
      
      // 如果最高分超过阈值，直接返回答案
      if (bestMatch.score >= 8) {
        return {
          found: true,
          answer: bestMatch.answer,
          source: bestMatch,
          suggestions: this.getRelatedSuggestions(bestMatch.category)
        };
      }
      
      // 否则返回多个选项
      return {
        found: true,
        answer: `我找到了几个相关的问题，请选择最符合您需求的：\n\n${searchResults.map((item, index) => `${index + 1}. ${item.question}`).join('\n')}`,
        options: searchResults,
        suggestions: this.getQuickReplies()
      };
      
    } catch (error) {
      logError('Error getting smart answer', error, { question });
      return {
        found: false,
        answer: null,
        suggestions: this.getQuickReplies()
      };
    }
  }

  /**
   * 获取相关建议
   * @param {string} category - 分类名称
   * @returns {Array} 建议列表
   */
  getRelatedSuggestions(category) {
    try {
      return this.getQuickReplies(category);
    } catch (error) {
      logError('Error getting related suggestions', error, { category });
      return [];
    }
  }

  /**
   * 重新加载知识库
   */
  reloadKnowledgeBase() {
    try {
      this.loadKnowledgeBase();
      logInfo('Knowledge base reloaded');
    } catch (error) {
      logError('Error reloading knowledge base', error);
    }
  }

  /**
   * 获取知识库统计信息
   * @returns {Object} 统计信息
   */
  getStats() {
    try {
      return {
        totalFAQ: this.faqData.faq.length,
        totalCategories: this.faqData.categories.length,
        totalQuickReplies: this.faqData.quickReplies.length,
        searchIndexSize: this.searchIndex.size,
        lastLoaded: new Date().toISOString()
      };
    } catch (error) {
      logError('Error getting knowledge base stats', error);
      return {
        totalFAQ: 0,
        totalCategories: 0,
        totalQuickReplies: 0,
        searchIndexSize: 0,
        lastLoaded: null
      };
    }
  }
}

// 创建单例实例
const knowledgeService = new KnowledgeService();

export default knowledgeService;
