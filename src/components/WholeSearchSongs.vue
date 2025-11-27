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
              <div class="song-artist" >
                <span v-for="(artist, index) in song.artists" :key="artist.id" @click="TurnIn(artist.id)">
              {{ artist.name }}<span v-if="index < song.artists.length - 1"> / </span>
            </span>
              </div>
            </div>

            <div class="album-info" :title="song.album">
              {{ song.album }}
            </div>

            <div class="right-actions">
              <button class="action-btn like">
                <svg
                  xmlns="http://www.w3.org/2000/svg "
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

        <!-- 加载提示 -->
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
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Player } from '@/stores/index'
import { GetMusicDetail } from '@/api/GetMusic'
import { GetSearchData } from '@/api/Search'
import { search } from '@/stores/search'
import type { SongItem } from '@/stores/index'
const player = Player()
const router = useRouter()
const isLoading = ref(false)
const isLoadingMore = ref(false)
const hasMore = ref(true)
const offset = ref(0)
const limit = 50
const isWholeListMode = ref(false)
const searcher = search()

const songs = ref<SongItem[]>([])
const currentSongId = computed(() => player.currentSong || null)
const addsongs = ref<SongItem[]>([])
const songsList = ref<SongItem[]>([])
async function loadWholelistData(loadMore = false) {
  // 防止重复加载
  if (isLoading.value || isLoadingMore.value) return

  // 如果不是加载更多，则重置状态
  if (!loadMore) {
    offset.value = 0
    hasMore.value = true
    songs.value = []
    isWholeListMode.value = true
  } else if (!hasMore.value) {
    return // 没有更多数据了
  }

  isLoadingMore.value = loadMore
  isLoading.value = !loadMore

  try {
    // 调用支持分页的API
    // 注意：需要你的后端接口支持 offset 和 limit 参数
    const res = await GetSearchData({keyword:searcher.keyword, offset:offset.value, limit:50, type: 1,})
    const rawSongList = res?.result?.songs || []

    if (rawSongList.length === 0) {
      songsList.value = []
      return
    }

    // 2. 提取 ID 列表
    const ids = rawSongList.map((song: any) => song.id)
    // 3. 获取歌曲详细信息
    const detailRes = await GetMusicDetail({ ids: ids.join(',') })

   
    // 检查是否还有更多数据
    if (res.result.length < limit || res.result.length === 0) {
      hasMore.value = false
    }
     // 4. 映射数据
    if (detailRes && detailRes.songs) {
      addsongs.value = detailRes.songs.map((song: any) => ({
        id: song.id,
        name: song.name,
        album: song.al?.name || '未知专辑',
        // 优化 artist 提取，直接拿 name 数组
        artists: song.ar.map((ar: any) => ({ id: ar.id, name: ar.name })),

        duration: song.dt ? Math.floor(song.dt / 1000) : 0,
        cover: song.al?.picUrl || '',
      }))
    }
  } catch (error) {
    console.error('获取新歌失败', error)
  }
  try{

    // 追加到新数据到现有列表
    songs.value = [...songs.value, ...addsongs.value]

    // 更新偏移量
    offset.value += limit

  } catch (err) {
    console.error('加载全部歌曲失败:', err)
  } finally {
    isLoading.value = false
    isLoadingMore.value = false
  }
}

function handleScroll(e: Event) {
  // 只在"全部歌曲"模式下启用无限滚动
  if (!isWholeListMode.value) return

  const target = e.target as HTMLElement
  const { scrollTop, scrollHeight, clientHeight } = target

  // 距离底部 100px 时开始加载
  if (scrollHeight - scrollTop - clientHeight < 200) {
    if (!isLoadingMore.value && hasMore.value && songs.value.length > 0) {
      loadWholelistData(true)
    }
  }
}

onMounted (async () => {
    loadWholelistData(false)
})


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
  }
}

function playSong(song: SongItem, index: number) {
  player.playFM = false
  player.playnormal = true
  player.nextSongUrl = null
  player.addWholePlaylist(songs.value.map((s) => s.id))
  player.playcurrentSong(song.id)
}
const TurnIn = (artistid) => {
  router.push({name: 'artist', params: { id: artistid } } )
}
</script>

<style scoped lang="scss">
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
  border-radius: 30px;
  font-family:
    -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  user-select: none;
  overflow-y: auto;
  height: 100vh;
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

      .title {
        font-size: 30px;
        font-weight: 700;
        line-height: 1.2;
        margin: 0;
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

  svg {
    margin-left: 3px;
  }
}

.show-list {
  bottom: 12px;
  right: 12px;
  width: 80px;
  height: 40px;
  background: rgba(255, 255, 255, 0.2);
  color: #fff;
  border: none;
  border-radius: 10px;
  align-items: center;
  justify-self: center;
  transform: translate(0, 5px);
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  cursor: pointer;

  &:hover {
    transform: scale(1) !important;
    background: rgba(255, 255, 255, 0.2);
  }
  &:active {
    transform: scale(0.95) !important;
  }
}

.show-list-info {
  font-size: 13px;
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
