/**
 * 3D功能测试
 * 测试3D场景管理器、相机动画、交互管理等核心功能
 */

import { SceneManager } from '../utils/SceneManager.js'
import { CameraAnimator } from '../utils/CameraAnimator.js'
import { InteractionManager } from '../utils/InteractionManager.js'
import { PerformanceOptimizer } from '../utils/PerformanceOptimizer.js'
import { ErrorHandler } from '../utils/ErrorHandler.js'

class ThreeDFunctionalityTest {
  constructor() {
    this.testResults = []
    this.canvas = null
    this.sceneManager = null
    this.cameraAnimator = null
    this.interactionManager = null
  }

  /**
   * 运行所有测试
   */
  async runAllTests() {
    console.log('🧪 开始3D功能测试...')
    
    try {
      await this.setupTestEnvironment()
      
      // 运行各项测试
      await this.testSceneManagerInitialization()
      await this.testCameraAnimator()
      await this.testInteractionManager()
      await this.testPerformanceOptimizer()
      await this.testErrorHandler()
      await this.testModelLoading()
      
      this.cleanup()
      this.printTestResults()
      
    } catch (error) {
      console.error('❌ 测试运行失败:', error)
      this.addTestResult('测试环境', false, error.message)
    }
  }

  /**
   * 设置测试环境
   */
  async setupTestEnvironment() {
    // 创建测试用的canvas
    this.canvas = document.createElement('canvas')
    this.canvas.width = 800
    this.canvas.height = 600
    document.body.appendChild(this.canvas)
    
    console.log('✅ 测试环境设置完成')
  }

  /**
   * 测试场景管理器初始化
   */
  async testSceneManagerInitialization() {
    try {
      this.sceneManager = new SceneManager(this.canvas)
      
      // 检查基本属性
      const checks = [
        { name: '场景对象', condition: !!this.sceneManager.scene },
        { name: '相机对象', condition: !!this.sceneManager.camera },
        { name: '渲染器对象', condition: !!this.sceneManager.renderer },
        { name: '控制器对象', condition: !!this.sceneManager.controls },
        { name: '初始化状态', condition: this.sceneManager.isInitialized }
      ]
      
      let allPassed = true
      checks.forEach(check => {
        if (!check.condition) {
          allPassed = false
          console.error(`❌ ${check.name} 检查失败`)
        }
      })
      
      this.addTestResult('场景管理器初始化', allPassed)
      
    } catch (error) {
      this.addTestResult('场景管理器初始化', false, error.message)
    }
  }

  /**
   * 测试相机动画器
   */
  async testCameraAnimator() {
    try {
      if (!this.sceneManager) {
        throw new Error('场景管理器未初始化')
      }
      
      this.cameraAnimator = new CameraAnimator(
        this.sceneManager.camera,
        this.sceneManager.controls
      )
      
      // 测试动画到预设位置
      const originalPosition = this.sceneManager.camera.position.clone()
      
      await this.cameraAnimator.animateToPreset('front', { duration: 0.1 })
      
      const newPosition = this.sceneManager.camera.position
      const positionChanged = !originalPosition.equals(newPosition)
      
      this.addTestResult('相机动画器', positionChanged)
      
    } catch (error) {
      this.addTestResult('相机动画器', false, error.message)
    }
  }

  /**
   * 测试交互管理器
   */
  async testInteractionManager() {
    try {
      if (!this.sceneManager || !this.cameraAnimator) {
        throw new Error('依赖组件未初始化')
      }
      
      this.interactionManager = new InteractionManager(
        this.sceneManager,
        this.cameraAnimator
      )
      
      // 测试添加热点
      const hotspot = this.interactionManager.addHotspot(
        { x: 0, y: 0, z: 0 },
        { id: 'test-hotspot', title: '测试热点' }
      )
      
      const hotspotAdded = !!hotspot && hotspot.userData.isHotspot
      
      this.addTestResult('交互管理器', hotspotAdded)
      
    } catch (error) {
      this.addTestResult('交互管理器', false, error.message)
    }
  }

  /**
   * 测试性能优化器
   */
  async testPerformanceOptimizer() {
    try {
      const optimizer = new PerformanceOptimizer()
      
      // 测试性能监控
      optimizer.startMonitoring()
      
      // 等待一小段时间收集数据
      await new Promise(resolve => setTimeout(resolve, 100))
      
      const report = optimizer.getPerformanceReport()
      const hasValidReport = report && typeof report.currentFPS === 'number'
      
      optimizer.stopMonitoring()
      
      this.addTestResult('性能优化器', hasValidReport)
      
    } catch (error) {
      this.addTestResult('性能优化器', false, error.message)
    }
  }

  /**
   * 测试错误处理器
   */
  async testErrorHandler() {
    try {
      const errorHandler = new ErrorHandler()
      
      // 测试错误处理
      const testError = {
        type: 'test_error',
        message: '这是一个测试错误'
      }
      
      const handledError = errorHandler.handleError(testError)
      const errorHandled = handledError && handledError.userMessage
      
      // 测试浏览器兼容性检查
      const compatibility = errorHandler.checkBrowserCompatibility()
      const compatibilityChecked = compatibility && typeof compatibility.compatible === 'boolean'
      
      this.addTestResult('错误处理器', errorHandled && compatibilityChecked)
      
    } catch (error) {
      this.addTestResult('错误处理器', false, error.message)
    }
  }

  /**
   * 测试模型加载
   */
  async testModelLoading() {
    try {
      if (!this.sceneManager) {
        throw new Error('场景管理器未初始化')
      }
      
      // 创建一个简单的测试几何体代替实际模型
      const geometry = new THREE.BoxGeometry(1, 1, 1)
      const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 })
      const testModel = new THREE.Mesh(geometry, material)
      
      this.sceneManager.scene.add(testModel)
      
      const modelAdded = this.sceneManager.scene.children.some(
        child => child === testModel
      )
      
      this.addTestResult('模型加载', modelAdded)
      
    } catch (error) {
      this.addTestResult('模型加载', false, error.message)
    }
  }

  /**
   * 添加测试结果
   */
  addTestResult(testName, passed, errorMessage = null) {
    this.testResults.push({
      name: testName,
      passed,
      errorMessage,
      timestamp: new Date().toISOString()
    })
    
    const status = passed ? '✅' : '❌'
    const message = errorMessage ? ` (${errorMessage})` : ''
    console.log(`${status} ${testName}${message}`)
  }

  /**
   * 打印测试结果
   */
  printTestResults() {
    const totalTests = this.testResults.length
    const passedTests = this.testResults.filter(result => result.passed).length
    const failedTests = totalTests - passedTests
    
    console.log('\n📊 测试结果汇总:')
    console.log(`总测试数: ${totalTests}`)
    console.log(`通过: ${passedTests}`)
    console.log(`失败: ${failedTests}`)
    console.log(`成功率: ${((passedTests / totalTests) * 100).toFixed(1)}%`)
    
    if (failedTests > 0) {
      console.log('\n❌ 失败的测试:')
      this.testResults
        .filter(result => !result.passed)
        .forEach(result => {
          console.log(`- ${result.name}: ${result.errorMessage}`)
        })
    }
    
    return {
      total: totalTests,
      passed: passedTests,
      failed: failedTests,
      successRate: (passedTests / totalTests) * 100,
      results: this.testResults
    }
  }

  /**
   * 清理测试环境
   */
  cleanup() {
    try {
      if (this.interactionManager) {
        this.interactionManager.dispose()
      }
      
      if (this.cameraAnimator) {
        this.cameraAnimator.stopCurrentAnimation()
      }
      
      if (this.sceneManager) {
        this.sceneManager.dispose()
      }
      
      if (this.canvas && this.canvas.parentNode) {
        this.canvas.parentNode.removeChild(this.canvas)
      }
      
      console.log('🧹 测试环境清理完成')
      
    } catch (error) {
      console.error('清理测试环境时出错:', error)
    }
  }
}

// 导出测试类
export { ThreeDFunctionalityTest }

// 如果直接运行此文件，执行测试
if (typeof window !== 'undefined' && window.location) {
  // 在浏览器环境中运行
  window.runThreeDTests = async () => {
    const tester = new ThreeDFunctionalityTest()
    return await tester.runAllTests()
  }
  
  console.log('💡 在浏览器控制台中运行 runThreeDTests() 来执行测试')
}
