<script setup>
import { ref, onMounted } from 'vue'
import { useMonumentStore } from './stores/monument'
import { useAIGuideStore } from './stores/aiGuide'
import MonumentViewer from './components/MonumentViewer.vue'
import AIGuideChat from './components/AIGuideChat.vue'

// Store
const monumentStore = useMonumentStore()
const aiGuideStore = useAIGuideStore()

// 响应式数据
const selectedMonument = ref('alhambra')
const showChat = ref(false) // 默认隐藏聊天框
const isFullscreen = ref(false)

// 方法
const selectMonument = async (monumentId) => {
  selectedMonument.value = monumentId
  await monumentStore.loadMonument(monumentId)
  aiGuideStore.setCurrentMonument(monumentStore.currentMonument)
}

const toggleChat = () => {
  showChat.value = !showChat.value
}

const toggleFullscreen = () => {
  isFullscreen.value = !isFullscreen.value
}

// 生命周期
onMounted(async () => {
  // 加载默认古迹
  await selectMonument(selectedMonument.value)
})
</script>

<template>
  <div class="app" :class="{ fullscreen: isFullscreen }">
    <!-- 头部导航 -->
    <header class="app-header" v-if="!isFullscreen">
      <div class="header-content">
        <div class="logo-section">
          <h1>🏛️ 西班牙文化古迹展示平台</h1>
          <p>Spanish Cultural Heritage Explorer</p>
        </div>
        
        <!-- 古迹选择器 -->
        <div class="monument-selector">
          <select 
            v-model="selectedMonument" 
            @change="selectMonument(selectedMonument)"
            class="monument-select"
          >
            <option 
              v-for="monument in monumentStore.availableMonuments" 
              :key="monument.id"
              :value="monument.id"
            >
              {{ monument.name[aiGuideStore.currentLanguage] }}
            </option>
          </select>
        </div>

        <!-- 控制按钮 -->
        <div class="header-controls">
          <button @click="toggleChat" class="control-btn">
            <i class="icon-chat"></i>
            {{ showChat ? '隐藏导游' : '召唤导游' }}
          </button>
          <button @click="toggleFullscreen" class="control-btn">
            <i class="icon-fullscreen"></i>
            全屏模式
          </button>
        </div>
      </div>
    </header>

    <!-- 主要内容区域 -->
    <main class="app-main">
      <!-- 3D展示区域 -->
      <div class="viewer-container" :class="{ 'full-width': !showChat }">
        <MonumentViewer />
        
        <!-- 全屏模式控制 -->
        <div v-if="isFullscreen" class="fullscreen-controls">
          <button @click="toggleFullscreen" class="fullscreen-btn">
            <i class="icon-exit-fullscreen"></i>
            退出全屏
          </button>
          <button @click="toggleChat" class="fullscreen-btn">
            <i class="icon-chat"></i>
            {{ showChat ? '隐藏' : '召唤' }}导游
          </button>
        </div>

        <!-- 浮动聊天按钮 (当聊天框隐藏时显示) -->
        <div v-if="!showChat" class="floating-chat-btn" @click="toggleChat">
          <div class="chat-btn-icon">
            <i class="icon-chat"></i>
          </div>
          <div class="chat-btn-text">AI导游</div>
          <div class="chat-btn-pulse"></div>
        </div>
      </div>

      <!-- AI导游聊天面板 -->
      <transition name="slide-chat">
        <div v-if="showChat" class="chat-container">
          <AIGuideChat />
        </div>
      </transition>
    </main>

    <!-- 加载遮罩 -->
    <div v-if="monumentStore.isLoading" class="loading-overlay">
      <div class="loading-content">
        <div class="loading-spinner"></div>
        <h3>正在加载古迹模型...</h3>
        <p>{{ monumentStore.currentMonument?.name[aiGuideStore.currentLanguage] }}</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.app {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: #f5f5f5;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

.app.fullscreen {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 1000;
  background: black;
}

.app-header {
  background: white;
  border-bottom: 1px solid #e0e0e0;
  padding: 15px 0;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.header-content {
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
}

.logo-section h1 {
  margin: 0;
  font-size: 24px;
  color: #2c3e50;
  font-weight: 600;
}

.logo-section p {
  margin: 5px 0 0 0;
  font-size: 14px;
  color: #7f8c8d;
}

.monument-selector {
  flex: 1;
  max-width: 300px;
}

.monument-select {
  width: 100%;
  padding: 10px 15px;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 14px;
  background: white;
  cursor: pointer;
  transition: border-color 0.3s;
}

.monument-select:focus {
  outline: none;
  border-color: #3498db;
}

.header-controls {
  display: flex;
  gap: 10px;
}

.app-main {
  flex: 1;
  display: flex;
  overflow: hidden;
}

.viewer-container {
  flex: 1;
  position: relative;
  background: #f0f0f0;
  transition: all 0.3s ease;
}

.viewer-container.full-width {
  flex: 1;
}

/* 浮动聊天按钮 */
.floating-chat-btn {
  position: absolute;
  bottom: 30px;
  right: 30px;
  width: 80px;
  height: 80px;
  background: linear-gradient(135deg, #3498db 0%, #2980b9 100%);
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  color: white;
  box-shadow: 
    0 8px 32px rgba(52, 152, 219, 0.4),
    0 4px 16px rgba(0, 0, 0, 0.1);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  z-index: 50;
  overflow: hidden;
}

.floating-chat-btn:hover {
  transform: translateY(-4px) scale(1.05);
  box-shadow: 
    0 12px 40px rgba(52, 152, 219, 0.5),
    0 6px 20px rgba(0, 0, 0, 0.15);
}

.chat-btn-icon {
  font-size: 24px;
  line-height: 1;
}

.chat-btn-text {
  font-size: 10px;
  font-weight: 500;
  letter-spacing: 0.5px;
}

.chat-btn-pulse {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.2);
  animation: pulse 2s infinite;
  pointer-events: none;
}

@keyframes pulse {
  0% {
    transform: scale(1);
    opacity: 1;
  }
  70% {
    transform: scale(1.4);
    opacity: 0;
  }
  100% {
    transform: scale(1.4);
    opacity: 0;
  }
}

/* 全屏模式下的浮动按钮 */
.app.fullscreen .floating-chat-btn {
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(15px);
  -webkit-backdrop-filter: blur(15px);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

/* 聊天容器毛玻璃效果 */
.chat-container {
  width: 400px;
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-left: 1px solid rgba(255, 255, 255, 0.2);
  border-right: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 
    0 8px 32px rgba(0, 0, 0, 0.1),
    inset 0 1px 0 rgba(255, 255, 255, 0.2);
  display: flex;
  flex-direction: column;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.chat-container::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.1) 0%,
    rgba(255, 255, 255, 0.05) 50%,
    rgba(255, 255, 255, 0.1) 100%
  );
  pointer-events: none;
  z-index: 1;
}

.chat-container::after {
  content: '';
  position: absolute;
  top: 0;
  left: -2px;
  width: 2px;
  height: 100%;
  background: linear-gradient(
    to bottom,
    rgba(52, 152, 219, 0.8) 0%,
    rgba(155, 89, 182, 0.8) 50%,
    rgba(52, 152, 219, 0.8) 100%
  );
  border-radius: 1px;
  z-index: 2;
}

/* 聊天框滑动动画 */
.slide-chat-enter-active,
.slide-chat-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.slide-chat-enter-from {
  transform: translateX(100%);
  opacity: 0;
}

.slide-chat-leave-to {
  transform: translateX(100%);
  opacity: 0;
}

/* 全屏模式下的聊天容器 */
.app.fullscreen .chat-container {
  position: fixed;
  right: 20px;
  top: 20px;
  bottom: 20px;
  width: 380px;
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  z-index: 150;
}

.app.fullscreen .chat-container::before {
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.05) 0%,
    rgba(255, 255, 255, 0.02) 50%,
    rgba(255, 255, 255, 0.05) 100%
  );
}

.app.fullscreen .chat-container::after {
  background: linear-gradient(
    to bottom,
    rgba(52, 152, 219, 0.6) 0%,
    rgba(155, 89, 182, 0.6) 50%,
    rgba(52, 152, 219, 0.6) 100%
  );
}

/* 全屏控制按钮 */
.fullscreen-controls {
  position: absolute;
  top: 20px;
  right: 20px;
  display: flex;
  gap: 12px;
  z-index: 100;
}

.fullscreen-btn {
  padding: 12px 18px;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(15px);
  -webkit-backdrop-filter: blur(15px);
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
}

.fullscreen-btn::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.1) 0%,
    rgba(255, 255, 255, 0.05) 100%
  );
  opacity: 0;
  transition: opacity 0.3s ease;
}

.fullscreen-btn:hover {
  background: rgba(0, 0, 0, 0.8);
  border-color: rgba(255, 255, 255, 0.2);
  transform: translateY(-2px);
  box-shadow: 
    0 8px 25px rgba(0, 0, 0, 0.3),
    0 4px 10px rgba(0, 0, 0, 0.2);
}

.fullscreen-btn:hover::before {
  opacity: 1;
}

.fullscreen-btn:active {
  transform: translateY(0);
}

/* 头部控制按钮 */
.control-btn {
  padding: 12px 18px;
  background: linear-gradient(135deg, #3498db 0%, #2980b9 100%);
  color: white;
  border: none;
  border-radius: 10px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
  box-shadow: 
    0 4px 15px rgba(52, 152, 219, 0.3),
    0 2px 4px rgba(0, 0, 0, 0.1);
}

.control-btn::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.2) 0%,
    rgba(255, 255, 255, 0.1) 100%
  );
  opacity: 0;
  transition: opacity 0.3s ease;
}

.control-btn:hover {
  background: linear-gradient(135deg, #2980b9 0%, #1f6391 100%);
  transform: translateY(-2px);
  box-shadow: 
    0 6px 20px rgba(52, 152, 219, 0.4),
    0 4px 8px rgba(0, 0, 0, 0.15);
}

.control-btn:hover::before {
  opacity: 1;
}

.control-btn:active {
  transform: translateY(0);
}

/* 加载遮罩 */
.loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
}

.loading-content {
  text-align: center;
  color: white;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  padding: 40px 60px;
  border-radius: 20px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow: 
    0 8px 32px rgba(0, 0, 0, 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.2);
}

.loading-spinner {
  width: 60px;
  height: 60px;
  border: 4px solid rgba(255, 255, 255, 0.2);
  border-top: 4px solid #3498db;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 20px;
  filter: drop-shadow(0 0 10px rgba(52, 152, 219, 0.5));
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.loading-content h3 {
  margin: 0 0 10px 0;
  font-size: 20px;
}

.loading-content p {
  margin: 0;
  font-size: 16px;
  opacity: 0.8;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .header-content {
    flex-direction: column;
    gap: 15px;
  }
  
  .app-main {
    flex-direction: column;
  }
  
  .floating-chat-btn {
    width: 60px;
    height: 60px;
    bottom: 20px;
    right: 20px;
  }
  
  .chat-btn-icon {
    font-size: 20px;
  }
  
  .chat-btn-text {
    font-size: 8px;
  }
  
  .chat-container {
    width: 100%;
    height: 350px;
    border-left: none;
    border-top: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 20px 20px 0 0;
    background: rgba(255, 255, 255, 0.9);
  }
  
  .chat-container::after {
    display: none;
  }
  
  .slide-chat-enter-from,
  .slide-chat-leave-to {
    transform: translateY(100%);
  }
  
  .viewer-container.full-width {
    height: calc(100vh - 200px);
  }
  
  .app.fullscreen .chat-container {
    position: fixed;
    right: 10px;
    left: 10px;
    top: auto;
    bottom: 20px;
    width: auto;
    height: 300px;
    border-radius: 16px;
  }
  
  .fullscreen-controls {
    top: 10px;
    right: 10px;
    gap: 8px;
  }
  
  .fullscreen-btn {
    padding: 10px 14px;
    font-size: 12px;
  }
}

/* 小屏幕优化 */
@media (max-width: 480px) {
  .loading-content {
    padding: 30px 40px;
    margin: 0 20px;
  }
  
  .fullscreen-btn {
    padding: 8px 12px;
    font-size: 11px;
    gap: 4px;
  }
  
  .control-btn {
    padding: 10px 14px;
    font-size: 13px;
  }
  
  .floating-chat-btn {
    width: 50px;
    height: 50px;
  }
  
  .chat-btn-icon {
    font-size: 18px;
  }
  
  .chat-btn-text {
    display: none;
  }
}

/* 暗色主题支持 */
@media (prefers-color-scheme: dark) {
  .chat-container {
    background: rgba(30, 30, 30, 0.85);
    border-left-color: rgba(255, 255, 255, 0.1);
  }
  
  .app.fullscreen .chat-container {
    background: rgba(20, 20, 20, 0.6);
  }
}

/* 图标样式 */
.icon-chat::before { content: '💬'; }
.icon-fullscreen::before { content: '⛶'; }
.icon-exit-fullscreen::before { content: '⛶'; }
.icon-home::before { content: '🏠'; }
.icon-rotate::before { content: '🔄'; }
.icon-info::before { content: 'ℹ️'; }
.icon-volume::before { content: '🔊'; }
.icon-mic::before { content: '🎤'; }
.icon-send::before { content: '📤'; }
</style>