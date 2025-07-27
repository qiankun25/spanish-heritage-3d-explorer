<template>
  <div class="notification-container">
    <transition-group name="notification" tag="div">
      <div
        v-for="notification in notifications"
        :key="notification.id"
        :class="['notification', `notification-${notification.type}`]"
        @click="removeNotification(notification.id)"
      >
        <div class="notification-icon">
          <i :class="getNotificationIcon(notification.type)"></i>
        </div>
        <div class="notification-content">
          <div class="notification-title">{{ notification.title }}</div>
          <div v-if="notification.message" class="notification-message">
            {{ notification.message }}
          </div>
        </div>
        <button @click.stop="removeNotification(notification.id)" class="notification-close">
          <i class="icon-close"></i>
        </button>
      </div>
    </transition-group>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

// 响应式数据
const notifications = ref([])
let notificationId = 0

// 方法
const addNotification = (options) => {
  const {
    type = 'info',
    title = '',
    message = '',
    duration = 5000,
    persistent = false
  } = options

  const notification = {
    id: ++notificationId,
    type,
    title,
    message,
    persistent
  }

  notifications.value.push(notification)

  // 自动移除（除非是持久通知）
  if (!persistent && duration > 0) {
    setTimeout(() => {
      removeNotification(notification.id)
    }, duration)
  }

  return notification.id
}

const removeNotification = (id) => {
  const index = notifications.value.findIndex(n => n.id === id)
  if (index > -1) {
    notifications.value.splice(index, 1)
  }
}

const clearAllNotifications = () => {
  notifications.value = []
}

const getNotificationIcon = (type) => {
  const icons = {
    success: 'icon-success',
    error: 'icon-error',
    warning: 'icon-warning',
    info: 'icon-info',
    loading: 'icon-loading'
  }
  return icons[type] || 'icon-info'
}

// 便捷方法
const showSuccess = (title, message, options = {}) => {
  return addNotification({ type: 'success', title, message, ...options })
}

const showError = (title, message, options = {}) => {
  return addNotification({ type: 'error', title, message, ...options })
}

const showWarning = (title, message, options = {}) => {
  return addNotification({ type: 'warning', title, message, ...options })
}

const showInfo = (title, message, options = {}) => {
  return addNotification({ type: 'info', title, message, ...options })
}

const showLoading = (title, message, options = {}) => {
  return addNotification({ 
    type: 'loading', 
    title, 
    message, 
    persistent: true,
    ...options 
  })
}

// 暴露方法给父组件
defineExpose({
  addNotification,
  removeNotification,
  clearAllNotifications,
  showSuccess,
  showError,
  showWarning,
  showInfo,
  showLoading
})
</script>

<style scoped>
.notification-container {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 1000;
  pointer-events: none;
}

.notification {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  min-width: 320px;
  max-width: 400px;
  padding: 16px;
  margin-bottom: 12px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  border-left: 4px solid #ddd;
  cursor: pointer;
  pointer-events: auto;
  transition: all 0.3s ease;
}

.notification:hover {
  transform: translateX(-4px);
  box-shadow: 0 6px 25px rgba(0, 0, 0, 0.2);
}

.notification-success {
  border-left-color: #27ae60;
}

.notification-error {
  border-left-color: #e74c3c;
}

.notification-warning {
  border-left-color: #f39c12;
}

.notification-info {
  border-left-color: #3498db;
}

.notification-loading {
  border-left-color: #9b59b6;
}

.notification-icon {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  flex-shrink: 0;
  margin-top: 2px;
}

.notification-success .notification-icon {
  background: #d5f4e6;
  color: #27ae60;
}

.notification-error .notification-icon {
  background: #fdeaea;
  color: #e74c3c;
}

.notification-warning .notification-icon {
  background: #fef5e7;
  color: #f39c12;
}

.notification-info .notification-icon {
  background: #e8f4fd;
  color: #3498db;
}

.notification-loading .notification-icon {
  background: #f4ecf7;
  color: #9b59b6;
}

.notification-content {
  flex: 1;
  min-width: 0;
}

.notification-title {
  font-weight: 600;
  color: #2c3e50;
  margin-bottom: 4px;
  line-height: 1.4;
}

.notification-message {
  font-size: 14px;
  color: #7f8c8d;
  line-height: 1.4;
  word-wrap: break-word;
}

.notification-close {
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: none;
  border: none;
  cursor: pointer;
  color: #bdc3c7;
  border-radius: 50%;
  transition: all 0.2s;
  flex-shrink: 0;
}

.notification-close:hover {
  background: #ecf0f1;
  color: #7f8c8d;
}

/* 动画 */
.notification-enter-active {
  transition: all 0.4s ease;
}

.notification-leave-active {
  transition: all 0.3s ease;
}

.notification-enter-from {
  opacity: 0;
  transform: translateX(100%);
}

.notification-leave-to {
  opacity: 0;
  transform: translateX(100%);
}

.notification-move {
  transition: transform 0.3s ease;
}

/* 图标样式 */
.icon-success::before { content: '✓'; }
.icon-error::before { content: '✕'; }
.icon-warning::before { content: '⚠'; }
.icon-info::before { content: 'ℹ'; }
.icon-loading::before { 
  content: '⟳'; 
  animation: spin 1s linear infinite;
}
.icon-close::before { content: '✕'; }

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* 响应式设计 */
@media (max-width: 768px) {
  .notification-container {
    left: 20px;
    right: 20px;
    top: 10px;
  }
  
  .notification {
    min-width: auto;
    max-width: none;
  }
}
</style>
