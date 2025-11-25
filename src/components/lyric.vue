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
            <span v-for="(artist, index) in player.currentSongDetail.artists" :key="artist.id" @click="TurnIn(artist.id)">
              {{ artist.name }}<span v-if="index < player.currentSongDetail.artists.length - 1"> / </span></span>
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
              @input="onVolume"
              v-model.number="player.audio.volume"
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
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
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
const volume = ref(player.audio.volume ?? 1)
const prevVolume = ref(volume.value)
// ==================== 1. 双语歌词解析 ====================
interface LyricLine {
  time: number
  text: string
  translation?: string
}

// 辅助：解析单字符串为数组
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

const lyricLines = computed<LyricLine[]>(() => {
  const rawLyric = player.currentSongLyric
  if (!rawLyric) return []

  // 1. 解析原文
  const origins = parseLrcStr(rawLyric)

  // 2. 解析译文 (如果存在)
  const rawTrans = player.currentSongTLyric || null
  const translations = rawTrans ? parseLrcStr(rawTrans) : []

  // 3. 合并逻辑：转为 Map 以时间为 key 匹配
  // 注意：时间戳可能有细微差异，这里使用 toFixed(1) 模糊匹配前一位小数
  const transMap = new Map(translations.map((t) => [t.time.toFixed(1), t.text]))

  return origins.map((line) => {
    const key = line.time.toFixed(1)
    return {
      ...line,
      translation: transMap.get(key) || '',
    }
  })
})

// ==================== 2. 滚动与定位核心逻辑 ====================
const scrollRef = ref<HTMLElement | null>(null)
const activeIndex = ref(0)
const isUserScrolling = ref(false)
let scrollTimeout: any = null
let rafId: number | null = null
const lyricLineRefs = ref<HTMLElement[]>([])

const setLyricLineRef = (el: any, index: number) => {
  if (el) lyricLineRefs.value[index] = el
}
onMounted(() => {
  const audio = player.audio
  volume.value = player.audiovolume ?? 1
  if (audio) {
    // 初始化状态
    duration.value = player.currentSongDetail.duration || audio.duration || 0
    currentTime.value = player.currentSongTime || 0
    seekValue.value = currentTime.value

    // 绑定事件
    audio.addEventListener('timeupdate', onTimeUpdate)
    audio.addEventListener('durationchange', () => (duration.value = audio.duration))
  }

  // 核心：组件挂载后立即执行一次定位 (使用 auto 模式瞬间跳转)
  //initScrollPosition()
  nextTick(() => scrollToActive('smooth'))
})

onUnmounted(() => {
  const audio = player.audio
  //if (audio) {
  //audio.removeEventListener('timeupdate', onTimeUpdate)
  //}
})

const onTimeUpdate = () => {
  if (!player.audio) return
  if (!isSeeking.value) {
    const t = player.audio.currentTime
    currentTime.value = t
    seekValue.value = t
    player.currentSongTime = t
  }
}
// 监听歌词数据变化（重要！解决切换歌曲后定位问题）
watch(
  lyricLines,
  async (newLyrics) => {
    if (newLyrics.length > 0) {
      activeIndex.value = 0
      await nextTick()
      scrollToTop('auto')
      setTimeout(() => scrollToActive('smooth'), 100)
    } else {
      scrollToTop('auto')
    }
  },
  { immediate: true },
)
// 监听时间变化，更新高亮行
watch(
  () => currentTime.value,
  (newTime) => {
    updateActiveIndex(newTime)
  },
)
const waitForLyricsLoaded = async () => {
  // 等待 lyricLines computed 更新
  await nextTick()
  // 确保有歌词数据
  if (lyricLines.value.length === 0) {
    // 没有歌词，滚动到中间显示"纯音乐"
   setTimeout(() => scrollToActive('smooth'), 100)
  }
}
// 监听歌曲切换（强制重置状态）
watch(
  () => player.currentSong,
  async () => {
    // 立即重置所有状态
    activeIndex.value = 0
    currentTime.value = 0
    seekValue.value = 0
    isUserScrolling.value = false

    // 先清空歌词引用
    lyricLineRefs.value = []
    scrollToTop('auto') // 立即清除旧歌词位置
    // 等待歌词数据加载
    await waitForLyricsLoaded()
  },
)

function updateActiveIndex(time: number) {
  if (lyricLines.value.length === 0) {
    activeIndex.value = 0
    return
  }

  // 二分查找
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
    console.log(`[Lyric] 激活索引变化：${activeIndex.value} -> ${targetIndex}`)
    activeIndex.value = targetIndex
    scrollToActive('smooth')
  }
}
const scrollToTop = (behavior: ScrollBehavior = 'auto') => {
  if (!scrollRef.value) return
  scrollRef.value.scrollTo({ top: 0, behavior })
}
// 打开界面时的初始化定位
const initScrollPosition = async () => {
  activeIndex.value = 0
  currentTime.value = player.currentSongTime
  seekValue.value = currentTime.value

  // 立即滚动到顶部（清除旧位置）
  scrollToTop('auto')

  // 等待 DOM 更新
  await nextTick()

  // 根据当前时间定位
  updateActiveIndex(currentTime.value)

  // 延迟执行，确保歌词渲染完成
  setTimeout(() => {
    scrollToActive('smooth')
  }, 100)
}

function scrollToActive(behavior: ScrollBehavior = 'smooth') {
  if (isUserScrolling.value || !scrollRef.value) return

  const container = scrollRef.value
  // +1 是因为第一个元素是 spacer-top
  const activeEl = container.children[activeIndex.value + 1] as HTMLElement

  if (activeEl) {
    // 计算位置：将当前歌词置于视口垂直方向的 40% 处 (符合人眼习惯)
    const top = activeEl.offsetTop - container.clientHeight * 0.4
    container.scrollTo({ top, behavior })
  }
}

// 用户手动滚动时的防抖
function handleUserScroll() {
  isUserScrolling.value = true
  if (scrollTimeout) clearTimeout(scrollTimeout)
  // 2秒无操作后，恢复自动滚动
  scrollTimeout = setTimeout(() => {
    isUserScrolling.value = false
  }, 1000)
}

// ==================== 3. 控制交互 ====================
function togglePlay() {
  player.togglePlay()
}
const next = async () => {
  scrollToTop('smooth')
  player.playNextSong && player.playNextSong()
  const mappedFmSongs = ref()
  if (player.playFM) {
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
  }
}
function prev() {
  scrollToTop('smooth')
  player.playPrevSong ? player.playPrevSong() : player.playNextSong()
}

function onSeek() {
  if (player.audio) {
    player.audio.currentTime = seekValue.value
    player.currentSongTime = seekValue.value
  }
}

function seekTo(time: number) {
  if (player.audio) {
    player.audio.currentTime = time
    currentTime.value = time
    player.currentSongTime = time
    isUserScrolling.value = false // 强制解除手动锁定
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
  if (volume.value > 0) prevVolume.value = volume.value
}
watch(volume, (v) => {
  player.audiovolume = v
  if (player.audio) player.audio.volume = player.audiovolume
  
  
})

const TurnIn = (artistid) => {
  pageCtrl.ShowLyric = false
  router.push({name: 'artist', params: { id: artistid } } )
}
</script>

<style scoped>
/* ================= 全局容器 ================= */
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
.icon-btn, .like-btn:hover {
  color: #fff;
  transform: scale(1.1);
}
.icon-btn, .like-btn:active {
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

.lyric-line:hover {
  color: rgba(255, 255, 255, 0.7);
  filter: blur(0);
}

/* 原文样式 */
.lyric-origin {
  font-size: 28px;
  font-weight: 700;
  line-height: 1.3;
}
/* 译文样式 */
.lyric-trans {
  font-size: 20px;
  font-weight: 500;
  opacity: 0.8;
  line-height: 1.4;
}

/* 激活状态 */
.lyric-line.active {
  color: #fff;
  transform: scale(1);
  filter: blur(0);
  margin-bottom: 36px; /* 增加间距 */
}
.lyric-line.active .lyric-origin {
  font-size: 36px; /* 激活时更大 */
  text-shadow: 0 0 30px rgba(255, 255, 255, 0.25);
}
.lyric-line.active .lyric-trans {
  font-size: 24px;
  color: rgba(255, 255, 255, 0.8);
}

/* 暂无歌词 */
.no-lyric-tip {
  height: 200px;
  display: flex;
  align-items: center;
  opacity: 0.5;
  font-size: 24px;
  letter-spacing: 2px;
}

/* ================= 移动端适配 ================= */
@media (max-width: 900px) {
  .content-layout {
    grid-template-columns: 1fr;
    padding: 20px;
    overflow-y: auto;
    display: block; /* 转为块级布局 */
  }
  .left-column {
    height: auto;
    padding-right: 0;
    max-width: 400px;
    margin: 60px auto 40px;
    justify-self: center;
  }
  .cover-wrapper {
    margin-bottom: 30px;
  }
  .song-title {
    font-size: 24px;
  }

  .right-column {
    height: auto; /* 让页面自然滚动 */
    overflow: visible;
    padding-left: 0;
    align-items: center;
    mask-image: none;
    -webkit-mask-image: none;
    padding-bottom: 100px;
  }
  .lyric-spacer-top,
  .lyric-spacer-bottom {
    display: none;
  }

  .lyric-line {
    align-items: center;
    text-align: center;
    transform-origin: center;
    margin-bottom: 20px;
  }
  .lyric-line.active {
    transform: scale(1.05);
  }
  .lyric-origin {
    font-size: 22px;
  }
  .lyric-trans {
    font-size: 16px;
  }
  .lyric-line.active .lyric-origin {
    font-size: 26px;
  }
  .lyric-line.active .lyric-trans {
    font-size: 18px;
  }
}
</style>