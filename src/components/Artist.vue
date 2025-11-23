<template>
  <div class="playlist-page">
    <div v-if="isLoading" class="loading-state">
      <div class="loading-spinner"></div>
      <p>正在加载...</p>
    </div>

    <div v-else>
      <div class="playlist-header">
        <div class="cover-wrap">
          <img :src="ArtistDetail.coverImgUrl" alt="歌单封面" class="cover" />
        </div>

        <div class="info">
          <div class="title-row">
            <h1 class="title">{{ ArtistDetail.name }}</h1>
          </div>

          <div class="description-wrapper">
            <p class="description" :title="ArtistDetail.description">
              {{ ArtistDetail.description }}
            </p>
          </div>

          <div class="actions">
            <button size="large" @click="playAll" class="play-all-btn">
              <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
                <path d="M8 5v14l11-7z" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      <div class="song-list-container">
        <div class="list-header">
          <div class="col-cover"></div>
          <div class="col-title">标题</div>
          <div class="col-album">专辑</div>
          <div class="col-time">时长</div>
        </div>

        <div class="song-list">
          <div
            v-for="(song, index) in songs"
            :key="song.id"
            class="song-item"
            :class="{ playing: currentSongId === song.id }"
            @dblclick="playSong(song, index)"
          >
            <div class="song-index">
              <span v-if="currentSongId === song.id" class="playing-icon">
                <i></i><i></i><i></i>
              </span>
              <span v-else class="index-num">{{ index + 1 }}</span>
            </div>

            <div class="cover-container">
              <img :src="song.cover + '?param=60y60'" loading="lazy" class="cover-img" />
              <div class="play-mask" @click="playSong(song, index)">
                <svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
              </div>
            </div>

            <div class="main-info">
              <div class="song-title" :title="song.name">
                {{ song.name }}
              </div>
              <div class="song-artist" :title="song.artist">
                {{ song.artist }}
              </div>
            </div>

            <div class="album-info" :title="song.album">
              {{ song.album }}
            </div>

            <div class="right-actions">
              <button class="action-btn like">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <path
                    d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"
                  ></path>
                </svg>
              </button>
              <span class="song-duration">{{ formatTime(song.duration) }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { Player } from '@/stores/index'
import { NButton } from 'naive-ui'
import { GetMusicFromList } from '@/api/GetMusicFromList'
import type { Song, Playlist } from '@/stores/index'
import { GetArtist } from '@/api/Artist'
import { GetMusicDetail } from '@/api/GetMusic'

const playerStore = Player()
const route = useRoute()
const isLoading = ref(true)

const ArtistDetail = ref<any>({
  id: 0,
  name: '',
  coverImgUrl: '',
  description: '',
})

const songs = ref<Song[]>([])
const currentSongId = computed(() => playerStore.currentSong || null)

const ArtistId = computed(() => {
  const artistid = route.params.id
  return Array.isArray(artistid) ? Number(artistid[0]) : Number(artistid)
})

async function loadPlaylistData() {
  isLoading.value = true
  try {
    const arid = ArtistId.value
    if (!arid) return

    const res = await GetArtist(arid)
    const hotsongs = res.hotSongs
    const pl = res.artist
    const playlist = ref()
    console.log(hotsongs)
    console.log(pl)
    ArtistDetail.value = {
      id: pl.id,
      name: pl.name,
      coverImgUrl: pl.picUrl,
      description: pl.briefDesc || '暂无简介',
    }
    const songlist = hotsongs
    playlist.value = songlist.map((song: any) => ({
      id: song.id,
    }))
    const idRes: any = playlist.value
    console.log('MusicIdList response:', idRes)

    // 从响应中提取 id 列表（根据你的后端结构调整）
    let ids: number[] = []
    if (Array.isArray(idRes)) {
      ids = idRes.map((v: any) => (typeof v === 'object' ? (v.id ?? v) : v))
    } else if (Array.isArray(idRes?.ids)) {
      ids = idRes.ids.map((v: any) => (typeof v === 'object' ? (v.id ?? v) : v))
    } else if (Array.isArray(idRes?.data)) {
      ids = idRes.data.map((v: any) => (typeof v === 'object' ? (v.id ?? v) : v))
    } else if (idRes?.id) {
      ids = [idRes.id]
    }
    playlist.value = ids
    try {
      const songIds = playlist.value // 假设是 number[]
      const results = await Promise.all(
        songIds.map((id) =>
          GetMusicDetail({ ids: id }) // 单个请求
            .then((res) => res) // 提取数据
            .catch((err) => {
              console.error(`歌曲 ${id} 加载失败:`, err)
              return null // 失败时返回null
            }),
        ),
      )
      songs.value = results
        .filter(Boolean) // 移除null
        .map((song) => ({
          id: song.songs[0].id,
          name: song.songs[0].name,
          album: song.songs[0].al?.name || '未知专辑',
          artist: song.songs[0].ar?.map((a) => a.name).join('/') || '未知艺术家',
          duration: song.songs[0].dt ? Math.floor(song.songs[0].dt / 1000) : 0,
          cover: song.songs[0].al?.picUrl || '',
        }))
    } catch (error) {
      console.error('加载歌曲失败:', error)
    } finally {
    }
  } catch (err) {
    console.error(err)
  } finally {
    isLoading.value = false
  }
}

onMounted(loadPlaylistData)
watch(
  () => ArtistId.value,
  (v) => v && loadPlaylistData(),
)

function formatPlayCount(n: number) {
  if (n > 100000000) return (n / 100000000).toFixed(1) + '亿'
  if (n > 10000) return (n / 10000).toFixed(1) + '万'
  return n
}

function formatDate(timestamp: number) {
  if (!timestamp) return ''
  const date = new Date(timestamp)
  return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`
}

function formatTime(s: number) {
  const m = Math.floor(s / 60)
    .toString()
    .padStart(2, '0')
  const sc = (s % 60).toString().padStart(2, '0')
  return `${m}:${sc}`
}

function playAll() {
  if (songs.value.length) {
    playerStore.addWholePlaylist(songs.value.map((s) => s.id))
    playerStore.playcurrentSong(songs.value[0].id)
  }
}

function playSong(song: Song, index: number) {
  playerStore.addWholePlaylist(songs.value.map((s) => s.id))
  playerStore.playcurrentSong(song.id)
}
</script>

<style scoped lang="scss">
// 变量定义
$bg-color: #121212; // 你截图中的深色背景
$item-hover: rgba(255, 255, 255, 0.06);
$text-main: #e0e0e0;
$text-sub: #888888;
$primary: #0bdc9a;

.playlist-page {
  padding: 30px;
  background-color: $bg-color;
  min-height: 100vh;
  color: $text-main;
  font-family:
    -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  user-select: none;
}

// --- 头部 ---
.playlist-header {
  display: flex;
  gap: 30px;
  margin-bottom: 40px;

  .cover-wrap {
    width: 200px;
    height: 200px;
    flex-shrink: 0;
    border-radius: 50%;
    overflow: hidden;
    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.4);

    .cover {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
  }

  .info {
    flex: 1;
    display: flex;
    flex-direction: column;

    .title-row {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 12px;

      .tag {
        border: 1px solid $primary;
        color: $primary;
        font-size: 13px;
        padding: 2px 6px;
        border-radius: 4px;
      }

      .title {
        font-size: 30px;
        font-weight: 700;
        line-height: 1.2;
        margin: 0;
      }
    }

    .creator-info {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 15px;
      font-size: 13px;
      color: $text-sub;

      .avatar {
        width: 24px;
        height: 24px;
        border-radius: 50%;
      }
      .name {
        color: #ccc;
        cursor: pointer;
        &:hover {
          color: #fff;
        }
      }
    }

    .description-wrapper {
      flex: 1;
      .description {
        font-size: 14px;
        color: $text-sub;
        line-height: 1.6;
        display: -webkit-box;
        -webkit-line-clamp: 3;
        -webkit-box-orient: vertical;
        overflow: hidden;
      }
    }

    .actions {
      display: flex;
      align-items: center;
      gap: 20px;
      margin-top: 15px;

      .stats-text {
        font-size: 13px;
        color: $text-sub;
      }
    }
  }
}
.play-all-btn {
  bottom: 12px;
  right: 12px;
  width: 50px;
  height: 50px;
  background: rgba(255, 255, 255, 0.2);
  color: #fff;
  border: none;
  border-radius: 50%;
  transform: translate(0, 5px); // 默认向下偏移一点
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);

  &:hover {
    transform: scale(1) !important;
    background: rgba(255, 255, 255, 0.2);
  }
  &:active {
    transform: scale(0.95) !important;
  }
}
// --- 列表部分 ---
.song-list-container {
  max-width: 100%;
}

.list-header {
  display: flex;
  padding: 0 10px 10px 10px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  margin-bottom: 10px;
  font-size: 13px;
  color: $text-sub;

  .col-cover {
    width: 80px;
  } // 包含序号宽 + 封面宽
  .col-title {
    flex: 2;
  }
  .col-album {
    flex: 1;
  }
  .col-time {
    width: 80px;
    text-align: right;
  }
}

.song-list {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.song-item {
  display: flex;
  align-items: center; // 关键：垂直居中
  height: 60px; // 固定高度，防止太高
  padding: 0 10px;
  border-radius: 6px;
  transition: all 0.2s;
  cursor: default;

  &:hover {
    background-color: $item-hover;

    .cover-container .play-mask {
      opacity: 1;
    }
    .right-actions .action-btn {
      opacity: 1;
    }
  }

  &.playing {
    background-color: rgba($primary, 0.1);

    .song-title {
      color: $primary;
    }
    .index-num {
      color: $primary;
    }
  }

  // 1. 序号
  .song-index {
    width: 30px;
    text-align: center;
    color: $text-sub;
    font-size: 14px;
    flex-shrink: 0;
    margin-right: 10px;

    .playing-icon {
      display: flex;
      align-items: flex-end;
      justify-content: center;
      gap: 2px;
      height: 14px;
      i {
        width: 2px;
        background: $primary;
        animation: bounce 1s infinite ease-in-out;
        &:nth-child(1) {
          height: 6px;
          animation-delay: 0s;
        }
        &:nth-child(2) {
          height: 10px;
          animation-delay: 0.1s;
        }
        &:nth-child(3) {
          height: 8px;
          animation-delay: 0.2s;
        }
      }
    }
  }

  // 2. 封面
  .cover-container {
    width: 40px;
    height: 40px;
    border-radius: 4px;
    overflow: hidden;
    position: relative;
    flex-shrink: 0;
    margin-right: 15px;

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .play-mask {
      position: absolute;
      inset: 0;
      background: rgba(0, 0, 0, 0.4);
      display: flex;
      align-items: center;
      justify-content: center;
      opacity: 0;
      cursor: pointer;
      color: #fff;
      svg {
        width: 18px;
        height: 18px;
      }
    }
  }

  // 3. 歌名 + 歌手
  .main-info {
    flex: 2; // 占据主要空间
    display: flex;
    flex-direction: column;
    justify-content: center;
    overflow: hidden; // 必须，否则无法省略
    margin-right: 20px;

    .song-title {
      font-size: 15px;
      color: $text-main;
      margin-bottom: 2px;
      white-space: nowrap; // 不换行
      overflow: hidden;
      text-overflow: ellipsis;

      .alia {
        color: $text-sub;
        margin-left: 4px;
        font-size: 13px;
      }
    }

    .song-artist {
      font-size: 12px;
      color: $text-sub;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
  }

  // 4. 专辑
  .album-info {
    flex: 1;
    font-size: 13px;
    color: $text-sub;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    margin-right: 20px;
  }

  // 5. 右侧操作
  .right-actions {
    width: 80px;
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 15px;
    flex-shrink: 0;

    .action-btn {
      background: none;
      border: none;
      color: $text-sub;
      cursor: pointer;
      opacity: 0; // 默认隐藏
      padding: 4px;
      &:hover {
        color: #fff;
      }
    }

    .song-duration {
      font-size: 13px;
      color: #666;
      font-variant-numeric: tabular-nums;
    }
  }
}

// 动画
@keyframes bounce {
  0%,
  100% {
    transform: scaleY(0.6);
  }
  50% {
    transform: scaleY(1);
  }
}

// 移动端适配
@media (max-width: 768px) {
  .list-header {
    display: none;
  }
  .playlist-header {
    flex-direction: column;
    align-items: center;
    text-align: center;
  }

  .song-item {
    .album-info {
      display: none;
    }
    .song-index {
      width: 20px;
      font-size: 12px;
      margin-right: 5px;
    }
    .cover-container {
      margin-right: 10px;
    }
    .main-info {
      margin-right: 10px;
    }
  }
}
</style>
