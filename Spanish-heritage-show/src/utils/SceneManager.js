import * as THREE from "three";
import { OrbitControls } from "three-stdlib";
import { GLTFLoader } from "three-stdlib";
import { DRACOLoader } from "three-stdlib";
import { gsap } from "gsap";
import { PerformanceOptimizer } from "./PerformanceOptimizer.js";
import { ErrorHandler } from "./ErrorHandler.js";

/**
 * 3D场景管理器
 * 负责Three.js场景的初始化、管理和渲染
 */
export class SceneManager {
  constructor(canvas, options = {}) {
    this.canvas = canvas;
    this.options = {
      enableShadows: true,
      enableControls: true,
      backgroundColor: 0xf0f0f0,
      cameraFov: 75,
      cameraNear: 0.1,
      cameraFar: 1000,
      ...options,
    };

    // Three.js 核心对象
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.controls = null;

    // 加载器
    this.gltfLoader = null;
    this.dracoLoader = null;

    // 状态管理
    this.isInitialized = false;
    this.animationId = null;
    this.loadedModels = new Map();
    this.interactiveObjects = [];

    // 事件回调
    this.onModelLoad = null;
    this.onModelError = null;
    this.onObjectClick = null;

    // 射线投射器（用于点击检测）
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();

    // 性能优化器和错误处理器
    try {
      this.performanceOptimizer = new PerformanceOptimizer();
      this.errorHandler = new ErrorHandler();
    } catch (error) {
      console.warn(
        "Failed to initialize performance optimizer or error handler:",
        error
      );
      this.performanceOptimizer = null;
      this.errorHandler = null;
    }

    this.init();
  }

  /**
   * 初始化3D场景
   */
  init() {
    try {
      this.createScene();
      this.createCamera();
      this.createRenderer();
      this.createLights();
      this.setupLoaders();

      if (this.options.enableControls) {
        this.createControls();
      }

      this.setupEventListeners();
      this.setupOptimization();
      this.startRenderLoop();

      this.isInitialized = true;
      console.log("SceneManager initialized successfully");
    } catch (error) {
      console.error("Failed to initialize SceneManager:", error);
      throw error;
    }
  }

  /**
   * 创建场景
   */
  createScene() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(this.options.backgroundColor);

    // 添加雾效果（可选）
    this.scene.fog = new THREE.Fog(this.options.backgroundColor, 50, 200);
  }

  /**
   * 创建相机
   */
  createCamera() {
    const aspect = this.canvas.clientWidth / this.canvas.clientHeight;
    this.camera = new THREE.PerspectiveCamera(
      this.options.cameraFov,
      aspect,
      this.options.cameraNear,
      this.options.cameraFar
    );
    this.camera.position.set(0, 5, 10);
    this.camera.lookAt(0, 0, 0);
  }

  /**
   * 创建渲染器
   */
  createRenderer() {
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      alpha: true,
    });

    this.renderer.setSize(this.canvas.clientWidth, this.canvas.clientHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    if (this.options.enableShadows) {
      this.renderer.shadowMap.enabled = true;
      this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    }

    // 启用物理正确的光照
    this.renderer.physicallyCorrectLights = true;
    this.renderer.outputEncoding = THREE.sRGBEncoding;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1;
  }

  /**
   * 创建光照系统
   */
  createLights() {
    // 环境光
    const ambientLight = new THREE.AmbientLight(0x404040, 0.4);
    this.scene.add(ambientLight);

    // 主方向光
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(10, 10, 5);
    directionalLight.castShadow = this.options.enableShadows;

    if (this.options.enableShadows) {
      directionalLight.shadow.mapSize.width = 2048;
      directionalLight.shadow.mapSize.height = 2048;
      directionalLight.shadow.camera.near = 0.5;
      directionalLight.shadow.camera.far = 50;
      directionalLight.shadow.camera.left = -10;
      directionalLight.shadow.camera.right = 10;
      directionalLight.shadow.camera.top = 10;
      directionalLight.shadow.camera.bottom = -10;
    }

    this.scene.add(directionalLight);

    // 补充光源
    const fillLight = new THREE.DirectionalLight(0xffffff, 0.3);
    fillLight.position.set(-5, 5, -5);
    this.scene.add(fillLight);
  }

  /**
   * 设置模型加载器
   */
  setupLoaders() {
    // 设置DRACO解码器
    this.dracoLoader = new DRACOLoader();
    this.dracoLoader.setDecoderPath("/draco/");

    // 设置GLTF加载器
    this.gltfLoader = new GLTFLoader();
    this.gltfLoader.setDRACOLoader(this.dracoLoader);
  }

  /**
   * 创建轨道控制器
   */
  createControls() {
    this.controls = new OrbitControls(this.camera, this.canvas);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.screenSpacePanning = false;
    this.controls.minDistance = 2;
    this.controls.maxDistance = 50;
    this.controls.maxPolarAngle = Math.PI / 2;
  }

  /**
   * 设置优化
   */
  setupOptimization() {
    try {
      // 优化渲染器
      if (this.performanceOptimizer) {
        this.performanceOptimizer.optimizeRenderer(this.renderer);
        // 开始性能监控
        this.performanceOptimizer.startMonitoring();
      }

      // 设置错误处理回调
      if (this.errorHandler) {
        this.errorHandler.setErrorCallback((error) => {
          if (this.onModelError) {
            this.onModelError(error);
          }
        });
      }

      console.log("Optimization setup completed");
    } catch (error) {
      console.error("Failed to setup optimization:", error);
    }
  }

  /**
   * 设置事件监听器
   */
  setupEventListeners() {
    // 窗口大小变化
    window.addEventListener("resize", this.handleResize.bind(this));

    // 鼠标点击事件
    this.canvas.addEventListener("click", this.handleClick.bind(this));

    // 鼠标移动事件（用于悬停效果）
    this.canvas.addEventListener("mousemove", this.handleMouseMove.bind(this));
  }

  /**
   * 处理窗口大小变化
   */
  handleResize() {
    if (!this.camera || !this.renderer) return;

    const width = this.canvas.clientWidth;
    const height = this.canvas.clientHeight;

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  /**
   * 处理鼠标点击事件
   */
  handleClick(event) {
    this.updateMousePosition(event);

    this.raycaster.setFromCamera(this.mouse, this.camera);
    const intersects = this.raycaster.intersectObjects(
      this.interactiveObjects,
      true
    );

    if (intersects.length > 0) {
      const clickedObject = intersects[0].object;
      if (this.onObjectClick) {
        this.onObjectClick(clickedObject, intersects[0]);
      }
    }
  }

  /**
   * 处理鼠标移动事件
   */
  handleMouseMove(event) {
    this.updateMousePosition(event);

    this.raycaster.setFromCamera(this.mouse, this.camera);
    const intersects = this.raycaster.intersectObjects(
      this.interactiveObjects,
      true
    );

    // 更新鼠标样式
    this.canvas.style.cursor = intersects.length > 0 ? "pointer" : "default";
  }

  /**
   * 更新鼠标位置
   */
  updateMousePosition(event) {
    const rect = this.canvas.getBoundingClientRect();
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
  }

  /**
   * 开始渲染循环
   */
  startRenderLoop() {
    const animate = () => {
      this.animationId = requestAnimationFrame(animate);

      if (this.controls) {
        this.controls.update();
      }

      this.renderer.render(this.scene, this.camera);
    };

    animate();
  }

  /**
   * 停止渲染循环
   */
  stopRenderLoop() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }

  /**
   * 加载GLB模型
   */
  async loadModel(url, options = {}) {
    return new Promise((resolve, reject) => {
      // 检查是否已经加载过
      if (this.loadedModels.has(url)) {
        const model = this.loadedModels.get(url).clone();
        resolve(model);
        return;
      }

      this.gltfLoader.load(
        url,
        (gltf) => {
          const model = gltf.scene;

          // 处理模型
          this.processModel(model, options);

          // 缓存模型
          this.loadedModels.set(url, model.clone());

          // 添加到场景
          this.scene.add(model);

          if (this.onModelLoad) {
            this.onModelLoad(model, gltf);
          }

          resolve(model);
        },
        (progress) => {
          // 加载进度回调
          console.log(
            "Loading progress:",
            (progress.loaded / progress.total) * 100 + "%"
          );
        },
        (error) => {
          console.error("Error loading model:", error);
          if (this.onModelError) {
            this.onModelError(error);
          }
          reject(error);
        }
      );
    });
  }

  /**
   * 处理加载的模型
   */
  processModel(model, options = {}) {
    const {
      scale = 1,
      position = { x: 0, y: 0, z: 0 },
      rotation = { x: 0, y: 0, z: 0 },
      enableShadows = this.options.enableShadows,
      makeInteractive = false,
    } = options;

    // 设置模型变换
    model.scale.setScalar(scale);
    model.position.set(position.x, position.y, position.z);
    model.rotation.set(rotation.x, rotation.y, rotation.z);

    // 遍历模型的所有子对象
    model.traverse((child) => {
      if (child.isMesh) {
        // 启用阴影
        if (enableShadows) {
          child.castShadow = true;
          child.receiveShadow = true;
        }

        // 添加到交互对象列表
        if (makeInteractive) {
          this.interactiveObjects.push(child);
        }
      }
    });

    // 自动调整模型大小和位置
    this.fitModelToView(model);
  }

  /**
   * 自动调整模型以适应视图
   */
  fitModelToView(model) {
    const box = new THREE.Box3().setFromObject(model);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());

    // 将模型居中
    model.position.sub(center);

    // 调整相机位置以适应模型
    const maxDim = Math.max(size.x, size.y, size.z);
    const distance = maxDim * 2;

    if (this.controls) {
      this.controls.target.copy(center);
      this.controls.update();
    }
  }

  /**
   * 销毁场景管理器
   */
  dispose() {
    this.stopRenderLoop();

    // 停止性能监控
    if (this.performanceOptimizer) {
      this.performanceOptimizer.stopMonitoring();
    }

    // 移除事件监听器
    window.removeEventListener("resize", this.handleResize.bind(this));
    this.canvas.removeEventListener("click", this.handleClick.bind(this));
    this.canvas.removeEventListener(
      "mousemove",
      this.handleMouseMove.bind(this)
    );

    // 使用性能优化器清理资源
    if (this.performanceOptimizer && this.scene && this.renderer) {
      this.performanceOptimizer.cleanupResources(this.scene, this.renderer);
    }

    // 清理Three.js对象
    if (this.controls) {
      this.controls.dispose();
    }

    if (this.renderer) {
      this.renderer.dispose();
    }

    if (this.dracoLoader) {
      this.dracoLoader.dispose();
    }

    // 清理场景中的所有对象
    while (this.scene.children.length > 0) {
      const child = this.scene.children[0];
      this.scene.remove(child);

      if (child.geometry) {
        child.geometry.dispose();
      }

      if (child.material) {
        if (Array.isArray(child.material)) {
          child.material.forEach((material) => material.dispose());
        } else {
          child.material.dispose();
        }
      }
    }

    this.loadedModels.clear();
    this.interactiveObjects = [];

    console.log("SceneManager disposed");
  }
}
