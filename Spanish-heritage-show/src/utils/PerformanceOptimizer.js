/**
 * 性能优化工具类
 * 提供各种性能优化功能，包括资源管理、内存清理、渲染优化等
 */
export class PerformanceOptimizer {
  constructor() {
    this.frameCount = 0
    this.lastTime = performance.now()
    this.fps = 60
    this.isMonitoring = false
    this.performanceData = {
      fps: [],
      memory: [],
      renderTime: []
    }
    
    // 性能阈值
    this.thresholds = {
      lowFPS: 30,
      highMemory: 100 * 1024 * 1024, // 100MB
      maxRenderTime: 16.67 // 60fps = 16.67ms per frame
    }
    
    // 优化策略
    this.optimizations = {
      autoLOD: true,
      frustumCulling: true,
      shadowOptimization: true,
      textureCompression: true
    }
  }

  /**
   * 开始性能监控
   */
  startMonitoring() {
    this.isMonitoring = true
    this.monitorPerformance()
  }

  /**
   * 停止性能监控
   */
  stopMonitoring() {
    this.isMonitoring = false
  }

  /**
   * 监控性能指标
   */
  monitorPerformance() {
    if (!this.isMonitoring) return

    const now = performance.now()
    const deltaTime = now - this.lastTime

    // 计算FPS
    this.frameCount++
    if (deltaTime >= 1000) {
      this.fps = Math.round((this.frameCount * 1000) / deltaTime)
      this.performanceData.fps.push(this.fps)
      
      // 保持数据数组大小
      if (this.performanceData.fps.length > 60) {
        this.performanceData.fps.shift()
      }
      
      this.frameCount = 0
      this.lastTime = now
      
      // 检查性能问题
      this.checkPerformanceIssues()
    }

    // 监控内存使用
    if (performance.memory) {
      const memoryUsage = performance.memory.usedJSHeapSize
      this.performanceData.memory.push(memoryUsage)
      
      if (this.performanceData.memory.length > 60) {
        this.performanceData.memory.shift()
      }
    }

    requestAnimationFrame(() => this.monitorPerformance())
  }

  /**
   * 检查性能问题
   */
  checkPerformanceIssues() {
    const issues = []

    // 检查FPS
    if (this.fps < this.thresholds.lowFPS) {
      issues.push({
        type: 'low_fps',
        severity: 'warning',
        message: `FPS过低: ${this.fps}`,
        suggestion: '考虑降低模型质量或减少光源数量'
      })
    }

    // 检查内存使用
    if (performance.memory && performance.memory.usedJSHeapSize > this.thresholds.highMemory) {
      issues.push({
        type: 'high_memory',
        severity: 'error',
        message: '内存使用过高',
        suggestion: '清理未使用的资源或重新加载页面'
      })
    }

    // 触发性能问题事件
    if (issues.length > 0) {
      this.onPerformanceIssue?.(issues)
    }
  }

  /**
   * 优化Three.js渲染器
   */
  optimizeRenderer(renderer) {
    // 启用硬件加速
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    
    // 优化阴影设置
    if (this.optimizations.shadowOptimization) {
      renderer.shadowMap.enabled = true
      renderer.shadowMap.type = THREE.PCFSoftShadowMap
      renderer.shadowMap.autoUpdate = false // 手动更新阴影
    }
    
    // 启用色调映射
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1
    
    // 启用物理正确的光照
    renderer.physicallyCorrectLights = true
    
    console.log('Renderer optimized')
  }

  /**
   * 优化场景对象
   */
  optimizeScene(scene) {
    scene.traverse((object) => {
      if (object.isMesh) {
        // 启用视锥体剔除
        if (this.optimizations.frustumCulling) {
          object.frustumCulled = true
        }
        
        // 优化几何体
        if (object.geometry) {
          // 合并顶点
          object.geometry.mergeVertices?.()
          
          // 计算包围盒
          object.geometry.computeBoundingBox()
          object.geometry.computeBoundingSphere()
        }
        
        // 优化材质
        if (object.material) {
          this.optimizeMaterial(object.material)
        }
      }
    })
    
    console.log('Scene optimized')
  }

  /**
   * 优化材质
   */
  optimizeMaterial(material) {
    if (Array.isArray(material)) {
      material.forEach(mat => this.optimizeMaterial(mat))
      return
    }

    // 启用材质缓存
    material.needsUpdate = false
    
    // 优化纹理
    if (material.map) {
      this.optimizeTexture(material.map)
    }
    
    if (material.normalMap) {
      this.optimizeTexture(material.normalMap)
    }
    
    if (material.roughnessMap) {
      this.optimizeTexture(material.roughnessMap)
    }
  }

  /**
   * 优化纹理
   */
  optimizeTexture(texture) {
    // 设置合适的过滤器
    texture.minFilter = THREE.LinearMipmapLinearFilter
    texture.magFilter = THREE.LinearFilter
    
    // 启用各向异性过滤
    texture.anisotropy = Math.min(4, renderer.capabilities.getMaxAnisotropy())
    
    // 生成mipmap
    texture.generateMipmaps = true
  }

  /**
   * 实现LOD (Level of Detail)
   */
  implementLOD(object, camera) {
    if (!this.optimizations.autoLOD) return

    const distance = camera.position.distanceTo(object.position)
    
    // 根据距离调整细节级别
    if (distance > 50) {
      // 远距离：低细节
      this.setObjectLOD(object, 'low')
    } else if (distance > 20) {
      // 中距离：中等细节
      this.setObjectLOD(object, 'medium')
    } else {
      // 近距离：高细节
      this.setObjectLOD(object, 'high')
    }
  }

  /**
   * 设置对象LOD级别
   */
  setObjectLOD(object, level) {
    object.traverse((child) => {
      if (child.isMesh) {
        switch (level) {
          case 'low':
            child.visible = child.userData.lodLevel !== 'high'
            break
          case 'medium':
            child.visible = child.userData.lodLevel !== 'low'
            break
          case 'high':
            child.visible = true
            break
        }
      }
    })
  }

  /**
   * 清理未使用的资源
   */
  cleanupResources(scene, renderer) {
    const disposedCount = { geometries: 0, materials: 0, textures: 0 }

    scene.traverse((object) => {
      if (object.isMesh) {
        // 清理几何体
        if (object.geometry && object.geometry.dispose) {
          object.geometry.dispose()
          disposedCount.geometries++
        }
        
        // 清理材质
        if (object.material) {
          if (Array.isArray(object.material)) {
            object.material.forEach(material => {
              this.disposeMaterial(material, disposedCount)
            })
          } else {
            this.disposeMaterial(object.material, disposedCount)
          }
        }
      }
    })

    // 清理渲染器
    renderer.dispose()
    
    console.log('Resources cleaned up:', disposedCount)
    return disposedCount
  }

  /**
   * 清理材质资源
   */
  disposeMaterial(material, disposedCount) {
    // 清理纹理
    if (material.map) {
      material.map.dispose()
      disposedCount.textures++
    }
    
    if (material.normalMap) {
      material.normalMap.dispose()
      disposedCount.textures++
    }
    
    if (material.roughnessMap) {
      material.roughnessMap.dispose()
      disposedCount.textures++
    }
    
    // 清理材质
    material.dispose()
    disposedCount.materials++
  }

  /**
   * 获取性能报告
   */
  getPerformanceReport() {
    const avgFPS = this.performanceData.fps.length > 0 
      ? this.performanceData.fps.reduce((a, b) => a + b, 0) / this.performanceData.fps.length 
      : 0

    const avgMemory = this.performanceData.memory.length > 0
      ? this.performanceData.memory.reduce((a, b) => a + b, 0) / this.performanceData.memory.length
      : 0

    return {
      currentFPS: this.fps,
      averageFPS: Math.round(avgFPS),
      memoryUsage: performance.memory ? {
        used: Math.round(performance.memory.usedJSHeapSize / 1024 / 1024),
        total: Math.round(performance.memory.totalJSHeapSize / 1024 / 1024),
        limit: Math.round(performance.memory.jsHeapSizeLimit / 1024 / 1024)
      } : null,
      averageMemory: Math.round(avgMemory / 1024 / 1024),
      optimizations: this.optimizations
    }
  }

  /**
   * 设置性能优化选项
   */
  setOptimizations(options) {
    this.optimizations = { ...this.optimizations, ...options }
  }

  /**
   * 设置性能阈值
   */
  setThresholds(thresholds) {
    this.thresholds = { ...this.thresholds, ...thresholds }
  }
}
