<template>
  <div class="Show-PlayList" v-if="player.playlist.length">
    <div class="song-list-wrapper">
      <draggable
        v-model="playlistData"
        item-key="id"
        tag="ul"
        class="song-list"
        animation="300"
        ghost-class="ghost-item"
        handle=".draggable-btn"
      >
        <template #item="{ element: song, index }">
          <li class="song-item" :class="{ playing: currentSongId === song.id }">
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
                    @click.stop="TurnIn(artist.id)"
                  >
                    {{ artist.name }}<span v-if="index as any < song.artists.length - 1"> / </span>
                  </span>
                </div>
              </div>
              <div class="remove">
                <button class="remove-btn" @click="player.removeSongFromPlaylist(song.id)">
                  <svg
                    t="1764587886144"
                    class="icon"
                    viewBox="0 0 1024 1024"
                    version="1.1"
                    xmlns="http://www.w3.org/2000/svg"
                    p-id="3545"
                    width="15"
                    height="15"
                  >
                    <path
                      d="M514.816 53.312h-2.752c-21.504 0-39.808 0-55.04 1.408a116.672 116.672 0 0 0-45.568 12.352c-5.76 3.008-11.2 6.528-16.32 10.496a116.608 116.608 0 0 0-30.144 36.352c-7.552 13.248-15.168 29.888-24.128 49.536l-17.856 39.232H128a32 32 0 0 0 0 64h32V832A160 160 0 0 0 320 992h384a160 160 0 0 0 160-160V266.688h32a32 32 0 0 0 0-64h-190.912l-20.992-43.264c-9.152-18.944-16.896-35.008-24.576-47.744a116.608 116.608 0 0 0-30.208-35.072 117.376 117.376 0 0 0-16.064-10.112 116.608 116.608 0 0 0-44.736-11.84c-14.784-1.28-32.64-1.28-53.696-1.28zM800 266.688V832a96 96 0 0 1-96 96H320A96 96 0 0 1 224 832V266.688h576z m-166.016-64h-240.64l5.184-11.456c9.664-21.184 16.064-35.2 22.016-45.568a54.144 54.144 0 0 1 13.568-17.28 53.312 53.312 0 0 1 7.424-4.8 54.144 54.144 0 0 1 21.312-5.12c11.968-1.088 27.328-1.152 50.624-1.152 22.72 0 37.76 0 49.344 1.088 11.072 0.96 16.704 2.752 20.928 4.928 2.56 1.28 4.992 2.88 7.36 4.608 3.776 2.816 7.808 7.168 13.504 16.64 6.016 10.048 12.608 23.488 22.528 43.968l6.848 14.08z"
                      fill="#fff"
                      p-id="3546"
                    ></path>
                  </svg>
                </button>
              </div>
              <div class="duration">{{ formatTime(song.duration) }}</div>
              <div class="draggable" title="拖动">
                <button class="draggable-btn">
                  <svg
                    t="1764585483030"
                    class="icon"
                    viewBox="0 0 1024 1024"
                    version="1.1"
                    xmlns="http://www.w3.org/2000/svg"
                    p-id="2529"
                    width="15"
                    height="15"
                  >
                    <path
                      d="M153.6 237.056a32.256 32.256 0 0 1 0-64h716.8a32.256 32.256 0 0 1 0 64z m0 307.2a32.256 32.256 0 0 1 0-64h716.8a32.256 32.256 0 0 1 0 64z m0 307.2a32.256 32.256 0 0 1 0-64h716.8a32.256 32.256 0 0 1 0 64z"
                      fill="#fff"
                      p-id="2530"
                    ></path>
                  </svg>
                </button>
              </div>
            </div>
          </li>
        </template>
      </draggable>
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
import draggable from 'vuedraggable'
import type { SongItem } from '@/stores/index'

const router = useRouter()
const player = Player()

const currentSongId = computed(() => player.currentSong)

const playlistData = computed({
  get: () => player.currentSongList,

  set: (newArray: SongItem[]) => {
    player.nextSongUrl = null
    player.currentSongList = newArray

    player.playlist = newArray.map((s) => s.id)
  },
})

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
  player.nextSongUrl = null
  player.playcurrentSong(song.id)
}
const TurnIn = (artistid: any) => {
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

.ghost-item {
  opacity: 0.5;
  background: rgba(255, 255, 255, 0.05);
  border: 1px dashed rgba(255, 255, 255, 0.3);
}

.Show-PlayList {
  width: 100%;
  height: 100%;
  padding-top: 50px;
  padding-bottom: 65px;
  background-color: #1c1c1e;
  color: $text-main;
  /* 关键点 2: 开启毛玻璃模糊效果 */
  backdrop-filter: blur(20px) saturate(180%); 
  -webkit-backdrop-filter: blur(20px) saturate(180%);
  
  /* 开启硬件加速 */
  transform: translateZ(0); 
  will-change: transform;
  
  /* 可选：添加细微的边框线增强层次感 */
  transition: background 0.3s ease;
}

// --- 滚动容器 ---
.song-list-wrapper {
  max-width: 100%;
  height: 100%;
  padding: 0 8px;
  user-select: none;
  overflow-y: auto;
  overflow-x: hidden;

  &::-webkit-scrollbar {
    display: none;
    width: 0 !important;
    height: 0 !important;
  }
  scrollbar-width: none;
  -ms-overflow-style: none;
}

// --- 列表样式 ---
.song-list {
  list-style: none;
  margin: 0;
  padding: 0;
  width: 100%;
}

// --- 列表项样式 (保持原样) ---
.song-item {
  display: block;
  width: 100%;
  padding: 0;
  background: transparent;
  border-radius: $radius;
  margin-bottom: 4px;
  margin-top: 4px;
  transition:
    background-color 0.2s ease,
    transform 0.1s;
  cursor: auto;

  &:hover {
    background-color: $bg-hover;
    .item-content {
      .index-container .index-num {
        opacity: 0.8;
      }
      .cover-container .play-mask {
        opacity: 1;
      }
    }
    .remove-btn{
      opacity: 1;
    }
  }

  &.playing {
    background-color: $bg-active;
    .remove-btn {
      opacity: 1;
    }
    .song-title {
      color: $primary-color;
      font-weight: 600;
    }
    .index-num {
      display: none;
    }
  }
}

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
  cursor: pointer;
  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
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
.draggable {
  padding-left: 8px;
  padding-right: 2px;
}
.draggable-btn {
  background: none;
  width: 25px;
  height: 25px;
  border: none;
  color: #fff;
  cursor: grab;
  border-radius: 8px;
  transition: color 0.2s;
  -webkit-app-region: no-drag;
  &:hover {
    background-color: rgba(255, 255, 255, 0.1);
  }
  &:active {
    cursor: grabbing;
  }
}

.remove-btn{
  background: none;
  opacity: 0;
  width: 25px;
  height: 25px;
  border: none;
  color: #fff;
  border-radius: 8px;
  transition: color 0.2s;
  -webkit-app-region: no-drag;
  &:hover {
    background-color: rgba(255, 255, 255, 0.1);
    
  }
  
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
