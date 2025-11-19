<template>
  <div class="Show-PlayList" v-if="store.playlist.length">
    <div class="song-list-wrapper">
      <n-list :show-divider="false" class="song-list">
        <n-list-item
          v-for="(song, index) in songs"
          :key="song.id"
          class="song-item"
          :class="{ playing: currentSongId === song.id }"
          @click="playSong(song, index)"
        >
          <!-- 序号/播放按钮 -->
          <template #prefix>
            <div class="song-index">
              <span class="index">{{ index + 1 }}</span>
              <button class="play-btn" aria-label="播放">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </button>
            </div>
          </template>

          <!-- 左侧信息区（封面+歌曲信息） -->
          <div class="leftinfo">
            <div class="song-cover">
              <img :src="song.cover + '?param=50y50'" alt="歌曲封面" />
            </div>
            <div class="song-info">
              <!-- ✅ 关键：添加 title 属性 -->
              <div class="song-title" :title="song.name">{{ song.name }}</div>
              <div class="song-artist" :title="song.artist">{{ song.artist }}</div>
            </div>
          </div>


          <!-- ✅ 关键：使用 suffix 插槽放置时长 -->
          <template #suffix>
            <div class="song-duration">{{ formatTime(song.duration) }}</div>
          </template>
        </n-list-item>
      </n-list>
    </div>
  </div>
  <div class="Inshow-PlayList" v-else>
    <p>暂无音乐列表</p>
  </div>
</template>

<script setup lang="ts">
import { Player } from '@/stores/index'
import { ref, computed, onMounted } from 'vue'
import type { Song } from '@/stores/index'
import { NList, NListItem } from 'naive-ui'

const playerStore = Player()
const store = Player()
const currentSongId = computed(() => playerStore.currentSong)

const songs = computed(() => playerStore.currentSongList)

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
    .toString()
    .padStart(2, '0')
  const s = (seconds % 60).toString().padStart(2, '0')
  return `${m}:${s}`
}

function playSong(song: Song, index: number) {
  playerStore.addWholePlaylist(songs.value.map((s) => s.id))
  playerStore.playcurrentSong(song.id)
}
</script>

<style scoped lang="scss">
// 颜色变量
$primary-color: #0bdc9a;
$bg-hover: rgba(84, 84, 84, 0.05);
$bg-playing: rgba(0, 255, 150, 0.1);
$text-primary: #ffffff;
$text-secondary: rgba(255, 255, 255, 0.7);
$transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

.song-list-wrapper {
  max-width: 960px;
  margin: 0 auto;
  padding: 0 16px;
  max-height: 100vh;
  overflow-y: auto;
  
  :deep(.n-list),
  :deep(.n-list-item) {
    background-color: transparent !important;
  }

  &::-webkit-scrollbar { width: 0; height: 0; }
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.song-list {
  user-select: none;
  :deep(.n-list-item) {
    padding: 0 !important;
    background: transparent;
    border-radius: 4px;
    margin-bottom: 4px;

    &:hover {
      background: $bg-hover;
    }

    // ✅ 关键：让 suffix 区域正常显示
    .n-list-item__suffix {
      margin-left: auto;
      flex-shrink: 0;
      padding-left: 20px; // 与左侧保持间距
    }
  }

  .song-item {
    // ✅ 关键：改用 flex 布局，更稳定可控
    display: flex !important;
    align-items: center;
    gap: 0;
    padding: 8px 12px;
    transition: $transition;
    cursor: pointer;
    position: relative;

    &.playing {
      background: linear-gradient(90deg, rgba($primary-color, 0.1) 0%, transparent 100%);
      border-left: 3px solid $primary-color;

      .song-title { color: $primary-color; font-weight: 600; }
      .index { color: $primary-color; font-weight: 600; }
    }

    // ✅ 序号区域
    :deep(.n-list-item__prefix) {
      width: 48px;
      flex-shrink: 0;
      margin-right: 0;
    }

    .song-index {
      width: 48px;
      height: 48px;
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;

      .index {
        font-size: 16px;
        color: $text-secondary;
        transition: $transition;
        position: absolute;
      }

      .play-btn {
        position: absolute;
        opacity: 0;
        background: none;
        border: none;
        color: $text-primary;
        cursor: pointer;
        padding: 8px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: $transition;
        transform: scale(0.9);

        &:hover {
          background: rgba(255, 255, 255, 0.1);
          transform: scale(1);
        }

        svg {
          width: 16px;
          height: 16px;
          filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.5));
        }
      }
    }

    &:hover .song-index {
      .index { opacity: 0; }
      .play-btn { opacity: 1; transform: scale(1); }
    }

    // ✅ 左侧信息区（封面+歌曲信息）
    .leftinfo {
      display: flex;
      align-items: center;
      gap: 12px;
      // ✅ 关键：允许收缩
      min-width: 0;
      flex: 1;
    }

    .song-cover {
      width: 44px;
      height: 44px;
      border-radius: 4px;
      overflow: hidden;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
      flex-shrink: 0;

      img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        transition: $transition;

        &:hover { transform: scale(1.05); }
      }
    }

    // ✅ 歌曲信息（歌名+歌手）
    .song-info {
      display: flex;
      flex-direction: column;
      gap: 4px;
      // ✅ 关键三重保险
      min-width: 0;          // 1. 允许flex item收缩
      max-width: 100%;       // 2. 限制最大宽度
      flex: 1;              // 3. 占据剩余空间

      .song-title {
        color: $text-primary;
        font-size: 14px;
        font-weight: 400;
        line-height: 1.4;
        // ✅ 省略号四件套
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        display: block;
        max-width: 100%;
      }

      .song-artist {
        color: $text-secondary;
        font-size: 12px;
        line-height: 1.2;
        // ✅ 省略号四件套
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        display: block;
        max-width: 100%;
      }
    }

    // 专辑
    .song-album {
      color: $text-secondary;
      font-size: 13px;
      width: 120px;
      flex-shrink: 0;
      // ✅ 关键：允许收缩
      min-width: 0;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      margin: 0 20px;
    }

    // ✅ 时长（在 suffix 插槽中）
    .song-duration {
      color: $text-secondary;
      font-size: 12px;
      font-variant-numeric: tabular-nums;
      // ❌ 移除所有绝对定位样式
      // ✅ 确保不收缩
      flex-shrink: 0;
    }
  }
}

.Inshow-PlayList {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 200px;
  color: $text-secondary;
  font-size: 14px;
}

// 响应式设计
@media (max-width: 768px) {
  .song-list .song-item {
    .leftinfo { flex: 1; }
    
    // 隐藏专辑
    .song-album { display: none !important; }
  }
}

@media (max-width: 480px) {
  .song-list .song-item {
    .song-cover {
      width: 36px;
      height: 36px;
    }

    .song-title { font-size: 13px; }
    .song-artist { font-size: 11px; }
    
    // ✅ 移除隐藏时长的规则
    .song-duration {
      font-size: 11px;
    }
  }
}
</style>