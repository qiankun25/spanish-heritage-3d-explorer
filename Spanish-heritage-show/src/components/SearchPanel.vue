<template>
  <div class="search-panel" :class="{ expanded: isExpanded }">
    <!-- 搜索触发按钮 -->
    <button @click="toggleSearch" class="search-trigger" :class="{ active: isExpanded }">
      <i class="icon-search"></i>
      <span v-if="!isExpanded">Search</span>
    </button>

    <!-- 搜索面板内容 -->
    <transition name="slide-down">
      <div v-if="isExpanded" class="search-content">
        <!-- 搜索输入框 -->
        <div class="search-input-container">
          <input ref="searchInput" v-model="searchQuery" @input="handleSearch" @keyup.enter="selectFirstResult"
            @keyup.escape="closeSearch" type="text" placeholder="Search monuments, hotspots or locations..."
            class="search-input" />
          <button @click="clearSearch" class="clear-btn" v-if="searchQuery">
            <i class="icon-close"></i>
          </button>
        </div>

        <!-- 搜索结果 -->
        <div v-if="searchResults.length > 0" class="search-results">
          <div class="results-header">
            <span>Found {{ searchResults.length }} results</span>
          </div>

          <div class="results-list">
            <div v-for="(result, index) in searchResults" :key="result.id" @click="selectResult(result)"
              class="result-item" :class="{ highlighted: index === highlightedIndex }">
              <div class="result-icon">
                <i :class="getResultIcon(result.type)"></i>
              </div>
              <div class="result-content">
                <div class="result-title">{{ result.title }}</div>
                <div class="result-description">{{ result.description }}</div>
                <div class="result-meta">{{ result.category }}</div>
              </div>
              <div class="result-action">
                <i class="icon-navigate"></i>
              </div>
            </div>
          </div>
        </div>

        <!-- 无结果提示 -->
        <div v-else-if="searchQuery && !isSearching" class="no-results">
          <i class="icon-no-results"></i>
          <p>No results found</p>
          <p class="suggestion">Try using different keywords</p>
        </div>

        <!-- 搜索建议 -->
        <div v-if="!searchQuery" class="search-suggestions">
          <div class="suggestions-header">Popular Searches</div>
          <div class="suggestions-list">
            <button v-for="suggestion in popularSearches" :key="suggestion"
              @click="searchQuery = suggestion; handleSearch()" class="suggestion-item">
              {{ suggestion }}
            </button>
          </div>
        </div>

        <!-- 加载状态 -->
        <div v-if="isSearching" class="search-loading">
          <div class="loading-spinner"></div>
          <span>Searching...</span>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick } from 'vue'
import { useMonumentStore } from '../stores/monument'
import { useAIGuideStore } from '../stores/aiGuide'

// Props
const props = defineProps({
  onResultSelect: {
    type: Function,
    default: null
  }
})

// Stores
const monumentStore = useMonumentStore()
const aiGuideStore = useAIGuideStore()

// 响应式数据
const isExpanded = ref(false)
const searchQuery = ref('')
const searchResults = ref([])
const isSearching = ref(false)
const highlightedIndex = ref(-1)
const searchInput = ref(null)

// 热门搜索建议
const popularSearches = ref([
  'Alhambra',
  'Sagrada Familia',
  'Alcázar of Seville',
  'Arc de Triomphe',
  'Court of Lions',
  'Islamic Architecture',
  'Gaudí Works',
  'Neoclassical'
])

// 计算属性
const currentLanguage = computed(() => aiGuideStore.currentLanguage)

// 方法
const toggleSearch = async () => {
  isExpanded.value = !isExpanded.value

  if (isExpanded.value) {
    await nextTick()
    searchInput.value?.focus()
  } else {
    clearSearch()
  }
}

const closeSearch = () => {
  isExpanded.value = false
  clearSearch()
}

const clearSearch = () => {
  searchQuery.value = ''
  searchResults.value = []
  highlightedIndex.value = -1
}

const handleSearch = async () => {
  if (!searchQuery.value.trim()) {
    searchResults.value = []
    return
  }

  isSearching.value = true

  try {
    // 模拟搜索延迟
    await new Promise(resolve => setTimeout(resolve, 300))

    const results = []

    // 搜索古迹
    const monuments = monumentStore.searchMonuments(searchQuery.value, currentLanguage.value)
    monuments.forEach(monument => {
      results.push({
        id: `monument-${monument.id}`,
        type: 'monument',
        title: monument.name[currentLanguage.value],
        description: monument.description[currentLanguage.value],
        category: 'Monument',
        data: monument
      })
    })

    // 搜索热点
    if (monumentStore.currentMonument) {
      const hotspots = monumentStore.currentMonument.interactivePoints || []
      hotspots.forEach(hotspot => {
        const title = hotspot.title[currentLanguage.value]
        const description = hotspot.description[currentLanguage.value]

        if (title.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
          description.toLowerCase().includes(searchQuery.value.toLowerCase())) {
          results.push({
            id: `hotspot-${hotspot.id}`,
            type: 'hotspot',
            title,
            description,
            category: '热点',
            data: hotspot
          })
        }
      })
    }

    searchResults.value = results
    highlightedIndex.value = results.length > 0 ? 0 : -1
  } catch (error) {
    console.error('Search error:', error)
  } finally {
    isSearching.value = false
  }
}

const selectResult = (result) => {
  console.log('Selected result:', result)

  if (props.onResultSelect) {
    props.onResultSelect(result)
  }

  // 根据结果类型执行不同操作
  if (result.type === 'monument') {
    monumentStore.loadMonument(result.data.id)
  } else if (result.type === 'hotspot') {
    monumentStore.selectHotspot(result.data.id)
  }

  closeSearch()
}

const selectFirstResult = () => {
  if (searchResults.value.length > 0) {
    selectResult(searchResults.value[0])
  }
}

const getResultIcon = (type) => {
  const icons = {
    monument: 'icon-monument',
    hotspot: 'icon-hotspot',
    location: 'icon-location'
  }
  return icons[type] || 'icon-search'
}

// 键盘导航
const handleKeyNavigation = (event) => {
  if (!isExpanded.value || searchResults.value.length === 0) return

  switch (event.key) {
    case 'ArrowDown':
      event.preventDefault()
      highlightedIndex.value = Math.min(highlightedIndex.value + 1, searchResults.value.length - 1)
      break
    case 'ArrowUp':
      event.preventDefault()
      highlightedIndex.value = Math.max(highlightedIndex.value - 1, 0)
      break
    case 'Enter':
      event.preventDefault()
      if (highlightedIndex.value >= 0) {
        selectResult(searchResults.value[highlightedIndex.value])
      }
      break
  }
}

// 监听器
watch(searchQuery, () => {
  if (searchQuery.value.trim()) {
    handleSearch()
  } else {
    searchResults.value = []
  }
})

// 全局键盘事件
document.addEventListener('keydown', handleKeyNavigation)
</script>

<style scoped>
.search-panel {
  position: relative;
  z-index: 20;
}

.search-trigger {
  padding: 10px 16px;
  background: rgba(255, 255, 255, 0.9);
  border: none;
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  transition: all 0.3s;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.search-trigger:hover {
  background: white;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.search-trigger.active {
  background: #3498db;
  color: white;
}

.search-content {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  margin-top: 8px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
  overflow: hidden;
  min-width: 400px;
}

.search-input-container {
  position: relative;
  padding: 16px;
  border-bottom: 1px solid #eee;
}

.search-input {
  width: 100%;
  padding: 12px 40px 12px 16px;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 16px;
  outline: none;
  transition: border-color 0.3s;
}

.search-input:focus {
  border-color: #3498db;
}

.clear-btn {
  position: absolute;
  right: 24px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  cursor: pointer;
  color: #666;
  font-size: 18px;
}

.search-results {
  max-height: 400px;
  overflow-y: auto;
}

.results-header {
  padding: 12px 16px;
  background: #f8f9fa;
  font-size: 14px;
  color: #666;
  border-bottom: 1px solid #eee;
}

.result-item {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  cursor: pointer;
  transition: background-color 0.2s;
  border-bottom: 1px solid #f0f0f0;
}

.result-item:hover,
.result-item.highlighted {
  background: #f8f9fa;
}

.result-icon {
  width: 40px;
  height: 40px;
  border-radius: 8px;
  background: #e3f2fd;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 12px;
  color: #1976d2;
}

.result-content {
  flex: 1;
}

.result-title {
  font-weight: 600;
  color: #333;
  margin-bottom: 4px;
}

.result-description {
  font-size: 14px;
  color: #666;
  margin-bottom: 4px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.result-meta {
  font-size: 12px;
  color: #999;
}

.result-action {
  color: #3498db;
  font-size: 18px;
}

.no-results {
  padding: 40px 16px;
  text-align: center;
  color: #666;
}

.no-results i {
  font-size: 48px;
  margin-bottom: 16px;
  opacity: 0.5;
}

.suggestion {
  font-size: 14px;
  margin-top: 8px;
}

.search-suggestions {
  padding: 16px;
}

.suggestions-header {
  font-weight: 600;
  margin-bottom: 12px;
  color: #333;
}

.suggestions-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.suggestion-item {
  padding: 6px 12px;
  background: #f0f0f0;
  border: none;
  border-radius: 16px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;
}

.suggestion-item:hover {
  background: #e0e0e0;
}

.search-loading {
  padding: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  color: #666;
}

.loading-spinner {
  width: 20px;
  height: 20px;
  border: 2px solid #f3f3f3;
  border-top: 2px solid #3498db;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

/* 过渡动画 */
.slide-down-enter-active,
.slide-down-leave-active {
  transition: all 0.3s ease;
}

.slide-down-enter-from,
.slide-down-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

/* 图标样式 */
.icon-search::before {
  content: '🔍';
}

.icon-close::before {
  content: '✕';
}

.icon-navigate::before {
  content: '→';
}

.icon-monument::before {
  content: '🏛️';
}

.icon-hotspot::before {
  content: '📍';
}

.icon-location::before {
  content: '📍';
}

.icon-no-results::before {
  content: '🔍';
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }

  100% {
    transform: rotate(360deg);
  }
}
</style>
