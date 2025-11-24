<template>
  <div class="song-rec-container">
    <div class="header">
      <h2 class="title">歌曲</h2>
      <a class="view-all" @click="goToAllSongs">查看全部</a>
    </div>

    <div class="grid-wrapper">
      <div v-for="song in songsList" :key="song.id" class="song-card" @dblclick="playSong(song)">
        <div class="cover-wrap">
          <img :src="song.cover" alt="cover" loading="lazy" />
          <div class="play-overlay" @click="playSong(song)">
            <svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
          </div>
        </div>

        <div class="info-wrap">
          <div class="song-name" :title="song.name">
            {{ song.name }}
          </div>
          <div class="artist-name">
            <span v-for="(artist, index) in song.artists" :key="artist.id" @click="TurnIn(artist.id)">
              {{ artist.name }}<span v-if="index < song.artists.length - 1"> / </span>
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onUnmounted } from 'vue'
import { Player } from '@/stores/index'
import { useRouter } from 'vue-router'
import { GetSearchData } from '@/api/Search'
import { search } from '@/stores/search'
import { GetMusicDetail } from '@/api/GetMusic'
import { Song } from '@/stores/index'

interface Artist {
  id: number
  name: string
}

interface SongItem {
  id: number
  name: string
  alias?: string // 歌曲别名（如：抖音DJ版）
  artists: Artist[]
  album: string
  cover: string
  duration?: number
}
// --- 状态与逻辑 ---
const router = useRouter()
const store = Player()
const songsList = ref<SongItem[]>([])
const searcher = search()

// 防抖定时器
let debounceTimer: ReturnType<typeof setTimeout> | null = null

// 加载歌曲结果
const loadMusic = async (Keyword: string) => {
  if (!Keyword) return

  try {
    // 1. 获取搜索结果 (获取ID)
    const searchRes = await GetSearchData({ keyword: Keyword, type: 1, limit: 12 })
    const rawSongList = searchRes?.result?.songs || []
    
    if (rawSongList.length === 0) {
      songsList.value = []
      return
    }

    // 2. 提取 ID 列表
    const ids = rawSongList.map((song: any) => song.id)
    // 3. 获取歌曲详细信息
    const detailRes = await GetMusicDetail({ ids: ids.join(',') })
    
    // 4. 映射数据
    if (detailRes && detailRes.songs) {
      songsList.value = detailRes.songs.map((song: any) => ({
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
    console.error('加载歌曲失败:', error)
  }
}

// 监听搜索关键词 (包含防抖和去重)
watch(
  () => searcher.keyword,
  (newKeyword) => {
    if (typeof newKeyword !== 'string') return

    // 清除上一次未执行的定时器
    if (debounceTimer) clearTimeout(debounceTimer)

    // 设置防抖，避免用户打字时频繁请求 (300ms 延迟)
    debounceTimer = setTimeout(() => {
      loadMusic(newKeyword)
    }, 300)
  },
  { immediate: true } // 立即执行一次以处理组件挂载时的初始值
)

// 组件销毁时清理定时器
onUnmounted(() => {
  if (debounceTimer) clearTimeout(debounceTimer)
})

// --- 播放与交互逻辑保持不变 ---
const playSong = (song: SongItem) => {
  store.addSongToPlaylist(song.id, store.currentSongIndex + 1)
  store.playcurrentSong({ firstId: song.id })
}

const goToAllSongs = () => {
  // router.push('/new-songs')
}
const TurnIn = (artistid) => {
  router.push({name: 'artist', params: { id: artistid } } )
}
</script>

<style scoped lang="scss">
$max-width: 1200px;
$hover-bg: rgba(255, 255, 255, 0.1);
$text-main: #ffffff;
$text-sub: #7d7d7d;

.song-rec-container {
  width: 100%;
  max-width: $max-width;
  margin: 0 auto;
  padding: 20px 20px;
  box-sizing: border-box;
  user-select: none;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-bottom: 16px;
  padding: 0 4px;

  .title {
    font-size: 24px;
    font-weight: 700;
    color: $text-main;
    margin: 0;
  }

  .view-all {
    font-size: 13px;
    color: $text-sub;
    cursor: pointer;
    text-decoration: none;
    transition: color 0.2s;
    border-radius: 8px;
    transition: background-color 0.3s ease;
    &:hover {
      background-color: $hover-bg;
    }
  }
}

.grid-wrapper {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px 24px;
  width: 100%;
}

.song-card {
  display: flex;
  align-items: center;
  padding: 8px;
  border-radius: 8px;
  cursor: default;
  transition: background-color 0.3s ease;
  overflow: hidden;

  &:hover {
    background-color: $hover-bg;

    .play-overlay {
      opacity: 1;
    }
  }
}

.cover-wrap {
  position: relative;
  width: 48px;
  height: 48px;
  flex-shrink: 0;
  border-radius: 6px;
  overflow: hidden;
  margin-right: 12px;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .play-overlay {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.3);
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0;
    transition: opacity 0.2s ease;
    cursor: pointer;

    svg {
      width: 20px;
      height: 20px;
      fill: #fff;
    }
  }
}

.info-wrap {
  display: flex;
  flex-direction: column;
  justify-content: center;
  flex: 1;
  min-width: 0;
  height: 48px;
}

.song-name {
  font-size: 14px;
  color: $text-main;
  font-weight: 500;
  margin-bottom: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;

  .alias {
    color: $text-sub;
    margin-left: 4px;
    font-weight: 400;
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

@media (max-width: 1100px) {
  .grid-wrapper {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (max-width: 800px) {
  .grid-wrapper {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 500px) {
  .grid-wrapper {
    grid-template-columns: 1fr;
  }
}
</style>
