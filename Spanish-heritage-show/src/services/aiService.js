/**
 * AI Service Client
 * Handles communication with Alibaba Cloud DashScope API
 */

import axios from "axios";

// 硬编码API配置
const AI_CONFIG = {
  baseURL: "https://dashscope.aliyuncs.com/compatible-mode/v1",
  apiKey: "sk-07f0c7dcff654a68ad0742b2c7125044",
  model: "qwen-plus",
  maxTokens: 2000,
  temperature: 0.7,
  timeout: 30000,
};

// 简单的输入验证函数
function validateInput(text) {
  if (!text || typeof text !== "string") {
    return { valid: false, error: "输入不能为空" };
  }
  if (text.length > 1000) {
    return { valid: false, error: "输入内容过长" };
  }
  if (text.trim().length === 0) {
    return { valid: false, error: "输入不能为空白" };
  }
  return { valid: true, sanitized: text.trim() };
}

class AIService {
  constructor() {
    this.client = axios.create({
      baseURL: AI_CONFIG.baseURL,
      timeout: AI_CONFIG.timeout,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${AI_CONFIG.apiKey}`,
      },
    });

    // Request interceptor for logging
    this.client.interceptors.request.use(
      (config) => {
        console.log("🚀 AI API Request:", config.url);
        return config;
      },
      (error) => {
        console.error("❌ AI API Request Error:", error);
        return Promise.reject(error);
      }
    );

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => {
        console.log("✅ AI API Response:", response.status);
        return response;
      },
      (error) => {
        console.error("❌ AI API Response Error:", error);
        return Promise.reject(this.handleError(error));
      }
    );
  }

  /**
   * Handle API errors and provide user-friendly messages
   */
  handleError(error) {
    if (error.response) {
      const { status, data } = error.response;

      switch (status) {
        case 401:
          return new Error("API 认证失败，请检查 API 密钥。");
        case 429:
          return new Error("请求过于频繁，请稍后再试。");
        case 500:
          return new Error("AI 服务暂时不可用，请稍后再试。");
        default:
          return new Error(data?.message || `API 错误: ${status}`);
      }
    } else if (error.request) {
      return new Error("网络连接失败，请检查网络连接。");
    } else {
      return new Error("发生未知错误。");
    }
  }

  /**
   * Build system prompt for Spanish heritage context
   */
  buildSystemPrompt(guide, monument, language) {
    const basePrompts = {
      zh: {
        historian: `你是一位专业的历史学家导游，专门研究西班牙文化遗产。你博学严谨，善于讲述历史故事，能够将复杂的历史事件用生动有趣的方式呈现给游客。请用中文回答问题。`,
        architect: `你是一位专业的建筑师导游，专门研究西班牙建筑艺术。你专业细致，专注于建筑技术和设计理念，能够详细解释建筑结构、风格特点和建造工艺。请用中文回答问题。`,
        archaeologist: `你是一位专业的考古学家导游，专门研究西班牙古代文明。你细心观察，擅长发现和解释文物，能够从考古学角度分析历史遗迹的价值和意义。请用中文回答问题。`,
        localGuide: `你是一位热情的当地向导，对西班牙文化和传说非常了解。你热情友好，了解当地文化和传说，能够分享有趣的民间故事和文化背景。请用中文回答问题。`,
      },
      en: {
        historian: `You are a professional historian guide specializing in Spanish cultural heritage. You are scholarly and rigorous, good at telling historical stories. Please answer in English.`,
        architect: `You are a professional architect guide specializing in Spanish architectural art. You are professional and meticulous, focused on architectural techniques and design concepts. Please answer in English.`,
        archaeologist: `You are a professional archaeologist guide specializing in ancient Spanish civilizations. You are a careful observer, good at discovering and interpreting artifacts. Please answer in English.`,
        localGuide: `You are an enthusiastic local guide who knows Spanish culture and legends very well. You are warm and friendly, knowledgeable about local culture and legends. Please answer in English.`,
      },
      es: {
        historian: `Eres un guía historiador profesional especializado en el patrimonio cultural español. Eres erudito y riguroso, bueno contando historias históricas. Por favor responde en español.`,
        architect: `Eres un guía arquitecto profesional especializado en arte arquitectónico español. Eres profesional y meticuloso, enfocado en técnicas arquitectónicas y conceptos de diseño. Por favor responde en español.`,
        archaeologist: `Eres un guía arqueólogo profesional especializado en civilizaciones españolas antiguas. Eres un observador cuidadoso, bueno descubriendo e interpretando artefactos. Por favor responde en español.`,
        localGuide: `Eres un guía local entusiasta que conoce muy bien la cultura y leyendas españolas. Eres cálido y amigable, conocedor de la cultura local y leyendas. Por favor responde en español.`,
      },
    };

    let systemPrompt = basePrompts[language]?.[guide] || basePrompts.en[guide];

    // Add monument-specific context
    if (monument) {
      const monumentContext = {
        zh: `当前你正在为游客介绍${monument.name?.zh || monument.name}，位于${
          monument.location?.city
        }。这座古迹建于${monument.period}。`,
        en: `Currently you are introducing ${
          monument.name?.en || monument.name
        } to visitors, located in ${
          monument.location?.city
        }. This monument was built in ${monument.period}.`,
        es: `Actualmente estás presentando ${
          monument.name?.es || monument.name
        } a los visitantes, ubicado en ${
          monument.location?.city
        }. Este monumento fue construido en ${monument.period}.`,
      };
      systemPrompt += ` ${monumentContext[language] || monumentContext.en}`;
    }

    return systemPrompt;
  }

  /**
   * Send chat completion request to DashScope API
   */
  async sendChatRequest(messages) {
    const requestData = {
      model: AI_CONFIG.model,
      messages: messages,
      max_tokens: AI_CONFIG.maxTokens,
      temperature: AI_CONFIG.temperature,
      stream: false,
    };

    try {
      const response = await this.client.post("/chat/completions", requestData);

      if (response.data?.choices?.[0]?.message?.content) {
        return response.data.choices[0].message.content;
      } else {
        throw new Error("AI 服务返回格式无效");
      }
    } catch (error) {
      throw error;
    }
  }

  /**
   * Main method to get AI response
   */
  async getResponse(prompt, context = {}) {
    const {
      guide = "historian",
      monument = null,
      language = "en",
      conversationHistory = [],
    } = context;

    console.log("🤖 AI Service: 开始处理请求", {
      prompt: prompt.substring(0, 50),
      guide,
      language,
    });

    try {
      // 简单的输入验证
      const validation = validateInput(prompt);
      if (!validation.valid) {
        console.warn("🚫 输入验证失败:", validation.error);
        throw new Error(`输入验证失败: ${validation.error}`);
      }

      const sanitizedPrompt = validation.sanitized;

      // Build system prompt
      const systemPrompt = this.buildSystemPrompt(guide, monument, language);

      // Prepare messages array
      const messages = [
        {
          role: "system",
          content: systemPrompt,
        },
      ];

      // Add conversation history (limit to recent messages)
      const recentHistory = conversationHistory.slice(-6);
      recentHistory.forEach((item) => {
        if (item.question) {
          messages.push({
            role: "user",
            content: item.question,
          });
        }
        if (item.answer) {
          messages.push({
            role: "assistant",
            content: item.answer,
          });
        }
      });

      // Add current user message
      messages.push({
        role: "user",
        content: sanitizedPrompt,
      });

      const response = await this.sendChatRequest(messages);

      console.log("✅ AI Service: 响应处理完成", {
        responseLength: response.length,
      });
      return response;
    } catch (error) {
      console.error("❌ AI Service: 处理失败", error.message);
      throw error;
    }
  }
}

// Create singleton instance
const aiService = new AIService();

export default aiService;
