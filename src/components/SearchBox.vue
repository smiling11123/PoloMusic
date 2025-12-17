<template>
  <div class="search-container" ref="containerRef">
    <span class="search-icon">
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <circle cx="11" cy="11" r="8"></circle>
        <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
      </svg>
    </span>

    <input
      type="text"
      class="search-box"
      placeholder="搜索"
      :value="modelValue"
      @input="onInput"
      @focus="handleFocus"
      @blur="handleBlur"
      @keyup.enter="onSearch"
    />

    <button v-if="modelValue" class="clear-btn" @click="clear">✕</button>

    <transition name="fade">
      <div v-if="showSuggestions && suggestionList.length > 0" class="suggestion-list">
        <div class="suggestion-header">搜索建议</div>
        <div
          v-for="(item, index) in suggestionList"
          :key="index"
          class="suggestion-item"
          @mousedown="selectSuggestion(item.keyword)"
        >
          
          <span class="item-text">{{ item.keyword }}</span>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, onUnmounted } from 'vue'
// 假设你的 api 文件路径如下，请根据实际情况调整
import { SearchSuggest } from '@/api/Search'
import { useRouter } from 'vue-router'
import { search } from '@/stores/search'
const router = useRouter()
const searcher = search()
const props = defineProps({
  modelValue: {
    type: String,
    default: '',
  },
})

const emit = defineEmits(['update:modelValue', 'search'])

// 状态定义
const suggestionList = ref([]) // 建议列表数据
const showSuggestions = ref(false) // 是否显示建议
const containerRef = ref(null) // 容器引用
let debounceTimer = null // 防抖定时器

// 输入事件
const onInput = (event) => {
  const val = event.target.value
  emit('update:modelValue', val)

  // 防抖逻辑：300ms 后再请求 API
  if (debounceTimer) clearTimeout(debounceTimer)

  if (!val.trim()) {
    suggestionList.value = []
    showSuggestions.value = false
    return
  }

  debounceTimer = setTimeout(() => {
    fetchSuggestions(val)
  }, 300)
}

// 获取搜索建议
const fetchSuggestions = async (keywords) => {
  try {
    // 调用你提供的 API
    const res = await SearchSuggest({ keywords, type: 'mobile' }) // type: 'mobile' 通常能获得更好的建议匹配

    // 注意：根据网易云/实际后端接口返回结构调整这里
    // 通常结构是 res.result.allMatch [{keyword: '...'}, ...]
    if (res.result && res.result.allMatch) {
      suggestionList.value = res.result.allMatch
      showSuggestions.value = true
    } else {
      suggestionList.value = []
    }
  } catch (error) {
    console.error('获取搜索建议失败:', error)
  }
}

// 聚焦输入框时，如果有内容则显示建议
const handleFocus = () => {
  if (props.modelValue && suggestionList.value.length > 0) {
    showSuggestions.value = true
  }
}

// 失焦处理
const handleBlur = () => {
  // 延迟隐藏，为了让 suggestion-item 的 click/mousedown 事件先触发
  // 这里使用了 @mousedown 在模板中，它优于 blur 触发，所以这里直接隐藏也没问题
  // 但为了保险，还是保留一个小延时或依靠点击逻辑
  setTimeout(() => {
    showSuggestions.value = false
  }, 200)
}

// 选中建议
const selectSuggestion = (keyword) => {
  emit('update:modelValue', keyword)
  emit('search', keyword)
  showSuggestions.value = false
}

// 回车搜索
const onSearch = () => {
  if (props.modelValue.trim()) {
    showSuggestions.value = false // 搜索时隐藏建议
    emit('search', props.modelValue)
    searcher.keyword = props.modelValue
    router.push('SearchResult')
  }
}

// 清除内容
const clear = () => {
  emit('update:modelValue', '')
  emit('search', '')
  suggestionList.value = []
  showSuggestions.value = false
}

onUnmounted(() => {
  if (debounceTimer) clearTimeout(debounceTimer)
})
</script>

<style scoped>
.search-container {
  position: relative;
  width: 200px;
  z-index: 100; /* 确保建议列表在顶层 */
}

/* 保持原有的 search-box 样式 */
.search-box {
  width: 100%;
  height: 30px;
  padding: 0 40px 0 40px;
  border: 1px solid rgba(255, 255, 255, 0.5);
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.6);
  font-size: 13px; /* 稍微调小一点字体 */
  font-weight: 600; /* 800太粗了，建议600 */
  color: #333;
  font-family:
    -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  outline: none;
  transition: all 0.3s ease;
  backdrop-filter: blur(10px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.search-box:focus {
  background: rgba(255, 255, 255, 0.9);
  border-color: rgba(255, 255, 255, 0.8);
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
}

.search-box::placeholder {
  color: #888;
  font-weight: normal;
}

/* 图标微调 */
.search-icon {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: #666;
  pointer-events: none;
  display: flex; /* 修复SVG垂直居中 */
  align-items: center;
}

.clear-btn {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  background: rgba(0, 0, 0, 0.1);
  border: none;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #555;
  font-size: 10px;
  transition: all 0.2s;
}

.clear-btn:hover {
  background: rgba(0, 0, 0, 0.3);
  color: white;
}

/* --- 新增：搜索建议列表样式 --- */
.suggestion-list {
  position: absolute;
  top: 40px; /* 在输入框下方 */
  left: 0;
  width: 100%;
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(12px);
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  border: 1px solid rgba(255, 255, 255, 0.5);
  overflow: hidden;
  padding: 8px 0;
  transform-origin: top center;
  /* 关键点 2: 开启毛玻璃模糊效果 */
  backdrop-filter: blur(20px) saturate(180%); 
  -webkit-backdrop-filter: blur(20px) saturate(180%);
  
  /* 开启硬件加速 */
  transform: translateZ(0); 
  will-change: transform;
  
  /* 可选：添加细微的边框线增强层次感 */
  transition: background 0.3s ease;
}

.suggestion-header {
  padding: 4px 12px;
  font-size: 12px;
  color: #999;
  margin-bottom: 4px;
}

.suggestion-item {
  display: flex;
  align-items: center;
  padding: 8px 12px;
  cursor: pointer;
  border-radius: 10px;
  transition: background 0.2s;
  font-size: 13px;
  color: #333;
}

.suggestion-item:hover {
  background: rgba(0, 0, 0, 0.05);
}

.item-icon {
  margin-right: 8px;
  font-size: 12px;
  opacity: 0.5;
}

.item-text {
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* 动画效果 */
.fade-enter-active,
.fade-leave-active {
  transition:
    opacity 0.2s ease,
    transform 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

/* 响应式 */
@media (max-width: 768px) {
  .search-container {
    width: 100%; /* 移动端撑满 */
    max-width: 240px;
  }
}
</style>
