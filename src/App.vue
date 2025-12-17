<template>
  <div class="Topbar">
    <Topbar />
  </div>

  <main class="mainpage">
    <n-split
      direction="horizontal"
      :default-size="0.35"
      :max="0.22"
      :min="0.08"
      v-model:size="leftPaneSize"
      :resize-trigger-size="resizeTriggerSize"
      @update:size="handleSplitResize"
    >
      <template #1>
        <div class="scroll-pane left-pane-content" v-if="pagecontroler.IsLogin || pagecontroler.IsSkipLogin" key="homepage">
          <Homepage />
        </div>
        <n-message-provider v-else>
          <div class="scroll-pane To-login left-pane-content" key="tologin">
            <ToLogin />
          </div>
        </n-message-provider>
      </template>

      <template #2>
        <div class="center-content">
          <div class="scroll-pane main-view" ref="Scroll">
            <router-view v-slot="{ Component }">
              <keep-alive :include="cachedComponents">
                <component :is="Component" :key="route.fullPath" />
              </keep-alive>
            </router-view>
          </div>
        </div>
      </template>
    </n-split>

    <transition name="slide">
      <div v-show="pagecontroler.ShowPlayList" class="playlist-drawer">
        <div class="playlist-content">
          <PlayList v-if="hasPlaylistOpened" />
        </div>
      </div>
    </transition>

    <transition name="fade">
      <div
        v-show="pagecontroler.ShowPlayList"
        class="playlist-overlay"
        @click="pagecontroler.ShowPlayList = false"
      ></div>
    </transition>
  </main>

  <div class="TouchBar">
    <Touchbar />
  </div>

  <transition name="fade">
    <div v-if="pagecontroler.ShowLyric" class="global-overlay" @click="closeOverlays"></div>
  </transition>

  <transition name="slide-up">
    <div v-show="pagecontroler.ShowLyric" class="lyric-page">
      <Lyric />
    </div>
  </transition>
</template>

<script setup>
import { ref, onMounted, watch, onUnmounted, computed, shallowRef, defineAsyncComponent, nextTick } from 'vue'
import { useRoute } from 'vue-router'
import { NSplit } from 'naive-ui'
import { pagecontrol } from '@/stores/page'
import { Player } from './stores/index'
import { CheckLoginStatus } from './api/Login'

// 异步组件定义 (保持不变)
const Topbar = defineAsyncComponent(() => import('@/components/TopBar.vue'))
const Touchbar = defineAsyncComponent(() => import('./components/TouchBar.vue'))
const Homepage = defineAsyncComponent(() => import('@/components/HomePage.vue'))
const ToLogin = defineAsyncComponent(() => import('./components/ToLogin.vue'))
const PlayList = defineAsyncComponent(() => import('@/components/PlayList.vue'))
const Lyric = defineAsyncComponent(() => import('@/components/Lyric.vue'))

const pagecontroler = pagecontrol()
const route = useRoute()
const player = Player()
const Scroll = ref(null)
// 优化：使用 shallowRef 存储不需要深度响应的数组
const cachedComponents = shallowRef([
  'Musichub',
  'Lricy',
  'HighQualityMusicList',
  'banner',
  'NewMusicList',
  'SearchResult',
])

// 优化：懒加载标志位
const hasPlaylistOpened = ref(false)
// 监听播放列表打开，一旦打开过一次，就置为 true，后续使用 v-show 控制显示隐藏
watch(
  () => pagecontroler.ShowPlayList,
  (val) => {
    if (val && !hasPlaylistOpened.value) {
      hasPlaylistOpened.value = true
    }
  },
)

watch(
  () => route.fullPath,
  async () => {
    // 等待 DOM 更新（确保新页面已经渲染）
    //await nextTick()
    if (Scroll.value) {
      // 强制滚动到顶部
      Scroll.value.scrollTop = 0
    }
  }
)
// 计算属性优化 trigger size
const resizeTriggerSize = computed(() => (pagecontroler.IsFold ? 0 : 2))

// Electron IPC 处理 (保持不变)
const handleGlobaltoggle = () => player.togglePlay()
const handleGlobalnext = () => player.playNextSong()
const handleGlobalprev = () => player.playPrevSong()

const code = ref(0)

onMounted(async () => {
  // 登录检查逻辑 (保持不变)
  if (localStorage.getItem('neteaseCookie')) {
    try {
      const result = await CheckLoginStatus()
      code.value = result.data.code
      pagecontroler.IsLogin = code.value === 200
    } catch (e) {
      console.error('Login check failed:', e)
      pagecontroler.IsLogin = false
    }
  } else {
    pagecontroler.IsLogin = false
  }

  // 绑定 Electron 事件
  if (window.electronAPI) {
    window.electronAPI.getnetstatuslistener(status =>{
      pagecontroler.IsOnline = status
    })
    window.electronAPI.global_toggle(handleGlobaltoggle)
    window.electronAPI.global_next(handleGlobalnext)
    window.electronAPI.global_prev(handleGlobalprev)
  }
})

onUnmounted(() => {
  if (window.electronAPI) {
    
    window.electronAPI.remove_toggle(handleGlobaltoggle)
    window.electronAPI.remove_next(handleGlobalnext)
    window.electronAPI.remove_prev(handleGlobalprev)
  }
})

// Split Pane 逻辑优化
const leftPaneSize = ref(0.22)
const expandedSize = ref(0.2)

// 优化：分离副作用
watch(
  () => pagecontroler.IsFold,
  (isFolded) => {
    if (isFolded) {
      expandedSize.value = leftPaneSize.value > 0.09 ? leftPaneSize.value : 0.2
      leftPaneSize.value = 0
    } else {
      leftPaneSize.value = expandedSize.value
    }
  },
)

// 优化：防抖函数 (通用工具应提取)
const debounce = (fn, delay = 100) => {
  let timer = null
  return (...args) => {
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => fn(...args), delay)
  }
}

// 优化：resize 处理逻辑
// 直接响应 resize 保证流畅度，只防抖 resize 事件的分发
const triggerWindowResize = debounce(() => {
  window.dispatchEvent(new Event('resize'))
}, 200)

const handleSplitResize = (newSize) => {
  // 更新内部值 (v-model 自动处理，这里主要处理额外逻辑)
  // 仅在非折叠状态下记录尺寸
  if (!pagecontroler.IsFold) {
    expandedSize.value = newSize
  }
  // 触发全局 resize (如图表重绘)
  triggerWindowResize()
}

const closeOverlays = () => {
  pagecontroler.ShowLyric = false
}
</script>

<style scoped lang="scss">
/* 核心优化：使用 content-visibility 和 GPU 加速 */

:host {
  display: block;
  width: 100%;
  height: 100%;
  background: #1c1c1e;
}

/* 固定定位元素提升层级，使用 will-change 提示浏览器优化 */
.Topbar,
.TouchBar {
  position: fixed;
  left: 0;
  right: 0;
  z-index: 1000;
  background: #1c1c1e;
  transform: translateZ(0); /* 开启硬件加速 */
  will-change: transform;
  background: rgba(28, 28, 30, 0.65); 
  
  /* 关键点 2: 开启毛玻璃模糊效果 */
  backdrop-filter: blur(20px) saturate(180%); 
  -webkit-backdrop-filter: blur(20px) saturate(180%);
  
  /* 开启硬件加速 */
  transform: translateZ(0); 
  will-change: transform;
  
  /* 可选：添加细微的边框线增强层次感 */
  transition: background 0.3s ease;
}

.Topbar {
  top: 0;
  height: 50px;
}

.TouchBar {
  bottom: 0;
  height: 65px;
}

.mainpage {
  position: fixed;
  top: 0;
  bottom: 0;
  left: 0;
  right: 0;
  box-sizing: border-box;
  transform: translateZ(0);
}

.center-content {
  height: 100%;
  /* 优化过渡效果，只针对需要的属性 */
  transition: padding-right 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  will-change: padding-right;
}

.scroll-pane {
  height: 100%;
  padding-top: 50px;
  padding-bottom: 65px;
  overflow-y: auto;
  overflow-x: hidden;
  overscroll-behavior: contain;
  scroll-behavior: smooth;
  /* 关键优化：限制布局重排范围，并利用 content-visibility 跳过视口外渲染 */
  contain: strict;
  content-visibility: auto;
  background: #1c1c1e;

  &::-webkit-scrollbar {
    display: none;
    width: 0 !important;
    height: 0 !important;
  }
  scrollbar-width: none;
  -ms-overflow-style: none;
}

/* 抽屉优化 */
.playlist-drawer {
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  width: 360px;
  z-index: 999;
  /* 提升为合成层，避免重绘主页面 */
  will-change: transform;
  transform: translateZ(0);
  background-color: #1c1c1e; /* 确保有背景，避免透明度混合开销 */
  /* 关键点 2: 开启毛玻璃模糊效果 */
  backdrop-filter: blur(20px) saturate(180%); 
  -webkit-backdrop-filter: blur(20px) saturate(180%);
  
  /* 开启硬件加速 */
  transform: translateZ(0); 
  will-change: transform;
  
  /* 可选：添加细微的边框线增强层次感 */
  transition: background 0.3s ease;
}

.playlist-content {
  height: 100%;
  overflow-y: auto;
  overscroll-behavior: contain;
  contain: content; /* 优化滚动性能 */
  &::-webkit-scrollbar {
    display: none;
  }
  scrollbar-width: none;
}

/* 动画优化：只变换 transform 和 opacity */
.slide-enter-active,
.slide-leave-active {
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
.slide-enter-from,
.slide-leave-to {
  transform: translateX(100%);
}
.slide-enter-to,
.slide-leave-from {
  transform: translateX(0);
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.global-overlay {
  position: fixed;
  inset: 50px 0 65px 0; /* 使用 inset 简写 */
  background: rgba(0, 0, 0, 0.7);
  z-index: 1800;
  /* backdrop-filter 性能开销较大，移动端或低端设备可考虑去除 */
  backdrop-filter: blur(4px);
  transform: translateZ(0);
}

.lyric-page {
  position: fixed;
  inset: 0;
  background: #000;
  z-index: 2000;
  overflow-y: auto;
  overscroll-behavior: contain;
  /* 歌词页通常很重，给予独立层 */
  will-change: transform;
  transform: translateZ(0);
}

.slide-up-enter-active,
.slide-up-leave-active {
  transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}
.slide-up-enter-from,
.slide-up-leave-to {
  transform: translateY(100%);
}
.slide-up-enter-to,
.slide-up-leave-from {
  transform: translateY(0);
}

/* 响应式 */
@media (max-width: 768px) {
  .playlist-drawer {
    width: 100%;
    max-width: 100%;
  }
  .center-content.playlist-open {
    padding-right: 0;
  }
}
</style>
