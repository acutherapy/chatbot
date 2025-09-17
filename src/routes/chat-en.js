import express from 'express';
import { body, validationResult } from 'express-validator';
import { config } from '../config/index.js';
import { logInfo, logError } from '../utils/logger.js';
import gptService from '../services/gptService.js';
import knowledgeServiceEn from '../services/knowledgeService-en.js';

const router = express.Router();

// Validation middleware
const validateMessage = [
  body('message')
    .trim()
    .isLength({ min: 1, max: 1000 })
    .withMessage('Message must be between 1 and 1000 characters'),
  body('userId')
    .optional()
    .isString()
    .withMessage('User ID must be a string'),
  body('sessionId')
    .optional()
    .isString()
    .withMessage('Session ID must be a string')
];

router.post('/message-en', validateMessage, async (req, res) => {
  try {
    // Validate input
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { message, userId, sessionId } = req.body;
    
    // Generate user and session IDs
    const finalUserId = userId || `web_en_${Date.now()}`;
    const finalSessionId = sessionId || `session_en_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    logInfo('English chat message received', {
      userId: finalUserId,
      sessionId: finalSessionId,
      messageLength: message.length,
      ip: req.ip,
      service: 'chatbot-en'
    });

    // First try to find answer from English FAQ
    const faqResult = knowledgeServiceEn.getSmartAnswer(message);
    let aiResponse;
    let isAppointment = false;
    let quickReplies = null;

    if (faqResult.found && faqResult.answer) {
      // Use FAQ answer
      aiResponse = faqResult.answer;
      quickReplies = faqResult.suggestions;
      logInfo('English FAQ answer found', { 
        userId: finalUserId, 
        query: message,
        source: 'knowledge_base_en'
      });
    } else {
      // If no FAQ answer found, use AI to generate response in English
      const englishPrompt = `Please respond in English only. ${message}`;
      aiResponse = await gptService.generateResponse(
        englishPrompt, 
        finalUserId, 
        'web'
      );
      
      // Check if it's an appointment query
      isAppointment = gptService.isAppointmentQuery(message);
      quickReplies = isAppointment ? getAppointmentQuickRepliesEn() : null;
      
      logInfo('English AI response generated', { 
        userId: finalUserId, 
        query: message,
        source: 'gpt_service_en'
      });
    }

    logInfo('English chat response generated', { 
      userId: finalUserId, 
      sessionId: finalSessionId,
      responseLength: aiResponse.length,
      isAppointment,
      service: 'chatbot-en'
    });

    // Return response
    res.json({
      success: true,
      data: {
        message: aiResponse,
        userId: finalUserId,
        sessionId: finalSessionId,
        timestamp: new Date().toISOString(),
        isAppointment,
        quickReplies: quickReplies
      }
    });

  } catch (error) {
    logError('English chat API error', { 
      error: error.message, 
      stack: error.stack,
      service: 'chatbot-en'
    });

    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Sorry, the server is temporarily unable to process your request. Please try again later.'
    });
  }
});

// Get English FAQ categories
router.get('/categories-en', (req, res) => {
  try {
    const categories = knowledgeServiceEn.getAllCategories();
    
    res.json({
      success: true,
      data: categories
    });
  } catch (error) {
    logError('Failed to get English categories', { error: error.message, service: 'chatbot-en' });
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve categories'
    });
  }
});

// Get English FAQ by category
router.get('/faq-en/:categoryId', (req, res) => {
  try {
    const { categoryId } = req.params;
    const faqItems = knowledgeServiceEn.getFAQByCategory(categoryId);
    
    res.json({
      success: true,
      data: faqItems
    });
  } catch (error) {
    logError('Failed to get English FAQ by category', { 
      error: error.message, 
      categoryId: req.params.categoryId,
      service: 'chatbot-en'
    });
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve FAQ items'
    });
  }
});

// Search English FAQ
router.post('/search-en', [
  body('query').trim().isLength({ min: 1, max: 200 }).withMessage('Query must be between 1 and 200 characters')
], (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { query } = req.body;
    const results = knowledgeServiceEn.searchFAQ(query, 10);
    
    res.json({
      success: true,
      data: results
    });
  } catch (error) {
    logError('English FAQ search error', { error: error.message, service: 'chatbot-en' });
    res.status(500).json({
      success: false,
      error: 'Search failed'
    });
  }
});

// Reload English knowledge base
router.post('/reload-en', (req, res) => {
  try {
    knowledgeServiceEn.reload();
    
    logInfo('English knowledge base reloaded', { service: 'chatbot-en' });
    
    res.json({
      success: true,
      message: 'English knowledge base reloaded successfully'
    });
  } catch (error) {
    logError('Failed to reload English knowledge base', { error: error.message, service: 'chatbot-en' });
    res.status(500).json({
      success: false,
      error: 'Failed to reload knowledge base'
    });
  }
});

// Get English quick replies for appointments
function getAppointmentQuickRepliesEn() {
  return [
    {
      id: "appointment_quick_en",
      title: "📅 Book Appointment",
      payload: "BOOK_APPOINTMENT",
      category: "Appointment Services"
    }
  ];
}

export default router;
