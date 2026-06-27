<template>
  <div class="playlist-page" @scroll="handleScroll">
    <div class="bg-blur" :style="{ backgroundImage: `url(${ArtistDetail.coverImgUrl})` }"></div>

    <div v-if="isLoading" class="loading-state">
      <div class="loading-spinner"></div>
      <p>正在加载...</p>
    </div>

    <div v-else class="content-wrapper">
      <div class="artist-header">
        <div class="cover-wrap">
          <img :src="ArtistDetail.coverImgUrl + '?param=500y500'" class="cover" />
        </div>

        <div class="info">
          <div class="title-row">
            <h1 class="title">{{ ArtistDetail.name }}</h1>
            <span v-if="ArtistDetail.transNames" class="alias">{{ ArtistDetail.transNames }}</span>
          </div>

          <div class="stats-row">
            <span class="stat-item" v-if="ArtistDetail.musicSize">
              单曲: {{ ArtistDetail.musicSize }}
            </span>
            <span class="stat-item" v-if="ArtistDetail.albumSize">
              专辑: {{ ArtistDetail.albumSize }}
            </span>
            <span class="stat-item" v-if="ArtistDetail.mvSize">
              MV: {{ ArtistDetail.mvSize }}
            </span>
          </div>

          <div class="description-wrapper">
            <p class="description" :title="ArtistDetail.description">
              {{ ArtistDetail.description }}
            </p>
          </div>

          <div class="actions">
            <button class="btn-primary" @click="playAll">
              <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
                <path d="M8 5v14l11-7z" />
              </svg>
              播放热门
            </button>
            <button class="btn-secondary" @click="loadWholelistData(false)">所有歌曲</button>
          </div>
        </div>
      </div>

      <div class="nav-tabs">
        <div
          class="tab-item"
          :class="{ active: currentTab === 'songs' }"
          @click="currentTab = 'songs'"
        >
          热门歌曲
        </div>
        <div
          class="tab-item"
          :class="{ active: currentTab === 'albums' }"
          @click="switchTab('albums')"
        >
          专辑 EP
        </div>
        <div
          class="tab-item"
          :class="{ active: currentTab === 'desc' }"
          @click="currentTab = 'desc'"
        >
          艺人详情
        </div>
      </div>

      <div v-show="currentTab === 'songs'" class="tab-content">
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

      <div v-show="currentTab === 'albums'" class="tab-content">
        <div class="album-grid">
          <div v-for="album in albums" :key="album.id" class="album-card">
            <div class="album-cover" @click="gotoalbum(album.id)">
              <img :src="album.picUrl + '?param=300y300'" loading="lazy" />
              <div class="play-overlay">
                <svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
              </div>
            </div>
            <div class="album-name">{{ album.name }}</div>
            <div class="album-date">{{ formatDate(album.publishTime) }}</div>
          </div>
        </div>
        <div v-if="loadingAlbums" class="loading-more">加载专辑中...</div>
      </div>

      <div v-show="currentTab === 'desc'" class="tab-content desc-content">
        <div class="desc-full">{{ ArtistDetail.description || '暂无详细介绍' }}</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Player } from '@/stores/index'
import { userInfo } from '@/stores/userInfo' // 引入 userInfo
import { GetArtist, GetArtistSongs } from '@/api/Artist'
import { GetMusicDetail, AddToLike, AddToMyList } from '@/api/GetMusic' // API
import { GetUserMusicList } from '@/api/GetMusicList' // API
import { GetArtistAlbum } from '@/api/Album'
import type { SongItem } from '@/stores/index'

const player = Player()
const userInfos = userInfo()
const route = useRoute()
const router = useRouter()

// 状态
const isLoading = ref(true)
const currentTab = ref('songs')
const isLoadingMore = ref(false)
const hasMore = ref(true)
const offset = ref(0)
const limit = 50
const isWholeListMode = ref(false)

// 专辑相关
const albums = ref<any[]>([])
const loadingAlbums = ref(false)
const albumHasMore = ref(true)
const albumOffset = ref(0)

// 菜单相关
const activeMenuId = ref<number | null>(null)
const openSubmenuId = ref<string | null>(null)
const myPlaylists = ref<any[]>([])

const ArtistDetail = ref<any>({
  id: 0,
  name: '',
  transNames: '',
  coverImgUrl: '',
  description: '',
  musicSize: 0,
  albumSize: 0,
  mvSize: 0,
})

const songs = ref<SongItem[]>([])
const currentSongId = computed(() => player.currentSong || null)
const ArtistId = computed(() => {
  const artistid = route.params.id
  return Array.isArray(artistid) ? Number(artistid[0]) : Number(artistid)
})

// --- 初始化数据 ---
async function loadPlaylistData() {
  isLoading.value = true
  isWholeListMode.value = false
  hasMore.value = true
  offset.value = 0

  try {
    const arid = ArtistId.value
    if (!arid) return

    const res = await GetArtist(arid)
    const hotsongs = res.hotSongs
    const pl = res.artist

    ArtistDetail.value = {
      id: pl.id,
      name: pl.name,
      transNames: pl.transNames?.[0] || pl.alias?.[0] || '',
      coverImgUrl: pl.picUrl,
      description: pl.briefDesc || '暂无简介',
      musicSize: pl.musicSize,
      albumSize: pl.albumSize,
      mvSize: pl.mvSize,
    }

    // 获取热门歌曲详情
    const songIds = hotsongs.map((song: any) => song.id)
    const results = await Promise.all(
      songIds.map((id: any) =>
        GetMusicDetail({ ids: id })
          .then((res) => res)
          .catch(() => null),
      ),
    )

    songs.value = results
      .filter((song) => song && song.songs && song.songs[0])
      .map((song) => ({
        id: song.songs[0].id,
        name: song.songs[0].name,
        album: song.songs[0].al?.name || '未知专辑',
        artists: song.songs[0].ar.map((ar: any) => ({ id: ar.id, name: ar.name })),
        duration: song.songs[0].dt ? Math.floor(song.songs[0].dt / 1000) : 0,
        cover: song.songs[0].al?.picUrl || '',
      }))
  } catch (err) {
    console.error('加载艺人数据失败:', err)
  } finally {
    isLoading.value = false
  }
}

// --- 加载全部歌曲 ---
async function loadWholelistData(loadMore = false) {
  if (isLoading.value || isLoadingMore.value) return
  const arid = ArtistId.value
  if (!arid) return

  if (!loadMore) {
    offset.value = 0
    hasMore.value = true
    songs.value = []
    isWholeListMode.value = true
  } else if (!hasMore.value) {
    return
  }

  isLoadingMore.value = loadMore
  isLoading.value = !loadMore

  try {
    const res = await GetArtistSongs({ id: arid, offset: offset.value, limit: 50 })
    const wholesongs = res.songs || []

    if (wholesongs.length < limit || wholesongs.length === 0) {
      hasMore.value = false
    }

    const songIds = wholesongs.map((song: any) => song.id)
    const results = await Promise.all(
      songIds.map((id: number) =>
        GetMusicDetail({ ids: id })
          .then((res) => res)
          .catch(() => null),
      ),
    )

    const newSongs = results
      .filter((song) => song && song.songs && song.songs[0])
      .map((song) => ({
        id: song.songs[0].id,
        name: song.songs[0].name,
        album: song.songs[0].al?.name || '未知专辑',
        artists: song.songs[0].ar?.map((ar: any) => ({ id: ar.id, name: ar.name })),
        duration: song.songs[0].dt ? Math.floor(song.songs[0].dt / 1000) : 0,
        cover: song.songs[0].al?.picUrl || '',
      }))

    songs.value = [...songs.value, ...newSongs]
    offset.value += limit
  } catch (err) {
    console.error('加载全部歌曲失败:', err)
  } finally {
    isLoading.value = false
    isLoadingMore.value = false
  }
}

// --- 加载专辑 ---
async function loadAlbums() {
  if (loadingAlbums.value || !albumHasMore.value) return
  loadingAlbums.value = true
  try {
    const res = await GetArtistAlbum({
      id: ArtistId.value,
      limit: 30,
      offset: albumOffset.value,
    })
    const newAlbums = res.hotAlbums || []
    if (newAlbums.length < 30) albumHasMore.value = false
    albums.value.push(...newAlbums)
    albumOffset.value += 30
  } catch (e) {
    console.error(e)
  } finally {
    loadingAlbums.value = false
  }
}

function switchTab(tab: string) {
  currentTab.value = tab
  if (tab === 'albums' && albums.value.length === 0) {
    loadAlbums()
  }
}

// --- 滚动监听 ---
function handleScroll(e: Event) {
  const target = e.target as HTMLElement
  const { scrollTop, scrollHeight, clientHeight } = target

  if (scrollHeight - scrollTop - clientHeight < 100) {
    if (
      currentTab.value === 'songs' &&
      !isLoadingMore.value &&
      hasMore.value &&
      isWholeListMode.value &&
      songs.value.length > 0
    ) {
      loadWholelistData(true)
    }
    if (currentTab.value === 'albums' && albumHasMore.value) {
      loadAlbums()
    }
  }
}

// --- 菜单控制逻辑 ---
const toggleMenu = (id: number) => {
  if (activeMenuId.value === id) {
    activeMenuId.value = null
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
      console.log('详情', song.name)
      router.push({ name: 'comment', params: { id: song.id } })
      break
  }
}

// --- 生命周期 & 监听 ---
onMounted(async () => {
  loadPlaylistData()
  document.addEventListener('click', closeMenu)

  if (userInfos.userId) {
    try {
      const res: any = await GetUserMusicList(userInfos.userId)
      myPlaylists.value = (res.playlist || []).filter(
        (p: any) => p.creator.userId === userInfos.userId,
      )
    } catch (e) {
      console.error('获取用户歌单失败', e)
    }
  }
})

onUnmounted(() => {
  document.removeEventListener('click', closeMenu)
})

watch(
  () => ArtistId.value,
  (v) => v && loadPlaylistData(),
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
function playAll() {
  if (songs.value.length) {
    player.playFM = false
    player.playnormal = true
    player.nextSongUrl = null
    player.addWholePlaylist(songs.value.map((s) => s.id))
    player.playcurrentSong(songs.value[0].id)
    player.loadPlaylistData()
  }
}
const TurnIn = (artistid: number) => {
  router.push({ name: 'artist', params: { id: artistid } })
}
const gotoalbum = (albumid: number) => {
  router.push({ name: 'album', params: { id: albumid } })
}
function playSong(song: SongItem, index: number) {
  player.playFM = false
  player.playnormal = true
  player.nextSongUrl = null
  player.addWholePlaylist(songs.value.map((s) => s.id))
  player.playcurrentSong(song.id)
  player.loadPlaylistData()
}
</script>

<style scoped lang="scss">
$bg-color: #121212;
$item-hover: rgba(255, 255, 255, 0.06);
$text-main: #e0e0e0;
$text-sub: #888888;
$primary: #1c1c1e;

// 菜单颜色变量
$menu-bg: #1c1c1e;
$menu-hover: #3a3a3a;

.playlist-page {
  position: relative;
  background-color: $bg-color;
  min-height: 100vh;
  color: $text-main;
  font-family:
    -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  user-select: none;
  overflow-y: auto;
  height: 100vh;
  padding-top: 60px; /* 给固定导航栏留位置 */

  &::-webkit-scrollbar {
    display: none;
  }
  scrollbar-width: none;
}

/* 顶部模糊背景 */
.bg-blur {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 380px; /* 固定高度，仅覆盖头部 */
  background-size: cover;
  background-position: center 20%;
  filter: blur(50px) brightness(0.4);
  z-index: 0;
  /* 底部渐变遮罩，使图片自然融入背景色 */
  mask-image: linear-gradient(to bottom, black 20%, transparent 100%);
  -webkit-mask-image: linear-gradient(to bottom, black 20%, transparent 100%);
}

.content-wrapper {
  position: relative;
  z-index: 2;
  padding: 0 40px 40px;
  max-width: 1400px;
  margin: 0 auto;
}

/* --- 紧凑型头部样式 (优化版) --- */
.artist-header {
  display: flex;
  gap: 30px;
  margin-bottom: 30px; /* 减小间距 */

  .cover-wrap {
    width: 200px; /* 稍微缩小封面 */
    height: 200px;
    flex-shrink: 0;
    border-radius: 12px;
    overflow: hidden;
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.5);
    background: #333;
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
    justify-content: flex-start; /* 顶部对齐或 flex-end 都可以，这里紧凑点 */

    .title-row {
      display: flex;
      align-items: baseline;
      gap: 12px;
      margin-bottom: 8px; /* 减小间距 */
      .title {
        font-size: 36px; /* 字体稍微调整 */
        font-weight: 800;
        margin: 0;
        line-height: 1.1;
      }
      .alias {
        font-size: 16px;
        color: rgba(255, 255, 255, 0.5);
        font-weight: 400;
      }
    }

    .stats-row {
      display: flex;
      align-items: center;
      gap: 15px;
      font-size: 13px;
      color: $text-sub;
      margin-bottom: 12px;
      .stat-item {
        color: #ddd;
      }
    }

    .description-wrapper {
      margin-bottom: 16px;
      .description {
        font-size: 13px;
        color: $text-sub;
        line-height: 1.5;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
        max-width: 700px;
      }
    }

    .actions {
      display: flex;
      gap: 12px;
      margin-top: auto; /* 将按钮推到底部 */
      button {
        height: 36px;
        border-radius: 18px;
        border: none;
        font-size: 13px;
        font-weight: 600;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 6px;
        transition:
          transform 0.2s,
          background-color 0.2s;
        &:hover {
          transform: scale(1.05);
        }
      }
      .btn-primary {
        background: rgba(255, 255, 255, 0.1);
        color: #fff;
        padding: 0 16px;
        border: 1px solid rgba(255, 255, 255, 0.05);
        &:hover {
          background: rgba(255, 255, 255, 0.2);
        }
      }
      .btn-secondary {
        background: rgba(255, 255, 255, 0.1);
        color: #fff;
        padding: 0 16px;
        border: 1px solid rgba(255, 255, 255, 0.05);
        &:hover {
          background: rgba(255, 255, 255, 0.2);
        }
      }
    }
  }
}

/* --- Tabs --- */
.nav-tabs {
  display: flex;
  gap: 30px;
  margin-bottom: 20px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  .tab-item {
    padding: 12px 0;
    font-size: 15px;
    font-weight: 500;
    color: $text-sub;
    cursor: pointer;
    position: relative;
    transition: color 0.2s;
    &.active {
      color: #fff;
      font-weight: 700;
      &::after {
        content: '';
        position: absolute;
        bottom: -1px;
        left: 0;
        right: 0;
        height: 3px;
        background: $primary;
        border-radius: 2px;
      }
    }
    &:hover {
      color: #fff;
    }
  }
}

/* --- 歌曲列表 (复用) --- */
.show-list-btn {
  background: none;
  border: none;
  color: $text-sub;
  cursor: pointer;
  font-size: 13px;
  margin-bottom: 10px;
  &:hover {
    color: #fff;
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
    .song-title,
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

/* --- 下拉菜单样式 --- */
.dropdown-menu {
  position: absolute;
  top: 100%;
  right: 0;
  width: 160px;
  background-color: rgba($menu-bg, 0.6);
  border-radius: 8px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.6);
  padding: 6px;
  z-index: 100;
  margin-top: 4px;
  border: 1px solid rgba(255, 255, 255, 0.05);
  overflow: visible !important;

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

/* 专辑卡片 */
.album-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 30px 24px;
  .album-card {
    cursor: pointer;
    &:hover .play-overlay {
      opacity: 1;
      transform: translate(-50%, -50%) scale(1);
    }
    .album-cover {
      width: 100%;
      aspect-ratio: 1/1;
      border-radius: 12px;
      overflow: hidden;
      position: relative;
      margin-bottom: 12px;
      background: #222;
      box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
      img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }
      .play-overlay {
        position: absolute;
        top: 50%;
        left: 50%;
        width: 48px;
        height: 48px;
        background: rgba(255, 255, 255, 0.9);
        border-radius: 50%;
        color: $primary;
        display: flex;
        align-items: center;
        justify-content: center;
        opacity: 0;
        transform: translate(-50%, -50%) scale(0.8);
        transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
        svg {
          width: 24px;
          margin-left: 2px;
        }
      }
    }
    .album-name {
      font-size: 15px;
      color: #fff;
      margin-bottom: 4px;
      line-height: 1.4;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }
    .album-date {
      font-size: 13px;
      color: $text-sub;
    }
  }
}

.desc-content {
  padding: 10px 0;
  .desc-full {
    line-height: 1.8;
    color: #ccc;
    font-size: 15px;
    white-space: pre-wrap;
  }
}

.loading-state,
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
.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid rgba(255, 255, 255, 0.1);
  border-top: 3px solid $text-sub;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}
.loading-more .small {
  width: 16px;
  height: 16px;
  border-width: 2px;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
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
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

@media (max-width: 768px) {
  .artist-header {
    flex-direction: column;
    align-items: center;
    text-align: center;
    .info {
      align-items: center;
    }
    .title-row {
      justify-content: center;
      flex-wrap: wrap;
    }
    .description-wrapper {
      display: none;
    }
  }
  .list-header,
  .album-info {
    display: none;
  }
}
</style>
