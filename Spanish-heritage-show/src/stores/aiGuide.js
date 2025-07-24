import { defineStore } from "pinia";
import { ref, computed } from "vue";

export const useAIGuideStore = defineStore("aiGuide", () => {
  // 核心状态
  const currentGuide = ref("historian");
  const isListening = ref(false);
  const currentLanguage = ref("zh");
  const currentMonument = ref(null);
  const userProfile = ref({
    interests: ["history", "architecture"],
    knowledgeLevel: "intermediate",
    preferredLanguage: "zh",
    visitHistory: [],
  });

  // AI对话状态
  const conversationHistory = ref([]);
  const isProcessing = ref(false);
  const currentContext = ref(null); // 用户当前关注的3D模型部分

  // AI导游角色定义
  const guideRoles = ref({
    historian: {
      name: {
        zh: "历史学家",
        en: "Historian",
        es: "Historiador",
      },
      personality: {
        zh: "博学严谨，善于讲述历史故事",
        en: "Scholarly and rigorous, good at telling historical stories",
        es: "Erudito y riguroso, bueno contando historias históricas",
      },
      avatar: "/avatars/historian.png",
      color: "#8B4513",
    },
    architect: {
      name: {
        zh: "建筑师",
        en: "Architect",
        es: "Arquitecto",
      },
      personality: {
        zh: "专业细致，专注建筑技术和设计",
        en: "Professional and meticulous, focused on architectural techniques",
        es: "Profesional y meticuloso, enfocado en técnicas arquitectónicas",
      },
      avatar: "/avatars/architect.png",
      color: "#4682B4",
    },
    archaeologist: {
      name: {
        zh: "考古学家",
        en: "Archaeologist",
        es: "Arqueólogo",
      },
      personality: {
        zh: "细心观察，擅长发现和解释文物",
        en: "Careful observer, good at discovering and interpreting artifacts",
        es: "Observador cuidadoso, bueno descubriendo e interpretando artefactos",
      },
      avatar: "/avatars/archaeologist.png",
      color: "#CD853F",
    },
    localGuide: {
      name: {
        zh: "当地向导",
        en: "Local Guide",
        es: "Guía Local",
      },
      personality: {
        zh: "热情友好，了解当地文化和传说",
        en: "Warm and friendly, knowledgeable about local culture and legends",
        es: "Cálido y amigable, conocedor de la cultura local y leyendas",
      },
      avatar: "/avatars/local-guide.png",
      color: "#228B22",
    },
  });

  // 计算属性
  const currentGuideInfo = computed(() => {
    return guideRoles.value[currentGuide.value];
  });

  const currentGuideName = computed(() => {
    return currentGuideInfo.value.name[currentLanguage.value];
  });

  // AI核心方法
  const askAI = async (question, context = null) => {
    isProcessing.value = true;
    try {
      const prompt = buildPrompt(question, context);
      const response = await callAIService(prompt);

      // 记录对话历史
      conversationHistory.value.push({
        question,
        answer: response,
        guide: currentGuide.value,
        timestamp: new Date(),
        context: currentContext.value,
      });

      return response;
    } catch (error) {
      console.error("AI服务调用失败:", error);
      return getErrorResponse();
    } finally {
      isProcessing.value = false;
    }
  };

  const buildPrompt = (question, context) => {
    const guide = currentGuideInfo.value;
    const monument = currentMonument.value;
    const lang = currentLanguage.value;

    return {
      role: guide.personality[lang],
      monument: monument,
      context: context || currentContext.value,
      question: question,
      language: lang,
      userProfile: userProfile.value,
    };
  };

  const callAIService = async (prompt) => {
    // 这里集成实际的AI服务（OpenAI, Claude等）
    // 模拟AI响应
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(
          `作为${prompt.role}，我来为您解答关于${
            prompt.monument?.name || "这个古迹"
          }的问题...`
        );
      }, 1000);
    });
  };

  const getErrorResponse = () => {
    const responses = {
      zh: "抱歉，我暂时无法回答您的问题，请稍后再试。",
      en: "Sorry, I cannot answer your question at the moment. Please try again later.",
      es: "Lo siento, no puedo responder tu pregunta en este momento. Inténtalo de nuevo más tarde.",
    };
    return responses[currentLanguage.value];
  };

  // 智能推荐方法
  const getPersonalizedRecommendations = () => {
    const interests = userProfile.value.interests;
    const level = userProfile.value.knowledgeLevel;

    // 基于用户兴趣和知识水平推荐内容
    return generateRecommendations(interests, level);
  };

  const generateRecommendations = (interests, level) => {
    // 智能推荐逻辑
    const recommendations = [];

    if (interests.includes("history")) {
      recommendations.push({
        type: "historical_timeline",
        title: "历史时间线探索",
        description: "了解这个古迹的历史演变过程",
      });
    }

    if (interests.includes("architecture")) {
      recommendations.push({
        type: "architectural_analysis",
        title: "建筑结构分析",
        description: "深入了解建筑技术和设计理念",
      });
    }

    return recommendations;
  };

  // 语音交互方法
  const startVoiceInteraction = () => {
    if ("webkitSpeechRecognition" in window) {
      const recognition = new webkitSpeechRecognition();
      recognition.lang = getVoiceLanguage();
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onstart = () => {
        isListening.value = true;
      };

      recognition.onresult = async (event) => {
        const transcript = event.results[0][0].transcript;
        const response = await askAI(transcript);
        speakResponse(response);
      };

      recognition.onend = () => {
        isListening.value = false;
      };

      recognition.start();
    }
  };

  const speakResponse = (text) => {
    if ("speechSynthesis" in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = getVoiceLanguage();
      speechSynthesis.speak(utterance);
    }
  };

  const getVoiceLanguage = () => {
    const langMap = {
      zh: "zh-CN",
      en: "en-US",
      es: "es-ES",
    };
    return langMap[currentLanguage.value] || "zh-CN";
  };

  // 基础方法
  const switchGuide = (roleId) => {
    currentGuide.value = roleId;
    // 切换导游时可以发送欢迎消息
    const welcomeMessage = getWelcomeMessage(roleId);
    conversationHistory.value.push({
      question: null,
      answer: welcomeMessage,
      guide: roleId,
      timestamp: new Date(),
      type: "welcome",
    });
  };

  const getWelcomeMessage = (roleId) => {
    const messages = {
      historian: {
        zh: "您好！我是您的历史学家导游，让我为您讲述这里的历史故事。",
        en: "Hello! I am your historian guide, let me tell you the historical stories here.",
        es: "¡Hola! Soy tu guía historiador, déjame contarte las historias históricas aquí.",
      },
      architect: {
        zh: "欢迎！作为建筑师，我将为您解析这座建筑的设计精髓。",
        en: "Welcome! As an architect, I will analyze the design essence of this building.",
        es: "¡Bienvenido! Como arquitecto, analizaré la esencia del diseño de este edificio.",
      },
      archaeologist: {
        zh: "很高兴见到您！让我从考古学角度为您介绍这些珍贵的文物。",
        en: "Nice to meet you! Let me introduce these precious artifacts from an archaeological perspective.",
        es: "¡Encantado de conocerte! Permíteme presentar estos preciosos artefactos desde una perspectiva arqueológica.",
      },
      localGuide: {
        zh: "¡Hola! 我是当地向导，让我分享一些有趣的当地传说和文化。",
        en: "¡Hola! I am a local guide, let me share some interesting local legends and culture.",
        es: "¡Hola! Soy un guía local, déjame compartir algunas leyendas locales y cultura interesantes.",
      },
    };
    return messages[roleId][currentLanguage.value];
  };

  const setLanguage = (lang) => {
    currentLanguage.value = lang;
    userProfile.value.preferredLanguage = lang;
  };

  const setCurrentMonument = (monument) => {
    currentMonument.value = monument;
  };

  const setCurrentContext = (context) => {
    currentContext.value = context;
  };

  const toggleListening = () => {
    if (isListening.value) {
      // 停止语音识别
      isListening.value = false;
    } else {
      // 开始语音交互
      startVoiceInteraction();
    }
  };

  return {
    // 状态
    currentGuide,
    isListening,
    currentLanguage,
    currentMonument,
    userProfile,
    conversationHistory,
    isProcessing,
    currentContext,
    guideRoles,

    // 计算属性
    currentGuideInfo,
    currentGuideName,

    // 方法
    askAI,
    switchGuide,
    setLanguage,
    setCurrentMonument,
    setCurrentContext,
    toggleListening,
    getPersonalizedRecommendations,
    startVoiceInteraction,
    speakResponse,
  };
});
