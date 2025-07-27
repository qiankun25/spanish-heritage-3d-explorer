/**
 * 错误处理工具类
 * 统一处理应用程序中的各种错误，提供错误恢复和用户友好的错误信息
 */
export class ErrorHandler {
  constructor() {
    this.errorLog = []
    this.maxLogSize = 100
    this.onError = null
    this.setupGlobalErrorHandling()
  }

  /**
   * 设置全局错误处理
   */
  setupGlobalErrorHandling() {
    // 捕获未处理的Promise拒绝
    window.addEventListener('unhandledrejection', (event) => {
      this.handleError({
        type: 'unhandled_promise_rejection',
        message: event.reason?.message || 'Unhandled promise rejection',
        stack: event.reason?.stack,
        timestamp: new Date().toISOString()
      })
      event.preventDefault()
    })

    // 捕获全局JavaScript错误
    window.addEventListener('error', (event) => {
      this.handleError({
        type: 'javascript_error',
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        stack: event.error?.stack,
        timestamp: new Date().toISOString()
      })
    })

    // 捕获资源加载错误
    window.addEventListener('error', (event) => {
      if (event.target !== window) {
        this.handleError({
          type: 'resource_error',
          message: `Failed to load resource: ${event.target.src || event.target.href}`,
          element: event.target.tagName,
          timestamp: new Date().toISOString()
        })
      }
    }, true)
  }

  /**
   * 处理错误
   */
  handleError(error) {
    // 添加到错误日志
    this.addToLog(error)
    
    // 分析错误类型并提供解决方案
    const errorInfo = this.analyzeError(error)
    
    // 触发错误回调
    if (this.onError) {
      this.onError(errorInfo)
    }
    
    console.error('Error handled:', errorInfo)
    return errorInfo
  }

  /**
   * 分析错误并提供解决方案
   */
  analyzeError(error) {
    const errorInfo = {
      ...error,
      severity: 'medium',
      userMessage: '发生了一个错误',
      technicalMessage: error.message,
      suggestions: [],
      recoverable: true
    }

    // 根据错误类型分析
    switch (error.type) {
      case 'webgl_error':
        errorInfo.severity = 'high'
        errorInfo.userMessage = '3D渲染出现问题'
        errorInfo.suggestions = [
          '请更新您的浏览器到最新版本',
          '检查显卡驱动是否为最新版本',
          '尝试在其他浏览器中打开'
        ]
        break

      case 'model_load_error':
        errorInfo.severity = 'medium'
        errorInfo.userMessage = '模型加载失败'
        errorInfo.suggestions = [
          '检查网络连接',
          '刷新页面重试',
          '稍后再试'
        ]
        break

      case 'network_error':
        errorInfo.severity = 'medium'
        errorInfo.userMessage = '网络连接出现问题'
        errorInfo.suggestions = [
          '检查网络连接',
          '刷新页面',
          '稍后重试'
        ]
        break

      case 'memory_error':
        errorInfo.severity = 'high'
        errorInfo.userMessage = '内存不足'
        errorInfo.suggestions = [
          '关闭其他标签页',
          '重新加载页面',
          '使用性能更好的设备'
        ]
        break

      case 'permission_error':
        errorInfo.severity = 'medium'
        errorInfo.userMessage = '权限不足'
        errorInfo.suggestions = [
          '检查浏览器权限设置',
          '允许网站访问所需功能'
        ]
        break

      case 'compatibility_error':
        errorInfo.severity = 'high'
        errorInfo.userMessage = '浏览器兼容性问题'
        errorInfo.suggestions = [
          '使用现代浏览器（Chrome、Firefox、Safari、Edge）',
          '更新浏览器到最新版本',
          '启用WebGL支持'
        ]
        break

      case 'resource_error':
        errorInfo.severity = 'low'
        errorInfo.userMessage = '资源加载失败'
        errorInfo.suggestions = [
          '刷新页面',
          '检查网络连接'
        ]
        break

      default:
        errorInfo.suggestions = [
          '刷新页面重试',
          '如果问题持续存在，请联系技术支持'
        ]
    }

    return errorInfo
  }

  /**
   * 添加错误到日志
   */
  addToLog(error) {
    this.errorLog.push({
      ...error,
      id: this.generateErrorId(),
      timestamp: error.timestamp || new Date().toISOString()
    })

    // 保持日志大小限制
    if (this.errorLog.length > this.maxLogSize) {
      this.errorLog.shift()
    }
  }

  /**
   * 生成错误ID
   */
  generateErrorId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2)
  }

  /**
   * 检查WebGL支持
   */
  checkWebGLSupport() {
    try {
      const canvas = document.createElement('canvas')
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl')
      
      if (!gl) {
        throw new Error('WebGL not supported')
      }
      
      return {
        supported: true,
        version: gl.getParameter(gl.VERSION),
        vendor: gl.getParameter(gl.VENDOR),
        renderer: gl.getParameter(gl.RENDERER)
      }
    } catch (error) {
      return {
        supported: false,
        error: error.message
      }
    }
  }

  /**
   * 检查浏览器兼容性
   */
  checkBrowserCompatibility() {
    const features = {
      webgl: this.checkWebGLSupport().supported,
      webgl2: !!document.createElement('canvas').getContext('webgl2'),
      es6: typeof Symbol !== 'undefined',
      fetch: typeof fetch !== 'undefined',
      promises: typeof Promise !== 'undefined',
      modules: 'noModule' in HTMLScriptElement.prototype
    }

    const incompatibleFeatures = Object.entries(features)
      .filter(([key, supported]) => !supported)
      .map(([key]) => key)

    return {
      compatible: incompatibleFeatures.length === 0,
      features,
      incompatibleFeatures
    }
  }

  /**
   * 尝试错误恢复
   */
  async attemptRecovery(errorType) {
    console.log(`Attempting recovery for error type: ${errorType}`)

    switch (errorType) {
      case 'webgl_error':
        return this.recoverWebGL()
      
      case 'model_load_error':
        return this.recoverModelLoad()
      
      case 'memory_error':
        return this.recoverMemory()
      
      default:
        return { success: false, message: 'No recovery method available' }
    }
  }

  /**
   * WebGL错误恢复
   */
  recoverWebGL() {
    try {
      // 尝试重新创建WebGL上下文
      const canvas = document.createElement('canvas')
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl')
      
      if (gl) {
        return { success: true, message: 'WebGL context recovered' }
      } else {
        return { success: false, message: 'WebGL still not available' }
      }
    } catch (error) {
      return { success: false, message: error.message }
    }
  }

  /**
   * 模型加载错误恢复
   */
  async recoverModelLoad() {
    try {
      // 清理缓存并重试
      if ('caches' in window) {
        const cacheNames = await caches.keys()
        await Promise.all(cacheNames.map(name => caches.delete(name)))
      }
      
      return { success: true, message: 'Cache cleared, ready to retry' }
    } catch (error) {
      return { success: false, message: error.message }
    }
  }

  /**
   * 内存错误恢复
   */
  recoverMemory() {
    try {
      // 强制垃圾回收（如果可用）
      if (window.gc) {
        window.gc()
      }
      
      // 清理可能的内存泄漏
      this.clearMemoryLeaks()
      
      return { success: true, message: 'Memory cleanup attempted' }
    } catch (error) {
      return { success: false, message: error.message }
    }
  }

  /**
   * 清理内存泄漏
   */
  clearMemoryLeaks() {
    // 清理事件监听器
    const elements = document.querySelectorAll('*')
    elements.forEach(element => {
      if (element._listeners) {
        delete element._listeners
      }
    })
    
    // 清理定时器（这需要应用程序配合）
    // 清理Three.js对象（这需要场景管理器配合）
  }

  /**
   * 获取错误统计
   */
  getErrorStats() {
    const errorTypes = {}
    const severityCount = { low: 0, medium: 0, high: 0 }
    
    this.errorLog.forEach(error => {
      // 统计错误类型
      errorTypes[error.type] = (errorTypes[error.type] || 0) + 1
      
      // 统计严重程度
      const severity = this.analyzeError(error).severity
      severityCount[severity]++
    })

    return {
      totalErrors: this.errorLog.length,
      errorTypes,
      severityCount,
      recentErrors: this.errorLog.slice(-10)
    }
  }

  /**
   * 导出错误日志
   */
  exportErrorLog() {
    const logData = {
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      errors: this.errorLog,
      stats: this.getErrorStats(),
      compatibility: this.checkBrowserCompatibility()
    }

    return JSON.stringify(logData, null, 2)
  }

  /**
   * 清空错误日志
   */
  clearLog() {
    this.errorLog = []
  }

  /**
   * 设置错误回调
   */
  setErrorCallback(callback) {
    this.onError = callback
  }
}
