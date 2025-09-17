import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { logInfo, logError } from '../utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

class KnowledgeServiceEn {
  constructor() {
    this.faqData = null;
    this.faqIndex = new Map();
    this.loadKnowledgeBase();
  }

  loadKnowledgeBase() {
    try {
      const faqPath = join(__dirname, '../../data/faq-en.json');
      const rawData = readFileSync(faqPath, 'utf8');
      this.faqData = JSON.parse(rawData);
      
      this.buildFAQIndex();
      
      logInfo('English knowledge base loaded', {
        categoriesCount: this.faqData.categories?.length || 0,
        faqCount: this.faqData.faq?.length || 0,
        service: 'chatbot-en'
      });
    } catch (error) {
      logError('Failed to load English knowledge base', { error: error.message, service: 'chatbot-en' });
      this.faqData = { faq: [], categories: [], quickReplies: [] };
    }
  }

  buildFAQIndex() {
    this.faqIndex.clear();
    
    if (!this.faqData.faq) return;
    
    this.faqData.faq.forEach((item, index) => {
      // Index by keywords
      if (item.keywords) {
        item.keywords.forEach(keyword => {
          const normalizedKeyword = keyword.toLowerCase().trim();
          if (!this.faqIndex.has(normalizedKeyword)) {
            this.faqIndex.set(normalizedKeyword, []);
          }
          this.faqIndex.get(normalizedKeyword).push({ ...item, index });
        });
      }
      
      // Index by question tokens
      const questionTokens = this.tokenize(item.question || '');
      questionTokens.forEach(token => {
        if (token.length >= 2) {
          if (!this.faqIndex.has(token)) {
            this.faqIndex.set(token, []);
          }
          this.faqIndex.get(token).push({ ...item, index });
        }
      });
    });
  }

  tokenize(text) {
    // English tokenization
    const cleanText = text.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    
    const words = cleanText.split(' ').filter(word => word.length > 0);
    
    const result = [];
    words.forEach(word => {
      if (word.length >= 2) {
        result.push(word);
        
        // Add partial matches for longer words
        if (word.length > 4) {
          for (let i = 0; i <= word.length - 3; i++) {
            for (let j = 3; j <= Math.min(6, word.length - i); j++) {
              const substring = word.substring(i, i + j);
              if (substring.length >= 3) {
                result.push(substring);
              }
            }
          }
        }
      }
    });
    
    return [...new Set(result)];
  }

  searchFAQ(query, limit = 10) {
    if (!query || !this.faqData.faq) {
      return [];
    }
    
    const queryTokens = this.tokenize(query);
    const scoreMap = new Map();
    
    queryTokens.forEach(token => {
      if (this.faqIndex.has(token)) {
        this.faqIndex.get(token).forEach(item => {
          const currentScore = scoreMap.get(item.index) || 0;
          
          // Higher score for exact keyword matches
          let tokenScore = 1;
          if (item.keywords && item.keywords.some(k => k.toLowerCase().includes(token))) {
            tokenScore = 3;
          }
          
          // Bonus for longer token matches
          if (token.length >= 4) {
            tokenScore += 1;
          }
          
          scoreMap.set(item.index, currentScore + tokenScore);
        });
      }
    });
    
    const results = Array.from(scoreMap.entries())
      .map(([index, score]) => ({
        ...this.faqData.faq[index],
        score,
        index
      }))
      .sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        return a.priority - b.priority;
      })
      .slice(0, limit);
    
    logInfo('English FAQ search completed', {
      query,
      resultsCount: results.length,
      topScore: results[0]?.score || 0,
      service: 'chatbot-en'
    });
    
    return results;
  }

  getSmartAnswer(query, threshold = 3) {
    const results = this.searchFAQ(query, 3);
    
    if (results.length > 0 && results[0].score >= threshold) {
      const bestMatch = results[0];
      
      // Get related quick replies
      const suggestions = this.getQuickReplies(bestMatch.category);
      
      return {
        found: true,
        answer: bestMatch.answer,
        question: bestMatch.question,
        category: bestMatch.category,
        confidence: bestMatch.score,
        suggestions: suggestions.slice(0, 3)
      };
    }
    
    return {
      found: false,
      answer: null,
      suggestions: this.getDefaultQuickReplies()
    };
  }

  getQuickReplies(category = null) {
    if (!this.faqData.quickReplies) return [];
    
    if (category) {
      return this.faqData.quickReplies.filter(reply => 
        reply.category === category
      );
    }
    
    return this.faqData.quickReplies;
  }

  getDefaultQuickReplies() {
    return this.getQuickReplies().slice(0, 4);
  }

  getAllCategories() {
    return this.faqData.categories || [];
  }

  getFAQByCategory(categoryId) {
    if (!this.faqData.faq) return [];
    
    return this.faqData.faq.filter(item => item.category === categoryId);
  }

  reload() {
    this.loadKnowledgeBase();
  }
}

// Export singleton instance
const knowledgeServiceEn = new KnowledgeServiceEn();
export default knowledgeServiceEn;
