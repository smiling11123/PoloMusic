<template>
  <div class="player-page">
    <div class="bg-layer" :style="{ backgroundImage: `url(${coverUrl})` }"></div>
    <div class="bg-mask"></div>

    <button class="close-btn" @click="handleClose" title="收起">
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <polyline points="6 9 12 15 18 9"></polyline>
      </svg>
    </button>

    <div class="content-layout">
      <div class="left-column">
        <div class="cover-wrapper">
          <img :src="coverUrl" alt="cover" class="album-cover" />
        </div>

        <div class="track-info">
          <div class="info-text">
            <h2 class="song-title" :title="player.currentSongDetail.name">
              {{ player.currentSongDetail.name || '未知歌曲' }}
            </h2>
            <div class="artist-name">
              <span
                v-for="(artist, index) in player.currentSongDetail.artists"
                :key="artist.id"
                @click="TurnIn(artist.id)"
              >
                {{ artist.name
                }}<span v-if="index < player.currentSongDetail.artists.length - 1"> / </span>
              </span>
            </div>
          </div>
          <div class="track-actions">
            <button class="like-btn">
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <path
                  d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"
                ></path>
              </svg>
            </button>
          </div>
        </div>

        <div class="progress-bar-wrap">
          <span class="time">{{ formatTime(currentTime) }}</span>
          <input
            type="range"
            class="slider progress-slider"
            min="0"
            :max="Math.max(player.currentSongTime || 1, duration)"
            step="0.1"
            v-model.number="seekValue"
            @change="onSeek"
            @mousedown="isSeeking = true"
            @mouseup="isSeeking = false"
            :style="{
              '--progress':
                (seekValue / Math.max(player.currentSongTime || 1, duration)) * 100 + '%',
            }"
          />
          <span class="time">{{ formatTime(duration) }}</span>
        </div>

        <div class="controls-row">
          <div class="main-controls">
            <button class="icon-btn secondary" @click="prev">
              <svg fill="currentColor" viewBox="0 0 24 24" width="22" height="22">
                <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z" />
              </svg>
            </button>

            <button class="icon-btn lg" @click="togglePlay">
              <svg
                v-if="player.isplaying"
                fill="currentColor"
                viewBox="0 0 24 24"
                width="38"
                height="38"
              >
                <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
              </svg>
              <svg v-else fill="currentColor" viewBox="0 0 24 24" width="38" height="38">
                <path d="M8 5v14l11-7z" />
              </svg>
            </button>

            <button class="icon-btn secondary" @click="next">
              <svg fill="currentColor" viewBox="0 0 24 24" width="22" height="22">
                <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" />
              </svg>
            </button>
          </div>

          <div class="vol-control">
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
            </svg>
            <input
              type="range"
              class="slider vol-slider"
              min="0"
              max="1"
              step="0.01"
              @input="onVolume"
              v-model.number="volume"
              :style="{ '--progress': player.audio.volume * 100 + '%' }"
            />
          </div>
        </div>
      </div>

      <div
        class="right-column"
        ref="scrollRef"
        @scroll="handleUserScroll"
        @wheel="handleUserScroll"
        @touchstart="handleUserScroll"
      >
        <div class="lyric-spacer-top"></div>

        <div
          v-for="(line, index) in lyricLines"
          :key="index"
          class="lyric-line"
          :class="{
            active: activeIndex === index,
            nearby: Math.abs(activeIndex - index) === 1,
          }"
          @click="seekTo(line.time)"
        >
          <div class="lyric-origin">{{ line.text }}</div>
          <div v-if="line.translation" class="lyric-trans">{{ line.translation }}</div>
        </div>

        <div v-if="lyricLines.length === 0" class="no-lyric-tip">
          <div class="no-lyric-text">纯音乐 / 暂无歌词</div>
        </div>

        <div class="lyric-spacer-bottom"></div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted, nextTick, toRaw } from 'vue'
import { Player } from '@/stores/index'
import { pagecontrol } from '@/stores/page'
import { useRouter } from 'vue-router'
import { GetPersonalFM } from '@/api/GetMusicList'

const router = useRouter()
const player = Player()
const pageCtrl = pagecontrol()

// ==================== 基础数据 ====================
const coverUrl = computed(() => player.currentSongDetail?.cover || '')
const currentTime = ref(0)
const duration = ref(0)
const seekValue = ref(0)
const isSeeking = ref(false)
const seeking = ref(false)
const volume = ref(player.audiovolume ?? 1)
const prevVolume = ref(volume.value)
// ==================== 1. 核心修复：音频事件与状态同步 ====================

// 标记事件是否已绑定，防止重复绑定
let isEventBound = false

const bindAudioEvents = () => {
  const audio = player.audio
  if (!audio || isEventBound) return

  audio.addEventListener('timeupdate', () => {
    if (!seeking.value) {
      currentTime.value = audio.currentTime || 0
      seekValue.value = currentTime.value
      player.currentSongTime = currentTime.value
    }
  })

  audio.addEventListener('durationchange', () => {
    duration.value = audio.duration || 0
  })

  audio.addEventListener('error', (e) => {
    console.error('audio error', e, audio.src)
  })
  
  audio.volume = volume.value
  isEventBound = true
}

onMounted(() => {
  if (player.audio) {
    if(player.audio.paused){
      player.isplaying = false
    }
    bindAudioEvents()
    duration.value = player.audio.duration || player.currentSongDetail.duration || 0
    currentTime.value = player.audio.currentTime || player.currentSongTime || 0
    seekValue.value = currentTime.value
  }
})

watch(
  () => player.audio,
  (newAudio) => {
    if (newAudio) {
      isEventBound = false 
      bindAudioEvents()
      duration.value = newAudio.duration || 0
      currentTime.value = player.currentSongTime || 0
      newAudio.currentTime = currentTime.value
    }
  },
  { immediate: true }
)

watch(() => player.currentSongDetail, (newVal) => {
  if (newVal) {
    nextTick(() => {
        const audio = player.audio
        if(audio) {
            duration.value = audio.duration || newVal.duration || 0
        }
    })
  }
})

watch(volume, (v) => {
  player.audiovolume = v
  if (player.audio) player.audio.volume = player.audiovolume
})

// ==================== 2. 双语歌词解析 (保持逻辑不变) ====================
interface LyricLine {
  time: number
  text: string
  translation?: string
}

const parseLrcStr = (lrc) => {
  const lines: { time: number; text: string }[] = []
  const regex = /\[(\d{2}):(\d{2})(\.\d{2,3})?\]/
  if (!lrc) return []
  for (const line of lrc.split('\n')) {
    const match = regex.exec(line)
    if (match) {
      const min = parseInt(match[1])
      const sec = parseInt(match[2])
      const ms = match[3] ? parseFloat(match[3]) * 1000 : 0
      lines.push({
        time: min * 60 + sec + ms / 1000,
        text: line.replace(regex, '').trim(),
      })
    }
  }
  return lines.filter((l) => l.text)
}

const lyricLines = computed<LyricLine[]>(() => {
  const rawLyric = player.currentSongLyric
  if (!rawLyric) return []

  const origins = parseLrcStr(rawLyric)
  const rawTrans = player.currentSongTLyric || null
  const translations = rawTrans ? parseLrcStr(rawTrans) : []
  const transMap = new Map(translations.map((t) => [t.time.toFixed(1), t.text]))

  return origins.map((line) => {
    const key = line.time.toFixed(1)
    return {
      ...line,
      translation: transMap.get(key) || '',
    }
  })
})

// ==================== 3. 滚动与定位逻辑 ====================
const scrollRef = ref<HTMLElement | null>(null)
const activeIndex = ref(0)
const isUserScrolling = ref(false)
let scrollTimeout: any = null

// 监听歌词变化重置
watch(lyricLines, async (newLyrics) => {
  if (newLyrics.length > 0) {
    activeIndex.value = 0
    await nextTick()
    scrollToTop('auto')
    setTimeout(() => scrollToActive('smooth'), 100)
  }
})

// 监听时间更新歌词位置
watch(
  () => currentTime.value,
  (newTime) => {
    updateActiveIndex(newTime)
  },
)

function updateActiveIndex(time: number) {
  if (lyricLines.value.length === 0) return
  let left = 0
  let right = lyricLines.value.length - 1
  let targetIndex = 0

  while (left <= right) {
    const mid = Math.floor((left + right) / 2)
    const line = lyricLines.value[mid]
    const nextLine = lyricLines.value[mid + 1]

    if (time >= line.time && (!nextLine || time < nextLine.time)) {
      targetIndex = mid
      break
    } else if (time < line.time) {
      right = mid - 1
    } else {
      left = mid + 1
    }
  }

  if (targetIndex !== activeIndex.value) {
    activeIndex.value = targetIndex
    scrollToActive('smooth')
  }
}

const scrollToTop = (behavior: ScrollBehavior = 'auto') => {
  if (scrollRef.value) scrollRef.value.scrollTo({ top: 0, behavior })
}

function scrollToActive(behavior: ScrollBehavior = 'smooth') {
  if (isUserScrolling.value || !scrollRef.value) return
  const container = scrollRef.value
  const activeEl = container.children[activeIndex.value + 1] as HTMLElement
  if (activeEl) {
    const containerHeight = container.clientHeight
    const offset = activeEl.offsetTop - containerHeight * 0.38
    container.scrollTo({ top: offset, behavior })
  }
}

function handleUserScroll() {
  isUserScrolling.value = true
  if (scrollTimeout) clearTimeout(scrollTimeout)
  scrollTimeout = setTimeout(() => {
    isUserScrolling.value = false
  }, 1200)
}

// ==================== 4. 交互控制 ====================
function togglePlay() {
  player.togglePlay()
}

const next = async () => {
  if (player.playFM) {
    const mappedFmSongs = ref()
    if (player.currentSongIndex - player.playlist.length <= 3) {
      const fmRes = await GetPersonalFM()
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
      if (!ids.length) return
      player.addSongsToPlaylist(ids)
    }
  }
  player.playNextSong && player.playNextSong()
}

function prev() {
  player.playPrevSong ? player.playPrevSong() : player.playNextSong()
}

function onSeek() {
  if (!player.audio) return
  player.audio.currentTime = seekValue.value
  currentTime.value = seekValue.value
  player.currentSongTime = seekValue.value
}

function seekTo(time: number) {
  if (player.audio) {
    player.audio.currentTime = time
    currentTime.value = time
    isUserScrolling.value = false // 点击歌词跳转时，强制接管滚动
    nextTick(() => scrollToActive('smooth'))
  }
}

function handleClose() {
  pageCtrl.isShowLyric()
}

function formatTime(s: number) {
  s = Math.floor(s) || 0
  const m = Math.floor(s / 60)
  const sec = (s % 60).toString().padStart(2, '0')
  return `${m}:${sec}`
}

function onVolume() {
  if (player.audio) player.audio.volume = volume.value
  if (volume.value > 0) prevVolume.value = volume.value
}

const TurnIn = (artistid: number) => {
  pageCtrl.ShowLyric = false
  router.push({ name: 'artist', params: { id: artistid } })
}
</script>

<style scoped lang="scss">
/* ================= 全局容器 ================= */
.player-page {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 2000;
  background: #000; /* 纯黑底色 */
  color: #fff;
  font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'PingFang SC', sans-serif;
  user-select: none;
  overflow: hidden;
}

/* 背景层：重度模糊 */
.bg-layer {
  position: absolute;
  inset: -60px;
  background-size: cover;
  background-position: center;
  /* 关键：高模糊、高饱和、低亮度 */
  filter: blur(100px) saturate(220%) brightness(0.4);
  z-index: 1;
  opacity: 0.8;
  transform: scale(1.1);
  transition: background-image 0.8s ease;
}
.bg-mask {
  position: absolute;
  inset: 0;
  background: linear-gradient(to bottom, rgba(0, 0, 0, 0.1), rgba(0, 0, 0, 0.5));
  z-index: 2;
}

.close-btn {
  position: absolute;
  top: 30px;
  right: 30px;
  z-index: 10;
  background: rgba(255, 255, 255, 0.08);
  border: none;
  border-radius: 12px;
  width: 44px;
  height: 44px;
  color: rgba(255, 255, 255, 0.6);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  backdrop-filter: blur(10px);
}
.close-btn:hover {
  background: rgba(255, 255, 255, 0.2);
  color: #fff;
}

/* ================= 布局 Grid ================= */
.content-layout {
  position: relative;
  z-index: 5;
  width: 100%;
  height: 100%;
  display: grid;
  /* 调整比例：左侧稍微窄一点，给歌词更多空间 */
  grid-template-columns: 42% 58%;
  padding: 0 4%;
  box-sizing: border-box;
}

/* ================= 左侧：控制区 ================= */
.left-column {
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding-right: 60px;
  max-width: 500px;
  width: 100%;
  justify-self: end;
  height: 100vh;
}

.cover-wrapper {
  width: 100%;
  aspect-ratio: 1/1;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 30px 60px rgba(0, 0, 0, 0.5); /* 更有深度的阴影 */
  margin-bottom: 40px;
  background: #222;
  transition: transform 0.6s cubic-bezier(0.25, 0.8, 0.25, 1);
}
.album-cover {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.track-info {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  margin-bottom: 24px;
}
.song-title {
  font-size: 30px;
  font-weight: 700;
  margin: 0 0 8px 0;
  line-height: 1.2;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  letter-spacing: -0.5px;
}
.artist-name {
  font-size: 18px;
  color: rgba(255, 255, 255, 0.6);
  margin: 0;
  font-weight: 500;
}
.artist-name span {
  cursor: pointer;
  transition: color 0.2s;
}
.artist-name span:hover {
  color: #fff;
}

.like-btn,
.icon-btn {
  background: transparent;
  border: none;
  color: rgba(255, 255, 255, 0.5);
  cursor: pointer;
  padding: 0;
  transition: all 0.3s;
}
.like-btn:hover,
.icon-btn:hover {
  color: #fff;
  transform: scale(1.1);
}
.like-btn:active,
.icon-btn:active {
  transform: scale(0.95);
}

/* 进度条 */
.progress-bar-wrap {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 30px;
}
.time {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.4);
  width: 40px;
  font-variant-numeric: tabular-nums;
}
.slider {
  -webkit-appearance: none;
  appearance: none;
  height: 4px;
  border-radius: 2px;
  background: rgba(255, 255, 255, 0.1);
  outline: none;
  cursor: pointer;
  position: relative;
  flex: 1;
  background: linear-gradient(
    to right,
    #fff 0%,
    #fff var(--progress),
    rgba(255, 255, 255, 0.1) var(--progress),
    rgba(255, 255, 255, 0.1) 100%
  );
}
.slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 0px;
  height: 0px;
  border-radius: 50%;
  background: #fff;
  cursor: pointer;
  opacity: 0;
  transition:
    opacity 0.2s,
    transform 0.2s;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}
.slider:hover::-webkit-slider-thumb {
  opacity: 1;
  transform: scale(1.2);
}

.controls-row {
  justify-content: center;
  align-items: center;
}
.main-controls {
  display: flex;
  justify-self: center;
  align-items: center;
  gap: 48px;
  padding: 20px;
}
.main-controls .lg {
  color: #fff;
}
.vol-control {
  display: flex;
  align-items: center;
  justify-self: center;
  gap: 10px;
  width: 80%;
  opacity: 0.8;
  transition: opacity 0.2s;
}
.vol-control:hover {
  opacity: 1;
}

/* ================= 右侧：歌词 (重构重点) ================= */
.right-column {
  height: 100vh;
  overflow-y: auto;
  scrollbar-width: none;
  /* 遮罩：让顶部和底部的歌词柔和消失 */
  mask-image: linear-gradient(to bottom, transparent 0%, black 15%, black 85%, transparent 100%);
  -webkit-mask-image: linear-gradient(
    to bottom,
    transparent 0%,
    black 15%,
    black 85%,
    transparent 100%
  );
  display: flex;
  flex-direction: column;
  align-items: flex-start; /* 左对齐 */
  padding-left: 50px;
  padding-right: 60px;
  box-sizing: border-box;
  cursor: grab;
  scroll-behavior: smooth; /* CSS 平滑滚动 */
}
.right-column:active {
  cursor: grabbing;
}
.right-column::-webkit-scrollbar {
  display: none;
}

/* 占位符：调整这些高度来改变第一句和最后一句歌词的位置 */
.lyric-spacer-top {
  height: 45vh;
  flex-shrink: 0;
}
.lyric-spacer-bottom {
  height: 55vh;
  flex-shrink: 0;
}

.lyric-line {
  margin-bottom: 26px;
  cursor: pointer;
  /* 核心动画：弹簧曲线 (Spring Bezier) */
  transition:
    color 1.5s,
    transform 1.5s cubic-bezier(0.34, 1.56, 0.64, 1),
    filter 1.5s,
    opacity 1.5s;
  transform-origin: left center;
  will-change: transform, filter, opacity; /* 性能优化 */

  display: flex;
  flex-direction: column;
  gap: 8px;

  /* --- 默认状态 (未激活) --- */
  color: rgba(255, 255, 255, 0.4); /* 变暗 */
  transform: scale(0.9) translateX(-15px); /* 缩小并左移 */
  filter: blur(2px); /* 深度模糊 */
  opacity: 0.6;
}

.lyric-line:hover {
  filter: blur(0px) !important;
  opacity: 1 !important;
  color: rgba(255, 255, 255, 0.8);
}

/* --- 临近状态 (Active 上下一行) --- */
.lyric-line.nearby {
  filter: blur(1px);
  opacity: 0.8;
  transform: scale(0.95) translateX(-8px);
}

/* --- 激活状态 (Active) --- */
.lyric-line.active {
  color: #fff;
  /* 放大并归位 */
  transform: scale(1.05) translateX(0);
  filter: blur(0);
  opacity: 1;
  margin-bottom: 34px; /* 增加激活行的间距 */

  /* 柔和发光效果 */
  text-shadow: 0 0 24px rgba(255, 255, 255, 0.4);
}

.lyric-origin {
  font-size: 42px;
  font-weight: 1000; /* 加粗 */
  line-height: 1.25;
  letter-spacing: -0.5px;
}
.lyric-trans {
  font-size: 30px;
  font-weight: 800;
  opacity: 0.7;
  line-height: 1.4;
}

.no-lyric-tip {
  height: 200px;
  display: flex;
  align-items: center;
  font-size: 42px;
  color: rgba(255, 255, 255, 0.4);
  letter-spacing: 2px;
}

/* ================= 移动端适配 ================= */
@media (max-width: 900px) {
  .content-layout {
    grid-template-columns: 1fr;
    padding: 24px;
    display: block;
    overflow-y: auto; /* 允许页面整体滚动 */
  }

  .left-column {
    height: auto;
    padding-right: 0;
    max-width: 380px;
    margin: 50px auto 30px;
    justify-self: center;
  }
  .cover-wrapper {
    margin-bottom: 24px;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.4);
  }
  .song-title {
    font-size: 24px;
    text-align: center;
  }
  .artist-name {
    text-align: center;
  }
  .track-info {
    display: block;
    text-align: center;
  }
  .track-actions {
    display: none; /* 移动端简化，隐藏点赞 */
  }

  /* 移动端歌词样式调整 */
  .right-column {
    height: auto; /* 不定高 */
    overflow: visible;
    padding-left: 0;
    align-items: center; /* 居中 */
    mask-image: none;
    -webkit-mask-image: none;
    padding-bottom: 150px;
  }
  .lyric-spacer-top,
  .lyric-spacer-bottom {
    display: none;
  }

  .lyric-line {
    align-items: center;
    text-align: center;
    transform-origin: center; /* 中心缩放 */
    margin-bottom: 20px;

    /* 移动端减弱模糊，为了性能 */
    filter: blur(1px);
    transform: scale(0.95);
  }
  .lyric-line.active {
    transform: scale(1.05);
    filter: blur(0);
    text-shadow: 0 0 10px rgba(255, 255, 255, 0.3);
  }
  .lyric-origin {
    font-size: 24px;
  }
  .lyric-trans {
    font-size: 16px;
  }
}
</style>
