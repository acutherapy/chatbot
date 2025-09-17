import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import cors from 'cors';
import helmet from 'helmet';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 创建 Express 应用
const app = express();

// 基本中间件
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

app.use(cors({
  origin: true,
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 静态文件服务
app.use(express.static(join(__dirname, '../public')));

// 英文FAQ数据
const faqDataEn = {
  "faq": [
    {
      "id": "clinic_hours",
      "question": "Clinic Hours",
      "answer": "Our clinic hours are:\n\n🕒 Monday - Saturday: 9:00AM - 1:00PM\n\n📞 For emergencies, please call: 808-528-7177\n\nWe are here to protect your health year-round.",
      "keywords": ["clinic hours", "opening hours", "when open", "when close", "working hours", "hours", "time"],
      "category": "Basic Information",
      "priority": 1
    },
    {
      "id": "clinic_location",
      "question": "Clinic Location and Directions",
      "answer": "📍 Main Clinic Address: 1650 LILIHA ST, SUITE 208 HONOLULU, AND Satellite Clinic: 98-211 Pali Momi St Suite 604 AIEA\n\nFree parking available.\n\n🗺️ Search on navigation: AcuTherapy Clinics",
      "keywords": ["address", "location", "how to get there", "directions", "parking", "where", "clinic"],
      "category": "Basic Information",
      "priority": 1
    },
    {
      "id": "appointment_booking",
      "question": "How to Book an Appointment",
      "answer": "Appointment methods:\n\n📞 Phone booking: 808-528-7177\n🌐 Online booking: https://acutherapy.janeapp.com/\n💬 WeChat booking: Not currently accepted. Follow our official account: 夏威夷古法疗愈\n\nPlease provide:\n• Name and contact information\n• Preferred appointment time\n• Description of symptoms or needs",
      "keywords": ["appointment", "book", "how to book", "booking methods", "online booking", "phone booking", "schedule", "reserve"],
      "category": "Appointment Services",
      "priority": 1
    },
    {
      "id": "back_pain_treatment",
      "question": "Can Acupuncture Help with Back Pain?",
      "answer": "🎯 Yes! Acupuncture is highly effective for back pain relief.\n\n✅ **We treat:**\n• Lower back pain\n• Upper back pain\n• Chronic back pain\n• Sciatica\n• Muscle tension\n\n📞 **Book your consultation:** 808-528-7177\n🌐 **Online booking:** https://acutherapy.janeapp.com/",
      "keywords": ["back pain", "lower back", "upper back", "chronic pain", "sciatica", "muscle tension", "spine", "lumbar"],
      "category": "Treatment Conditions",
      "priority": 1
    },
    {
      "id": "pain_management",
      "question": "Pain Management Services",
      "answer": "💪 **Comprehensive Pain Management**\n\n🎯 **We specialize in treating:**\n• Chronic pain conditions\n• Acute injury pain\n• Arthritis pain\n• Joint pain\n• Muscle pain\n• Nerve pain\n\n✨ **Our approach combines:**\n• Traditional acupuncture\n• Cupping therapy\n• Medical massage\n• Holistic pain relief\n\n📅 **Schedule consultation:** 808-528-7177",
      "keywords": ["pain management", "chronic pain", "acute pain", "arthritis", "joint pain", "muscle pain", "nerve pain", "pain relief", "pain treatment"],
      "category": "Treatment Conditions",
      "priority": 1
    }
  ]
};

// 中文FAQ数据
const faqDataCn = {
  "faq": [
    {
      "id": "clinic_hours_cn",
      "question": "诊所营业时间",
      "answer": "我们的营业时间是：\n\n🕒 周一至周六：9:00AM - 1:00PM\n\n📞 紧急情况请拨打：808-528-7177\n\n我们全年无休，为您的健康保驾护航。",
      "keywords": ["营业时间", "开放时间", "几点开门", "几点关门", "工作时间", "时间", "营业"],
      "category": "基本信息",
      "priority": 1
    },
    {
      "id": "clinic_location_cn", 
      "question": "诊所地址和交通",
      "answer": "📍 主诊所地址：1650 LILIHA ST, SUITE 208 HONOLULU, AND 辅诊所98-211 Pali Momi St Suite 604 AIEA\n\n 免费停车位\n\n🗺️ 导航搜索：acutherapy clinics",
      "keywords": ["地址", "位置", "怎么去", "交通", "地铁", "公交", "停车", "在哪里", "诊所"],
      "category": "基本信息",
      "priority": 1
    },
    {
      "id": "appointment_booking_cn",
      "question": "如何预约",
      "answer": "预约方式：\n\n📞 电话预约：808-528-7177\n🌐 在线预约：https://acutherapy.janeapp.com/\n💬 暂不接受微信预约：关注我们的公众号： 夏威夷古法疗愈 \n\n预约时请提供：\n• 姓名和联系方式\n• 希望就诊的时间\n• 症状或需求描述",
      "keywords": ["预约", "挂号", "怎么预约", "预约方式", "在线预约", "电话预约", "约诊"],
      "category": "预约服务",
      "priority": 1
    },
    {
      "id": "services_general_cn",
      "question": "主要服务项目",
      "answer": "我们提供以下医疗服务：\n\n🏥 针灸， 中医， 按摩， 拔火罐\n\n详细服务请咨询我们的医生。",
      "keywords": ["服务", "科室", "看什么病", "治疗项目", "医疗服务", "针灸", "中医"],
      "category": "服务项目",
      "priority": 1
    },
    {
      "id": "back_pain_cn",
      "question": "腰痛背痛治疗",
      "answer": "🎯 针灸对腰背疼痛非常有效！\n\n✅ **我们治疗：**\n• 下腰痛\n• 上背痛\n• 慢性腰痛\n• 坐骨神经痛\n• 肌肉紧张\n\n📞 **预约咨询：** 808-528-7177\n🌐 **在线预约：** https://acutherapy.janeapp.com/",
      "keywords": ["腰痛", "背痛", "下腰痛", "上背痛", "慢性疼痛", "坐骨神经痛", "肌肉紧张", "脊椎"],
      "category": "治疗项目",
      "priority": 1
    }
  ]
};

// 英文FAQ搜索函数
function searchFAQEn(message) {
  const searchTerms = message.toLowerCase().split(' ');
  
  for (const faq of faqDataEn.faq) {
    for (const keyword of faq.keywords) {
      if (searchTerms.some(term => keyword.includes(term) || term.includes(keyword))) {
        return {
          found: true,
          answer: faq.answer,
          question: faq.question,
          category: faq.category
        };
      }
    }
  }
  
  return { found: false };
}

// 中文FAQ搜索函数
function searchFAQCn(message) {
  // 中文不需要分词，直接在关键词中搜索
  for (const faq of faqDataCn.faq) {
    for (const keyword of faq.keywords) {
      if (message.includes(keyword)) {
        return {
          found: true,
          answer: faq.answer,
          question: faq.question,
          category: faq.category
        };
      }
    }
  }
  
  return { found: false };
}

// 基本路由 - 默认显示英文版
app.get('/', (req, res) => {
  res.sendFile(join(__dirname, '../public/chat-en.html'));
});

// 中文版聊天页面
app.get('/working-chat.html', (req, res) => {
  res.sendFile(join(__dirname, '../public/working-chat.html'));
});

// 英文版聊天页面
app.get('/chat-en.html', (req, res) => {
  res.sendFile(join(__dirname, '../public/chat-en.html'));
});

// 健康检查
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'chatbot-api'
  });
});

// 简化的聊天 API - 英文版
app.post('/chat/message-en', async (req, res) => {
  try {
    const { message, userId, sessionId } = req.body;
    
    if (!message || typeof message !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Message is required and must be a string'
      });
    }

    // 生成用户ID和会话ID
    const finalUserId = userId || `web_en_${Date.now()}`;
    const finalSessionId = sessionId || `session_en_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // 搜索FAQ
    const faqResult = searchFAQEn(message);
    let aiResponse;
    let isAppointment = false;
    let quickReplies = null;

    if (faqResult.found) {
      aiResponse = faqResult.answer;
      console.log('English FAQ answer found for:', message);
    } else {
      // 更智能的AI响应
      const lowerMessage = message.toLowerCase();
      
      if (lowerMessage.includes('hello') || lowerMessage.includes('hi') || lowerMessage.includes('hey')) {
        aiResponse = "Hello! Welcome to AcuTherapy Clinics! 👋\n\nI'm here to help you with:\n• Clinic information\n• Appointment booking\n• Treatment options\n• Pain management\n\nHow can I assist you today?";
      } else if (lowerMessage.includes('help')) {
        aiResponse = "I'm here to help! You can ask me about:\n\n🏥 Clinic hours & location\n📅 How to book appointments\n💉 Acupuncture treatments\n🩺 Pain management services\n💰 Insurance & payment options\n\nWhat would you like to know?";
      } else if (lowerMessage.includes('thank')) {
        aiResponse = "You're welcome! 😊\n\nIf you need anything else, feel free to ask. For appointments, call 808-528-7177 or visit https://acutherapy.janeapp.com/";
      } else {
        aiResponse = "I'd be happy to help! For specific medical questions or detailed information, please:\n\n📞 Call us at: 808-528-7177\n🌐 Visit: https://acutherapy.janeapp.com/\n📍 Location: 1650 LILIHA ST, SUITE 208 HONOLULU\n\nYou can also ask me about our clinic hours, services, or general information!";
      }
      
      // 检查是否为预约查询
      const appointmentKeywords = ['appointment', 'book', 'schedule', 'reserve'];
      isAppointment = appointmentKeywords.some(keyword => 
        message.toLowerCase().includes(keyword)
      );
      
      console.log('English smart response provided for:', message);
    }

    // 总是提供快速回复选项
    quickReplies = [
      {
        id: "hours_quick_en",
        title: "🕒 Clinic Hours",
        payload: "clinic hours"
      },
      {
        id: "appointment_quick_en", 
        title: "📅 Book Appointment",
        payload: "book appointment"
      },
      {
        id: "location_quick_en",
        title: "📍 Location",
        payload: "clinic location"
      }
    ];

    // 返回响应
    res.json({
      success: true,
      data: {
        message: aiResponse,
        userId: finalUserId,
        sessionId: finalSessionId,
        timestamp: new Date().toISOString(),
        isAppointment: isAppointment,
        quickReplies: quickReplies
      }
    });

  } catch (error) {
    console.error('English Chat API error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Sorry, the server is temporarily unable to process your request. Please try again later.'
    });
  }
});

// 简化的聊天 API - 中文版
app.post('/chat/message', async (req, res) => {
  try {
    const { message, userId, sessionId } = req.body;
    
    if (!message || typeof message !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Message is required and must be a string'
      });
    }

    // 生成用户ID和会话ID
    const finalUserId = userId || `web_${Date.now()}`;
    const finalSessionId = sessionId || `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // 首先搜索中文FAQ
    const faqResult = searchFAQCn(message);
    let aiResponse;
    let isAppointment = false;
    let quickReplies = null;

    if (faqResult.found) {
      aiResponse = faqResult.answer;
      console.log('Chinese FAQ answer found for:', message);
    } else {
      // 更智能的中文响应
      if (message.includes('你好') || message.includes('您好') || message.includes('hello')) {
        aiResponse = "您好！欢迎来到AcuTherapy诊所！👋\n\n我可以为您提供：\n• 诊所信息\n• 预约服务\n• 治疗项目\n• 疼痛管理\n\n请问有什么可以帮助您的吗？";
      } else if (message.includes('帮助') || message.includes('help')) {
        aiResponse = "我很乐意为您服务！您可以咨询：\n\n🏥 诊所营业时间和地址\n📅 预约方式\n💉 针灸治疗\n🩺 疼痛管理服务\n💰 保险和付费方式\n\n您想了解什么呢？";
      } else if (message.includes('谢谢') || message.includes('thank')) {
        aiResponse = "不客气！😊\n\n如果您还有其他问题，随时可以问我。预约请拨打：808-528-7177 或访问：https://acutherapy.janeapp.com/";
      } else {
        aiResponse = "我很乐意为您提供帮助！如有具体医疗问题或详细信息，请：\n\n📞 致电：808-528-7177\n🌐 访问：https://acutherapy.janeapp.com/\n📍 地址：1650 LILIHA ST, SUITE 208 HONOLULU\n\n您也可以问我关于诊所时间、服务或一般信息！";
      }
      
      // 检查是否为预约查询
      const appointmentKeywords = ['预约', '挂号', '约诊'];
      isAppointment = appointmentKeywords.some(keyword => 
        message.includes(keyword)
      );
      
      console.log('Chinese smart response provided for:', message);
    }

    // 总是提供快速回复选项
    quickReplies = [
      {
        id: "hours_quick_cn",
        title: "🕒 营业时间",
        payload: "营业时间"
      },
      {
        id: "appointment_quick_cn", 
        title: "📅 预约服务",
        payload: "预约服务"
      },
      {
        id: "location_quick_cn",
        title: "📍 诊所地址",
        payload: "诊所地址"
      }
    ];

    // 返回响应
    res.json({
      success: true,
      data: {
        message: aiResponse,
        userId: finalUserId,
        sessionId: finalSessionId,
        timestamp: new Date().toISOString(),
        isAppointment: isAppointment,
        quickReplies: quickReplies
      }
    });

  } catch (error) {
    console.error('Chinese Chat API error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: '抱歉，服务器暂时无法处理您的请求，请稍后再试。'
    });
  }
});

// 404 处理
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found'
  });
});

// 错误处理
app.use((error, req, res, next) => {
  console.error('Server error:', error);
  res.status(500).json({
    success: false,
    error: 'Internal server error'
  });
});

export default app;