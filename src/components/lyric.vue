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
      <!-- 左侧控制区 (保持不变) -->
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
            step="0.01"
            :value="seekValue"
            @input="onSliderInput"
            @change="onSliderChange"
            @mousedown="startSeek"
            @touchstart="startSeek"
            @mouseup="endSeek"
            @touchend="endSeek"
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

      <!-- ================= 右侧：歌词区 ================= -->
      <div
        class="right-column"
        ref="scrollRef"
        @wheel="handleWheel"
        @touchstart="handleTouchStart"
        @touchmove="handleTouchMove"
        @touchend="handleTouchEnd"
      >
        <div class="lyric-spacer-top"></div>

        <div
          v-for="(line, index) in lyricLines"
          :key="index"
          class="lyric-line"
          :class="{
            active: activeIndex === index,
            nearby: Math.abs(activeIndex - index) === 1,
            'is-yrc': line.words && line.words.length > 0,
            'is-interlude': line.isInterlude, // 标记间奏行
          }"
          :style="{
            '--scroll-y': `-${containerOffset + manualOffset}px`,
            '--delay': isUserScrolling ? '0s' : getDelay(index),
          }"
          @click="line.isInterlude ? null : seekTo(line.time)"
        >
          <div v-if="line.isInterlude" class="interlude-dots">
            <span v-for="n in 3" :key="n" :style="getInterludeDotStyle(line, n)"></span>
          </div>

          <template v-else>
            <div class="lyric-origin">
              <template v-if="line.words && line.words.length > 0">
                <span
                  v-for="(word, wIndex) in line.words"
                  :key="wIndex"
                  class="lyric-word"
                  :class="{
                    'long-note': word.duration > 0.7, // 长音标记
                    'word-active': isWordActive(word), // 当前字激活标记
                  }"
                  :style="getWordStyle(word, index === activeIndex)"
                >
                  {{ word.text }}
                </span>
              </template>
              <template v-else>
                {{ line.text }}
              </template>
            </div>

            <div v-if="line.translation" class="lyric-trans">{{ line.translation }}</div>
            <!-- 罗马音 -->
            <div v-if="line.romaji" class="lyric-romaji">{{ line.romaji }}</div>
          </template>
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
import { ref, computed, watch, onMounted, nextTick, onUnmounted } from 'vue'
import { Player } from '@/stores/index'
import { pagecontrol } from '@/stores/page'
import { useRouter } from 'vue-router'
import { GetPersonalFM } from '@/api/GetMusicList'

const router = useRouter()
const player = Player()
const pagecontroler = pagecontrol()

const coverUrl = computed(() => player.currentSongDetail?.cover || '')
const currentTime = ref(0)
const duration = ref(0)
const volume = ref(player.audiovolume ?? 1)
const seekValue = ref(0)
const isSeeking = ref(false)

const startSeek = () => {
  isSeeking.value = true
}
const endSeek = () => {
  setTimeout(() => {
    isSeeking.value = false
  }, 100)
}
const onSliderInput = (e: Event) => {
  seekValue.value = parseFloat((e.target as HTMLInputElement).value)
}
const onSliderChange = (e: Event) => {
  const val = parseFloat((e.target as HTMLInputElement).value)
  seekValue.value = val
  if (player.audio) {
    player.audio.currentTime = val
    currentTime.value = val
    player.currentSongTime = val
  }
}

let isEventBound = false
let rafId = 0

const updateTimeHighFreq = () => {
  if (player.audio && !player.audio.paused && !isSeeking.value) {
    currentTime.value = player.audio.currentTime
    seekValue.value = currentTime.value
    player.currentSongTime = currentTime.value
  }
  rafId = requestAnimationFrame(updateTimeHighFreq)
}

const bindAudioEvents = () => {
  const audio = player.audio
  if (!audio || isEventBound) return

  audio.addEventListener('timeupdate', () => {
    if (!isSeeking.value && audio.paused) {
      currentTime.value = audio.currentTime
      seekValue.value = currentTime.value
    }
  })

  audio.addEventListener('play', () => {
    cancelAnimationFrame(rafId)
    updateTimeHighFreq()
  })

  audio.addEventListener('pause', () => {
    cancelAnimationFrame(rafId)
  })

  audio.addEventListener('durationchange', () => {
    duration.value = audio.duration || 0
  })
  audio.volume = volume.value
  isEventBound = true

  // 如果已经在播放，立即启动 RAF
  if (!audio.paused) {
    updateTimeHighFreq()
  }
}
onMounted(() => {
  //calculateScrollPosition()
  if (player.audio) {
    bindAudioEvents()
    duration.value = player.audio.duration || player.currentSongDetail.duration || 0
    currentTime.value = player.audio.currentTime || player.currentSongTime || 0
    seekValue.value = currentTime.value
  }
  window.addEventListener('resize', calculateScrollPosition)
})

onUnmounted(() => {
  cancelAnimationFrame(rafId)
})

watch(
  () => player.audio,
  (newAudio) => {
    if (newAudio) {
      isEventBound = false
      bindAudioEvents()
      duration.value = newAudio.duration || 0
      currentTime.value = player.currentSongTime || 0
    }
  },
  { immediate: true },
)

watch(volume, (v) => {
  player.audiovolume = v
  if (player.audio) player.audio.volume = player.audiovolume
})

// ==================== 歌词解析 ====================
interface LyricWord {
  text: string
  time: number
  duration: number
}
interface LyricLine {
  time: number
  duration?: number // 整行持续时间
  text: string
  translation?: string
  romaji?: string
  words?: LyricWord[]
  isInterlude?: boolean // 标记是否为间奏
  endTime?: number // 辅助字段
}

const parseLrcStr = (lrc: string): LyricLine[] => {
  const lines: LyricLine[] = []
  const regex = /\[(\d{2}):(\d{2})(\.\d{2,3})?\]/
  if (!lrc) return []
  for (const line of lrc.split('\n')) {
    const match = regex.exec(line)
    if (match) {
      const min = parseInt(match[1])
      const sec = parseInt(match[2])
      const ms = match[3] ? parseFloat(match[3]) * 1000 : 0
      lines.push({ time: min * 60 + sec + ms / 1000, text: line.replace(regex, '').trim() })
    }
  }
  return lines.filter((l) => l.text)
}

const parseYrcStr = (yrc: string): LyricLine[] => {
  const lines: LyricLine[] = []
  if (!yrc) return []
  const rawLines = yrc.split('\n')
  const lineInfoRegex = /^\[(\d+),(\d+)\](.*)/
  const wordRegex = /\((\d+),(\d+),(\d+)\)([^\(]+)/g

  for (const rawLine of rawLines) {
    const lineMatch = lineInfoRegex.exec(rawLine)
    if (lineMatch) {
      const lineStartTime = parseInt(lineMatch[1]) / 1000
      const lineDuration = parseInt(lineMatch[2]) / 1000 // 获取整行持续时间
      const content = lineMatch[3]
      const words: LyricWord[] = []
      let match
      while ((match = wordRegex.exec(content)) !== null) {
        words.push({
          time: parseInt(match[1]) / 1000,
          duration: parseInt(match[2]) / 1000,
          text: match[4],
        })
      }
      if (words.length > 0) {
        const fullText = words.map((w) => w.text).join('')
        lines.push({
          time: lineStartTime,
          duration: lineDuration,
          endTime: lineStartTime + lineDuration,
          text: fullText,
          words: words,
        })
      }
    }
  }
  return lines.sort((a, b) => a.time - b.time)
}

const lyricLines = computed<LyricLine[]>(() => {
  const yrcRaw = player.currentSongYrc
  const transRaw = yrcRaw ? player.currentSongTYrc : player.currentSongTLyric
  const romaYrcRaw = player.currentSongRoMaYrc
  const normalLrcRaw = player.currentSongLyric

  let mainLines: LyricLine[] = []
  if (yrcRaw) mainLines = parseYrcStr(yrcRaw)
  else if (normalLrcRaw) mainLines = parseLrcStr(normalLrcRaw)

  // 处理翻译和罗马音
  let transLines = transRaw
    ? /\(\d+,\d+,\d+\)/.test(transRaw)
      ? parseYrcStr(transRaw)
      : parseLrcStr(transRaw)
    : []
  let romaLines = romaYrcRaw
    ? /\(\d+,\d+,\d+\)/.test(romaYrcRaw)
      ? parseYrcStr(romaYrcRaw)
      : parseLrcStr(romaYrcRaw)
    : []

  const transMap = new Map()
  transLines.forEach((l) => transMap.set(l.time.toFixed(1), l.text))
  const romaMap = new Map()
  romaLines.forEach((l) => romaMap.set(l.time.toFixed(1), l.text))

  // 合并数据
  const combinedLines = mainLines.map((line) => {
    const key = line.time.toFixed(1)
    let transText = transMap.get(key)
    let romaText = romaMap.get(key)
    // 模糊匹配容错
    if (!transText)
      transText =
        transMap.get((line.time + 0.1).toFixed(1)) || transMap.get((line.time - 0.1).toFixed(1))
    if (!romaText)
      romaText =
        romaMap.get((line.time + 0.1).toFixed(1)) || romaMap.get((line.time - 0.1).toFixed(1))

    return {
      ...line,
      translation: transText || '',
      romaji: romaText || '',
    }
  })

  // === 插入间奏逻辑 ===
  const finalLines: LyricLine[] = []

  // 判断前奏：如果第一句开始时间大于 5 秒
  if (combinedLines.length > 0) {
    const firstLine = combinedLines[0]
    if (firstLine.time > 5) {
      finalLines.push({
        time: 0,
        duration: firstLine.time, // 前奏持续时间
        text: '...',
        isInterlude: true,
        words: [],
      })
    }
  }

  // 2. 插入间奏
  for (let i = 0; i < combinedLines.length; i++) {
    const current = combinedLines[i]
    finalLines.push(current)

    if (i < combinedLines.length - 1) {
      const next = combinedLines[i + 1]
      if (current.endTime) {
        const gap = next.time - current.endTime
        if (gap > 5) {
          // 间奏阈值 5秒
          finalLines.push({
            time: current.endTime,
            duration: gap,
            text: '...',
            isInterlude: true,
            words: [],
          })
        }
      }
    }
  }

  return finalLines
})

const getWordStyle = (word: LyricWord, isLineActive: boolean) => {
  if (!isLineActive) return { '--word-progress': '0%' }

  const now = currentTime.value
  const start = word.time
  const end = word.time + word.duration

  let percent = 0
  if (now >= end) percent = 100
  else if (now > start) percent = ((now - start) / word.duration) * 100

  percent = Math.max(0, Math.min(100, percent))

  return { '--word-progress': `${percent}%` }
}

/**
 * 判断单词是否处于激活状态（用于上浮动效）
 */
const isWordActive = (word: LyricWord) => {
  const now = currentTime.value
  return now >= word.time && now < word.time + word.duration
}

const getInterludeDotStyle = (line: LyricLine, dotIndex: number) => {
  const now = currentTime.value
  const start = line.time
  const duration = line.duration || 1
  const progress = Math.max(0, Math.min(1, (now - start) / duration)) // 0~1

  const segment = 1 / 3
  const startThreshold = (dotIndex - 1) * segment

  // 计算当前点在自己区间的进度
  let dotOpacity = 0.2 // 默认底色
  if (progress > startThreshold) {
    // (当前总进度 - 本段起点) / 本段长度 = 本段内的完成度 (0~1)
    const localProgress = (progress - startThreshold) / segment
    const clampedProgress = Math.min(1, localProgress)
    // 0.2 到 1 的插值
    dotOpacity = 0.2 + 0.8 * clampedProgress
  }

  return {
    opacity: dotOpacity,
    transform: `scale(${0.8 + (0.4 * (dotOpacity - 0.2)) / 0.8})`, // 根据不透明度同步缩放
  }
}

// ... 滚动逻辑 ...
const scrollRef = ref<HTMLElement | null>(null)
const activeIndex = ref(0)
const containerOffset = ref(0)
const manualOffset = ref(0)
const isUserScrolling = ref(false)
let scrollTimer: any = null

const getDelay = (index: number) => {
  const diff = index - activeIndex.value
  if (diff < 0) return '0s'
  if (diff === 0) return '0.05s'
  const delay = 0.1 + diff * 0.08
  return `${Math.min(delay, 0.6)}s`
}

function calculateScrollPosition() {
  if (!scrollRef.value) return
  const container = scrollRef.value
  const children = container.querySelectorAll('.lyric-line')
  const activeEl = children[activeIndex.value] as HTMLElement
  if (activeEl) {
    const containerHeight = container.clientHeight
    const activeTop = activeEl.offsetTop
    containerOffset.value = activeTop - containerHeight * 0.38
  }
}

function activateManualScroll() {
  isUserScrolling.value = true
  if (scrollTimer) clearTimeout(scrollTimer)
  scrollTimer = setTimeout(() => {
    isUserScrolling.value = false
    manualOffset.value = 0
  }, 2500)
}
const handleWheel = (e: WheelEvent) => {
  activateManualScroll()
  manualOffset.value += e.deltaY
}
let startY = 0,
  lastManualOffset = 0
const handleTouchStart = (e: TouchEvent) => {
  activateManualScroll()
  startY = e.touches[0].clientY
  lastManualOffset = manualOffset.value
}
const handleTouchMove = (e: TouchEvent) => {
  e.preventDefault()
  activateManualScroll()
  const currentY = e.touches[0].clientY
  manualOffset.value = lastManualOffset + (startY - currentY)
}
const handleTouchEnd = () => {
  activateManualScroll()
}

watch(
  () => currentTime.value,
  (newTime) => {
    updateActiveIndex(newTime)
  },
)
watch([activeIndex, isUserScrolling], () => {
  if (!isUserScrolling.value) {
    nextTick(() => {
      calculateScrollPosition()
      manualOffset.value = 0
    })
  }
})

function updateActiveIndex(time: number) {
  if (lyricLines.value.length === 0) return
  let left = 0,
    right = lyricLines.value.length - 1,
    targetIndex = 0
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
  if (targetIndex !== activeIndex.value) activeIndex.value = targetIndex
}

watch(
  () => pagecontroler.ShowLyric,
  async (isShow) => {
    if (isShow) {
      await nextTick()
      calculateScrollPosition()
    }
  },
)
watch(lyricLines, async () => {
  activeIndex.value = 0
  containerOffset.value = 0
  manualOffset.value = 0
  await nextTick()
  calculateScrollPosition()
})

// ... 交互函数保持不变 ...
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
function seekTo(time: number) {
  if (player.audio) {
    player.audio.currentTime = time
    currentTime.value = time
    isUserScrolling.value = false
    manualOffset.value = 0
    nextTick(calculateScrollPosition)
  }
}
function handleClose() {
  pagecontroler.isShowLyric()
}
function formatTime(s: number) {
  s = Math.floor(s) || 0
  const m = Math.floor(s / 60)
  const sec = (s % 60).toString().padStart(2, '0')
  return `${m}:${sec}`
}
function onVolume() {
  if (player.audio) player.audio.volume = volume.value
}
const TurnIn = (artistid: number) => {
  pagecontroler.ShowLyric = false
  router.push({ name: 'artist', params: { id: artistid } })
}
</script>

<style scoped lang="scss">
/* 全局样式不变 */
.player-page {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 2000;
  background: #000;
  color: #fff;
  font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif;
  user-select: none;
  overflow: hidden;
}
.bg-layer {
  position: absolute;
  inset: -60px;
  background-size: cover;
  background-position: center;
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
  display: flex;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(10px);
  cursor: pointer;
}
.close-btn:hover {
  background: rgba(255, 255, 255, 0.2);
  color: #fff;
}
.content-layout {
  position: relative;
  z-index: 5;
  width: 100%;
  height: 100%;
  display: grid;
  grid-template-columns: 42% 58%;
  padding: 0 4%;
  box-sizing: border-box;
}
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
  box-shadow: 0 30px 60px rgba(0, 0, 0, 0.5);
  margin-bottom: 40px;
  background: #222;
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
.like-btn,
.icon-btn {
  background: transparent;
  border: none;
  color: rgba(255, 255, 255, 0.5);
  cursor: pointer;
  padding: 0;
  transition: all 0.3s;
}
.vol-control {
  display: flex;
  align-items: center;
  justify-self: center;
  gap: 10px;
  width: 80%;
  opacity: 0.8;
}
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
  height: 4px;
  border-radius: 2px;
  background: rgba(255, 255, 255, 0.1);
  flex: 1;
  background: linear-gradient(
    to right,
    #fff 0%,
    #fff var(--progress),
    rgba(255, 255, 255, 0.1) var(--progress),
    rgba(255, 255, 255, 0.1) 100%
  );
  cursor: pointer;
  position: relative;
}
.slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 0;
  height: 0;
  border-radius: 50%;
  background: #fff;
  transition: all 0.2s;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}
.slider:hover::-webkit-slider-thumb {
  opacity: 1;
  transform: scale(1.2);
  width: 12px;
  height: 12px;
}

/* 歌词区 */
.right-column {
  height: 100vh;
  overflow: hidden;
  position: relative;
  align-items: flex-start;
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
  align-items: flex-start;
  padding-left: 50px;
  padding-right: 60px;
  box-sizing: border-box;
  touch-action: none;
}
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
  will-change: transform, opacity, filter;
  transform: translateY(var(--scroll-y)) scale(1) translate3d(0, 0, 0);
  transition:
    transform 0.7s cubic-bezier(0.34, 1.56, 0.64, 1),
    filter 0.7s ease,
    opacity 0.7s ease,
    color 0.7s ease;
  transition-delay: var(--delay), 0s, 0s, 0s;
  display: flex;
  flex-direction: column;
  gap: 4px;
  color: rgba(255, 255, 255, 0.45);
  filter: blur(2px);
  opacity: 0.5;
}
.lyric-line:hover {
  filter: blur(0px) !important;
  opacity: 1 !important;
  color: rgba(255, 255, 255, 0.8);
}
.lyric-line.active {
  color: #fff;
  filter: blur(0);
  opacity: 1;
  margin-bottom: 34px;
  text-shadow: 0 0 30px rgba(255, 255, 255, 0.3);
  transform: translateY(var(--scroll-y)) scale(1) translate3d(0, 0, 0);
}
.lyric-line.active:not(.is-yrc) {
  color: #fff;
}
.lyric-line.active.is-yrc {
  color: rgba(255, 255, 255, 0.45) !important;
}

.lyric-line.nearby {
  filter: blur(2px);
  opacity: 0.8;
  transform: translateY(var(--scroll-y)) scale(1) translate3d(0, 0, 0);
}

/* 翻译与罗马音 */
.lyric-trans {
  font-size: 30px;
  font-weight: 800;
  opacity: 0.7;
  line-height: 1.4;
  margin-top: 4px;
}
.lyric-romaji {
  font-size: 20px;
  font-weight: 500;
  opacity: 0.5;
  font-family: 'SF Pro Rounded', system-ui;
  margin-top: 2px;
}
.active .lyric-trans {
  color: rgba(255, 255, 255, 0.9);
}
.active .lyric-romaji {
  color: rgba(255, 255, 255, 0.7);
}

.lyric-origin {
  font-size: 42px;
  font-weight: 1000;
  line-height: 1.25;
  letter-spacing: -0.5px;
}
.active .lyric-origin {
  font-size: 50px;
}
.lyric-trans {
  font-size: 30px;
  font-weight: 800;
  opacity: 0.7;
  line-height: 1.4;
  margin-top: 4px;
}

/* 逐字歌词动效优化 */
.lyric-word {
  display: inline-block;
  white-space: pre-wrap;
  background-clip: text;
  -webkit-background-clip: text;
  font-size: 42px;
  font-weight: 1000;
  color: rgba(255, 255, 255, 0.45);
  background-image: linear-gradient(to right, #fff 0%, #fff 100%);
  background-repeat: no-repeat;
  background-size: var(--word-progress) 100%;
}
.lyric-line.active .lyric-word {
  color: rgba(255, 255, 255, 0.45);
  -webkit-text-fill-color: transparent;
  /* 更柔和的渐变 */
  background-image: linear-gradient(to right, #ffffff 50%, rgba(255, 255, 255, 0.45) 50%);
  background-size: 200% 100%;
  background-position: calc(100% - var(--word-progress)) 0;
  /* 关键：0.1s linear 过渡确保在 RAF 帧之间平滑补间，消除抖动 */
  transition: background-position 0.1s linear;
}
.lyric-line:not(.is-yrc) .lyric-origin,
.lyric-line:not(.active) .lyric-word {
  background: none;
  -webkit-text-fill-color: initial;
  color: inherit;
}

/* 间奏圆点 */
.interlude-dots {
  display: flex;
  gap: 12px;
  height: 60px;
  align-items: center;
  justify-content: flex-start;
  padding-left: 10px;
}
.interlude-dots span {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background-color: #fff;
  transition: all 0.3s ease;
}

.no-lyric-tip {
  height: 200px;
  display: flex;
  align-items: center;
  font-size: 42px;
  color: rgba(255, 255, 255, 0.4);
}

@media (max-width: 900px) {
  .content-layout {
    grid-template-columns: 1fr;
    display: block;
    overflow-y: auto;
  }
  .left-column {
    height: auto;
    padding-right: 0;
    max-width: 380px;
    margin: 50px auto 30px;
    justify-self: center;
  }
  .right-column {
    height: auto;
    overflow: visible;
    padding-left: 0;
    align-items: center;
    mask-image: none;
    padding-bottom: 150px;
    touch-action: auto;
  }
  .lyric-spacer-top,
  .lyric-spacer-bottom {
    display: none;
  }
  .lyric-line {
    transform: none !important;
    transition: all 0.3s ease !important;
    transition-delay: 0s !important;
    align-items: center;
    text-align: center;
    margin-bottom: 20px;
    filter: blur(1px);
  }
  .lyric-line.active {
    transform: scale(1.05) !important;
    filter: blur(0);
  }
  .active .lyric-origin {
    font-size: 28px;
  }
  .lyric-origin {
    font-size: 24px;
  }
  .lyric-trans {
    font-size: 16px;
  }
  .lyric-romaji {
    font-size: 14px;
  }
  .lyric-word {
    font-size: 24px;
  }
  .interlude-dots {
    justify-content: center;
  }
}
</style>
