<template>
  <div v-if="isVisible" class="loading-overlay" :class="{ fullscreen: fullscreen }">
    <div class="loading-content">
      <!-- 主加载动画 -->
      <div class="loading-animation">
        <div class="loading-spinner" :class="spinnerType">
          <div v-if="spinnerType === 'dots'" class="dots">
            <div class="dot"></div>
            <div class="dot"></div>
            <div class="dot"></div>
          </div>
          <div v-else-if="spinnerType === 'circle'" class="circle-spinner"></div>
          <div v-else-if="spinnerType === 'pulse'" class="pulse-spinner"></div>
        </div>
      </div>

      <!-- 加载信息 -->
      <div class="loading-info">
        <h3 class="loading-title">{{ title }}</h3>
        <p v-if="message" class="loading-message">{{ message }}</p>
        
        <!-- 进度条 -->
        <div v-if="showProgress" class="progress-container">
          <div class="progress-bar">
            <div 
              class="progress-fill" 
              :style="{ width: `${progress}%` }"
            ></div>
          </div>
          <div class="progress-text">{{ Math.round(progress) }}%</div>
        </div>

        <!-- 详细状态 -->
        <div v-if="details" class="loading-details">
          <div v-for="(detail, index) in details" :key="index" class="detail-item">
            <span class="detail-label">{{ detail.label }}:</span>
            <span class="detail-value">{{ detail.value }}</span>
          </div>
        </div>

        <!-- 取消按钮 -->
        <button 
          v-if="showCancel" 
          @click="handleCancel" 
          class="cancel-btn"
        >
          取消
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'

// Props
const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  title: {
    type: String,
    default: '加载中...'
  },
  message: {
    type: String,
    default: ''
  },
  progress: {
    type: Number,
    default: 0
  },
  showProgress: {
    type: Boolean,
    default: false
  },
  details: {
    type: Array,
    default: () => []
  },
  spinnerType: {
    type: String,
    default: 'circle', // 'circle', 'dots', 'pulse'
    validator: (value) => ['circle', 'dots', 'pulse'].includes(value)
  },
  fullscreen: {
    type: Boolean,
    default: true
  },
  showCancel: {
    type: Boolean,
    default: false
  }
})

// Emits
const emit = defineEmits(['cancel'])

// 响应式数据
const isVisible = computed(() => props.visible)

// 方法
const handleCancel = () => {
  emit('cancel')
}

// 监听进度变化，添加动画效果
watch(() => props.progress, (newProgress, oldProgress) => {
  if (newProgress > oldProgress) {
    // 可以在这里添加进度增加的动画效果
  }
})
</script>

<style scoped>
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
  backdrop-filter: blur(4px);
}

.loading-overlay.fullscreen {
  position: fixed;
}

.loading-content {
  text-align: center;
  color: white;
  max-width: 400px;
  padding: 40px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 20px;
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.loading-animation {
  margin-bottom: 30px;
}

.loading-spinner {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 80px;
}

/* 圆形加载器 */
.circle-spinner {
  width: 60px;
  height: 60px;
  border: 4px solid rgba(255, 255, 255, 0.3);
  border-top: 4px solid white;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

/* 点状加载器 */
.dots {
  display: flex;
  gap: 8px;
}

.dot {
  width: 12px;
  height: 12px;
  background: white;
  border-radius: 50%;
  animation: bounce 1.4s ease-in-out infinite both;
}

.dot:nth-child(1) { animation-delay: -0.32s; }
.dot:nth-child(2) { animation-delay: -0.16s; }

/* 脉冲加载器 */
.pulse-spinner {
  width: 60px;
  height: 60px;
  background: white;
  border-radius: 50%;
  animation: pulse 1.5s ease-in-out infinite;
}

.loading-info {
  text-align: center;
}

.loading-title {
  margin: 0 0 10px 0;
  font-size: 24px;
  font-weight: 600;
}

.loading-message {
  margin: 0 0 20px 0;
  font-size: 16px;
  opacity: 0.9;
  line-height: 1.5;
}

.progress-container {
  margin: 20px 0;
}

.progress-bar {
  width: 100%;
  height: 8px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 8px;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #3498db, #2ecc71);
  border-radius: 4px;
  transition: width 0.3s ease;
  position: relative;
}

.progress-fill::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(255, 255, 255, 0.4),
    transparent
  );
  animation: shimmer 2s infinite;
}

.progress-text {
  font-size: 14px;
  opacity: 0.8;
}

.loading-details {
  margin: 20px 0;
  text-align: left;
  background: rgba(0, 0, 0, 0.2);
  padding: 15px;
  border-radius: 8px;
}

.detail-item {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
  font-size: 14px;
}

.detail-item:last-child {
  margin-bottom: 0;
}

.detail-label {
  opacity: 0.8;
}

.detail-value {
  font-weight: 500;
}

.cancel-btn {
  margin-top: 20px;
  padding: 10px 20px;
  background: rgba(255, 255, 255, 0.2);
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.3s;
}

.cancel-btn:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: translateY(-1px);
}

/* 动画 */
@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

@keyframes bounce {
  0%, 80%, 100% {
    transform: scale(0);
  }
  40% {
    transform: scale(1);
  }
}

@keyframes pulse {
  0% {
    transform: scale(0);
    opacity: 1;
  }
  100% {
    transform: scale(1);
    opacity: 0;
  }
}

@keyframes shimmer {
  0% {
    transform: translateX(-100%);
  }
  100% {
    transform: translateX(100%);
  }
}

/* 响应式设计 */
@media (max-width: 768px) {
  .loading-content {
    max-width: 300px;
    padding: 30px 20px;
  }
  
  .loading-title {
    font-size: 20px;
  }
  
  .loading-message {
    font-size: 14px;
  }
}
</style>
