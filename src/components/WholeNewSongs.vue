<template>
  <div class="playlist-page" @scroll="handleScroll">
    <div v-if="isLoading" class="loading-state">
      <div class="loading-spinner"></div>
      <p>正在加载...</p>
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
              <div class="song-artist">
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
              <div class="more-container" @dblclick.stop>
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

                    <div
                      class="menu-item has-submenu"
                      @click.stop="toggleSubmenu('playlist')"
                      :class="{ 'is-active': openSubmenuId === 'playlist' }"
                    >
                      <div class="menu-content">
                        <svg
                          viewBox="0 0 24 24"
                          width="16"
                          height="16"
                          fill="none"
                          stroke="currentColor"
                          stroke-width="2"
                        >
                          <path d="M19 11H5m14-6H5m9 12H5"></path>
                          <path d="M17 17v6m3-3h-6"></path>
                        </svg>
                        <span>收藏到歌单</span>
                        <span class="arrow" :class="{ rotate: openSubmenuId === 'playlist' }"
                          >›</span
                        >
                      </div>

                      <transition name="fade">
                        <div class="submenu" v-show="openSubmenuId === 'playlist'" @click.stop>
                          <div class="submenu-scroll">
                            <div
                              v-for="list in myPlaylists"
                              :key="list.id"
                              class="menu-item"
                              @click.stop="addToPlaylist(list.id, song.id)"
                            >
                              <span>{{ list.name }}</span>
                            </div>
                            <div v-if="myPlaylists.length === 0" class="empty-tip">暂无歌单</div>
                          </div>
                        </div>
                      </transition>
                    </div>

                    <div class="menu-item" @click="handleMenuAction('detail', song)">
                      <svg viewBox="0 0 24 24" width="16" height="16">
                        <path
                          d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"
                          fill="currentColor"
                        />
                      </svg>
                      <span>评论</span>
                    </div>
                  </div>
                </transition>
              </div>
              <button class="action-btn like" @click.stop="handleMenuAction('like', song)">
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

        <div v-if="isLoadingMore" class="loading-more">
          <div class="loading-spinner small"></div>
          <span>正在加载更多...</span>
        </div>
        <div v-if="!hasMore && songs.length > 0" class="no-more-data">没有更多歌曲了</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { Player } from '@/stores/index'
import { userInfo } from '@/stores/userInfo' // 引入 userInfo
import type { SongItem } from '@/stores/index'
import { GetRecommendNewMusic, GetUserMusicList } from '@/api/GetMusicList'
import { AddToLike, AddToMyList } from '@/api/GetMusic' // 引入操作API

const player = Player()
const userInfos = userInfo()
const router = useRouter()

// --- 状态控制 ---
const isLoading = ref(false)
const isLoadingMore = ref(false)
const hasMore = ref(true)
const offset = ref(0)
const limit = 50
const isWholeListMode = ref(false)

const songs = ref<SongItem[]>([])
const currentSongId = computed(() => player.currentSong || null)

// --- 菜单相关状态 ---
const activeMenuId = ref<number | null>(null)
const openSubmenuId = ref<string | null>(null) // 二级菜单状态
const myPlaylists = ref<any[]>([]) // 用户歌单

// 加载初始数据
async function loadPlaylistData() {
  isLoading.value = true
  isWholeListMode.value = false
  hasMore.value = true
  offset.value = 0

  try {
    const res = await GetRecommendNewMusic({ limit: 50 })

    songs.value = (res.result || []).map((item: any) => ({
      id: item.id,
      name: item.name,
      alias: item.song.alias?.[0] || item.song.transName || '',
      artists: item.song.artists.map((ar: any) => ({ id: ar.id, name: ar.name })),
      album: item.song.album.name,
      cover: item.picUrl,
      duration: Math.floor(item.song.duration / 1000),
    }))
  } catch (err) {
    console.error('加载新歌失败:', err)
  } finally {
    isLoading.value = false
  }
}

// 加载更多数据（无限滚动）
async function loadWholelistData(loadMore = false) {
  if (isLoading.value || isLoadingMore.value) return
  if (loadMore && !hasMore.value) return

  if (!loadMore) {
    offset.value = 0
    hasMore.value = true
    songs.value = []
    isWholeListMode.value = true
    isLoading.value = true
  } else {
    isLoadingMore.value = true
  }

  try {
    const res = await GetRecommendNewMusic({ offset: offset.value, limit: limit })
    const rawList = res.result || []

    const newItems = rawList.map((item: any) => ({
      id: item.id,
      name: item.name,
      alias: item.song.alias?.[0] || item.song.transName || '',
      artists: item.song.artists.map((ar: any) => ({ id: ar.id, name: ar.name })),
      album: item.song.album.name,
      cover: item.picUrl,
      duration: Math.floor(item.song.duration / 1000),
    }))

    const existingIds = new Set(songs.value.map((s) => s.id))
    const uniqueNewItems = newItems.filter((item: SongItem) => !existingIds.has(item.id))

    if (uniqueNewItems.length === 0) {
      hasMore.value = false
    } else {
      songs.value = [...songs.value, ...uniqueNewItems]
      offset.value += limit
      if (rawList.length < limit) {
        hasMore.value = false
      }
    }
  } catch (error) {
    console.error('获取新歌失败', error)
  } finally {
    isLoading.value = false
    isLoadingMore.value = false
  }
}

// 滚动监听
function handleScroll(e: Event) {
  if (!isWholeListMode.value) return
  const target = e.target as HTMLElement
  const { scrollTop, scrollHeight, clientHeight } = target
  if (scrollHeight - scrollTop - clientHeight < 100) {
    if (!isLoadingMore.value && hasMore.value) {
      loadWholelistData(true)
    }
  }
}

// 生命周期
onMounted(async () => {
  loadWholelistData(false)
  document.addEventListener('click', closeMenu)

  // 获取用户创建的歌单
  if (userInfos.userId) {
    try {
      const res: any = await GetUserMusicList(userInfos.userId)
      myPlaylists.value = (res.playlist || []).filter(
        (p: any) => p.creator.userId === userInfos.userId,
      )
    } catch (e) {
      console.error('获取歌单失败', e)
    }
  }
})

onUnmounted(() => {
  document.removeEventListener('click', closeMenu)
})

// --- 辅助函数 ---
function formatTime(s: number) {
  const m = Math.floor(s / 60)
    .toString()
    .padStart(2, '0')
  const sc = (s % 60).toString().padStart(2, '0')
  return `${m}:${sc}`
}

const playSong = async (song: SongItem, index: number) => {
  player.playFM = false
  player.playnormal = true
  player.nextSongUrl = null
  await player.addWholePlaylist(songs.value.map((s) => s.id))
  await player.playcurrentSong(song.id)
  player.loadPlaylistData()
}

const TurnIn = (artistid: number) => {
  router.push({ name: 'artist', params: { id: artistid } })
}

// --- 菜单控制逻辑 ---

const toggleMenu = (id: number) => {
  if (activeMenuId.value === id) {
    closeMenu()
  } else {
    activeMenuId.value = id
    openSubmenuId.value = null
  }
}

const toggleSubmenu = (key: string) => {
  if (openSubmenuId.value === key) {
    openSubmenuId.value = null
  } else {
    openSubmenuId.value = key
  }
}

const closeMenu = () => {
  activeMenuId.value = null
  openSubmenuId.value = null
}

const addToPlaylist = async (pid: number, songId: number) => {
  try {
    const res: any = await AddToMyList({ op: 'add', listid: pid, songid: songId })
    if (res.body.code === 200) console.log('添加成功')
  } catch (error) {
    console.error(error)
  }
  closeMenu()
}

const handleMenuAction = async (action: string, song: SongItem) => {
  if (action === 'playlist') return

  closeMenu()

  switch (action) {
    case 'next':
      await player.addSongToPlaylist(song.id, player.currentSongIndex + 1)
      player.nextSongUrl = null
      break
    case 'like':
      try {
        const res: any = await AddToLike({ id: song.id, like: 'true' })
        if (res.code === 200) console.log('已喜欢')
      } catch (e) {
        console.error(e)
      }
      break
    case 'detail':
      // 跳转到评论
      router.push({ name: 'comment', params: { id: song.id } })
      break
  }
}
</script>

<style scoped lang="scss">
$bg-color: #1c1c1e;
$item-hover: rgba(255, 255, 255, 0.06);
$text-main: #e0e0e0;
$text-sub: #888888;
$primary: #0bdc9a;
$menu-bg: #1c1c1e; 
$menu-hover: #3a3a3a;

.playlist-page {
  padding: 30px;
  background-color: $bg-color;
  min-height: 100vh;
  padding-bottom: 160px;
  color: $text-main;
  border-radius: 30px;
  font-family:
    -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  user-select: none;
  overflow-y: auto;
  height: 100vh;
  overscroll-behavior: contain;
  &::-webkit-scrollbar {
    display: none;
    width: 0 !important;
    height: 0 !important;
  }
  scrollbar-width: none;
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
    }

    .song-artist {
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

/* 更多操作容器 */
.more-container {
  flex-shrink: 0;
  opacity: 1;
  transition: opacity 0.2s ease;
  position: relative; // 关键

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
    .is-active & {
      color: #fff;
    }
    svg {
      width: 100%;
      height: 100%;
      display: block;
    }
  }
}

/* --- 下拉菜单样式 (复刻 NewSongs) --- */
.dropdown-menu {
  position: absolute;
  top: 100%;
  right: 0;
  width: 160px;
  /* 使用 $menu-bg 配合 rgba */
  background-color: rgba($menu-bg, 0.6);
  border-radius: 8px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.6);
  padding: 6px;
  z-index: 100;
  margin-top: 4px;
  border: 1px solid rgba(255, 255, 255, 0.05);
  overflow: visible !important;

  /* 模糊特效 */
  backdrop-filter: blur(20px) saturate(180%);
  -webkit-backdrop-filter: blur(20px) saturate(180%);
  transition: background 0.3s ease;
}

.menu-item {
  display: flex;
  align-items: center;
  padding: 10px 12px;
  border-radius: 4px;
  cursor: pointer;
  color: #ddd;
  font-size: 13px;
  transition: background-color 0.2s;
  position: relative;

  &:hover,
  &.is-active {
    background-color: $menu-hover;
    color: #fff;
  }
  svg {
    margin-right: 10px;
    opacity: 0.8;
    flex-shrink: 0;
  }
}

/* 二级菜单内容 */
.menu-content {
  display: flex;
  align-items: center;
  width: 100%;
}
.arrow {
  margin-left: auto;
  font-size: 16px;
  color: #888;
  line-height: 1;
  transition: transform 0.2s ease;
  &.rotate {
    transform: rotate(90deg);
  }
}

/* 二级菜单本体 */
.submenu {
  position: absolute;
  top: -4px;
  right: 100%;
  margin-right: 8px;
  width: 180px;
  background-color: rgba($menu-bg, 0.5);
  border-radius: 8px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.6);
  border: 1px solid rgba(255, 255, 255, 0.05);
  z-index: 101;
  padding: 6px;

  backdrop-filter: blur(20px) saturate(180%);
  -webkit-backdrop-filter: blur(20px) saturate(180%);
}

.submenu-scroll {
  max-height: 280px;
  overflow-y: auto;
  &::-webkit-scrollbar {
    width: 4px;
  }
  &::-webkit-scrollbar-thumb {
    background: #444;
    border-radius: 2px;
  }
}

.submenu .menu-item {
  padding: 8px 12px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  display: block;
}

.empty-tip {
  padding: 10px;
  text-align: center;
  color: #666;
  font-size: 12px;
}

.loading-more,
.no-more-data {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  color: $text-sub;
  font-size: 13px;
  gap: 10px;
}

.loading-more .loading-spinner.small {
  width: 16px;
  height: 16px;
  border-width: 2px;
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

@keyframes bounce {
  0%,
  100% {
    transform: scaleY(0.6);
  }
  50% {
    transform: scaleY(1);
  }
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

@media (max-width: 768px) {
  .list-header {
    display: none;
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
