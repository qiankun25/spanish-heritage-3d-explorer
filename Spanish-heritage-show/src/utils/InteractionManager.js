import * as THREE from 'three'
import { gsap } from 'gsap'

/**
 * 交互管理器
 * 处理用户与3D场景的交互，包括点击、悬停、选择等
 */
export class InteractionManager {
  constructor(sceneManager, cameraAnimator) {
    this.sceneManager = sceneManager
    this.cameraAnimator = cameraAnimator
    
    // 射线投射器
    this.raycaster = new THREE.Raycaster()
    this.mouse = new THREE.Vector2()
    
    // 交互状态
    this.hoveredObject = null
    this.selectedObject = null
    this.interactiveObjects = []
    this.hotspots = []
    
    // 高亮材质
    this.originalMaterials = new Map()
    this.highlightMaterial = new THREE.MeshBasicMaterial({
      color: 0x00ff00,
      transparent: true,
      opacity: 0.3
    })
    
    // 事件回调
    this.onObjectClick = null
    this.onObjectHover = null
    this.onHotspotClick = null
    
    this.setupEventListeners()
  }

  /**
   * 设置事件监听器
   */
  setupEventListeners() {
    const canvas = this.sceneManager.canvas
    
    canvas.addEventListener('click', this.handleClick.bind(this))
    canvas.addEventListener('mousemove', this.handleMouseMove.bind(this))
    canvas.addEventListener('dblclick', this.handleDoubleClick.bind(this))
    
    // 触摸事件支持
    canvas.addEventListener('touchstart', this.handleTouchStart.bind(this))
    canvas.addEventListener('touchend', this.handleTouchEnd.bind(this))
  }

  /**
   * 添加可交互对象
   */
  addInteractiveObject(object, options = {}) {
    const {
      type = 'general',
      data = null,
      highlightColor = 0x00ff00,
      clickCallback = null,
      hoverCallback = null
    } = options

    // 为对象添加用户数据
    object.userData = {
      ...object.userData,
      interactive: true,
      type,
      data,
      highlightColor,
      clickCallback,
      hoverCallback
    }

    this.interactiveObjects.push(object)
    return object
  }

  /**
   * 添加热点
   */
  addHotspot(position, options = {}) {
    const {
      id = Math.random().toString(36).substr(2, 9),
      title = 'Hotspot',
      description = '',
      icon = '📍',
      scale = 1,
      data = null
    } = options

    // 创建热点几何体
    const geometry = new THREE.SphereGeometry(0.2 * scale, 16, 16)
    const material = new THREE.MeshBasicMaterial({
      color: 0xff6b6b,
      transparent: true,
      opacity: 0.8
    })
    
    const hotspotMesh = new THREE.Mesh(geometry, material)
    hotspotMesh.position.copy(position)
    
    // 添加脉冲动画
    this.addPulseAnimation(hotspotMesh)
    
    // 设置用户数据
    hotspotMesh.userData = {
      interactive: true,
      type: 'hotspot',
      id,
      title,
      description,
      icon,
      data,
      isHotspot: true
    }

    // 添加到场景和交互列表
    this.sceneManager.scene.add(hotspotMesh)
    this.interactiveObjects.push(hotspotMesh)
    this.hotspots.push(hotspotMesh)

    return hotspotMesh
  }

  /**
   * 添加脉冲动画
   */
  addPulseAnimation(object) {
    const originalScale = object.scale.clone()
    
    gsap.to(object.scale, {
      duration: 1,
      x: originalScale.x * 1.2,
      y: originalScale.y * 1.2,
      z: originalScale.z * 1.2,
      yoyo: true,
      repeat: -1,
      ease: "power2.inOut"
    })
  }

  /**
   * 处理鼠标点击
   */
  handleClick(event) {
    this.updateMousePosition(event)
    
    const intersects = this.getIntersections()
    
    if (intersects.length > 0) {
      const clickedObject = intersects[0].object
      const intersection = intersects[0]
      
      this.selectObject(clickedObject)
      
      // 执行回调
      if (clickedObject.userData.clickCallback) {
        clickedObject.userData.clickCallback(clickedObject, intersection)
      }
      
      if (clickedObject.userData.isHotspot && this.onHotspotClick) {
        this.onHotspotClick(clickedObject, intersection)
      }
      
      if (this.onObjectClick) {
        this.onObjectClick(clickedObject, intersection)
      }
    } else {
      this.deselectObject()
    }
  }

  /**
   * 处理鼠标移动
   */
  handleMouseMove(event) {
    this.updateMousePosition(event)
    
    const intersects = this.getIntersections()
    
    if (intersects.length > 0) {
      const hoveredObject = intersects[0].object
      
      if (this.hoveredObject !== hoveredObject) {
        // 取消之前的悬停
        if (this.hoveredObject) {
          this.unhighlightObject(this.hoveredObject)
        }
        
        // 设置新的悬停对象
        this.hoveredObject = hoveredObject
        this.highlightObject(hoveredObject)
        
        // 更新鼠标样式
        this.sceneManager.canvas.style.cursor = 'pointer'
        
        // 执行悬停回调
        if (hoveredObject.userData.hoverCallback) {
          hoveredObject.userData.hoverCallback(hoveredObject)
        }
        
        if (this.onObjectHover) {
          this.onObjectHover(hoveredObject)
        }
      }
    } else {
      // 没有悬停对象
      if (this.hoveredObject) {
        this.unhighlightObject(this.hoveredObject)
        this.hoveredObject = null
        this.sceneManager.canvas.style.cursor = 'default'
      }
    }
  }

  /**
   * 处理双击
   */
  handleDoubleClick(event) {
    this.updateMousePosition(event)
    
    const intersects = this.getIntersections()
    
    if (intersects.length > 0) {
      const clickedObject = intersects[0].object
      
      // 双击聚焦到对象
      if (this.cameraAnimator) {
        this.cameraAnimator.focusOnObject(clickedObject, {
          distance: 5,
          duration: 1.5
        })
      }
    }
  }

  /**
   * 处理触摸开始
   */
  handleTouchStart(event) {
    if (event.touches.length === 1) {
      this.touchStartTime = Date.now()
      this.updateMousePositionFromTouch(event.touches[0])
    }
  }

  /**
   * 处理触摸结束
   */
  handleTouchEnd(event) {
    if (event.changedTouches.length === 1) {
      const touchDuration = Date.now() - this.touchStartTime
      
      if (touchDuration < 300) { // 短触摸视为点击
        this.updateMousePositionFromTouch(event.changedTouches[0])
        this.handleClick(event)
      }
    }
  }

  /**
   * 更新鼠标位置
   */
  updateMousePosition(event) {
    const rect = this.sceneManager.canvas.getBoundingClientRect()
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1
  }

  /**
   * 从触摸事件更新鼠标位置
   */
  updateMousePositionFromTouch(touch) {
    const rect = this.sceneManager.canvas.getBoundingClientRect()
    this.mouse.x = ((touch.clientX - rect.left) / rect.width) * 2 - 1
    this.mouse.y = -((touch.clientY - rect.top) / rect.height) * 2 + 1
  }

  /**
   * 获取射线相交对象
   */
  getIntersections() {
    this.raycaster.setFromCamera(this.mouse, this.sceneManager.camera)
    return this.raycaster.intersectObjects(this.interactiveObjects, true)
  }

  /**
   * 选择对象
   */
  selectObject(object) {
    if (this.selectedObject) {
      this.deselectObject()
    }
    
    this.selectedObject = object
    this.highlightObject(object, 0x0099ff) // 蓝色高亮表示选中
  }

  /**
   * 取消选择对象
   */
  deselectObject() {
    if (this.selectedObject) {
      this.unhighlightObject(this.selectedObject)
      this.selectedObject = null
    }
  }

  /**
   * 高亮对象
   */
  highlightObject(object, color = null) {
    if (!object.material) return
    
    const highlightColor = color || object.userData.highlightColor || 0x00ff00
    
    // 保存原始材质
    if (!this.originalMaterials.has(object)) {
      this.originalMaterials.set(object, object.material.clone())
    }
    
    // 应用高亮效果
    if (Array.isArray(object.material)) {
      object.material.forEach(material => {
        material.emissive.setHex(highlightColor)
        material.emissiveIntensity = 0.3
      })
    } else {
      object.material.emissive.setHex(highlightColor)
      object.material.emissiveIntensity = 0.3
    }
  }

  /**
   * 取消高亮对象
   */
  unhighlightObject(object) {
    if (!object.material) return
    
    const originalMaterial = this.originalMaterials.get(object)
    if (originalMaterial) {
      // 恢复原始材质属性
      if (Array.isArray(object.material)) {
        object.material.forEach((material, index) => {
          if (originalMaterial[index]) {
            material.emissive.copy(originalMaterial[index].emissive)
            material.emissiveIntensity = originalMaterial[index].emissiveIntensity
          }
        })
      } else {
        object.material.emissive.copy(originalMaterial.emissive)
        object.material.emissiveIntensity = originalMaterial.emissiveIntensity
      }
    }
  }

  /**
   * 移除交互对象
   */
  removeInteractiveObject(object) {
    const index = this.interactiveObjects.indexOf(object)
    if (index > -1) {
      this.interactiveObjects.splice(index, 1)
    }
    
    if (this.hoveredObject === object) {
      this.hoveredObject = null
    }
    
    if (this.selectedObject === object) {
      this.selectedObject = null
    }
    
    this.originalMaterials.delete(object)
  }

  /**
   * 清除所有交互对象
   */
  clearInteractiveObjects() {
    this.interactiveObjects = []
    this.hotspots = []
    this.hoveredObject = null
    this.selectedObject = null
    this.originalMaterials.clear()
  }

  /**
   * 销毁交互管理器
   */
  dispose() {
    const canvas = this.sceneManager.canvas
    
    canvas.removeEventListener('click', this.handleClick.bind(this))
    canvas.removeEventListener('mousemove', this.handleMouseMove.bind(this))
    canvas.removeEventListener('dblclick', this.handleDoubleClick.bind(this))
    canvas.removeEventListener('touchstart', this.handleTouchStart.bind(this))
    canvas.removeEventListener('touchend', this.handleTouchEnd.bind(this))
    
    this.clearInteractiveObjects()
    
    if (this.highlightMaterial) {
      this.highlightMaterial.dispose()
    }
  }
}
