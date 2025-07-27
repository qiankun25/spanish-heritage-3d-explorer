<template>
  <div class="monument-viewer">
    <!-- 3D模型展示区域 -->
    <div class="model-container" ref="modelContainer">
      <div v-if="isLoading" class="loading-overlay">
        <div class="loading-spinner"></div>
        <p>正在加载3D模型...</p>
      </div>

      <div v-else-if="modelError" class="error-overlay">
        <p>模型加载失败: {{ modelError }}</p>
        <button @click="retryLoad" class="retry-btn">重试</button>
      </div>

      <!-- Three.js 3D场景将在这里渲染 -->
      <div class="model-display">
        <canvas ref="threeCanvas" class="three-canvas"></canvas>

        <!-- 交互热点 -->
        <div v-if="modelLoaded" v-for="point in interactivePoints" :key="point.id" class="hotspot"
          :style="getHotspotStyle(point)" @click="selectHotspot(point.id)">
          <div class="hotspot-marker">
            <div class="pulse-ring"></div>
            <div class="hotspot-dot"></div>
          </div>
          <div class="hotspot-label">
            {{ point.title[currentLanguage] }}
          </div>
        </div>
      </div>
    </div>

    <!-- 控制面板 -->
    <div class="control-panel">
      <!-- 搜索面板 -->
      <div class="search-section">
        <SearchPanel @result-select="handleSearchResult" />
      </div>

      <!-- 相机控制 -->
      <div class="camera-controls">
        <button @click="resetCamera" class="control-btn">
          <i class="icon-home"></i>
          重置视角
        </button>
        <button @click="toggleAutoRotate" class="control-btn" :class="{ active: autoRotate }">
          <i class="icon-rotate"></i>
          自动旋转
        </button>
        <button @click="animateToPreset('front')" class="control-btn">
          <i class="icon-view"></i>
          正视图
        </button>
        <button @click="animateToPreset('top')" class="control-btn">
          <i class="icon-view"></i>
          俯视图
        </button>
      </div>

      <!-- 信息面板切换 -->
      <div class="info-toggle">
        <button @click="toggleInfoPanel" class="control-btn" :class="{ active: showInfoPanel }">
          <i class="icon-info"></i>
          信息
        </button>
      </div>
    </div>

    <!-- 信息面板 -->
    <transition name="slide-up">
      <div v-if="showInfoPanel" class="info-panel">
        <div class="info-header">
          <h2>{{ currentMonument?.name[currentLanguage] }}</h2>
          <button @click="showInfoPanel = false" class="close-btn">×</button>
        </div>

        <div class="info-content">
          <div class="monument-details">
            <p class="description">{{ currentMonument?.description[currentLanguage] }}</p>
            <div class="metadata">
              <div class="meta-item">
                <strong>位置:</strong>
                {{ currentMonument?.location.city }}, {{ currentMonument?.location.region }}
              </div>
              <div class="meta-item">
                <strong>时期:</strong>
                {{ currentMonument?.period }}
              </div>
              <div class="meta-item">
                <strong>重要性:</strong>
                {{ currentMonument?.significance }}
              </div>
            </div>
          </div>

          <!-- 选中热点的详细信息 -->
          <div v-if="selectedHotspot" class="hotspot-details">
            <h3>{{ selectedHotspot.title[currentLanguage] }}</h3>
            <p>{{ selectedHotspot.description[currentLanguage] }}</p>
          </div>
        </div>
      </div>
    </transition>

    <!-- 通知系统 -->
    <NotificationSystem ref="notificationSystem" />

    <!-- 加载进度覆盖层 -->
    <LoadingProgress :visible="showLoadingOverlay" :title="loadingTitle" :message="loadingMessage"
      :progress="loadingProgress" :show-progress="loadingProgress > 0" spinner-type="circle"
      @cancel="handleLoadingCancel" />
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch, computed } from 'vue'
import { useMonumentStore } from '../stores/monument'
import { useAIGuideStore } from '../stores/aiGuide'
import * as THREE from 'three'
import { SceneManager } from '../utils/SceneManager'
import { CameraAnimator } from '../utils/CameraAnimator'
import { InteractionManager } from '../utils/InteractionManager'
import SearchPanel from './SearchPanel.vue'
import NotificationSystem from './NotificationSystem.vue'
import LoadingProgress from './LoadingProgress.vue'

// Store
const monumentStore = useMonumentStore()
const aiGuideStore = useAIGuideStore()

// 响应式数据
const modelContainer = ref(null)
const threeCanvas = ref(null)
const showInfoPanel = ref(false)
const autoRotate = ref(false)
const loadingProgress = ref(0)
const notificationSystem = ref(null)
const showLoadingOverlay = ref(false)
const loadingTitle = ref('加载中...')
const loadingMessage = ref('')

// 3D场景管理
let sceneManager = null
let cameraAnimator = null
let interactionManager = null
let currentModel = null

// 计算属性
const isLoading = computed(() => monumentStore.isLoading)
const modelError = computed(() => monumentStore.modelError)
const modelLoaded = computed(() => monumentStore.modelLoaded)
const interactivePoints = computed(() => monumentStore.interactivePoints)
const selectedHotspot = computed(() => monumentStore.selectedHotspot)
const currentMonument = computed(() => monumentStore.currentMonument)
const currentLanguage = computed(() => aiGuideStore.currentLanguage)

// 方法
const initThreeJS = () => {
  if (!threeCanvas.value) {
    console.error('Canvas element not found')
    return
  }

  try {
    console.log('Initializing 3D scene...')

    // 创建场景管理器
    sceneManager = new SceneManager(threeCanvas.value, {
      enableShadows: true,
      enableControls: true,
      backgroundColor: 0xf0f0f0
    })

    // 创建相机动画器
    cameraAnimator = new CameraAnimator(sceneManager.camera, sceneManager.controls)

    // 创建交互管理器
    interactionManager = new InteractionManager(sceneManager, cameraAnimator)

    // 设置事件回调
    sceneManager.onModelLoad = handleModelLoad
    sceneManager.onModelError = handleModelError
    interactionManager.onObjectClick = handleObjectClick
    interactionManager.onHotspotClick = handleHotspotClick
    interactionManager.onObjectHover = handleObjectHover

    console.log('3D scene initialized successfully')
    console.log('Scene manager:', sceneManager)
    console.log('Canvas size:', threeCanvas.value.clientWidth, 'x', threeCanvas.value.clientHeight)
  } catch (error) {
    console.error('Failed to initialize 3D scene:', error)
    monumentStore.setModelError('3D场景初始化失败')
  }
}

const loadModel = async (modelPath) => {
  if (!sceneManager) {
    console.error('Scene manager not initialized')
    showNotification('场景未初始化', '请刷新页面重试', 'error')
    return
  }

  try {
    // 显示加载状态
    showLoading('加载3D模型', '正在准备模型文件...')

    // 清除之前的模型
    if (currentModel) {
      sceneManager.scene.remove(currentModel)
      currentModel = null
    }

    updateLoadingProgress(20, '正在下载模型文件...')

    // 加载新模型
    console.log('Loading model:', modelPath)
    currentModel = await sceneManager.loadModel(modelPath, {
      scale: 1,
      position: { x: 0, y: 0, z: 0 },
      enableShadows: true,
      makeInteractive: true
    })

    updateLoadingProgress(70, '正在处理模型数据...')

    // 添加交互热点
    if (interactionManager && currentMonument.value.interactivePoints) {
      addInteractiveHotspots(currentMonument.value.interactivePoints)
    }

    updateLoadingProgress(90, '正在调整相机视角...')

    // 动画到模型
    try {
      if (cameraAnimator && currentModel) {
        await cameraAnimator.focusOnObject(currentModel, {
          distance: 15,
          duration: 2
        })
        console.log('Camera animation completed')
      }
    } catch (cameraError) {
      console.warn('Camera animation failed:', cameraError)
      // 相机动画失败不应该阻止模型加载完成
    }

    updateLoadingProgress(100, '加载完成')
    console.log('Model loading completed, hiding loading overlay...')

    // 立即隐藏加载界面，然后显示成功通知
    hideLoading()
    showNotification('模型加载成功', currentMonument.value?.name[currentLanguage.value], 'success')
    monumentStore.setModelLoaded(true)
  } catch (error) {
    console.error('Failed to load model:', error)
    hideLoading()
    showNotification('模型加载失败', error.message, 'error')
    monumentStore.setModelError('模型加载失败: ' + error.message)
  }
}

// 模型加载成功回调
const handleModelLoad = (model, gltf) => {
  console.log('Model loaded successfully:', model)

  // 处理动画（如果有）
  if (gltf.animations && gltf.animations.length > 0) {
    console.log('Model has animations:', gltf.animations.length)
    showNotification('发现模型动画', `找到 ${gltf.animations.length} 个动画`, 'info')
    // 这里可以添加动画处理逻辑
  }
}

// 模型加载错误回调
const handleModelError = (error) => {
  console.error('Model loading error:', error)
  hideLoading()
  showNotification('模型加载失败', error.message, 'error')
  monumentStore.setModelError('模型加载失败')
}

// 对象点击回调
const handleObjectClick = (object, intersection) => {
  console.log('Object clicked:', object)
}

// 热点点击回调
const handleHotspotClick = (hotspot, intersection) => {
  console.log('Hotspot clicked:', hotspot.userData)

  if (hotspot.userData.id) {
    selectHotspot(hotspot.userData.id)
  }
}

// 对象悬停回调
const handleObjectHover = (object) => {
  console.log('Object hovered:', object.userData)
}

const getHotspotStyle = (point) => {
  // 检查必要的依赖
  if (!sceneManager || !sceneManager.camera || !threeCanvas.value) {
    return {
      position: 'absolute',
      left: '50%',
      top: '50%',
      transform: 'translate(-50%, -50%)',
      display: 'none' // 隐藏直到场景准备好
    }
  }

  try {
    // 将3D坐标转换为屏幕坐标
    const vector = new THREE.Vector3(point.position.x, point.position.y, point.position.z)
    vector.project(sceneManager.camera)

    const x = (vector.x * 0.5 + 0.5) * threeCanvas.value.clientWidth
    const y = (vector.y * -0.5 + 0.5) * threeCanvas.value.clientHeight

    // 检查坐标是否在视口内
    const isVisible = x >= 0 && x <= threeCanvas.value.clientWidth &&
      y >= 0 && y <= threeCanvas.value.clientHeight &&
      vector.z < 1 // 确保在相机前方

    return {
      position: 'absolute',
      left: `${x}px`,
      top: `${y}px`,
      transform: 'translate(-50%, -50%)',
      display: isVisible ? 'block' : 'none',
      zIndex: Math.round((1 - vector.z) * 1000) // 根据深度设置z-index
    }
  } catch (error) {
    console.warn('Error calculating hotspot style:', error)
    return {
      position: 'absolute',
      left: '50%',
      top: '50%',
      transform: 'translate(-50%, -50%)',
      display: 'none'
    }
  }
}

const selectHotspot = async (hotspotId) => {
  monumentStore.selectHotspot(hotspotId)

  // 通知AI导游用户选择了热点
  const hotspot = interactivePoints.value.find(p => p.id === hotspotId)
  if (hotspot) {
    aiGuideStore.setCurrentContext({
      type: 'hotspot',
      data: hotspot
    })

    // 使用新的动画方法
    await animateToHotspot(hotspot)

    // 显示信息面板
    showInfoPanel.value = true
  }
}

const resetCamera = async () => {
  monumentStore.resetCamera()

  if (cameraAnimator) {
    await cameraAnimator.animateToPreset('isometric', { duration: 1.5 })
  }
}

const toggleAutoRotate = () => {
  autoRotate.value = !autoRotate.value

  if (autoRotate.value && currentModel && cameraAnimator) {
    // 开始自动旋转动画
    startAutoRotation()
  }
}

const startAutoRotation = () => {
  if (!autoRotate.value || !currentModel || !cameraAnimator) return

  const center = new THREE.Vector3()
  const box = new THREE.Box3().setFromObject(currentModel)
  box.getCenter(center)

  cameraAnimator.animateOrbit(center, 15, 0, Math.PI * 2, {
    duration: 10,
    onComplete: () => {
      if (autoRotate.value) {
        startAutoRotation() // 循环旋转
      }
    }
  })
}

// 动画到预设视角
const animateToPreset = async (presetName) => {
  if (!cameraAnimator) return

  try {
    await cameraAnimator.animateToPreset(presetName, {
      duration: 1.5,
      ease: "power2.inOut"
    })
  } catch (error) {
    console.error('Failed to animate to preset:', error)
  }
}

// 平滑过渡到热点
const animateToHotspot = async (hotspot) => {
  if (!cameraAnimator) return

  const targetPosition = {
    x: hotspot.position.x + 3,
    y: hotspot.position.y + 2,
    z: hotspot.position.z + 3
  }

  try {
    await cameraAnimator.animateToPosition(targetPosition, hotspot.position, {
      duration: 2,
      ease: "power2.inOut"
    })
  } catch (error) {
    console.error('Failed to animate to hotspot:', error)
  }
}

// 处理搜索结果选择
const handleSearchResult = async (result) => {
  console.log('Search result selected:', result)

  try {
    if (result.type === 'monument') {
      // 切换到选中的古迹
      showNotification('正在切换古迹', result.title, 'info')
      await monumentStore.loadMonument(result.data.id)
    } else if (result.type === 'hotspot') {
      // 导航到热点
      showNotification('正在导航到热点', result.title, 'info')
      await selectHotspot(result.data.id)
    }

    // 显示成功提示
    showNotification('导航成功', '已到达: ' + result.title, 'success')
  } catch (error) {
    console.error('Failed to navigate to search result:', error)
    showNotification('导航失败', '无法到达指定位置', 'error')
  }
}

// 显示通知
const showNotification = (title, message = '', type = 'info') => {
  if (notificationSystem.value) {
    switch (type) {
      case 'success':
        notificationSystem.value.showSuccess(title, message)
        break
      case 'error':
        notificationSystem.value.showError(title, message)
        break
      case 'warning':
        notificationSystem.value.showWarning(title, message)
        break
      default:
        notificationSystem.value.showInfo(title, message)
    }
  }
}

// 显示加载状态
const showLoading = (title, message = '') => {
  showLoadingOverlay.value = true
  loadingTitle.value = title
  loadingMessage.value = message
  loadingProgress.value = 0

  // 设置一个备用的超时隐藏机制，防止界面卡住
  setTimeout(() => {
    if (showLoadingOverlay.value && loadingProgress.value >= 90) {
      console.warn('Loading overlay timeout, force hiding...')
      hideLoading()
    }
  }, 10000) // 10秒超时
}

// 更新加载进度
const updateLoadingProgress = (progress, message = '') => {
  loadingProgress.value = Math.max(0, Math.min(100, progress))
  if (message) {
    loadingMessage.value = message
  }
}

// 隐藏加载状态
const hideLoading = () => {
  showLoadingOverlay.value = false
  loadingProgress.value = 0
}

// 处理加载取消
const handleLoadingCancel = () => {
  hideLoading()
  showNotification('操作已取消', '', 'info')
}

// 添加交互热点
const addInteractiveHotspots = (hotspots) => {
  if (!interactionManager) return

  // 清除之前的热点
  interactionManager.clearInteractiveObjects()

  hotspots.forEach(hotspot => {
    const hotspotMesh = interactionManager.addHotspot(
      hotspot.position,
      {
        id: hotspot.id,
        title: hotspot.title[currentLanguage.value],
        description: hotspot.description[currentLanguage.value],
        data: hotspot
      }
    )

    console.log('Added hotspot:', hotspot.id)
  })
}

// 根据对象查找对应的热点
const findHotspotByObject = (object) => {
  return interactivePoints.value.find(point => {
    return object.userData && object.userData.id === point.id
  })
}

const toggleInfoPanel = () => {
  showInfoPanel.value = !showInfoPanel.value
}

const retryLoad = () => {
  if (currentMonument.value) {
    monumentStore.loadMonument(currentMonument.value.id)
  }
}

// 监听器
watch(currentMonument, async (newMonument) => {
  if (newMonument && newMonument.modelPath && sceneManager) {
    await loadModel(newMonument.modelPath)
  }
})

watch(() => monumentStore.cameraPosition, async (newPos) => {
  if (cameraAnimator && newPos) {
    await cameraAnimator.animateToPosition(newPos, null, { duration: 1 })
  }
})

watch(autoRotate, (rotating) => {
  if (!rotating && cameraAnimator) {
    cameraAnimator.stopCurrentAnimation()
  }
})

// 生命周期
onMounted(async () => {
  initThreeJS()

  // 确保canvas可见
  monumentStore.setModelLoaded(false)
  monumentStore.setModelError(null)

  // 初始化完成后，如果有当前古迹，则加载模型
  if (currentMonument.value && currentMonument.value.modelPath) {
    await loadModel(currentMonument.value.modelPath)
  }
})

onUnmounted(() => {
  // 停止自动旋转
  autoRotate.value = false

  // 清理交互管理器
  if (interactionManager) {
    interactionManager.dispose()
    interactionManager = null
  }

  // 清理相机动画器
  if (cameraAnimator) {
    cameraAnimator.stopCurrentAnimation()
    cameraAnimator = null
  }

  // 清理场景管理器
  if (sceneManager) {
    sceneManager.dispose()
    sceneManager = null
  }

  currentModel = null
})
</script>

<style scoped>
.monument-viewer {
  position: relative;
  width: 100%;
  height: 100vh;
  overflow: hidden;
}

.model-container {
  position: relative;
  width: 100%;
  height: 100%;
}

.loading-overlay,
.error-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  background: rgba(0, 0, 0, 0.8);
  color: white;
  z-index: 10;
}

.loading-spinner {
  width: 50px;
  height: 50px;
  border: 3px solid #f3f3f3;
  border-top: 3px solid #3498db;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 20px;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }

  100% {
    transform: rotate(360deg);
  }
}

.three-canvas {
  width: 100%;
  height: 100%;
  display: block;
}

.hotspot {
  position: absolute;
  z-index: 5;
  cursor: pointer;
}

.hotspot-marker {
  position: relative;
  width: 20px;
  height: 20px;
}

.hotspot-dot {
  width: 12px;
  height: 12px;
  background: #ff6b6b;
  border-radius: 50%;
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  border: 2px solid white;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
}

.pulse-ring {
  width: 20px;
  height: 20px;
  border: 2px solid #ff6b6b;
  border-radius: 50%;
  position: absolute;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0% {
    transform: scale(1);
    opacity: 1;
  }

  100% {
    transform: scale(2);
    opacity: 0;
  }
}

.hotspot-label {
  position: absolute;
  top: -30px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(0, 0, 0, 0.8);
  color: white;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  white-space: nowrap;
  opacity: 0;
  transition: opacity 0.3s;
}

.hotspot:hover .hotspot-label {
  opacity: 1;
}

.control-panel {
  position: absolute;
  top: 20px;
  right: 20px;
  display: flex;
  flex-direction: column;
  gap: 15px;
  z-index: 10;
}

.search-section {
  display: flex;
  justify-content: flex-end;
}

.camera-controls,
.info-toggle {
  display: flex;
  gap: 10px;
}

.control-btn {
  padding: 10px;
  background: rgba(255, 255, 255, 0.9);
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s;
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 14px;
}

.control-btn:hover {
  background: white;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.control-btn.active {
  background: #3498db;
  color: white;
}

.info-panel {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: white;
  border-radius: 20px 20px 0 0;
  box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.1);
  max-height: 50vh;
  overflow-y: auto;
  z-index: 15;
}

.info-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid #eee;
}

.info-header h2 {
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

.info-content {
  padding: 20px;
}

.description {
  font-size: 16px;
  line-height: 1.6;
  color: #555;
  margin-bottom: 20px;
}

.metadata {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.meta-item {
  font-size: 14px;
  color: #666;
}

.meta-item strong {
  color: #333;
}

.hotspot-details {
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid #eee;
}

.hotspot-details h3 {
  margin: 0 0 10px 0;
  color: #333;
}

.retry-btn {
  margin-top: 20px;
  padding: 10px 20px;
  background: #3498db;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
}

/* 过渡动画 */
.slide-up-enter-active,
.slide-up-leave-active {
  transition: transform 0.3s ease;
}

.slide-up-enter-from,
.slide-up-leave-to {
  transform: translateY(100%);
}

/* 图标样式 */
.icon-home::before {
  content: '🏠';
}

.icon-rotate::before {
  content: '🔄';
}

.icon-info::before {
  content: 'ℹ️';
}

.icon-view::before {
  content: '👁️';
}

.icon-search::before {
  content: '🔍';
}
</style>