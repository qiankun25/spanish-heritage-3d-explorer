import { defineStore } from "pinia";
import { ref, computed } from "vue";

export const useMonumentStore = defineStore("monument", () => {
  // 当前展示的古迹
  const currentMonument = ref(null);
  const monuments = ref([]);
  const isLoading = ref(false);

  // 3D模型相关状态
  const modelLoaded = ref(false);
  const modelError = ref(null);
  const interactivePoints = ref([]);

  // 用户交互状态
  const selectedHotspot = ref(null);
  const cameraPosition = ref({ x: 0, y: 5, z: 10 });
  const cameraTarget = ref({ x: 0, y: 0, z: 0 });

  // 西班牙文化古迹数据 - Updated with Sagrada Familia
  const spanishMonuments = ref([
    {
      id: "alhambra",
      name: {
        zh: "阿尔罕布拉宫",
        en: "Alhambra",
        es: "La Alhambra",
      },
      location: {
        city: "Granada",
        region: "Andalusia",
        coordinates: { lat: 37.176, lng: -3.5881 },
      },
      period: "13-14世纪",
      description: {
        zh: "格拉纳达的阿尔罕布拉宫是伊斯兰建筑艺术的杰作，展现了摩尔人精湛的建筑技艺。",
        en: "The Alhambra in Granada is a masterpiece of Islamic architecture, showcasing the exquisite architectural skills of the Moors.",
        es: "La Alhambra en Granada es una obra maestra de la arquitectura islámica, que muestra las exquisitas habilidades arquitectónicas de los moros.",
      },
      modelPath: "/models/test.glb",
      thumbnail: "/images/alhambra-thumb.jpg",
      category: "palace",
      significance: "UNESCO World Heritage Site",
      interactivePoints: [
        {
          id: "courtyard_lions",
          position: { x: 0, y: 2, z: 0 },
          title: {
            zh: "狮子庭院",
            en: "Court of Lions",
            es: "Patio de los Leones",
          },
          description: {
            zh: "著名的狮子喷泉庭院，展现了伊斯兰园林艺术的精髓",
            en: "Famous lion fountain courtyard showcasing the essence of Islamic garden art",
            es: "Famoso patio de la fuente de los leones que muestra la esencia del arte de jardines islámicos",
          },
        },
      ],
    },
    {
      id: "sagrada_familia",
      name: {
        zh: "圣家族大教堂",
        en: "Sagrada Familia",
        es: "Basílica de la Sagrada Familia",
      },
      location: {
        city: "Barcelona",
        region: "Catalonia",
        coordinates: { lat: 41.4036, lng: 2.1744 },
      },
      period: "1882年至今",
      description: {
        zh: "安东尼·高迪设计的未完成杰作，融合了哥特式和新艺术运动风格。",
        en: "An unfinished masterpiece designed by Antoni Gaudí, blending Gothic and Art Nouveau styles.",
        es: "Una obra maestra inacabada diseñada por Antoni Gaudí, que combina estilos góticos y modernistas.",
      },
      modelPath: "/models/shengjiatang.glb",
      thumbnail: "/images/sagrada-familia-thumb.jpg",
      category: "cathedral",
      significance: "UNESCO World Heritage Site",
      interactivePoints: [
        {
          id: "nativity_facade",
          position: { x: -8, y: 15, z: 5 },
          title: {
            zh: "诞生立面",
            en: "Nativity Façade",
            es: "Fachada del Nacimiento",
          },
          description: {
            zh: "高迪亲自监督建造的立面，描绘了耶稣基督的诞生故事，充满了自然主义的雕刻细节。",
            en: "The façade personally supervised by Gaudí, depicting the birth story of Jesus Christ with naturalistic sculptural details.",
            es: "La fachada supervisada personalmente por Gaudí, que representa la historia del nacimiento de Jesucristo con detalles escultóricos naturalistas.",
          },
        },
        {
          id: "passion_facade",
          position: { x: 8, y: 15, z: 5 },
          title: {
            zh: "受难立面",
            en: "Passion Façade",
            es: "Fachada de la Pasión",
          },
          description: {
            zh: "描绘耶稣受难和死亡的立面，采用了更加现代和抽象的雕刻风格。",
            en: "The façade depicting the Passion and death of Jesus, featuring more modern and abstract sculptural style.",
            es: "La fachada que representa la Pasión y muerte de Jesús, con un estilo escultórico más moderno y abstracto.",
          },
        },
        {
          id: "glory_facade",
          position: { x: 0, y: 12, z: -8 },
          title: {
            zh: "荣耀立面",
            en: "Glory Façade",
            es: "Fachada de la Gloria",
          },
          description: {
            zh: "尚未完工的主立面，将描绘耶稣的荣耀升天，是三个立面中最宏伟的一个。",
            en: "The unfinished main façade that will depict the Glory of Jesus, the most magnificent of the three façades.",
            es: "La fachada principal inacabada que representará la Gloria de Jesús, la más magnífica de las tres fachadas.",
          },
        },
        {
          id: "central_nave",
          position: { x: 0, y: 8, z: 0 },
          title: {
            zh: "中央大厅",
            en: "Central Nave",
            es: "Nave Central",
          },
          description: {
            zh: "教堂的中央空间，高迪设计的森林般的柱子支撑着拱顶，创造出独特的光影效果。",
            en: "The central space of the basilica, with Gaudí's forest-like columns supporting the vaults, creating unique light and shadow effects.",
            es: "El espacio central de la basílica, con las columnas similares a un bosque de Gaudí que sostienen las bóvedas, creando efectos únicos de luz y sombra.",
          },
        },
        {
          id: "towers",
          position: { x: 0, y: 25, z: 0 },
          title: {
            zh: "钟塔群",
            en: "Bell Towers",
            es: "Torres Campanario",
          },
          description: {
            zh: "圣家堂计划建造18座塔楼，目前已完成8座，每座都有独特的装饰和象征意义。",
            en: "The Sagrada Familia is planned to have 18 towers, with 8 currently completed, each with unique decoration and symbolic meaning.",
            es: "La Sagrada Familia está planeada para tener 18 torres, con 8 actualmente completadas, cada una con decoración única y significado simbólico.",
          },
        },
      ],
    },
    {
      id: "alcazar_seville",
      name: {
        zh: "塞维利亚王宫",
        en: "Alcázar of Seville",
        es: "Real Alcázar de Sevilla",
      },
      location: {
        city: "Seville",
        region: "Andalusia",
        coordinates: { lat: 37.383, lng: -5.9931 },
      },
      period: "10-16世纪",
      description: {
        zh: "欧洲最古老的皇宫之一，展现了穆德哈尔建筑风格的精美。",
        en: "One of the oldest royal palaces in Europe, showcasing the beauty of Mudéjar architecture.",
        es: "Uno de los palacios reales más antiguos de Europa, que muestra la belleza de la arquitectura mudéjar.",
      },
      modelPath: "/models/test.glb",
      thumbnail: "/images/alcazar-seville-thumb.jpg",
      category: "palace",
      significance: "UNESCO World Heritage Site",
    },
    {
      id: "arc_de_triomphe",
      name: {
        zh: "凯旋门",
        en: "Arc de Triomphe",
        es: "Arco del Triunfo",
      },
      location: {
        city: "Paris",
        region: "Île-de-France",
        coordinates: { lat: 48.8738, lng: 2.295 },
      },
      period: "1806-1836年",
      description: {
        zh: "巴黎凯旋门是法国新古典主义建筑的杰作，为纪念拿破仑军队的胜利而建造，是巴黎的标志性建筑之一。",
        en: "The Arc de Triomphe in Paris is a masterpiece of French neoclassical architecture, built to commemorate the victories of Napoleon's army, and is one of Paris's iconic landmarks.",
        es: "El Arco del Triunfo de París es una obra maestra de la arquitectura neoclásica francesa, construido para conmemorar las victorias del ejército de Napoleón, y es uno de los monumentos emblemáticos de París.",
      },
      modelPath: "/models/kaixuanmen.glb",
      thumbnail: "/images/arc-de-triomphe-thumb.jpg",
      category: "monument",
      significance: "National Monument of France",
      interactivePoints: [
        {
          id: "central_arch",
          position: { x: 0, y: 5, z: 0 },
          title: {
            zh: "中央拱门",
            en: "Central Arch",
            es: "Arco Central",
          },
          description: {
            zh: "凯旋门的主要拱门，高达29.19米，宽14.62米，是整个建筑的核心部分",
            en: "The main arch of the Arc de Triomphe, 29.19 meters high and 14.62 meters wide, is the core part of the entire building",
            es: "El arco principal del Arco del Triunfo, de 29,19 metros de alto y 14,62 metros de ancho, es la parte central de todo el edificio",
          },
        },
        {
          id: "relief_sculptures",
          position: { x: -3, y: 3, z: 2 },
          title: {
            zh: "浮雕雕塑",
            en: "Relief Sculptures",
            es: "Esculturas en Relieve",
          },
          description: {
            zh: "凯旋门四面都装饰有精美的浮雕，描绘了法国革命和拿破仑战争的重要场景",
            en: "All four sides of the Arc de Triomphe are decorated with exquisite reliefs depicting important scenes from the French Revolution and Napoleonic Wars",
            es: "Los cuatro lados del Arco del Triunfo están decorados con exquisitos relieves que representan escenas importantes de la Revolución Francesa y las Guerras Napoleónicas",
          },
        },
        {
          id: "eternal_flame",
          position: { x: 0, y: 0, z: 0 },
          title: {
            zh: "无名烈士墓",
            en: "Tomb of the Unknown Soldier",
            es: "Tumba del Soldado Desconocido",
          },
          description: {
            zh: "位于凯旋门下方的无名烈士墓，长明火永远燃烧，纪念在第一次世界大战中牺牲的法国士兵",
            en: "The Tomb of the Unknown Soldier beneath the Arc de Triomphe, with an eternal flame that burns forever, commemorating French soldiers who died in World War I",
            es: "La Tumba del Soldado Desconocido bajo el Arco del Triunfo, con una llama eterna que arde para siempre, conmemorando a los soldados franceses que murieron en la Primera Guerra Mundial",
          },
        },
        {
          id: "observation_deck",
          position: { x: 0, y: 8, z: 0 },
          title: {
            zh: "观景台",
            en: "Observation Deck",
            es: "Mirador",
          },
          description: {
            zh: "凯旋门顶部的观景台可以俯瞰香榭丽舍大街和巴黎市区的壮丽景色",
            en: "The observation deck at the top of the Arc de Triomphe offers magnificent views of the Champs-Élysées and Paris cityscape",
            es: "El mirador en la parte superior del Arco del Triunfo ofrece magníficas vistas de los Campos Elíseos y el paisaje urbano de París",
          },
        },
      ],
    },
  ]);

  // 计算属性
  const currentMonumentInfo = computed(() => {
    return currentMonument.value;
  });

  const availableMonuments = computed(() => {
    return spanishMonuments.value;
  });

  // 方法
  const loadMonument = async (monumentId) => {
    isLoading.value = true;
    modelError.value = null;

    try {
      const monument = spanishMonuments.value.find((m) => m.id === monumentId);
      if (!monument) {
        throw new Error("Monument not found");
      }

      currentMonument.value = monument;
      interactivePoints.value = monument.interactivePoints || [];

      // 模拟3D模型加载
      await simulateModelLoading(monument.modelPath);
      modelLoaded.value = true;
    } catch (error) {
      modelError.value = error.message;
      console.error("Failed to load monument:", error);
    } finally {
      isLoading.value = false;
    }
  };

  const simulateModelLoading = (modelPath) => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (modelPath) {
          resolve();
        } else {
          reject(new Error("Model path not found"));
        }
      }, 1500);
    });
  };

  const selectHotspot = (hotspotId) => {
    const hotspot = interactivePoints.value.find((p) => p.id === hotspotId);
    selectedHotspot.value = hotspot;

    // 移动相机到热点位置
    if (hotspot) {
      setCameraPosition(hotspot.position);
    }
  };

  const setCameraPosition = (position) => {
    cameraPosition.value = { ...position, z: position.z + 5 };
    cameraTarget.value = position;
  };

  const resetCamera = () => {
    cameraPosition.value = { x: 0, y: 5, z: 10 };
    cameraTarget.value = { x: 0, y: 0, z: 0 };
    selectedHotspot.value = null;
  };

  const getMonumentsByCategory = (category) => {
    return spanishMonuments.value.filter((m) => m.category === category);
  };

  const searchMonuments = (query, language = "en") => {
    return spanishMonuments.value.filter(
      (monument) =>
        monument.name[language].toLowerCase().includes(query.toLowerCase()) ||
        monument.location.city.toLowerCase().includes(query.toLowerCase()) ||
        monument.description[language]
          .toLowerCase()
          .includes(query.toLowerCase())
    );
  };

  // 新增方法
  const setModelLoaded = (loaded) => {
    modelLoaded.value = loaded;
    if (loaded) {
      modelError.value = null;
    }
  };

  const setModelError = (error) => {
    modelError.value = error;
    modelLoaded.value = false;
  };

  const clearModel = () => {
    modelLoaded.value = false;
    modelError.value = null;
    selectedHotspot.value = null;
  };

  return {
    // 状态
    currentMonument,
    monuments,
    isLoading,
    modelLoaded,
    modelError,
    interactivePoints,
    selectedHotspot,
    cameraPosition,
    cameraTarget,
    spanishMonuments,

    // 计算属性
    currentMonumentInfo,
    availableMonuments,

    // 方法
    loadMonument,
    selectHotspot,
    setCameraPosition,
    resetCamera,
    getMonumentsByCategory,
    searchMonuments,
    setModelLoaded,
    setModelError,
    clearModel,
  };
});
