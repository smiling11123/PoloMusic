<template>
  <!-- 顶部栏 -->
  <div class="Topbar">
    <Topbar />
  </div>

  <!-- 主内容区 -->
  <main class="mainpage">
    <n-split
      direction="horizontal"
      :default-size="0.2"
      :max="0.33"
      :min="0.15"
      :resize-trigger-size="2"
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
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRoute } from 'vue-router'
import { NSplit } from 'naive-ui'
import { pagecontrol } from '@/stores/page'
import { defineAsyncComponent } from 'vue'
import Login from '@/components/Login.vue'
const Topbar = defineAsyncComponent(() => import('@/components/topbar.vue'))
const Touchbar = defineAsyncComponent(() => import('./components/touchbar.vue'))
const Homepage = defineAsyncComponent(() => import('@/components/homepage.vue'))
const ToLogin = defineAsyncComponent(() => import('./components/ToLogin.vue'))
const PlayList = defineAsyncComponent(() => import('@/components/playlist.vue'))

const pagecontroler = pagecontrol()
const route = useRoute()
const cachedComponents = ref(['Musichub', 'Lricypage','HighQualityMusicList', 'banner', 'NewMusicList'])

const debounce = (fn, delay = 100) => {
  let timer = null
  return (...args) => {
    timer && clearTimeout(timer)
    timer = setTimeout(() => fn(...args), delay)
  }
}

const onPaneResize = debounce(() => {
  window.dispatchEvent(new Event('resize'))
}, 150)
</script>

<style scoped>
/* ===== 基础布局不变 ===== */
.Topbar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 50px;
  z-index: 1000;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  background: #000000;
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
  box-shadow: 0 -2px 4px rgba(0, 0, 0, 0.1);
  background: #000000;
  transform: translateZ(0);
  will-change: transform;
}

.mainpage {
  position: fixed;
  top: 50px;
  bottom: 65px;
  left: 0;
  right: 0;
  padding: 0 1%;
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
  top:0;
  right: 0;
  bottom: 0px;
  width: 360px; /* 固定宽度 */
  
  box-shadow: -2px 0 8px rgba(0, 0, 0, 0.3);
  z-index: 999;
  contain: layout style paint;
}

.playlist-content {
  height: 100%;
  overflow-y: auto;
  overscroll-behavior: contain;
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
</style>