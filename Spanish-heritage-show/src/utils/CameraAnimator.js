import { gsap } from 'gsap'
import * as THREE from 'three'

/**
 * 相机动画管理器
 * 使用GSAP实现平滑的相机动画效果
 */
export class CameraAnimator {
  constructor(camera, controls = null) {
    this.camera = camera
    this.controls = controls
    this.isAnimating = false
    this.currentTween = null
    
    // 默认动画配置
    this.defaultDuration = 2
    this.defaultEase = "power2.inOut"
  }

  /**
   * 动画到指定位置
   */
  animateToPosition(targetPosition, targetLookAt = null, options = {}) {
    return new Promise((resolve) => {
      if (this.isAnimating) {
        this.stopCurrentAnimation()
      }

      const {
        duration = this.defaultDuration,
        ease = this.defaultEase,
        onUpdate = null,
        onComplete = null
      } = options

      this.isAnimating = true

      // 当前相机位置
      const startPosition = {
        x: this.camera.position.x,
        y: this.camera.position.y,
        z: this.camera.position.z
      }

      // 目标位置
      const endPosition = {
        x: targetPosition.x,
        y: targetPosition.y,
        z: targetPosition.z
      }

      // 如果有控制器，同时动画控制器的目标
      let startTarget = null
      let endTarget = null
      
      if (this.controls && targetLookAt) {
        startTarget = {
          x: this.controls.target.x,
          y: this.controls.target.y,
          z: this.controls.target.z
        }
        endTarget = {
          x: targetLookAt.x,
          y: targetLookAt.y,
          z: targetLookAt.z
        }
      }

      // 创建GSAP时间线
      const timeline = gsap.timeline({
        onComplete: () => {
          this.isAnimating = false
          if (onComplete) onComplete()
          resolve()
        }
      })

      // 相机位置动画
      timeline.to(startPosition, {
        duration,
        ease,
        x: endPosition.x,
        y: endPosition.y,
        z: endPosition.z,
        onUpdate: () => {
          this.camera.position.set(
            startPosition.x,
            startPosition.y,
            startPosition.z
          )
          
          if (onUpdate) onUpdate()
        }
      })

      // 控制器目标动画（如果存在）
      if (this.controls && targetLookAt) {
        timeline.to(startTarget, {
          duration,
          ease,
          x: endTarget.x,
          y: endTarget.y,
          z: endTarget.z,
          onUpdate: () => {
            this.controls.target.set(
              startTarget.x,
              startTarget.y,
              startTarget.z
            )
            this.controls.update()
          }
        }, 0) // 同时开始
      } else if (targetLookAt) {
        // 没有控制器时直接设置相机朝向
        timeline.call(() => {
          this.camera.lookAt(targetLookAt.x, targetLookAt.y, targetLookAt.z)
        })
      }

      this.currentTween = timeline
    })
  }

  /**
   * 围绕目标旋转动画
   */
  animateOrbit(center, radius, startAngle = 0, endAngle = Math.PI * 2, options = {}) {
    return new Promise((resolve) => {
      if (this.isAnimating) {
        this.stopCurrentAnimation()
      }

      const {
        duration = this.defaultDuration * 2,
        ease = "none",
        height = this.camera.position.y,
        onUpdate = null,
        onComplete = null
      } = options

      this.isAnimating = true

      const animationData = { angle: startAngle }

      this.currentTween = gsap.to(animationData, {
        duration,
        ease,
        angle: endAngle,
        onUpdate: () => {
          const x = center.x + Math.cos(animationData.angle) * radius
          const z = center.z + Math.sin(animationData.angle) * radius
          
          this.camera.position.set(x, height, z)
          this.camera.lookAt(center.x, center.y, center.z)
          
          if (this.controls) {
            this.controls.target.copy(center)
            this.controls.update()
          }
          
          if (onUpdate) onUpdate()
        },
        onComplete: () => {
          this.isAnimating = false
          if (onComplete) onComplete()
          resolve()
        }
      })
    })
  }

  /**
   * 缩放动画（通过改变相机位置实现）
   */
  animateZoom(targetDistance, center = null, options = {}) {
    return new Promise((resolve) => {
      if (this.isAnimating) {
        this.stopCurrentAnimation()
      }

      const {
        duration = this.defaultDuration,
        ease = this.defaultEase,
        onUpdate = null,
        onComplete = null
      } = options

      this.isAnimating = true

      // 计算当前距离和方向
      const lookAtTarget = center || (this.controls ? this.controls.target : new THREE.Vector3(0, 0, 0))
      const direction = new THREE.Vector3()
        .subVectors(this.camera.position, lookAtTarget)
        .normalize()

      const currentDistance = this.camera.position.distanceTo(lookAtTarget)
      const targetPosition = new THREE.Vector3()
        .copy(lookAtTarget)
        .add(direction.multiplyScalar(targetDistance))

      // 执行位置动画
      this.animateToPosition(targetPosition, lookAtTarget, {
        duration,
        ease,
        onUpdate,
        onComplete: () => {
          this.isAnimating = false
          if (onComplete) onComplete()
          resolve()
        }
      })
    })
  }

  /**
   * 平滑过渡到预设视角
   */
  animateToPreset(presetName, options = {}) {
    const presets = {
      front: {
        position: { x: 0, y: 5, z: 15 },
        lookAt: { x: 0, y: 0, z: 0 }
      },
      back: {
        position: { x: 0, y: 5, z: -15 },
        lookAt: { x: 0, y: 0, z: 0 }
      },
      left: {
        position: { x: -15, y: 5, z: 0 },
        lookAt: { x: 0, y: 0, z: 0 }
      },
      right: {
        position: { x: 15, y: 5, z: 0 },
        lookAt: { x: 0, y: 0, z: 0 }
      },
      top: {
        position: { x: 0, y: 20, z: 0 },
        lookAt: { x: 0, y: 0, z: 0 }
      },
      isometric: {
        position: { x: 10, y: 10, z: 10 },
        lookAt: { x: 0, y: 0, z: 0 }
      }
    }

    const preset = presets[presetName]
    if (!preset) {
      console.warn(`Camera preset "${presetName}" not found`)
      return Promise.resolve()
    }

    return this.animateToPosition(preset.position, preset.lookAt, options)
  }

  /**
   * 聚焦到对象
   */
  focusOnObject(object, options = {}) {
    const {
      distance = 10,
      offset = { x: 0, y: 2, z: 0 },
      ...animationOptions
    } = options

    // 计算对象的包围盒
    const box = new THREE.Box3().setFromObject(object)
    const center = box.getCenter(new THREE.Vector3())
    const size = box.getSize(new THREE.Vector3())

    // 添加偏移
    center.add(new THREE.Vector3(offset.x, offset.y, offset.z))

    // 计算合适的距离
    const maxDim = Math.max(size.x, size.y, size.z)
    const finalDistance = distance || maxDim * 2

    // 计算相机位置（保持当前角度）
    const direction = new THREE.Vector3()
      .subVectors(this.camera.position, center)
      .normalize()
    
    const targetPosition = new THREE.Vector3()
      .copy(center)
      .add(direction.multiplyScalar(finalDistance))

    return this.animateToPosition(targetPosition, center, animationOptions)
  }

  /**
   * 摇摆动画（用于吸引注意力）
   */
  animateShake(intensity = 0.5, duration = 0.5) {
    if (this.isAnimating) return Promise.resolve()

    return new Promise((resolve) => {
      this.isAnimating = true

      const originalPosition = {
        x: this.camera.position.x,
        y: this.camera.position.y,
        z: this.camera.position.z
      }

      const timeline = gsap.timeline({
        onComplete: () => {
          this.isAnimating = false
          resolve()
        }
      })

      // 创建摇摆效果
      for (let i = 0; i < 4; i++) {
        timeline.to(this.camera.position, {
          duration: duration / 8,
          x: originalPosition.x + (Math.random() - 0.5) * intensity,
          y: originalPosition.y + (Math.random() - 0.5) * intensity,
          z: originalPosition.z + (Math.random() - 0.5) * intensity,
          ease: "power2.inOut"
        })
      }

      // 回到原位置
      timeline.to(this.camera.position, {
        duration: duration / 4,
        x: originalPosition.x,
        y: originalPosition.y,
        z: originalPosition.z,
        ease: "power2.out"
      })

      this.currentTween = timeline
    })
  }

  /**
   * 停止当前动画
   */
  stopCurrentAnimation() {
    if (this.currentTween) {
      this.currentTween.kill()
      this.currentTween = null
    }
    this.isAnimating = false
  }

  /**
   * 检查是否正在动画
   */
  getIsAnimating() {
    return this.isAnimating
  }

  /**
   * 设置默认动画参数
   */
  setDefaults(duration, ease) {
    if (duration !== undefined) this.defaultDuration = duration
    if (ease !== undefined) this.defaultEase = ease
  }
}
