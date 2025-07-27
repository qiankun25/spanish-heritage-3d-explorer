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

  // 西班牙文化古迹数据
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
      modelPath: "/models/test.glb",
      thumbnail: "/images/sagrada-familia-thumb.jpg",
      category: "cathedral",
      significance: "UNESCO World Heritage Site",
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

  const searchMonuments = (query, language = "zh") => {
    return spanishMonuments.value.filter(
      (monument) =>
        monument.name[language].toLowerCase().includes(query.toLowerCase()) ||
        monument.location.city.toLowerCase().includes(query.toLowerCase()) ||
        monument.description[language]
          .toLowerCase()
          .includes(query.toLowerCase())
    );
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
  };
});
