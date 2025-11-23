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
            <h2 class="song-title" :title="player.currentSongDetial.name">
              {{ player.currentSongDetial.name || '未知歌曲' }}
            </h2>
            <div class="artist-name">
              <span
                v-for="(artist, index) in player.currentSongDetial.artists"
                :key="artist.id"
                @click="TurnIn(artist.id)"
              >
                {{ artist.name
                }}<span v-if="index < player.currentSongDetial.artists.length - 1"> / </span>
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
          <span class="time">{{ formatTime(player.currentSongTime) }}</span>
          <input
            type="range"
            class="slider progress-slider"
            min="0"
            :max="duration || 1"
            step="0.1"
            v-model.number="seekValue"
            @change="onSeek"
            @mousedown="isSeeking = true"
            @mouseup="isSeeking = false"
            :style="{ '--progress': (seekValue / (duration || 1)) * 100 + '%' }"
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
              v-model="volume"
              :style="{ '--progress': volume * 100 + '%' }"
            />
          </div>
        </div>
      </div>

      <div
        class="right-column"
        ref="scrollRef"
        @scroll="handleUserScroll"
        @wheel="handleUserScroll"
      >
        <div class="lyric-spacer-top"></div>

        <div
          v-for="(line, index) in lyricLines"
          :key="index"
          class="lyric-line"
          :class="{
            active: activeIndex === index,
            nearby: Math.abs(activeIndex - index) === 1,
            far: Math.abs(activeIndex - index) > 2,
            'is-yrc': line.isYrc,
          }"
          :style="
            !line.isYrc && activeIndex === index ? { '--curr-progress': lineProgress + '%' } : {}
          "
          @click="seekTo(line.time)"
        >
          <div v-if="line.isYrc" class="lyric-origin yrc-mode">
            <span
              v-for="(word, wIndex) in line.words"
              :key="wIndex"
              class="yrc-word"
              :class="{
                passed: currentTime >= word.endTime,
                active: currentTime >= word.time && currentTime < word.endTime,
              }"
              :style="
                currentTime >= word.time && currentTime < word.endTime
                  ? { '--word-progress': calcWordProgress(word) + '%' }
                  : {}
              "
            >
              {{ word.text }}
            </span>
          </div>

          <div v-else class="lyric-origin lrc-mode" :data-text="line.text">
            {{ line.text }}
          </div>

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
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { Player } from '@/stores/index'
import { pagecontrol } from '@/stores/page'
import { useRouter } from 'vue-router'
import { GetPersonalFM } from '@/api/GetMusicList'

const router = useRouter()
const player = Player()
const pageCtrl = pagecontrol()

// ==================== 基础数据 ====================
const coverUrl = computed(() => player.currentSongDetial?.cover || '')
const currentTime = ref(0)
const duration = ref(0)
const seekValue = ref(0)
const isSeeking = ref(false)
const volume = ref(player.audiovolume ?? 1)

const formatTime = (s: number) => {
  s = Math.floor(s) || 0
  const m = Math.floor(s / 60)
  const sec = (s % 60).toString().padStart(2, '0')
  return `${m}:${sec}`
}
// ==================== 1. 歌词核心逻辑 (支持 YRC + LRC) ====================

// 数据结构定义
interface LyricWord {
  text: string
  time: number // 字开始时间 (秒)
  duration: number // 字持续时间 (秒)
  endTime: number // 字结束时间 (秒)
}

interface LyricLine {
  time: number
  text: string
  translation?: string
  duration?: number // 行总时长
  words?: LyricWord[] // YRC 独有
  isYrc: boolean
}

// 逐字动画相关的 RAF 变量
const lineProgress = ref(0) // 仅用于普通 LRC 模式的整行进度
let rafId: number | null = null

// --- 解析器 A: 普通 LRC ---
const parseLrcStr = (lrc) => {
  const lines: { time: number; text: string }[] = []
  const regex = /\[(\d{2}):(\d{2})(\.\d{2,3})?\]/
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

// --- 解析器 B: NetEase YRC 逐字 ---
// 格式示例: [1230,123](10,20)你(30,40)好
const parseYrcStr = (yrc): LyricLine[] => {
  const lines: LyricLine[] = []
  // 匹配行头: [startTime, duration]
  const lineRegex = /^\[(\d+),(\d+)\](.*)/
  // 匹配字: (offset, duration)text
  const wordRegex = /\((\d+),(\d+)\)([^\(]+)/g

  const rawLines = yrc.split('\n')
  for (const rawLine of rawLines) {
    const lineMatch = lineRegex.exec(rawLine)
    if (lineMatch) {
      const startTime = parseInt(lineMatch[1]) / 1000 // 转为秒
      const lineDuration = parseInt(lineMatch[2]) / 1000
      const content = lineMatch[3]

      const words: LyricWord[] = []
      let fullText = ''
      let wordMatch

      // 循环匹配行内的每个字
      while ((wordMatch = wordRegex.exec(content)) !== null) {
        const offset = parseInt(wordMatch[1]) / 1000
        const wordDur = parseInt(wordMatch[2]) / 1000
        const wordText = wordMatch[3]

        words.push({
          text: wordText,
          time: startTime + offset,
          duration: wordDur,
          endTime: startTime + offset + wordDur,
        })
        fullText += wordText
      }

      if (fullText) {
        lines.push({
          time: startTime,
          duration: lineDuration,
          text: fullText,
          words: words,
          isYrc: true,
        })
      }
    }
  }
  return lines
}

const lyricLines = computed<LyricLine[]>(() => {
  // 1. 尝试获取 YRC 数据
  // 注意：请确保你的 player store 中存储了 raw YRC 数据，字段名假设为 currentSongYrc
  const rawYrc = player.currentSongWordLyric // <--- 确保这里能取到 YRC 字符串
  const rawLrc = player.currentSongLyric

  let parsedOrigin: LyricLine[] = []
  let isYrcMode = false

  if (rawYrc && rawYrc.length > 20) {
    // 简单判断是否有内容
    parsedOrigin = parseYrcStr(rawYrc)
    if (parsedOrigin.length > 0) isYrcMode = true
  }

  // 2. 如果没有有效的 YRC，回退到 LRC 解析
  if (!isYrcMode && rawLrc) {
    const lrcData = parseLrcStr(rawLrc)
    // 为 LRC 补充 duration 字段 (用于普通模式的进度条)
    parsedOrigin = lrcData.map((line, index) => {
      const nextLine = lrcData[index + 1]
      const duration = nextLine ? nextLine.time - line.time : 5
      return {
        ...line,
        duration,
        words: [],
        isYrc: false,
      }
    })
  }

  if (parsedOrigin.length === 0) return []

  // 3. 解析译文 (通用逻辑)
  const rawTrans = player.currentSongTLyric || null
  const translations = rawTrans ? parseLrcStr(rawTrans) : []
  const transMap = new Map(translations.map((t) => [t.time.toFixed(1), t.text]))

  return parsedOrigin.map((line) => {
    const key = line.time.toFixed(1)
    return {
      ...line,
      translation: transMap.get(key) || '',
    }
  })
})

// ==================== 2. 动画循环 (核心) ====================

// 辅助：计算单个字的播放百分比
const calcWordProgress = (word: LyricWord) => {
  if (!word) return 0
  const now = currentTime.value
  if (now < word.time) return 0
  if (now > word.endTime) return 100
  // 计算比例
  const p = (now - word.time) / word.duration
  return Math.min(100, Math.max(0, p * 100))
}

const updateProgressLoop = () => {
  const audio = player.audio
  if (audio && player.isplaying) {
    const t = audio.currentTime
    currentTime.value = t // 这里的更新频率比 timeupdate 事件更高，更丝滑

    // 仅当处于普通 LRC 模式时，才需要计算整行进度
    // YRC 模式的进度是由 template 中的 css 变量动态绑定的
    const currentLine = lyricLines.value[activeIndex.value]
    if (currentLine && !currentLine.isYrc && currentLine.duration) {
      const elapsed = t - currentLine.time
      const p = Math.max(0, Math.min(elapsed / currentLine.duration, 1))
      lineProgress.value = p * 100
    }
  }
  rafId = requestAnimationFrame(updateProgressLoop)
}

// ==================== 3. 滚动与定位 ====================
const scrollRef = ref<HTMLElement | null>(null)
const activeIndex = ref(0)
const isUserScrolling = ref(false)
let scrollTimeout: any = null

// ... (原有 onMounted/onUnmounted 逻辑保持，加入 RAF 启动)
onMounted(() => {
  const audio = player.audio
  if (audio) {
    duration.value = player.currentSongDetial.duration || audio.duration || 0
    currentTime.value = player.currentSongTime || 0
    seekValue.value = currentTime.value
    audio.addEventListener('timeupdate', onTimeUpdate) // 保持用于低频更新
  }
  nextTick(() => scrollToActive('auto'))
  rafId = requestAnimationFrame(updateProgressLoop) // 启动高频循环
})

onUnmounted(() => {
  if (rafId) cancelAnimationFrame(rafId)
  // audio removeEventListener...
})

// 监听 currentTime 更新 activeIndex (使用二分查找保持高效)
watch(
  () => currentTime.value,
  (newTime) => {
    if (isSeeking.value) return
    // 简单的防抖优化，避免每一帧都计算 index
    // 这里直接用原有的 updateActiveIndex 逻辑即可，因为它开销很小
    updateActiveIndex(newTime)
  },
)

const onTimeUpdate = () => {
  if (!player.audio || isSeeking.value) return
  // 仅同步 slider，核心时间由 RAF 驱动
  seekValue.value = player.audio.currentTime
  player.currentSongTime = player.audio.currentTime
}

function updateActiveIndex(time: number) {
  if (lyricLines.value.length === 0) return
  // ... 保持你原有的二分查找逻辑 ...
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

// ... (waitForLyricsLoaded, scrollToTop, handleUserScroll, 保持不变) ...
// ==================== 补全缺失的滚动交互逻辑 ====================

// 处理用户手动滚动
const handleUserScroll = () => {
  // 1. 标记用户正在滚动，暂停自动定位
  isUserScrolling.value = true

  // 2. 清除之前的定时器
  if (scrollTimeout) clearTimeout(scrollTimeout)

  // 3. 设置新的定时器：如果 3 秒内没有新的滚动操作，恢复自动定位
  scrollTimeout = setTimeout(() => {
    isUserScrolling.value = false
  }, 3000)
}

function scrollToActive(behavior: ScrollBehavior = 'smooth') {
  if (isUserScrolling.value || !scrollRef.value) return
  const container = scrollRef.value
  const activeEl = container.children[activeIndex.value + 1] as HTMLElement
  if (activeEl) {
    const top = activeEl.offsetTop - container.clientHeight * 0.4
    container.scrollTo({ top, behavior })
  }
}

// ... (播放控制逻辑 togglePlay, next, prev, onSeek... 保持不变) ...
// ... (TurnIn, formatTime, handleClose... 保持不变) ...
function handleClose() {
  pageCtrl.isShowLyric()
}
function togglePlay() {
  player.togglePlay()
}
const next = () => player.playNextSong && player.playNextSong()
const prev = () => player.playPrevSong && player.playPrevSong()
function onSeek() {
  if (player.audio) player.audio.currentTime = seekValue.value
}
function seekTo(time: number) {
  if (player.audio) {
    player.audio.currentTime = time
    currentTime.value = time
    isUserScrolling.value = false
  }
}
const TurnIn = (id) => {
  router.push({ name: 'artist', params: { id } })
}
</script>

<style scoped>
/* ... (保留你原有的所有全局布局样式) ... */
.player-page {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 2000; /* 确保覆盖主界面 */
  background: #121212;
  color: #fff;
  font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'PingFang SC', sans-serif;
  user-select: none;
  overflow: hidden;
}

/* 背景：深色模糊光晕 */
.bg-layer {
  position: absolute;
  inset: -60px;
  background-size: cover;
  background-position: center;
  /* 关键：高斯模糊 + 饱和度提升 */
  filter: blur(80px) saturate(180%) brightness(0.5);
  z-index: 1;
  transition: background-image 0.5s ease;
}
.bg-mask {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.2);
  z-index: 2;
}

.close-btn {
  position: absolute;
  top: 30px;
  right: 30px;
  z-index: 10;
  background: rgba(255, 255, 255, 0.1);
  border: none;
  border-radius: 8px;
  width: 40px;
  height: 40px;
  color: rgba(255, 255, 255, 0.6);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
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
  /* 桌面端：左 45% - 右 55% */
  grid-template-columns: 45% 55%;
  padding: 0 6%;
  box-sizing: border-box;
}

/* ================= 左侧列 ================= */
.left-column {
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding-right: 80px;
  max-width: 560px;
  width: 100%;
  justify-self: end;
  height: 100vh;
}

.cover-wrapper {
  width: 100%;
  aspect-ratio: 1/1;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
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
  font-size: 32px;
  font-weight: 700;
  margin: 0 0 8px 0;
  line-height: 1.2;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.artist-name {
  font-size: 18px;
  color: rgba(255, 255, 255, 0.6);
  margin: 0;
  span {
    cursor: pointer;
    &:hover {
      color: #fff;
    }
  }
}
.like-btn {
  width: 30px;
  height: 30px;
  background: transparent;
  border: none;
  color: rgba(255, 255, 255, 0.5);
  cursor: pointer;
  transition: all 0.5s;
  padding: 0;
  border-radius: 8px;
  transition: color 0.5s;
  &:hover {
    background-color: rgba(255, 255, 255, 0.1);
  }
}
.icon-btn {
  background: transparent;
  border: none;
  color: rgba(255, 255, 255, 0.5);
  cursor: pointer;
  padding: 0;
  transition: all 0.5s;
  display: flex;
  border-radius: 4px;
  transition: color 0.5s;
  &:hover {
    background-color: rgba(255, 255, 255, 0.1);
  }
}
.icon-btn,
.like-btn:hover {
  color: #fff;
  transform: scale(1.1);
}
.icon-btn,
.like-btn:active {
  transform: scale(0.95);
}

/* 进度条与 Slider */
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
  /* 进度着色 */
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
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: #fff;
  cursor: pointer;
  opacity: 0;
  transition: opacity 0.2s;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
}
.progress-bar-wrap:hover .slider::-webkit-slider-thumb,
.vol-control:hover .slider::-webkit-slider-thumb {
  opacity: 1;
}

/* 底部控制区 */
.controls-row {
  justify-content: center;
  align-items: center;
}
.main-controls {
  display: flex;
  justify-self: center;
  align-items: center;
  gap: 52px;
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
}

/* ================= 右侧：歌词 ================= */
.right-column {
  height: 100vh;
  overflow-y: auto;
  scrollbar-width: none; /* Firefox */
  /* 遮罩：上下边缘渐隐 */
  mask-image: linear-gradient(to bottom, transparent 0%, black 10%, black 80%, transparent 100%);
  -webkit-mask-image: linear-gradient(
    to bottom,
    transparent 0%,
    black 10%,
    black 80%,
    transparent 100%
  );

  display: flex;
  flex-direction: column;
  align-items: flex-start; /* 左对齐 */
  padding-left: 40px;
}
.right-column::-webkit-scrollbar {
  display: none;
}

/* 占位符 */
.lyric-spacer-top {
  height: 40vh;
  flex-shrink: 0;
}
.lyric-spacer-bottom {
  height: 60vh;
  flex-shrink: 0;
}

/* 单行歌词 */
.lyric-line {
  margin-bottom: 28px;
  cursor: pointer;
  transition: all 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  transform-origin: left center;

  /* 默认未激活样式 */
  color: rgba(255, 255, 255, 0.4);
  transform: scale(0.95);
  filter: blur(0.8px);

  display: flex;
  flex-direction: column;
  gap: 6px; /* 双语间距 */
}
/* ================= 歌词样式重构 ================= */

.lyric-line {
  margin-bottom: 28px;
  cursor: pointer;
  transition: all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  transform-origin: left center;
  /* 默认状态 */
  color: rgba(255, 255, 255, 0.4);
  transform: scale(0.95);
  filter: blur(0.8px);
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.lyric-line:hover {
  filter: blur(0);
  color: rgba(255, 255, 255, 0.6);
}

/* 激活行通用样式 */
.lyric-line.active {
  color: #fff;
  transform: scale(1);
  filter: blur(0);
  margin-bottom: 36px;
}

/* --- 模式 A: YRC 逐字样式 --- */
.yrc-mode {
  display: flex;
  flex-wrap: wrap;
  font-size: 36px; /* 激活时默认大小 */
  font-weight: 700;
  line-height: 1.3;
}

.yrc-word {
  display: inline-block;
  margin-right: 2px; /* 字间距 */
  transition: color 0.2s;
  color: rgba(255, 255, 255, 0.4); /* 未唱的字：灰色 */
}

/* 1. 已经唱过的字 */
.yrc-word.passed {
  color: #fff; /* 纯白 */
  transition: color 0.1s;
}

/* 2. 正在唱的字 (核心效果) */
.yrc-word.active {
  /* 背景渐变：左白，右灰，中间由 --word-progress 控制 */
  background-image: linear-gradient(
    to right,
    #fff var(--word-progress),
    rgba(255, 255, 255, 0.4) var(--word-progress)
  );
  background-clip: text;
  -webkit-background-clip: text;
  color: transparent; /* 文字透明，显示背景 */

  /* 可选：当前字稍微放大一点点，类似 Apple Music 动效 */
  transform: scale(1.05);
  transition: transform 0.1s;
}

/* --- 模式 B: LRC 逐行样式 (回退) --- */
.lrc-mode {
  font-size: 28px;
  font-weight: 700;
  line-height: 1.3;
  background-clip: text;
  -webkit-background-clip: text;
  color: rgba(255, 255, 255, 0.4);
  /* 默认背景 */
  background-image: linear-gradient(to right, #fff 0%, #fff 0%);
  background-repeat: no-repeat;
  transition: color 0.3s;
}

/* 激活时的 LRC */
.lyric-line.active .lrc-mode {
  font-size: 36px;
  background-image: linear-gradient(
    to right,
    #fff var(--curr-progress),
    rgba(255, 255, 255, 0.4) var(--curr-progress)
  );
  color: transparent;
  filter: drop-shadow(0 0 10px rgba(255, 255, 255, 0.3));
}

/* 译文 */
.lyric-trans {
  font-size: 20px;
  font-weight: 500;
  opacity: 0.8;
  line-height: 1.4;
}
.lyric-line.active .lyric-trans {
  font-size: 24px;
  color: rgba(255, 255, 255, 0.8);
}

/* 移动端适配 */
@media (max-width: 900px) {
  .yrc-mode {
    justify-content: center; /* 移动端居中 */
    font-size: 26px;
  }
  .lrc-mode {
    font-size: 22px;
  }
  .lyric-line.active .lrc-mode,
  .lyric-line.active .yrc-mode {
    font-size: 28px;
  }
  .yrc-word {
    margin-right: 1px;
  }
}
</style>
