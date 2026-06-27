<template>
  <div class="playlist-page">
    <div v-if="isInitLoading" class="loading-state">
      <div class="loading-spinner"></div>
      <p>正在加载歌单信息...</p>
    </div>

    <div v-else>
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
              <div class="artist-name">
                <span
                  v-for="(artist, index) in song.artists"
                  :key="artist.id"
                  @click.stop="TurnIn(artist.id)"
                >
                  {{ artist.name }}<span v-if="index < song.artists.length - 1"> / </span>
                </span>
              </div>
            </div>

            <div class="album-info" :title="song.album">
              {{ song.album }}
            </div>

            <div class="right-actions">
              <div class="more-container">
                <button class="more" @click.stop="toggleMenu(song.id)">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                    <path
                      d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"
                    />
                  </svg>
                </button>
                <transition name="fade">
                  <div class="dropdown-menu" v-show="activeMenuId === song.id" @click.stop>
                    <div class="menu-item" @click="handleMenuAction('next', song)">
                      <svg viewBox="0 0 24 24" width="16" height="16">
                        <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" fill="currentColor" />
                      </svg>
                      <span>下一首播放</span>
                    </div>
                    <div class="menu-item" @click="handleMenuAction('like', song)">
                      <svg viewBox="0 0 24 24" width="16" height="16">
                        <path
                          d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
                          fill="currentColor"
                        />
                      </svg>
                      <span>添加到我喜欢</span>
                    </div>
                  </div>
                </transition>
              </div>
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
              <span class="song-duration">{{ formatTime(song.duration as any) }}</span>
            </div>
          </div>
        </div>

        <div ref="loadTrigger" class="load-more-trigger">
          <div v-if="isLoadingMore" class="loading-more">
            <div class="mini-spinner"></div>
            正在加载更多歌曲...
          </div>
          <div v-else-if="!hasMore && songs.length > 0" class="no-more">没有更多歌曲了</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch, onUnmounted, nextTick } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { Player } from '@/stores/index'
import type { SongItem } from '@/stores/index'
import { GetMusicFromList, GetMusicListInfo } from '@/api/GetMusicFromList'
import { GetRecnetList } from '@/api/GetMusicList'

const player = Player()
const router = useRouter()
const route = useRoute()

// 状态控制
const isInitLoading = ref(true) // 初始加载（详情）
const isLoadingMore = ref(false) // 分页加载（歌曲）
const hasMore = ref(true) // 是否还有数据
const loadTrigger = ref<HTMLElement | null>(null) // 触底 DOM
let observer: IntersectionObserver | null = null

// 分页参数
const limit = 100
const offset = ref(0)

const playlist = ref<any>({
  id: 0,
  name: '',
  coverImgUrl: '',
  description: '',
  playCount: 0,
  trackCount: 0,
  creator: null,
  updateTime: 0,
})

const songs = ref<SongItem[]>([])
const currentSongId = computed(() => player.currentSong || null)

const MusicListId = computed(() => {
  const id = route.params.id
  return Array.isArray(id) ? Number(id[0]) : Number(id)
})

const activeMenuId = ref<number | null>(null)

// 1. 初始化数据：加载歌单详情 + 第一页歌曲
async function initData() {
  isInitLoading.value = true
  // 重置状态
  songs.value = []
  offset.value = 0
  hasMore.value = true

  try {

    // 获取歌单详情
    // const res = await GetRecnetList()
    // console.log(res)
    // const pl = res.data.list

    // playlist.value = {
    //   id: pl.id,
    //   name: pl.name,
    //   coverImgUrl: pl.coverImgUrl,
    //   description: pl.description || '暂无简介',
    //   playCount: pl.playCount,
    //   trackCount: pl.trackCount,
    //   creator: pl.creator,
    //   updateTime: pl.updateTime,
    // }

    // 详情加载完后，开始加载第一页歌曲
    isInitLoading.value = false // 先显示骨架屏或移除 Loading
    await loadMoreSongs() // 手动触发第一次加载

    // 初始化 Observer
    setupIntersectionObserver()
  } catch (err) {
    console.error('加载歌单详情失败', err)
    isInitLoading.value = false
  }
}

// 2. 分页加载歌曲逻辑
async function loadMoreSongs() {
  if (isLoadingMore.value || !hasMore.value) return

  isLoadingMore.value = true
  try {
    const id = MusicListId.value

    // 注意：确保你的 GetMusicFromList 接口支持 limit 和 offset 参数
    // 如果是网易云 API，通常参数是 { id, limit, offset }
    const res = await GetRecnetList({
      limit: limit,
      offset: offset.value,
    })

    // 兼容处理：有些接口返回 songs 数组，有些在 body 里
    const newSongsRaw = res.data.list

    if (newSongsRaw.length === 0) {
      hasMore.value = false
      isLoadingMore.value = false
      return
    }

    const formattedSongs = newSongsRaw.map((track: any) => ({
      id: Number(track.resourceId),
      cover: track.data.al.picUrl,
      name: track.data.name,
      alia: track.data.alia,
      album: track.data.al?.name || '未知专辑',
      artists: track.data.ar?.map((ar: any) => ({ id: ar.id, name: ar.name })),
      duration: track.data.dt ? Math.floor(track.data.dt / 1000) : 0,
    }))

    // 追加数据
    songs.value.push(...formattedSongs)

    // 更新偏移量
    offset.value += newSongsRaw.length

    // 判断是否加载完毕
    // 方式A: 如果返回数量小于 limit，说明没数据了
    if (newSongsRaw.length < limit) {
      hasMore.value = false
    }
    // 方式B: 如果 offset 超过了 trackCount
    if (offset.value >= playlist.value.trackCount) {
      hasMore.value = false
    }
  } catch (err) {
    console.error('加载歌曲失败', err)
  } finally {
    isLoadingMore.value = false
  }
}

// 3. 设置触底监听
function setupIntersectionObserver() {
  if (observer) observer.disconnect()

  observer = new IntersectionObserver(
    (entries) => {
      // 如果 loadTrigger 可见，且还有数据，且不在加载中
      if (entries[0].isIntersecting && hasMore.value && !isLoadingMore.value) {
        loadMoreSongs()
      }
    },
    {
      rootMargin: '200px', // 距离底部 200px 时就开始加载，体验更好
    },
  )

  nextTick(() => {
    if (loadTrigger.value) {
      observer?.observe(loadTrigger.value)
    }
  })
}

// 生命周期
onMounted(() => {
  
  
  initData()
  document.addEventListener('click', closeMenu)
})

onUnmounted(() => {
  if (observer) observer.disconnect()
  document.removeEventListener('click', closeMenu)
})

// 监听路由变化（切换歌单时）
watch(
  () => MusicListId.value,
  (newId) => {
    if (newId) initData()
  },
)

// --- 辅助函数 ---
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

const playAll = async () => {
  if (songs.value.length) {
    player.playFM = false
    player.playnormal = true
    player.nextSongUrl = null
    // 注意：这里只添加了当前已加载的歌曲
    // 如果要播放全部3000首，逻辑需要调整（比如只播放当前列表，后续自动加载，或者获取所有ID）
    await player.addWholePlaylist(songs.value.map((s) => s.id))
    await player.playcurrentSong(songs.value[0].id)
    player.loadPlaylistData()
  }
}

const playSong = async (song: SongItem, index: number) => {
  player.playFM = false
  player.playnormal = true
  player.nextSongUrl = null
  // 同上，添加到播放列表的是当前已加载的歌曲
  await player.addWholePlaylist(songs.value.map((s) => s.id))
  await player.playcurrentSong(song.id)
  player.loadPlaylistData()
}

const TurnIn = (artistid: number) => {
  router.push({ name: 'artist', params: { id: artistid } })
}

const toggleMenu = (id: number) => {
  if (activeMenuId.value === id) {
    activeMenuId.value = null
  } else {
    activeMenuId.value = id
  }
}

const closeMenu = () => {
  activeMenuId.value = null
}

const handleMenuAction = async (action: string, song: SongItem) => {
  closeMenu()
  switch (action) {
    case 'next':
      await player.addSongToPlaylist(song.id, player.currentSongIndex + 1)
      player.nextSongUrl = null
      break
    case 'like':
      break
    case 'detail':
      break
  }
}
</script>

<style scoped lang="scss">
// ... 保留你原有的所有样式 ...
$bg-color: #1c1c1e;
$item-hover: rgba(255, 255, 255, 0.06);
$text-main: #e0e0e0;
$text-sub: #888888;
$primary: #0bdc9a;

.playlist-page {
  padding: 30px;
  background-color: $bg-color;
  min-height: 100vh;
  color: $text-main;
  padding-top: 60px;
  border-radius: 30px;
  font-family:
    -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 200px;

  .loading-spinner {
    width: 40px;
    height: 40px;
    border: 3px solid rgba(255, 255, 255, 0.1);
    border-top: 3px solid $text-sub;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin-bottom: 10px;
  }
}

// 底部加载更多样式
.load-more-trigger {
  padding: 20px 0;
  text-align: center;
  color: $text-sub;
  font-size: 13px;
  min-height: 50px; // 确保有高度供 Observer 检测

  .loading-more {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;

    .mini-spinner {
      width: 16px;
      height: 16px;
      border: 2px solid rgba(255, 255, 255, 0.1);
      border-top: 2px solid $primary;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }
  }

  .no-more {
    opacity: 0.5;
  }
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}


.playlist-header {
  display: flex;
  gap: 30px;
  margin-bottom: 40px;
  .cover-wrap {
    width: 200px;
    height: 200px;
    flex-shrink: 0;
    border-radius: 12px;
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
  transform: translate(0, 5px);
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
  }
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
  align-items: center;
  height: 60px;
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
  .main-info {
    flex: 2;
    display: flex;
    flex-direction: column;
    justify-content: center;
    overflow: hidden;
    margin-right: 20px;
    .song-title {
      font-size: 15px;
      color: $text-main;
      margin-bottom: 2px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      .alia {
        color: $text-sub;
        margin-left: 4px;
        font-size: 13px;
      }
    }
    .artist-name {
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
    }
  }
  .album-info {
    flex: 1;
    font-size: 13px;
    color: $text-sub;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    margin-right: 20px;
  }
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
      opacity: 0;
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
.more-container {
  flex-shrink: 0;
  opacity: 1;
  transition: opacity 0.2s ease;
  position: relative;
  .is-active & {
    opacity: 1;
  }
  .more {
    width: 30px;
    height: 30px;
    background: none;
    border: none;
    color: #888;
    cursor: pointer;
    padding: 6px;
    border-radius: 50%;
    transition: all 0.2s ease;
    &:hover {
      background: rgba(255, 255, 255, 0.1);
      color: #fff;
    }
    svg {
      width: 100%;
      height: 100%;
      display: block;
    }
  }
}
.dropdown-menu {
  position: absolute;
  top: 100%;
  right: 0;
  width: 150px;
  background-color: #1c1c1e;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
  padding: 6px;
  z-index: 100;
  margin-top: 4px;
  border: 1px solid rgba(255, 255, 255, 0.05);
  .menu-item {
    display: flex;
    align-items: center;
    padding: 10px 12px;
    border-radius: 4px;
    cursor: pointer;
    color: #ddd;
    font-size: 13px;
    transition: background-color 0.2s;
    &:hover {
      background-color: #3a3a3a;
      color: #fff;
    }
    svg {
      margin-right: 10px;
      opacity: 0.8;
    }
  }
}
.fade-enter-active,
.fade-leave-active {
  transition:
    opacity 0.2s ease,
    transform 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(-5px);
}
</style>
