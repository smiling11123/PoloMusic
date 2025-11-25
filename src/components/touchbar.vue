<template>
  <div class="touchbar" role="region" aria-label="player touchbar">
    <div class="left-area">
      <div class="cover-container" v-if="store.currentSong">
        <img :src="store.currentSongDetail.cover" alt="cover" class="cover-img" />
        <div class="lyric-btn-overlay" @click="ShowLyric()">
          <svg class="icon-lyric" viewBox="0 0 320 512" fill="currentColor">
            <path
              v-if="!pagecontroler.ShowLyric"
              d="M177 159.7l136 136c9.4 9.4 9.4 24.6 0 33.9l-22.6 22.6c-9.4 9.4-24.6 9.4-33.9 0L160 255.9l-96.4 96.4c-9.4 9.4-24.6 9.4-33.9 0L7 329.7c-9.4-9.4-9.4-24.6 0-33.9l136-136c9.4-9.5 24.6-9.5 34-.1z"
            ></path>
            <path
              v-else
              d="M143 352.3L7 216.3c-9.4-9.4-9.4-24.6 0-33.9l22.6-22.6c9.4-9.4 24.6-9.4 33.9 0l96.4 96.4l96.4-96.4c9.4-9.4 24.6-9.4 33.9 0l22.6 22.6c9.4 9.4 9.4 24.6 0 33.9l-136 136c-9.2 9.4-24.4 9.4-33.8 0z"
            ></path>
          </svg>
        </div>
      </div>
      <div class="meta-info">
        <div class="song-title" :title="store.currentSongDetail.name">
          {{ store.currentSongDetail.name || 'PoloMusic' }}
        </div>
        <div class="artist-name">
          <span
            v-for="(artist, index) in store.currentSongDetail.artists"
            :key="artist.id"
            @click="TurnIn(artist.id)"
          >
            {{ artist.name
            }}<span v-if="index < store.currentSongDetail.artists.length - 1"> / </span>
          </span>
        </div>
      </div>
    </div>

    <div class="center-area">
      <div class="controls-row">
        <button class="ctrl-btn secondary" @click="prev" title="上一首">
          <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
            <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z" />
          </svg>
        </button>

        <button
          class="ctrl-btn primary"
          @click="togglePlay"
          :title="store.isplaying ? '暂停' : '播放'"
        >
          <svg
            v-if="store.isplaying"
            viewBox="0 0 24 24"
            fill="currentColor"
            width="24"
            height="24"
          >
            <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
          </svg>
          <svg v-else viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
            <path d="M8 5v14l11-7z" />
          </svg>
        </button>

        <button class="ctrl-btn secondary" @click="next" title="下一首">
          <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
            <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" />
          </svg>
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
            :style="{
              '--progress':
                (seekValue / Math.max(store.currentSongTime || 1, duration)) * 100 + '%',
            }"
          />
        </div>
        <span class="time-text">{{ formatTime(duration) }}</span>
      </div>
    </div>

    <div class="right-area">
      <button
        title="单曲循环"
        class="onlyone"
        @click="Onlyoneplaymodel()"
        :class="{ active: store.playmodel === 'onlyone' }"
      >
        <svg
          t="1763882308161"
          class="icon"
          viewBox="0 0 1024 1024"
          version="1.1"
          xmlns="http://www.w3.org/2000/svg"
          p-id="8805"
          width="20"
          height="20"
        >
          <path
            d="M720.535243 903.335445H149.97506l54.885186 51.198867a38.32601 38.32601 0 0 1 18.314567 32.884302 43.475153 43.475153 0 0 1-43.884744 36.57062 54.475595 54.475595 0 0 1-32.942814-14.628248L22.007147 899.649126c-14.628248-14.628248-18.256053-40.198425 0-54.826673L146.347255 731.424275c7.314124-7.314124 21.942372-10.941929 32.942814-10.94193A40.549503 40.549503 0 0 1 219.488494 760.680771a45.055004 45.055004 0 0 1-14.628248 29.256496l-47.512549 43.884743h566.815351a225.567583 225.567583 0 0 0 226.737843-226.737843V508.37275a36.57062 36.57062 0 0 1 73.14124 0v98.711417c0 160.910727-135.34055 296.251277-303.506888 296.251278zM303.630176 120.72418h566.815351l-54.885186-51.198868a38.501549 38.501549 0 0 1-18.256053-32.942814 43.41664 43.41664 0 0 1 43.884744-36.57062 54.300056 54.300056 0 0 1 32.884301 14.628248l124.340107 109.71186c14.628248 14.628248 18.314566 40.256938 0 54.885186L877.759651 292.576837c-7.314124 7.314124-21.942372 11.000442-32.884301 11.000442A40.608016 40.608016 0 0 1 804.618412 263.320341a45.055004 45.055004 0 0 1 14.628248-29.256496l47.512549-43.884744H299.943858a234.051967 234.051967 0 0 0-226.737843 234.051967V526.628804a34.522665 34.522665 0 0 1-36.57062 36.57062A34.522665 34.522665 0 0 1 0.064775 526.628804V427.858874c0-171.852657 135.282037-307.134694 303.565401-307.134694z"
            p-id="8806"
          ></path>
          <path
            d="M488.121639 351.265368m29.13947 0l0 0q29.13947 0 29.13947 29.139469l0 257.164599q0 29.13947-29.13947 29.13947l0 0q-29.13947 0-29.13947-29.13947l0-257.164599q0-29.13947 29.13947-29.139469Z"
            p-id="8807"
          ></path>
          <path
            d="M414.512296 689.528973m0-22.410476l0 0q0-22.410476 22.410476-22.410476l160.793701 0q22.410476 0 22.410476 22.410476l0 0q0 22.410476-22.410476 22.410476l-160.793701 0q-22.410476 0-22.410476-22.410476Z"
            p-id="8808"
          ></path>
          <path
            d="M430.968518 460.855424m-13.287537-19.833705l-0.032567-0.048612q-13.287537-19.833705 6.546168-33.121242l77.536175-51.945149q19.833705-13.287537 33.121242 6.546169l0.032568 0.048612q13.287537 19.833705-6.546169 33.121242l-77.536175 51.945149q-19.833705 13.287537-33.121242-6.546169Z"
            p-id="8809"
          ></path>
        </svg>
      </button>
      <button
        title="随机播放"
        class="random"
        @click="Randomplaymodel()"
        :class="{ active: store.playmodel === 'random' }"
      >
        <svg
          t="1763880396362"
          class="icon"
          viewBox="0 0 1024 1024"
          version="1.1"
          xmlns="http://www.w3.org/2000/svg"
          p-id="5903"
          width="20"
          height="20"
        >
          <path
            d="M268.8 256c56.6784 0 109.568 28.0576 141.312 74.9056l5.12 7.936 181.4016 302.3872c14.1824 23.6032 38.8608 38.912 66.2528 41.1648l6.9632 0.256h50.944l0.8704-17.664 0.9216-15.36 0.512-6.8096c1.1776-14.7456 15.0528-23.7568 26.9312-17.5104l13.056 7.0144 15.36 8.704 8.448 4.9664 18.3296 11.2128 9.7792 6.2464 19.7632 13.2608 8.96 6.2464 16.0768 11.6736 13.4656 10.24 5.632 4.4032c10.0864 8.0384 9.6256 24.1664-0.9216 32.512l-11.9808 9.2672-14.4896 10.752-17.1008 12.032-19.456 13.0048-19.6608 12.4416-17.7664 10.5984-15.5648 8.7552-13.1072 7.0656c-11.776 6.0928-24.4224-1.536-25.4976-15.36l-1.0752-14.848-1.024-17.664-0.4608-9.8304h-50.944a170.6496 170.6496 0 0 1-141.312-74.9056l-5.0176-7.936-181.4528-302.3872a85.3504 85.3504 0 0 0-66.2528-41.1648l-7.0144-0.256H170.6496a42.6496 42.6496 0 0 1-4.9664-85.0432L170.6496 256h98.2016z m158.5152 326.144a42.6496 42.6496 0 0 1 14.592 58.4704l-26.7264 44.544A170.6496 170.6496 0 0 1 268.8512 768H170.6496a42.6496 42.6496 0 1 1 0-85.3504h98.2016c29.952 0 57.7536-15.7184 73.1648-41.4208l26.7264-44.4928a42.6496 42.6496 0 0 1 58.5216-14.6944v0.0512z m322.6624-383.488l13.056 7.0144 15.36 8.6528 8.448 4.9664 18.3808 11.264 9.728 6.2464 19.7632 13.2096 8.96 6.2976 16.0768 11.6224 13.4656 10.24 5.632 4.4544c10.1376 8.0384 9.6256 24.1664-0.9216 32.512l-11.9808 9.216-14.4896 10.752c-5.2736 3.8912-10.9568 7.8848-17.0496 12.0832l-19.456 13.0048-19.712 12.3904-17.7664 10.6496-15.5648 8.8064-13.1072 6.9632c-11.776 6.144-24.4224-1.536-25.4976-15.36l-1.0752-14.7968-1.024-17.7152-0.4096-9.7792h-50.944c-27.5456 0-53.3504 13.2608-69.4272 35.6352l-3.7376 5.7856-26.6752 44.4928a42.6496 42.6496 0 0 1-75.52-39.424l2.304-4.5056 26.7264-44.4928a170.6496 170.6496 0 0 1 136.9088-82.5856L669.8496 256h50.944l0.8704-17.7152 0.9216-15.36 0.512-6.7584c1.1776-14.7968 15.0528-23.808 26.9312-17.5104z"
            fill="currentColor"
            p-id="5904"
          ></path>
        </svg>
      </button>
      <button class="tool-btn" @click="ShowPlayList()" title="播放列表">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20">
          <g
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="M4 6h16"></path>
            <path d="M8 12h8"></path>
            <path d="M6 18h12"></path>
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
          v-model.number="audio.volume"
          @input="onVolume"
          class="slider volume-slider"
          :style="{ '--progress': audio.volume * 100 + '%' }"
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
import { useRouter } from 'vue-router'

const router = useRouter()
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
  duration.value = store.currentSongDetail.duration || 0
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

function ShowLyric() {
  pagecontroler.isShowLyric()
}
function ShowPlayList() {
  pagecontroler.isShowPlayList()
}
function formatTime(s = 0) {
  s = Math.floor(s) || 0
  const m = Math.floor(s / 60)
    .toString()
    .padStart(2, '0')
  const sec = (s % 60).toString().padStart(2, '0')
  return `${m}:${sec}`
}
function togglePlay() {
  store.togglePlay()
}
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
  //const nextdata = GetNextPersonalFM()
  //console.log(nextdata)
  const mappedFmSongs = ref()
  if (store.playFM) {
    if (store.currentSongIndex - store.playlist.length <= 3) {
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
      store.addSongsToPlaylist(ids)
    }
  }
  store.playNextSong()
  console.log('列表', store.currentSongList)
  console.log('列表id', store.playlist)
  console.log('当前索引', store.currentSongIndex)
  console.log('FM下一首')
}

const TurnIn = (artistid) => {
  router.push({ name: 'artist', params: { id: artistid } })
}
const Randomplaymodel = () => {
  store.randomplaymodel()
}
const Onlyoneplaymodel = () => {
  store.onlyoneplaymodel()
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
  background: #1c1c1e;
  color: #fff;
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
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
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
  background: rgba(0, 0, 0, 0.5);
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
  span {
    cursor: pointer;
    &:hover {
      color: #fff;
    }
  }
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
  color: rgba(255, 255, 255, 0.4);
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
  background: linear-gradient(
    to right,
    #a1a1a4 0%,
    #afabab var(--progress, 0%),
    rgba(255, 255, 255, 0.1) var(--progress, 0%),
    rgba(255, 255, 255, 0.1) 100%
  );
}

.slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #fff;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.3);
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
.onlyone {
  background: none;
  border: none;
  color: rgba(255, 255, 255, 0.6);
  cursor: pointer;
  padding: 6px;
  border-radius: 8px;
  transition: color 0.2s;
  display: flex;
}
.onlyone svg {
  width: 18px;
  height: 18px;
  fill: currentColor; /* 继承按钮的 color */
}
.onlyone:hover {
  color: #fff;
  background: rgba(255, 255, 255, 0.2);
}
.onlyone.active {
  color: #fff;
  background: rgba(255, 255, 255, 0.2);
}
.random {
  background: none;
  border: none;
  color: rgba(255, 255, 255, 0.6);
  cursor: pointer;
  padding: 6px;
  border-radius: 8px;
  transition: color 0.2s;
  display: flex;
}
.random svg {
  width: 20px;
  height: 20px;
  fill: currentColor; /* 继承按钮的 color */
}
.random:hover {
  color: #fff;
  background: rgba(255, 255, 255, 0.2);
}
.random.active {
  color: #fff;
  background: rgba(255, 255, 255, 0.2);
}
.tool-btn {
  background: none;
  border: none;
  color: rgba(255, 255, 255, 0.6);
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
  .song-title,
  .artist-name {
    max-width: 120px; /* 强制限制文字宽度 */
  }
  .volume-slider {
    display: none; /* 手机端隐藏音量条，节省空间 */
  }
}
</style>
