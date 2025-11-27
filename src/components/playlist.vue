<template>
  <div class="Show-PlayList" v-if="player.playlist.length">
    <div class="song-list-wrapper">
      <ul class="song-list">
        <li
          v-for="(song, index) in songs"
          :key="song.id"
          class="song-item"
          :class="{ playing: currentSongId === song.id }"
        >
          <div class="item-content">
            <div class="index-container">
              <span class="index-num" v-if="currentSongId !== song.id">{{ index + 1 }}</span>
              <div class="playing-icon" v-else><span></span><span></span><span></span></div>
            </div>

            <div class="cover-container" @click="playSong(song, index)">
              <img :src="song.cover + '?param=60y60'" alt="cover" loading="lazy" />
              <div class="play-mask">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </div>
            </div>

            <div class="info-container">
              <div class="song-title" :title="song.name">
                {{ truncateText(song.name, 9) }}
              </div>

              <div class="song-meta">
                <span
                  v-for="(artist, index) in song.artists"
                  :key="artist.id"
                  @click="TurnIn(artist.id)"
                >
                  {{ artist.name }}<span v-if="index < song.artists.length - 1"> / </span>
                </span>
              </div>
            </div>

            <div class="duration">{{ formatTime(song.duration) }}</div>
          </div>
        </li>
      </ul>
    </div>
  </div>

  <div class="Inshow-PlayList" v-else>
    <div class="empty-state">
      <p>暂无播放列表</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Player } from '@/stores/index'
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import type { SongItem } from '@/stores/index'

const playerStore = Player()
const router = useRouter()
const player = Player()
const currentSongId = computed(() => playerStore.currentSong)
const songs = computed(() => playerStore.currentSongList)

function truncateText(text: string, maxLength: number): string {
  if (!text) return ''
  return text.length > maxLength ? text.slice(0, maxLength) + '...' : text
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
    .toString()
    .padStart(2, '0')
  const s = (seconds % 60).toString().padStart(2, '0')
  return `${m}:${s}`
}

function playSong(song: SongItem, index: number) {
  //playerStore.addWholePlaylist(songs.value.map((s) => s.id))
  playerStore.nextSongUrl = null
  playerStore.playcurrentSong(song.id)
}
const TurnIn = (artistid) => {
  router.push({ name: 'artist', params: { id: artistid } })
}
</script>

<style scoped lang="scss">
// --- 变量定义 ---
$primary-color: #0bdc9a;
$bg-hover: rgba(255, 255, 255, 0.08);
$bg-active: rgba(255, 255, 255, 0.12);
$text-main: #ffffff;
$text-sub: rgba(255, 255, 255, 0.5);
$text-hover: #ffffff;
$radius: 10px;
$bg-dark: #1c1c1e;
.Show-PlayList {
  width: 100%;
  height: 100%;
  background-color: $bg-dark; // 强制深色背景
  color: $text-main; // 确保文本颜色
}
// --- 滚动容器 ---
.song-list-wrapper {
  max-width: 100%;
  height: 100%;
  padding: 0 8px; // 给滚动条留一点内边距防止贴边
  user-select: none;

  // 允许 Y 轴滚动
  overflow-y: auto;
  overflow-x: hidden;

  // --- 隐藏滚动条核心代码 ---
  // Chrome, Safari, Edge
  &::-webkit-scrollbar {
    display: none;
    width: 0 !important;
    height: 0 !important;
  }
  // Firefox
  scrollbar-width: none;
  // IE
  -ms-overflow-style: none;
}

// --- 列表样式 ---
.song-list {
  // 清除原生 ul 样式
  list-style: none;
  margin: 0;
  padding: 0;
  width: 100%;
}

// --- 列表项样式 ---
.song-item {
  display: block; // 确保 li 占满一行
  width: 100%;
  padding: 0;
  background: transparent;
  border-radius: $radius;
  margin-bottom: 4px;
  margin-top: 4px;
  transition: all 0.2s ease;
  cursor: pointer; // 添加手型光标

  // 悬停效果
  &:hover {
    background-color: $bg-hover;
    .item-content {
      .index-container .index-num {
        opacity: 0.5;
      }
      .cover-container .play-mask {
        opacity: 1;
      }
    }
  }

  // 点击/激活态
  &:active {
    transform: scale(0.99);
  }

  // 播放中状态
  &.playing {
    background-color: $bg-active;

    .song-title {
      color: $primary-color;
      font-weight: 600;
    }
    .index-num {
      display: none;
    }
  }
}

// --- 内容布局 (保持原有逻辑) ---
.item-content {
  display: flex;
  align-items: center;
  padding: 10px 12px;
  width: 100%;
  height: 64px;
  box-sizing: border-box;
}

// 1. 序号
.index-container {
  width: 30px;
  margin-right: 12px;
  display: flex;
  justify-content: center;
  align-items: center;
  flex-shrink: 0;

  .index-num {
    color: $text-sub;
    font-size: 14px;
    font-variant-numeric: tabular-nums;
  }

  .playing-icon {
    display: flex;
    align-items: flex-end;
    height: 14px;
    gap: 2px;
    span {
      width: 2px;
      background-color: $primary-color;
      animation: sound-wave 1s infinite ease-in-out;
      &:nth-child(1) {
        height: 60%;
        animation-delay: 0s;
      }
      &:nth-child(2) {
        height: 100%;
        animation-delay: 0.2s;
      }
      &:nth-child(3) {
        height: 50%;
        animation-delay: 0.4s;
      }
    }
  }
}

@keyframes sound-wave {
  0%,
  100% {
    height: 30%;
  }
  50% {
    height: 100%;
  }
}

// 2. 封面
.cover-container {
  width: 44px;
  height: 44px;
  border-radius: 6px;
  overflow: hidden;
  position: relative;
  flex-shrink: 0;
  margin-right: 16px;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2);

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block; // 消除图片底部幽灵间隙
  }

  .play-mask {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.4);
    display: flex;
    justify-content: center;
    align-items: center;
    opacity: 0;
    transition: opacity 0.2s ease;

    svg {
      width: 20px;
      height: 20px;
      color: #fff;
      filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));
    }
  }
}

// 3. 信息区
.info-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  min-width: 0;
  gap: 4px;

  .song-title {
    color: $text-main;
    font-size: 15px;
    font-weight: 500;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .song-meta {
    display: flex;
    align-items: center;
    font-size: 12px;
    color: $text-sub;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    span {
      cursor: pointer;
      &:hover {
        color: $text-main;
      }
    }
    .artist {
      &:hover {
        color: $text-hover;
        cursor: pointer;
        text-decoration: underline;
      }
    }
  }
}

// 4. 时长
.duration {
  font-size: 13px;
  color: $text-sub;
  font-variant-numeric: tabular-nums;
  margin-left: 16px;
  flex-shrink: 0;
}

// --- 空状态 ---
.Inshow-PlayList {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 300px;

  .empty-state {
    text-align: center;
    color: $text-sub;
    p {
      margin: 0;
    }
  }
}

// --- 响应式 ---
@media (max-width: 600px) {
  .item-content {
    padding: 8px;
    height: 60px;
  }
  .cover-container {
    width: 40px;
    height: 40px;
    margin-right: 12px;
  }
}
</style>
