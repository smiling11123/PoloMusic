<template>
  <div class="song-rec-container">
    <div class="header">
      <h2 class="title">最新音乐</h2>
      <a class="view-all" @click="goToAllSongs">查看全部</a>
    </div>

    <div class="grid-wrapper">
      <div v-for="song in songs" :key="song.id" class="song-card" @dblclick="playSong(song)">
        <div class="cover-wrap">
          <img :src="song.cover" alt="cover" loading="lazy" />
          <div class="play-overlay" @click="playSong(song)">
            <svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
          </div>
        </div>

        <div class="info-wrap">
          <div class="song-name" :title="song.name">
            {{ song.name }}
            <span v-if="song.alias" class="alias">({{ song.alias }})</span>
          </div>
          <div class="artist-name" >
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
import { ref, onMounted } from 'vue'
import { Player } from '@/stores/index' // 你的播放器 Store
import { useRouter } from 'vue-router'
import { GetRecommendNewMusic } from '@/api/GetMusicList' // 假设你有这个API封装

// --- 数据接口定义 ---
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
const songs = ref<SongItem[]>([])

// 获取数据
onMounted(async () => {
  try {
    // 调用网易云 /personalized/newsong 接口
    const res = await GetRecommendNewMusic({ limit: 12 })

    // 数据清洗（不同接口返回结构可能不同，按需调整）
    songs.value = (res.result || []).map((item: any) => ({
      id: item.id,
      name: item.name,
      alias: item.song.alias?.[0] || item.song.transName || '',
      artists: item.song.artists.map((ar: any) => ({ id: ar.id, name: ar.name })),
      album: item.song.album.name,
      cover: item.picUrl,
      duration: item.song.duration,
    }))
  } catch (error) {
    console.error('获取新歌失败', error)
  }
})

// 播放逻辑
const playSong = (song: SongItem) => {
  console.log('播放:', song.name)
  // 这里调用你的全局播放器逻辑
  // store.play(song.id)
  // 或者添加到播放列表
  //store.addWholePlaylist([song.id])
  store.addSongToPlaylist(song.id, store.currentSongIndex + 1)
  store.playcurrentSong({ firstId: song.id })
}

const goToAllSongs = () => {
  console.log('跳转到全部新歌')
  // router.push('/new-songs')
}
const TurnIn = (artistid) => {
  router.push({name: 'artist', params: { id: artistid } } )
}
</script>

<style scoped lang="scss">
$max-width: 1200px; // 与之前的组件保持一致
$hover-bg: rgba(255, 255, 255, 0.1); // 悬停背景色
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

/* 头部样式 */
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

/* Grid 布局核心 */
.grid-wrapper {
  display: grid;
  /* 核心：自适应列数，最小宽度 260px，填满 4 列 */
  grid-template-columns: repeat(4, 1fr);
  gap: 12px 24px; // 行间距 12px，列间距 24px
  width: 100%;
}

/* 单曲卡片样式 */
.song-card {
  display: flex;
  align-items: center; // 垂直居中
  padding: 8px;
  border-radius: 8px;
  cursor: default; // 默认箭头，只有按钮是指针
  transition: background-color 0.3s ease;
  overflow: hidden; // 防止文字溢出

  &:hover {
    background-color: $hover-bg;

    .play-overlay {
      opacity: 1;
    }
  }
}

/* 封面区域 */
.cover-wrap {
  position: relative;
  width: 48px; // 截图中的封面很小，大约48-56px
  height: 48px;
  flex-shrink: 0; // 防止被挤压
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
    opacity: 0; // 默认隐藏
    transition: opacity 0.2s ease;
    cursor: pointer;

    svg {
      width: 20px;
      height: 20px;
      fill: #fff;
    }
  }
}

/* 信息区域 */
.info-wrap {
  display: flex;
  flex-direction: column;
  justify-content: center;
  flex: 1;
  min-width: 0; // 关键：让 flex 子元素内的 text-overflow 生效
  height: 48px;
}

.song-name {
  font-size: 14px;
  color: $text-main;
  font-weight: 500;
  margin-bottom: 4px;

  // 单行省略
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

  // 单行省略
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

/* 响应式调整 */
@media (max-width: 1100px) {
  .grid-wrapper {
    grid-template-columns: repeat(3, 1fr); // 变3列
  }
}

@media (max-width: 800px) {
  .grid-wrapper {
    grid-template-columns: repeat(2, 1fr); // 变2列
  }
}

@media (max-width: 500px) {
  .grid-wrapper {
    grid-template-columns: 1fr; // 变1列
  }
}
</style>
