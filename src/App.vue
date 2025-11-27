<template>
  <!-- 顶部栏 -->
  <div class="Topbar">
    <Topbar />
  </div>

  <!-- 主内容区 -->
  <main class="mainpage">
    <n-split
      direction="horizontal"
      :default-size="0.3"
      :max="0.4"
      :min="0.09"
      v-model:size="leftPaneSize"
      :resize-trigger-size="pagecontroler.IsFold ? 0 : 2"
      @update:size="onPaneResize"
    >
      <!-- Pane 1: 左侧 -->
      <template #1>
        <div class="scroll-pane" v-if="pagecontroler.IsLogin" key="homepage">
          <Homepage />
        </div>
        <n-message-provider>
          <div class="scroll-pane To-login" v-if="!pagecontroler.IsLogin" key="tologin">
            <ToLogin />
          </div>
        </n-message-provider>
      </template>

      <!-- Pane 2: 中间主内容（保持比例） -->
      <template #2>
        <div class="center-content" :class="{ 'playlist-open': pagecontroler.ShowPlayList }">
          <div class="scroll-pane">
            <router-view v-slot="{ Component }">
              <keep-alive :include="cachedComponents">
                <component :is="Component" :key="route.fullPath" />
              </keep-alive>
            </router-view>
          </div>
        </div>
      </template>
    </n-split>

    <!-- 右侧播放列表（抽屉式） -->
    <transition name="slide">
      <div v-show="pagecontroler.ShowPlayList" class="playlist-drawer">
        <div class="playlist-content">
          <PlayList />
        </div>
      </div>
    </transition>

    <!-- 遮罩层 -->
    <transition name="fade">
      <div
        v-show="pagecontroler.ShowPlayList"
        class="playlist-overlay"
        @click="pagecontroler.ShowPlayList = false"
      ></div>
    </transition>
  </main>

  <!-- 底部栏 -->
  <div class="TouchBar">
    <Touchbar />
  </div>
  <!-- ✅ 遮罩层（全局，在播放列表和歌词页面之下） -->
  <transition name="fade">
    <div v-show="pagecontroler.ShowLyric" class="global-overlay" @click="closeOverlays"></div>
  </transition>

  <!-- ✅ 歌词页面（全屏覆盖，从底部滑出） -->
  <transition name="slide-up">
    <div v-show="pagecontroler.ShowLyric" class="lyric-page">
      <Lyric></Lyric>
    </div>
  </transition>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { NSplit } from 'naive-ui'
import { pagecontrol } from '@/stores/page'
import { defineAsyncComponent } from 'vue'
const Topbar = defineAsyncComponent(() => import('@/components/TopBar.vue'))
const Touchbar = defineAsyncComponent(() => import('./components/TouchBar.vue'))
const Homepage = defineAsyncComponent(() => import('@/components/HomePage.vue'))
const ToLogin = defineAsyncComponent(() => import('./components/ToLogin.vue'))
const PlayList = defineAsyncComponent(() => import('@/components/PlayList.vue'))
const Lyric = defineAsyncComponent(() => import('@/components/Lyric.vue'))
import { CheckLoginStatus } from './api/Login'
const pagecontroler = pagecontrol()
const route = useRoute()
const cachedComponents = ref([
  'Musichub',
  'Lricy',
  'HighQualityMusicList',
  'banner',
  'NewMusicList',
  'SearchResult',
])
const code = ref(0)
onMounted(async () => {
  //登录状态验证
  if (localStorage.getItem('neteaseCookie')) {
    const result = await CheckLoginStatus()

    code.value = result.data.code
    console.log(code.value)
    if (code.value === 200) {
      pagecontroler.IsLogin = true
    } else {
      pagecontroler.IsLogin = false
    }
  } else {
    pagecontroler.IsLogin = false
  }
})
const leftPaneSize = ref(0.2) // 默认展开 20%

// 新增：保存展开时的尺寸
const expandedSize = ref(0.2)
// 监听 IsFold 变化
watch(
  () => pagecontroler.IsFold,
  (isFolded) => {
    if (isFolded) {
      // 折叠：保存当前尺寸，然后设为最小值
      expandedSize.value = leftPaneSize.value
      leftPaneSize.value = 0 // 最小值
    } else {
      // 展开：恢复保存的尺寸
      leftPaneSize.value = expandedSize.value || 0.2
    }
  },
  { immediate: true },
)
const debounce = (fn, delay = 100) => {
  let timer = null
  return (...args) => {
    timer && clearTimeout(timer)
    timer = setTimeout(() => fn(...args), delay)
  }
}
// 监听用户手动调整面板大小
const onPaneResize = debounce((newSize) => {
  // 只有在展开状态才保存用户调整的尺寸
  if (!pagecontroler.IsFold) {
    expandedSize.value = newSize
  }
  window.dispatchEvent(new Event('resize'))
}, 150)
</script>

<style scoped lang="scss">
/* ===== 基础布局不变 ===== */

:host {
  display: block;
  width: 100%;
  height: 100%;
  background: #1c1c1e;
}

.Topbar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 50px;
  z-index: 1000;
  background: #1c1c1e;
  transform: translateZ(0);
  will-change: transform;
}

.TouchBar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 65px;
  z-index: 1000;
  background: #1c1c1e;
  transform: translateZ(0);
  will-change: transform;
}

.mainpage {
  position: fixed;
  top: 50px;
  bottom: 65px;
  left: 0;
  right: 0;

  box-sizing: border-box;
  transform: translateZ(0);
}

/* 中间内容区域 - 保持比例不变 */
.center-content {

  height: 100%;
  transition: padding-right 0.3s cubic-bezier(0.4, 0, 0.2, 1); /* 平滑过渡 */
}

.center-content.playlist-open {
  padding-right: 360px; /* 播放列表宽度，保持内容不被挤压 */
}

.scroll-pane {
  height: 100%;
  overflow-y: auto;
  overflow-x: hidden;
  overscroll-behavior: contain;
  scroll-behavior: smooth;
  contain: layout style paint;
  background: #1c1c1e;
  &::-webkit-scrollbar {
    display: none;
    width: 0 !important;
    height: 0 !important;
  }
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.scroll-pane::-webkit-scrollbar {
  width: 6px;
}

.scroll-pane::-webkit-scrollbar-thumb {
  background: #ccc;
  border-radius: 3px;
}

/* ===== 抽屉式播放列表 ===== */
.playlist-drawer {
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0px;
  width: 360px; /* 固定宽度 */

  // box-shadow: -2px 0 8px rgba(0, 0, 0, 0.3);
  z-index: 999;
  contain: layout style paint;
}

.playlist-content {
  height: 100%;
  overflow-y: auto;
  overscroll-behavior: contain;
  &::-webkit-scrollbar {
    display: none;
    width: 0 !important;
    height: 0 !important;
  }
  scrollbar-width: none;
  -ms-overflow-style: none;
}

/* 滑入动画 */
.slide-enter-active,
.slide-leave-active {
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.slide-enter-from {
  transform: translateX(100%);
}

.slide-enter-to {
  transform: translateX(0);
}

.slide-leave-from {
  transform: translateX(0);
}

.slide-leave-to {
  transform: translateX(100%);
}

/* 遮罩层 */

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* 响应式调整 */
@media (max-width: 768px) {
  .playlist-drawer {
    width: 100%; /* 移动端全屏 */
    max-width: 420px;
  }

  .center-content.playlist-open {
    padding-right: 0; /* 移动端不推挤内容 */
  }
}
/* 遮罩层（全局覆盖） */
.global-overlay {
  position: fixed;
  top: 50px; /* 避开 Topbar */
  left: 0;
  right: 0;
  bottom: 65px; /* 避开 TouchBar */
  background: rgba(0, 0, 0, 0.7);
  z-index: 1800; /* 在播放列表之下 */
  backdrop-filter: blur(4px);
}

/* ✅ 歌词页面 - 全屏覆盖 */
.lyric-page {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: #000000;
  z-index: 2000; /* ✅ 最高层级，覆盖所有内容 */
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  overscroll-behavior: contain;
}

/* 从底部滑入动画 */
.slide-up-enter-active,
.slide-up-leave-active {
  transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.slide-up-enter-from {
  transform: translateY(100%);
}

.slide-up-enter-to {
  transform: translateY(0);
}

.slide-up-leave-from {
  transform: translateY(0);
}

.slide-up-leave-to {
  transform: translateY(100%);
}
</style>
