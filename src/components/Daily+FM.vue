<template>
  <div class="for-you-section">
    <h2 class="section-title">For You</h2>

    <div class="cards-grid">
      <div class="card daily-card" v-if="dailyCover">
        <div class="bg-image" :style="{ backgroundImage: `url(${dailyCover})` }"></div>

        <div class="overlay" @click="handleDailyClick"></div>

        <div class="daily-content">
          <span class="calendar-text">📅 {{ currentDay }}</span>
          <div class="main-title">每日<br />推荐</div>
        </div>

        <button class="play-btn-overlay" @click="play">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
            <path d="M8 5v14l11-7z" />
          </svg>
        </button>
      </div>

      <div class="card fm-card" v-if="coverfm">
        <div class="fm-cover">
          <img :src="coverfm.cover" alt="FM Cover" />
        </div>

        <div class="fm-info">
          <div class="song-meta">
            <div class="song-title">{{ coverfm.name }}</div>
            <div class="song-artist">{{ coverfm.artist }}</div>
          </div>

          <div class="fm-controls">
            <button class="control-btn sm" @click.stop="handleDislike(player.currentSongDetail.id)">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                <path
                  d="M15.5 4l-1 5H22l-2 10H6v-9l6-6 3.5 4zM4 19h2v-9H4v9z"
                  transform="rotate(180 12 12)"
                />
              </svg>
            </button>

            <button class="control-btn lg" @click.stop="togglePlay">
              <svg
                v-if="!isPlaying"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M8 5v14l11-7z" />
              </svg>
              <svg
                v-else
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
              </svg>
            </button>

            <button class="control-btn sm" @click.stop="handleNext">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" />
              </svg>
            </button>
          </div>

          <div class="fm-logo">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path d="M9 18V5l12-2v13"></path>
              <circle cx="6" cy="18" r="3"></circle>
              <circle cx="18" cy="16" r="3"></circle>
            </svg>
            私人FM
          </div>
        </div>

        <div class="fm-bg-blur" :style="{ backgroundImage: `url(${coverfm.cover})` }"></div>
      </div>

      <div v-else class="card fm-card loading-skeleton">Loading...</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { GetDailyRecommendMusic, GetNextPersonalFM, GetPersonalFM } from '@/api/GetMusicList'
import { ref, onMounted } from 'vue'
import { Song, Player } from '@/stores/index'
import router from '@/router'

interface Item {
  image: string
  title: string
  subtitle?: string
  badgeText?: string
  id: number
}
// --- Props & Data ---
const isPlaying = ref(false)
const currentDay = ref(new Date().getDate())
const dailyCover = ref<string>('') // 初始化为空字符串
const coverfm = ref<Song | null>(null) // 初始化为 null
const player = Player()
const mappedDailySongs = ref<Song[]>()
const mappedFmSongs = ref<Song[]>()
onMounted(async () => {
  try {
    const [dailyRes, fmRes] = await Promise.all([GetDailyRecommendMusic(), GetPersonalFM()])

    const dailyList = dailyRes.data.dailySongs
    const fmList = fmRes.data

    mappedDailySongs.value = dailyList.map((song: any) => ({
      id: song.id,
      name: song.name,
      album: song.al?.name,
      artist: song.ar?.[0]?.name,
      cover: song.al?.picUrl,
    }))
    mappedFmSongs.value = fmList.map((song: any) => ({
      id: song.id,
      name: song.name,
      album: song.album?.name,
      artist: song.artists?.[0]?.name,
      duration: Math.floor(song.duration / 1000),
      cover: song.album?.picUrl,
    }))

    if (mappedDailySongs.value.length > 0) {
      dailyCover.value = mappedDailySongs.value[0].cover
    }

    if (mappedFmSongs.value.length > 0) {
      coverfm.value = mappedFmSongs.value[0]
    }
  } catch (error) {
    console.error('获取推荐失败:', error)
  }
})
async function play() {
  const idRes: any = mappedDailySongs.value
  player.playnormal = true
  player.playFM = false
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

  if (!ids.length) {
    console.error('No track ids returned from MusicIdList', idRes)
    return
  }

  // 把标准化的 id 列表加入播放器
  player.addWholePlaylist(ids)

  // 取第一首，先获取可播放 url
  const firstId = ids[0]

  // 调用播放（如果 store.playcurrentSong 支持传 url，可直接传；否则按你现有逻辑处理）
  player.playcurrentSong({
    firstId,
  })

  console.log('isplaying', player.isplaying)
}
// --- Methods ---
const handleDailyClick = () => {
  router.push({ name: 'DailyRecommendMusic' })
}
const playFM = () => {
  const idRes: any = mappedFmSongs.value

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

  if (!ids.length) {
    console.error('No track ids returned from MusicIdList', idRes)
    return
  }
  // 取第一首，先获取可播放 url
  const firstId = ids[0]

  // 调用播放（如果 store.playcurrentSong 支持传 url，可直接传；否则按你现有逻辑处理）
  player.playcurrentSong({
    firstId,
  })
  // 把标准化的 id 列表加入播放器
  player.addWholePlaylist(ids)

  console.log('isplaying', player.isplaying)
}
const togglePlay = () => {
  if (!player.playFM || player.currentSong != mappedFmSongs.value[0].id) {
    player.playnormal = false
    player.playFM = true
    playFM()
    player.isplaying = true
  } else {
    player.togglePlay()
  }
}

const handleNext = async () => {
  console.log(player.currentSongList.length)
  console.log(player.playlist.length)
  if (player.currentSongIndex - player.playlist.length <= 3) {
    const fmRes = await GetPersonalFM()
    console.log(fmRes)
    const fmList = fmRes.data
    mappedFmSongs.value = fmList.map((song: any) => ({
      id: song.id,
      name: song.name,
      album: song.album?.name,
      artist: song.artists?.[0]?.name,
      duration: Math.floor(song.duration / 1000),
      cover: song.album?.picUrl,
    }))
    const idRes: any = mappedFmSongs.value
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

    if (!ids.length) {
      console.error('No track ids returned from MusicIdList', idRes)
      return
    }
    player.addSongsToPlaylist(ids)
  }
  player.playNextSong()
  console.log('FM下一首')
}

const handleDislike = async (musicid) => {
  player.removeSongFromPlaylist(musicid)
  //const nextdata = GetNextPersonalFM()
  //console.log(nextdata)
  console.log(player.currentSongList.length)
  console.log(player.playlist.length)
  if (player.currentSongIndex - player.playlist.length <= 3) {
    const fmRes = await GetNextPersonalFM(musicid)
    console.log(fmRes)
    const fmList = fmRes.data
    mappedFmSongs.value = fmList.map((song: any) => ({
      id: song.id,
      name: song.name,
      album: song.album?.name,
      artist: song.artists?.[0]?.name,
      duration: Math.floor(song.duration / 1000),
      cover: song.album?.picUrl,
    }))
    const idRes: any = mappedFmSongs.value
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

    if (!ids.length) {
      console.error('No track ids returned from MusicIdList', idRes)
      return
    }
    player.addSongsToPlaylist(ids)
  }
  console.log('FM下一首')
}
</script>

<style scoped lang="scss">
// 定义一些颜色变量，实际项目中建议放在 global.scss
$bg-card: #2b2b2b; // 卡片深灰背景
$text-main: #ffffff;
$text-sub: #a1a1a1;
$accent: #335eea; // 强调色
$radius: 16px;

.for-you-section {
  padding: 20px 20px;
  width: 100%;
  max-width: 1200px; // 限制最大宽度
  margin: 0 auto;
  user-select: none;
}

.section-title {
  font-size: 24px;
  font-weight: 700;
  color: $text-main;
  margin-bottom: 16px;
}

.cards-grid {
  display: grid;
  grid-template-columns: 1fr 1fr; // 两列等宽
  gap: 24px;
  height: 180px; // 固定高度，保证一致性
}

// --- 通用卡片样式 ---
.card {
  position: relative;
  border-radius: $radius;
  overflow: hidden;
  cursor: pointer;
  transition:
    transform 0.3s ease,
    box-shadow 0.3s ease;

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 12px 24px rgba(0, 0, 0, 0.2);
  }
}

// --- 1. 每日推荐样式 ---
.daily-card {
  display: flex;
  align-items: center;
  padding: 20px;

  .bg-image {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-size: cover;
    background-position: center;
    z-index: 0;
    transition: transform 0.5s ease;
  }

  // 悬浮时背景图微放大
  &:hover .bg-image {
    transform: scale(1.05);
  }

  .overlay {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.3); // 变暗遮罩
    z-index: 1;
    backdrop-filter: blur(2px); // 轻微模糊
  }

  .daily-content {
    position: relative;
    z-index: 2;
    margin-left: 20px;

    .calendar-text {
      font-size: 14px;
      color: rgba(255, 255, 255, 0.8);
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 1px;
      display: block;
      margin-bottom: 4px;
    }

    .main-title {
      font-size: 32px;
      font-weight: 800;
      line-height: 1.2;
      color: #fff;
    }
  }

  // 右下角播放按钮
  .play-btn-overlay {
    position: absolute;
    bottom: 20px;
    right: 20px;
    width: 48px;
    height: 48px;
    background: rgba(255, 255, 255, 0.2);
    color: #fff;
    backdrop-filter: blur(10px);
    border: none;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 3;
    opacity: 0; // 默认隐藏
    transform: scale(0.8);
    transition: all 0.3s ease;

    svg {
      width: 24px;
      height: 24px;
      fill: #fff;
      margin-left: 2px; // 视觉校正
    }
  }

  &:hover .play-btn-overlay {
    opacity: 1;
    transform: scale(1);
  }
}

// --- 2. 私人 FM 样式 ---
.fm-card {
  background-color: $bg-card; // 可以在这里用深灰色
  display: flex;
  padding: 0; // FM不需要padding，内部布局控制

  // 隐约的背景，增加质感
  .fm-bg-blur {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-size: cover;
    filter: blur(60px) opacity(0.15); // 很强的模糊，作为氛围光
    z-index: 0;
    pointer-events: none;
  }

  .fm-cover {
    position: relative;
    z-index: 2;
    height: 100%;
    aspect-ratio: 1 / 1; // 保持正方形
    padding: 16px; // 图片周围留白

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    }
  }

  .fm-info {
    position: relative;
    z-index: 2;
    flex: 1;
    padding: 20px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;

    .song-meta {
      .song-title {
        font-size: 18px;
        font-weight: 700;
        color: $text-main;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .song-artist {
        font-size: 14px;
        color: $text-sub;
        margin-top: 4px;
      }
    }

    .fm-controls {
      display: flex;
      align-items: center;
      gap: 16px;
      margin-bottom: 4px;

      .control-btn {
        background: transparent;
        border: none;
        cursor: pointer;
        color: $text-main;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: opacity 0.2s;
        border-radius: 8px;
        padding: 0;

        &:hover {
          opacity: 0.7;
          background-color: rgba(255, 255, 255, 0.1);
        }

        &.sm svg {
          width: 20px;
          height: 20px;
          color: $text-sub;
        }
        &.lg svg {
          width: 32px;
          height: 32px;
          fill: $text-main;
        }
      }
    }

    .fm-logo {
      position: absolute;
      bottom: 16px;
      right: 16px;
      font-size: 12px;
      color: rgba(255, 255, 255, 0.2);
      font-weight: 600;
      display: flex;
      align-items: center;
      gap: 4px;

      svg {
        width: 14px;
        height: 14px;
      }
    }
  }
}

// 响应式调整
@media (max-width: 768px) {
  .cards-grid {
    grid-template-columns: 1fr; // 小屏幕变单列
  }
}
</style>
