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

      <div v-else-if="modelLoaded" class="model-display">
        <!-- Three.js 3D场景将在这里渲染 -->
        <canvas ref="threeCanvas" class="three-canvas"></canvas>

        <!-- 交互热点 -->
        <div v-for="point in interactivePoints" :key="point.id" class="hotspot" :style="getHotspotStyle(point)"
          @click="selectHotspot(point.id)">
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
      <!-- 相机控制 -->
      <div class="camera-controls">
        <button @click="resetCamera" class="control-btn">
          <i class="icon-home"></i>
          重置视角
        </button>
        <button @click="toggleAutoRotate" class="control-btn">
          <i class="icon-rotate"></i>
          自动旋转
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
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch, computed } from 'vue'
import { useMonumentStore } from '../stores/monument'
import { useAIGuideStore } from '../stores/aiGuide'
import * as THREE from 'three'

// Store
const monumentStore = useMonumentStore()
const aiGuideStore = useAIGuideStore()

// 响应式数据
const modelContainer = ref(null)
const threeCanvas = ref(null)
const showInfoPanel = ref(false)
const autoRotate = ref(false)

// Three.js 相关
let scene, camera, renderer, controls
let animationId

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
  if (!threeCanvas.value) return

  // 创建场景
  scene = new THREE.Scene()
  scene.background = new THREE.Color(0xf0f0f0)

  // 创建相机
  camera = new THREE.PerspectiveCamera(
    75,
    threeCanvas.value.clientWidth / threeCanvas.value.clientHeight,
    0.1,
    1000
  )
  camera.position.set(0, 5, 10)

  // 创建渲染器
  renderer = new THREE.WebGLRenderer({
    canvas: threeCanvas.value,
    antialias: true
  })
  renderer.setSize(threeCanvas.value.clientWidth, threeCanvas.value.clientHeight)
  renderer.shadowMap.enabled = true
  renderer.shadowMap.type = THREE.PCFSoftShadowMap

  // 添加光源
  const ambientLight = new THREE.AmbientLight(0x404040, 0.6)
  scene.add(ambientLight)

  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8)
  directionalLight.position.set(10, 10, 5)
  directionalLight.castShadow = true
  scene.add(directionalLight)

  // 开始渲染循环
  animate()
}

const animate = () => {
  animationId = requestAnimationFrame(animate)

  if (autoRotate.value && scene) {
    scene.rotation.y += 0.005
  }

  renderer.render(scene, camera)
}

const loadModel = async (modelPath) => {
  // 这里应该使用GLTFLoader加载实际的GLB模型
  // 现在创建一个简单的几何体作为占位符
  const geometry = new THREE.BoxGeometry(2, 3, 2)
  const material = new THREE.MeshLambertMaterial({ color: 0x8B4513 })
  const cube = new THREE.Mesh(geometry, material)
  cube.castShadow = true
  cube.receiveShadow = true
  scene.add(cube)
}

const getHotspotStyle = (point) => {
  // 将3D坐标转换为屏幕坐标
  const vector = new THREE.Vector3(point.position.x, point.position.y, point.position.z)
  vector.project(camera)

  const x = (vector.x * 0.5 + 0.5) * threeCanvas.value.clientWidth
  const y = (vector.y * -0.5 + 0.5) * threeCanvas.value.clientHeight

  return {
    position: 'absolute',
    left: `${x}px`,
    top: `${y}px`,
    transform: 'translate(-50%, -50%)'
  }
}

const selectHotspot = (hotspotId) => {
  monumentStore.selectHotspot(hotspotId)

  // 通知AI导游用户选择了热点
  const hotspot = interactivePoints.value.find(p => p.id === hotspotId)
  if (hotspot) {
    aiGuideStore.setCurrentContext({
      type: 'hotspot',
      data: hotspot
    })
  }
}

const resetCamera = () => {
  monumentStore.resetCamera()
  camera.position.set(0, 5, 10)
  camera.lookAt(0, 0, 0)
}

const toggleAutoRotate = () => {
  autoRotate.value = !autoRotate.value
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
watch(modelLoaded, (loaded) => {
  if (loaded && currentMonument.value) {
    loadModel(currentMonument.value.modelPath)
  }
})

watch(() => monumentStore.cameraPosition, (newPos) => {
  if (camera) {
    camera.position.set(newPos.x, newPos.y, newPos.z)
  }
})

// 生命周期
onMounted(() => {
  initThreeJS()

  // 处理窗口大小变化
  const handleResize = () => {
    if (camera && renderer && threeCanvas.value) {
      camera.aspect = threeCanvas.value.clientWidth / threeCanvas.value.clientHeight
      camera.updateProjectionMatrix()
      renderer.setSize(threeCanvas.value.clientWidth, threeCanvas.value.clientHeight)
    }
  }

  window.addEventListener('resize', handleResize)

  // 清理函数
  onUnmounted(() => {
    window.removeEventListener('resize', handleResize)
    if (animationId) {
      cancelAnimationFrame(animationId)
    }
    if (renderer) {
      renderer.dispose()
    }
  })
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
  gap: 10px;
  z-index: 10;
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
</style>