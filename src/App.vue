<template>
  <!-- 顶部栏 -->
  <div class="Topbar">
    <Topbar></Topbar>
  </div>

  <!-- 主内容区 -->
  <div class="mainpage">
    <div style="height: 100%">
      <!-- 外层：Pane 1 和右侧区域 -->
      <n-split
        direction="horizontal"
        :default-size="0.2"
        :max="0.33"
        :min="0.15"
        :resize-trigger-size="1"
      >
        <!-- Pane 1: 左侧，最多 1/3 -->
        <template #1>
          <div class="scroll-pane">
            <Homepage></Homepage>
          </div>
        </template>

        <!-- 右侧区域 -->
        <template #2>
          <!-- 内层：Pane 2 和 Pane 3 -->
          <n-split direction="horizontal" :default-size="0.8" :min="0.5" :max="0.85" v-if="pagecontroler.ShowPlayList">
            <!-- Pane 2: 中间，最小 1/3，最大 2/3 -->
            <template #1>
              <div class="scroll-pane">
                <router-view></router-view>
              </div>
            </template>

            <!-- Pane 3: 右侧，可隐藏 -->
            <template #2 >
              <div class="Lricy">
                <PlayList></PlayList>
              </div>
            </template>
          </n-split>
          <div v-else class="scroll-pane">
            <RouterView></RouterView>
          </div>

        </template>
      </n-split>
    </div>
  </div>

  <!-- 底部栏 -->
  <div class="TouchBar">
    <Touchbar></Touchbar>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { NButton, NIcon } from 'naive-ui'
import Homepage from '@/components/homepage.vue'
import Lricypage from '@/components/lricypage.vue'
import Musichub from '@/components/musichub.vue'
import Topbar from '@/components/topbar.vue'
import Touchbar from './components/touchbar.vue'
import MusicList from './components/MusicList.vue'
import { pagecontrol } from './stores/page'
import PlayList from '@/components/playlist.vue'
const pagecontroler = pagecontrol()
</script>

<style scoped>
.Topbar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 50px;
  z-index: 1000;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  background: #000000;
}

.TouchBar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 50px;
  z-index: 1000;
  box-shadow: 0 -2px 4px rgba(0, 0, 0, 0.1);
  background: #000000;
}

.mainpage {
  position: fixed;
  top: 50px;
  bottom: 50px;
  left: 0;
  right: 0;
  padding: 0 1%; /* 左右留边 */
  box-sizing: border-box;
}

/* 独立滚动面板样式 */
.scroll-pane {
  height: 100%;
  overflow-y: auto;
  overflow-x: hidden;
}

/* Pane 3 容器样式 */
.pane3-wrapper {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.pane3-header {
  padding: 10px;

  display: flex;
  justify-content: flex-end;
}

.pane3-collapsed {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}
.Lricy {
  height: 100%;
  transition: opacity 0.3s ease;
}
/* 美化滚动条 */
:deep(.scroll-pane::-webkit-scrollbar) {
  width: 6px;
}

:deep(.scroll-pane::-webkit-scrollbar-thumb) {
  background: #ccc;
  border-radius: 3px;
}

:deep(.scroll-pane::-webkit-scrollbar-thumb:hover) {
  background: #999;
}
</style>
