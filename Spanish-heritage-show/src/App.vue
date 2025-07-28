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
const showChat = ref(true)
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
            {{ showChat ? '隐藏导游' : '显示导游' }}
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
            {{ showChat ? '隐藏' : '显示' }}导游
          </button>
        </div>
      </div>

      <!-- AI导游聊天面板 -->
      <div v-if="showChat" class="chat-container">
        <AIGuideChat />
      </div>
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

.control-btn {
  padding: 10px 16px;
  background: #3498db;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: all 0.3s;
}

.control-btn:hover {
  background: #2980b9;
  transform: translateY(-1px);
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

.fullscreen-controls {
  position: absolute;
  top: 20px;
  right: 20px;
  display: flex;
  gap: 10px;
  z-index: 100;
}

.fullscreen-btn {
  padding: 12px 16px;
  background: rgba(0, 0, 0, 0.7);
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: all 0.3s;
}

.fullscreen-btn:hover {
  background: rgba(0, 0, 0, 0.9);
}

.chat-container {
  width: 400px;
  background: white;
  border-left: 1px solid #e0e0e0;
  display: flex;
  flex-direction: column;
  transition: all 0.3s ease;
}

.loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
}

.loading-content {
  text-align: center;
  color: white;
}

.loading-spinner {
  width: 60px;
  height: 60px;
  border: 4px solid rgba(255, 255, 255, 0.3);
  border-top: 4px solid white;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 20px;
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
  
  .chat-container {
    width: 100%;
    height: 300px;
    border-left: none;
    border-top: 1px solid #e0e0e0;
  }
  
  .viewer-container.full-width {
    height: calc(100vh - 200px);
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
