<template>
  <div class="ai-guide-chat">
    <!-- 导游选择器 -->
    <div class="guide-selector">
      <div class="guide-avatars">
        <div v-for="(guide, roleId) in guideRoles" :key="roleId" class="guide-avatar"
          :class="{ active: currentGuide === roleId }" :style="{ borderColor: guide.color }"
          @click="switchGuide(roleId)">
          <img :src="guide.avatar" :alt="guide.name[currentLanguage]" />
          <div class="guide-name">{{ guide.name[currentLanguage] }}</div>
        </div>
      </div>

      <!-- 语言切换 -->
      <div class="language-selector">
        <button v-for="lang in languages" :key="lang.code" class="lang-btn"
          :class="{ active: currentLanguage === lang.code }" @click="setLanguage(lang.code)">
          {{ lang.flag }} {{ lang.name }}
        </button>
        <!-- 清理对话历史按钮 -->
        <button class="clear-btn" @click="clearConversationHistory" title="Clear Chat History">
          🗑️
        </button>
      </div>
    </div>

    <!-- 聊天历史 -->
    <div class="chat-history" ref="chatHistory">
      <template v-for="(message, index) in conversationHistory" :key="index">
        <!-- 用户消息 (如果存在问题，先显示用户消息) -->
        <div v-if="message.question" class="message user-message">
          <div class="user-question">
            <div class="message-content">
              <p>{{ message.question }}</p>
            </div>
            <div class="user-info">
              <span class="timestamp">{{ formatTime(message.timestamp) }}</span>
            </div>
          </div>
        </div>

        <!-- AI消息 (然后显示AI回答) -->
        <div v-if="message.answer" class="message ai-message"
          :class="{ 'welcome-message': message.type === 'welcome' }">
          <div class="ai-response">
            <div class="guide-info">
              <img :src="guideRoles[message.guide]?.avatar" :alt="guideRoles[message.guide]?.name[currentLanguage]"
                class="guide-mini-avatar" />
              <span class="guide-mini-name">
                {{ guideRoles[message.guide]?.name[currentLanguage] }}
              </span>
              <span class="timestamp">{{ formatTime(message.timestamp) }}</span>
            </div>
            <div class="message-content">
              <p>{{ message.answer }}</p>

              <!-- 如果有相关推荐 -->
              <div v-if="message.recommendations" class="recommendations">
                <h4>相关推荐</h4>
                <div class="recommendation-list">
                  <button v-for="rec in message.recommendations" :key="rec.type" class="recommendation-btn"
                    @click="handleRecommendation(rec)">
                    {{ rec.title }}
                  </button>
                </div>
              </div>
            </div>

            <!-- 语音播放按钮 -->
            <button class="speak-btn" @click="speakResponse(message.answer)" :disabled="isSpeaking">
              <i class="icon-volume"></i>
            </button>
          </div>
        </div>
      </template>

      <!-- AI正在思考 -->
      <div v-if="isProcessing" class="thinking-indicator">
        <div class="guide-info">
          <img :src="currentGuideInfo.avatar" :alt="currentGuideName" class="guide-mini-avatar" />
          <span class="guide-mini-name">{{ currentGuideName }}</span>
        </div>
        <div class="thinking-animation">
          <div class="dot"></div>
          <div class="dot"></div>
          <div class="dot"></div>
        </div>
      </div>
    </div>

    <!-- 输入区域 -->
    <div class="input-area">
      <!-- 快速问题建议 -->
      <div v-if="!userInput && quickQuestions.length > 0" class="quick-questions">
        <button v-for="question in quickQuestions" :key="question.id" class="quick-question-btn"
          @click="askQuickQuestion(question.text)">
          {{ question.text }}
        </button>
      </div>

      <!-- 输入框 -->
      <div class="input-container">
        <input v-model="userInput" type="text" placeholder="Ask your question..." @keyup.enter="sendMessage"
          @input="handleInput" class="message-input" :disabled="isProcessing" />

        <!-- 语音输入按钮 -->
        <button class="voice-btn" :class="{ active: isListening, disabled: isProcessing }" @click="toggleVoiceInput"
          :disabled="isProcessing">
          <i class="icon-mic"></i>
          <div v-if="isListening" class="voice-indicator">
            <div class="voice-wave"></div>
          </div>
        </button>

        <!-- 发送按钮 -->
        <button class="send-btn" @click="sendMessage" :disabled="!userInput.trim() || isProcessing">
          <i class="icon-send"></i>
        </button>
      </div>
    </div>

    <!-- 个性化推荐面板 -->
    <div v-if="showRecommendations" class="recommendations-panel">
      <div class="panel-header">
        <h3>个性化推荐</h3>
        <button @click="showRecommendations = false" class="close-btn">×</button>
      </div>
      <div class="recommendations-content">
        <div v-for="rec in personalizedRecommendations" :key="rec.type" class="recommendation-card"
          @click="handleRecommendation(rec)">
          <h4>{{ rec.title }}</h4>
          <p>{{ rec.description }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick, watch } from 'vue'
import { useAIGuideStore } from '../stores/aiGuide'
import { useMonumentStore } from '../stores/monument'

// Store
const aiGuideStore = useAIGuideStore()
const monumentStore = useMonumentStore()

// 响应式数据
const userInput = ref('')
const showRecommendations = ref(false)
const isSpeaking = ref(false)
const chatHistory = ref(null)

// 语言选项
const languages = ref([
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'zh', name: '中文', flag: '🇨🇳' },
  { code: 'es', name: 'Español', flag: '🇪🇸' }
])

// 快速问题建议
const quickQuestions = ref([
  { id: 1, text: 'What is the historical significance of this building?' },
  { id: 2, text: 'How long did it take to build this monument?' },
  { id: 3, text: 'Are there any interesting legends here?' },
  { id: 4, text: 'What are the characteristics of this architectural style?' }
])

// 计算属性
const currentGuide = computed(() => aiGuideStore.currentGuide)
const currentLanguage = computed(() => aiGuideStore.currentLanguage)
const guideRoles = computed(() => aiGuideStore.guideRoles)
const currentGuideInfo = computed(() => aiGuideStore.currentGuideInfo)
const currentGuideName = computed(() => aiGuideStore.currentGuideName)
const conversationHistory = computed(() => aiGuideStore.conversationHistory)
const isProcessing = computed(() => aiGuideStore.isProcessing)
const isListening = computed(() => aiGuideStore.isListening)
const personalizedRecommendations = computed(() => aiGuideStore.getPersonalizedRecommendations())

// 方法
const sendMessage = async () => {
  if (!userInput.value.trim() || isProcessing.value) return

  const question = userInput.value.trim()
  userInput.value = ''

  try {
    const response = await aiGuideStore.askAI(question)

    // 滚动到底部
    await nextTick()
    scrollToBottom()

    // 自动播放回答（可选）
    if (aiGuideStore.userProfile.autoSpeak) {
      speakResponse(response)
    }
  } catch (error) {
    console.error('发送消息失败:', error)
  }
}

const askQuickQuestion = async (question) => {
  userInput.value = question
  await sendMessage()
}

const handleInput = () => {
  // 可以在这里添加输入建议逻辑
}

const toggleVoiceInput = () => {
  aiGuideStore.toggleListening()
}

const speakResponse = (text) => {
  if (isSpeaking.value) return

  isSpeaking.value = true
  aiGuideStore.speakResponse(text)

  // 监听语音结束
  const utterance = new SpeechSynthesisUtterance(text)
  utterance.onend = () => {
    isSpeaking.value = false
  }
}

const switchGuide = (roleId) => {
  aiGuideStore.switchGuide(roleId)
  scrollToBottom()
}

const clearConversationHistory = () => {
  aiGuideStore.clearConversationHistory()
}

const setLanguage = (lang) => {
  aiGuideStore.setLanguage(lang)
  updateQuickQuestions(lang)
}

const updateQuickQuestions = (lang) => {
  const questions = {
    zh: [
      { id: 1, text: '这个建筑有什么历史意义？' },
      { id: 2, text: '建造这个古迹用了多长时间？' },
      { id: 3, text: '这里有什么有趣的传说吗？' },
      { id: 4, text: '这个建筑风格有什么特点？' }
    ],
    en: [
      { id: 1, text: 'What is the historical significance of this building?' },
      { id: 2, text: 'How long did it take to build this monument?' },
      { id: 3, text: 'Are there any interesting legends here?' },
      { id: 4, text: 'What are the characteristics of this architectural style?' }
    ],
    es: [
      { id: 1, text: '¿Cuál es el significado histórico de este edificio?' },
      { id: 2, text: '¿Cuánto tiempo tomó construir este monumento?' },
      { id: 3, text: '¿Hay alguna leyenda interesante aquí?' },
      { id: 4, text: '¿Cuáles son las características de este estilo arquitectónico?' }
    ]
  }
  quickQuestions.value = questions[lang] || questions.en
}

const handleRecommendation = (recommendation) => {
  // 处理推荐点击
  switch (recommendation.type) {
    case 'historical_timeline':
      // 显示历史时间线
      break
    case 'architectural_analysis':
      // 显示建筑分析
      break
    default:
      // 发送相关问题
      userInput.value = `Tell me more about ${recommendation.title}`
      sendMessage()
  }
}

const formatTime = (timestamp) => {
  return new Date(timestamp).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit'
  })
}

const scrollToBottom = () => {
  if (chatHistory.value) {
    chatHistory.value.scrollTop = chatHistory.value.scrollHeight
  }
}

// 监听器
watch(conversationHistory, () => {
  nextTick(() => {
    scrollToBottom()
  })
}, { deep: true })

// 生命周期
onMounted(() => {
  updateQuickQuestions(currentLanguage.value)

  // 发送欢迎消息
  if (conversationHistory.value.length === 0) {
    aiGuideStore.switchGuide(currentGuide.value)
  }
})
</script>

<style scoped>
.ai-guide-chat {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #f8f9fa;
}

.guide-selector {
  padding: 15px;
  background: white;
  border-bottom: 1px solid #e9ecef;
}

.guide-avatars {
  display: flex;
  gap: 15px;
  margin-bottom: 15px;
  overflow-x: auto;
  padding-bottom: 5px;
}

.guide-avatar {
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: pointer;
  padding: 10px;
  border-radius: 12px;
  border: 2px solid transparent;
  transition: all 0.3s;
  min-width: 80px;
}

.guide-avatar:hover {
  background: #f8f9fa;
}

.guide-avatar.active {
  border-color: currentColor;
  background: rgba(52, 152, 219, 0.1);
}

.guide-avatar img {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  object-fit: cover;
  margin-bottom: 5px;
}

.guide-name {
  font-size: 12px;
  text-align: center;
  color: #666;
}

.language-selector {
  display: flex;
  gap: 10px;
}

.lang-btn {
  padding: 8px 12px;
  border: 1px solid #ddd;
  background: white;
  border-radius: 20px;
  cursor: pointer;
  font-size: 12px;
  transition: all 0.3s;
}

.lang-btn:hover {
  background: #f8f9fa;
}

.lang-btn.active {
  background: #3498db;
  color: white;
  border-color: #3498db;
}

.clear-btn {
  padding: 8px 12px;
  border: 1px solid #e74c3c;
  background: white;
  border-radius: 20px;
  cursor: pointer;
  font-size: 12px;
  transition: all 0.3s;
  margin-left: 10px;
}

.clear-btn:hover {
  background: #e74c3c;
  color: white;
}

.chat-history {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.message {
  display: flex;
  flex-direction: column;
}

.ai-response {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}

.user-question {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}

.guide-info {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.guide-mini-avatar {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  object-fit: cover;
}

.guide-mini-name {
  font-size: 12px;
  font-weight: 500;
  color: #666;
}

.timestamp {
  font-size: 11px;
  color: #999;
}

.message-content {
  background: white;
  padding: 12px 16px;
  border-radius: 18px;
  max-width: 80%;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.user-question .message-content {
  background: #3498db;
  color: white;
}

.message-content p {
  margin: 0;
  line-height: 1.4;
}

.recommendations {
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px solid #eee;
}

.recommendations h4 {
  margin: 0 0 8px 0;
  font-size: 14px;
  color: #666;
}

.recommendation-list {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
}

.recommendation-btn {
  padding: 4px 8px;
  background: #e3f2fd;
  border: 1px solid #2196f3;
  border-radius: 12px;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.3s;
}

.recommendation-btn:hover {
  background: #2196f3;
  color: white;
}

.speak-btn {
  margin-top: 5px;
  padding: 4px 8px;
  background: none;
  border: 1px solid #ddd;
  border-radius: 12px;
  cursor: pointer;
  font-size: 12px;
  color: #666;
  transition: all 0.3s;
}

.speak-btn:hover {
  background: #f8f9fa;
}

.speak-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.thinking-indicator {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}

.thinking-animation {
  display: flex;
  gap: 4px;
  padding: 12px 16px;
  background: white;
  border-radius: 18px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.thinking-animation .dot {
  width: 8px;
  height: 8px;
  background: #ccc;
  border-radius: 50%;
  animation: thinking 1.4s infinite ease-in-out;
}

.thinking-animation .dot:nth-child(1) {
  animation-delay: -0.32s;
}

.thinking-animation .dot:nth-child(2) {
  animation-delay: -0.16s;
}

@keyframes thinking {

  0%,
  80%,
  100% {
    transform: scale(0.8);
    opacity: 0.5;
  }

  40% {
    transform: scale(1);
    opacity: 1;
  }
}

.input-area {
  padding: 15px;
  background: white;
  border-top: 1px solid #e9ecef;
}

.quick-questions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 15px;
}

.quick-question-btn {
  padding: 8px 12px;
  background: #f8f9fa;
  border: 1px solid #e9ecef;
  border-radius: 16px;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.3s;
}

.quick-question-btn:hover {
  background: #e9ecef;
}

.input-container {
  display: flex;
  gap: 10px;
  align-items: center;
}

.message-input {
  flex: 1;
  padding: 12px 16px;
  border: 1px solid #e9ecef;
  border-radius: 24px;
  font-size: 14px;
  outline: none;
  transition: border-color 0.3s;
}

.message-input:focus {
  border-color: #3498db;
}

.voice-btn,
.send-btn {
  width: 44px;
  height: 44px;
  border: none;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s;
}

.voice-btn {
  background: #f8f9fa;
  color: #666;
  position: relative;
}

.voice-btn.active {
  background: #ff4757;
  color: white;
}

.voice-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.voice-indicator {
  position: absolute;
  width: 100%;
  height: 100%;
  border-radius: 50%;
  border: 2px solid currentColor;
  animation: voice-pulse 1s infinite;
}

@keyframes voice-pulse {
  0% {
    transform: scale(1);
    opacity: 1;
  }

  100% {
    transform: scale(1.3);
    opacity: 0;
  }
}

.send-btn {
  background: #3498db;
  color: white;
}

.send-btn:hover:not(:disabled) {
  background: #2980b9;
  transform: scale(1.05);
}

.send-btn:disabled {
  background: #bdc3c7;
  cursor: not-allowed;
}

.recommendations-panel {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: white;
  z-index: 20;
  display: flex;
  flex-direction: column;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid #e9ecef;
}

.panel-header h3 {
  margin: 0;
  color: #333;
}

.close-btn {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #666;
  padding: 0;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.recommendations-content {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
}

.recommendation-card {
  padding: 15px;
  background: #f8f9fa;
  border-radius: 12px;
  margin-bottom: 15px;
  cursor: pointer;
  transition: all 0.3s;
}

.recommendation-card:hover {
  background: #e9ecef;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.recommendation-card h4 {
  margin: 0 0 8px 0;
  color: #333;
}

.recommendation-card p {
  margin: 0;
  color: #666;
  font-size: 14px;
}
</style>