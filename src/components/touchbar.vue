<template>
  <div class="touchbar" role="region" aria-label="player touchbar">
    
    <div class="left-area">
      <div class="cover-container" v-if="store.currentSong">
        <img :src="store.currentSongDetial.cover" alt="cover" class="cover-img" />
        <div class="lyric-btn-overlay" @click="ShowLyric()">
          <svg class="icon-lyric" viewBox="0 0 320 512" fill="currentColor">
             <path v-if="!pagecontroler.ShowLyric" d="M177 159.7l136 136c9.4 9.4 9.4 24.6 0 33.9l-22.6 22.6c-9.4 9.4-24.6 9.4-33.9 0L160 255.9l-96.4 96.4c-9.4 9.4-24.6 9.4-33.9 0L7 329.7c-9.4-9.4-9.4-24.6 0-33.9l136-136c9.4-9.5 24.6-9.5 34-.1z"></path>
            <path v-else d="M143 352.3L7 216.3c-9.4-9.4-9.4-24.6 0-33.9l22.6-22.6c9.4-9.4 24.6-9.4 33.9 0l96.4 96.4l96.4-96.4c9.4-9.4 24.6-9.4 33.9 0l22.6 22.6c9.4 9.4 9.4 24.6 0 33.9l-136 136c-9.2 9.4-24.4 9.4-33.8 0z"></path>
          </svg>
        </div>
      </div>
      <div class="meta-info">
        <div class="song-title" :title="store.currentSongDetial.name">{{ store.currentSongDetial.name || 'YesPlayMusic' }}</div>
        <div class="artist-name" :title="store.currentSongDetial.artist">{{ store.currentSongDetial.artist || '听你所爱' }}</div>
      </div>
    </div>

    <div class="center-area">
      <div class="controls-row">
        <button class="ctrl-btn secondary" @click="prev" title="上一首">
          <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20"><path d="M6 6h2v12H6zm3.5 6l8.5 6V6z"/></svg>
        </button>
        
        <button class="ctrl-btn primary" @click="togglePlay" :title="store.isplaying ? '暂停' : '播放'">
          <svg v-if="store.isplaying" viewBox="0 0 24 24" fill="currentColor" width="24" height="24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
          <svg v-else viewBox="0 0 24 24" fill="currentColor" width="24" height="24"><path d="M8 5v14l11-7z"/></svg>
        </button>
        
        <button class="ctrl-btn secondary" @click="next" title="下一首">
          <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20"><path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/></svg>
        </button>
      </div>

      <div class="progress-row">
        <span class="time-text">{{ formatTime(currentTime) }}</span>
        <div class="slider-container">
            <input
            class="slider progress-bar"
            type="range"
            min="0"
            :max="Math.max(store.currentSongTime || 1, duration)"
            step="0.1"
            v-model.number="seekValue"
            @change="onSeek"
            @pointerdown="seeking = true"
            @pointerup="seeking = false"
            :style="{ '--progress': (seekValue / (Math.max(store.currentSongTime || 1, duration))) * 100 + '%' }"
            />
        </div>
        <span class="time-text">{{ formatTime(duration) }}</span>
      </div>
    </div>

    <div class="right-area">
      <button class="tool-btn" @click="ShowPlayList()" title="播放列表">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20">
          <g fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M4 6h16"></path><path d="M8 12h8"></path><path d="M6 18h12"></path>
          </g>
        </svg>
      </button>
      
      <div class="volume-control">
        <button class="tool-btn mini" @click="muteToggle" :title="volume > 0 ? '静音' : '取消静音'">
          <span v-if="volume === 0">🔇</span>
           <span v-else-if="volume < 0.5">🔉</span>
           <span v-else>🔊</span>
        </button>
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          v-model.number="volume"
          @input="onVolume"
          class="slider volume-slider"
          :style="{ '--progress': volume * 100 + '%' }"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// 逻辑部分保持原样，没有任何改动
import { ref, computed, onMounted, watch } from 'vue'
import { Player } from '@/stores/index'
import { pagecontrol } from '@/stores/page'
import { GetPersonalFM } from '@/api/GetMusicList'
const store = Player()
const pagecontroler = pagecontrol()
const audio = store.audio
const currentTime = ref(0)
const duration = ref(0)
const seekValue = ref(0)
const seeking = ref(false)
const volume = ref(audio?.volume ?? 1)
const prevVolume = ref(volume.value)

onMounted(() => {
  if (!audio) return
  store.isplaying = false
  volume.value = store.audiovolume ?? 1
  duration.value = store.currentSongDetial.duration || 0
  currentTime.value = store.currentSongTime || 0
  seekValue.value = currentTime.value

  audio.addEventListener('timeupdate', () => {
    if (!seeking.value) {
      currentTime.value = audio.currentTime || 0
      seekValue.value = currentTime.value
      store.currentSongTime = currentTime.value
    }
  })
  audio.addEventListener('durationchange', () => {
    duration.value = audio.duration || 0
  })
  audio.addEventListener('error', (e) => {
    console.error('audio error', e, audio.src)
  })
})

watch(volume, (v) => {
  store.audiovolume = v
  if (audio) audio.volume = store.audiovolume
})

function ShowLyric() { pagecontroler.isShowLyric() }
function ShowPlayList() { pagecontroler.isShowPlayList() }
function formatTime(s = 0) {
  s = Math.floor(s) || 0
  const m = Math.floor(s / 60).toString().padStart(2, '0')
  const sec = (s % 60).toString().padStart(2, '0')
  return `${m}:${sec}`
}
function togglePlay() { store.togglePlay() }
function onSeek() {
  if (!audio) return
  audio.currentTime = seekValue.value
  currentTime.value = seekValue.value
  store.currentSongTime = seekValue.value
}
function onVolume() {
  if (volume.value > 0) prevVolume.value = volume.value
}
function muteToggle() {
  if (volume.value > 0) {
    prevVolume.value = volume.value
    volume.value = 0
  } else {
    volume.value = prevVolume.value || 0.6
  }
}
function prev() {
  if (store.playlist?.length) store.playPrevSong ? store.playPrevSong() : store.playNextSong()
}
const next = async () => {
  //store.playNextSong && store.playNextSong()
  store.playNextSong()
  //const nextdata = GetNextPersonalFM()
  //console.log(nextdata)
  console.log(store.currentSongList.length)
  console.log(store.playlist.length)
  const mappedFmSongs = ref()
  if(store.playFM){
  if (store.currentSongIndex - store.playlist.length <= 3) {
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
    store.addSongsToPlaylist(ids)
  }
}
  console.log('FM下一首')
}
</script>

<style scoped>
/* 布局核心：Grid 布局 
  解决混乱的关键：左中右三栏，中间自适应但最大宽度受限，左右两边平分剩余空间
*/
.touchbar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 72px; /* 稍微增加高度，更大气 */
  z-index: 9999;
  
  display: grid;
  /* 定义三列：左侧自适应，中间固定/弹性，右侧自适应 */
  grid-template-columns: 1fr minmax(320px, 640px) 1fr;
  align-items: center;
  padding: 0 24px;
  gap: 20px;

  /* 视觉风格：磨砂黑 */
  background: rgba(25, 25, 25, 0.95); /* 深色底 */
  backdrop-filter: blur(20px) saturate(180%); /* 毛玻璃 */
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  color: #fff;
  box-shadow: 0 -2px 20px rgba(0, 0, 0, 0.3);
  user-select: none;
}

/* ================= 左侧：信息区 ================= */
.left-area {
  display: flex;
  align-items: center;
  gap: 12px;
  overflow: hidden; /* 关键：防止子元素溢出撑破布局 */
}

.cover-container {
  position: relative;
  width: 48px;
  height: 48px;
  flex-shrink: 0; /* 防止图片被压缩 */
  border-radius: 6px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0,0,0,0.2);
  cursor: pointer;
}

.cover-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s ease;
}

/* 悬停封面显示歌词按钮 */
.lyric-btn-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.2s ease;
}
.cover-container:hover .lyric-btn-overlay {
  opacity: 1;
}
.cover-container:hover .cover-img {
  transform: scale(1.1); /* 微放大效果 */
}
.icon-lyric {
  width: 20px;
  height: 20px;
  color: #fff;
  transform: scale(0.9);
}

.meta-info {
  display: flex;
  flex-direction: column;
  justify-content: center;
  min-width: 0; /* 关键：允许 Flex 子项缩小以触发文字截断 */
}

.song-title {
  font-size: 15px;
  font-weight: 600;
  color: #fff;
  /* 单行省略 */
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.artist-name {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.6);
  margin-top: 2px;
  /* 单行省略 */
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* ================= 中间：控制区 ================= */
.center-area {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
}

.controls-row {
  display: flex;
  align-items: center;
  gap: 24px;
}

.ctrl-btn {
  background: none;
  border: none;
  padding: 0;
  cursor: pointer;
  color: rgba(255, 255, 255, 0.8);
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.ctrl-btn:hover {
  color: #fff;
}
.ctrl-btn:active {
  transform: scale(0.9);
}

.ctrl-btn.secondary {
  width: 32px;
  height: 32px;
}
.ctrl-btn.primary {
  width: 36px;
  height: 36px;
  background: #ffffff; /* 浅色背景突出主按钮 */
  color: #9e9c9c; /* 蓝色或主题色 */
  border-radius: 50%;
  box-shadow: 0 2px 10px rgba(131, 131, 132, 0.2);
}
.ctrl-btn.primary:hover {
  background: #fff;
  transform: scale(1.05);
}

/* 进度条行 */
.progress-row {
  display: flex;
  align-items: center;
  width: 100%;
  gap: 10px;
}

.time-text {
  font-size: 11px;
  color: rgba(255,255,255,0.4);
  font-variant-numeric: tabular-nums; /* 数字等宽，防止跳动 */
  width: 35px;
  text-align: center;
}

.slider-container {
  flex: 1;
  display: flex;
  align-items: center;
  height: 16px; /* 增加点击热区 */
}

/* ================= 统一样式：滑动条 (Range Input) ================= */
.slider {
  -webkit-appearance: none;
  appearance: none;
  width: 100%;
  height: 4px;
  border-radius: 2px;
  background: rgba(255, 255, 255, 0.1); /* 轨道底色 */
  outline: none;
  cursor: pointer;
  position: relative;
}

/* 进度条着色部分（Webkit 技巧：使用 background-image 模拟） */
/* 为了简单且高性能，这里使用 CSS 变量 --progress 控制渐变 */
.slider {
  background: linear-gradient(to right, #a1a1a4 0%, #afabab var(--progress, 0%), rgba(255, 255, 255, 0.1) var(--progress, 0%), rgba(255, 255, 255, 0.1) 100%);
}

.slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #fff;
  box-shadow: 0 1px 4px rgba(0,0,0,0.3);
  transition: transform 0.1s;
  transform: scale(0); /* 默认隐藏滑块，更简洁 */
}

/* 悬停时显示滑块 */
.center-area:hover .slider::-webkit-slider-thumb,
.volume-control:hover .slider::-webkit-slider-thumb {
  transform: scale(1); 
}
.slider:active::-webkit-slider-thumb {
  transform: scale(1.3); 
}

/* ================= 右侧：工具区 ================= */
.right-area {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 16px;
}

.tool-btn {
  background: none;
  border: none;
  color: rgba(255,255,255,0.6);
  cursor: pointer;
  padding: 6px;
  border-radius: 8px;
  transition: color 0.2s;
  display: flex;
}
.tool-btn:hover {
  color: #fff;
  background: rgba(255, 255, 255, 0.2);
}

.volume-control {
  display: flex;
  align-items: center;
  gap: 8px;
}

.volume-slider {
  width: 80px;
}

/* ================= 响应式微调 ================= */
@media (max-width: 768px) {
  .touchbar {
    grid-template-columns: 1fr auto 1fr; /* 保持布局 */
    padding: 0 12px;
  }
  .song-title, .artist-name {
    max-width: 120px; /* 强制限制文字宽度 */
  }
  .volume-slider {
    display: none; /* 手机端隐藏音量条，节省空间 */
  }
}
</style>
