<template>
  <div class="touchbar" role="region" aria-label="player touchbar">
    <div class="left">
      <img v-if="cover" :src="cover" alt="cover" class="cover" />
      <div class="meta">
        <div class="title">{{ title }}</div>
        <div class="artist">{{ artist }}</div>
      </div>
    </div>

    <div class="center">
      <div class="controls">
        <button class="btn" @click="prev">⏮</button>
        <button class="btn play" @click="togglePlay">
          <span v-if="isplaying">⏸</span>
          <span v-else>▶</span>
        </button>
        <button class="btn" @click="next">⏭</button>
      </div>

      <div class="progress-wrap">
        <span class="time">{{ formatTime(currentTime) }}</span>
        <input
          class="progress"
          type="range"
          min="0"
          :max="Math.max(1, duration)"
          step="0.1"
          v-model.number="seekValue"
          @change="onSeek"
          @pointerdown="seeking = true"
          @pointerup="seeking = false"
        />
        <span class="time">{{ formatTime(duration) }}</span>
      </div>
    </div>

    <div class="right">
      <div class="vol">
        <button class="mini" @click="muteToggle">{{ volume > 0 ? '🔊' : '🔈' }}</button>
        <input type="range" min="0" max="1" step="0.01" v-model.number="volume" @input="onVolume" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { Player } from '@/stores/index'

const store = Player()

const audio = store.audio // 复用 store 中的 Audio 实例

const isplaying = computed(() => !!store.isplaying)
const currentSong = computed(() => store.currentSong ?? {})
const cover = computed(() => currentSong.value?.cover || currentSong.value?.image || '')
const title = computed(() => currentSong.value?.name || currentSong.value?.title || '未播放')
const artist = computed(() => currentSong.value?.artist || currentSong.value?.subtitle || '')

const currentTime = ref(0)
const duration = ref(0)
const seekValue = ref(0)
const seeking = ref(false)
const volume = ref(audio?.volume ?? 1)
const prevVolume = ref(volume.value)

onMounted(() => {
  if (!audio) return
  // 同步初始值
  volume.value = audio.volume ?? 1
  duration.value = audio.duration || 0
  currentTime.value = audio.currentTime || 0
  seekValue.value = currentTime.value

  audio.addEventListener('timeupdate', () => {
    if (!seeking.value) {
      currentTime.value = audio.currentTime || 0
      seekValue.value = currentTime.value
    }
  })
  audio.addEventListener('durationchange', () => {
    duration.value = audio.duration || 0
  })
  audio.addEventListener('play', () => {
    /* store.isplaying 会被 store 管理，但确保同步 */
  })
  audio.addEventListener('pause', () => {
    /* 同上 */
  })
  audio.addEventListener('error', (e) => {
    console.error('audio error', e, audio.src)
  })
})

watch(volume, (v) => {
  if (audio) audio.volume = v
})

function formatTime(s = 0) {
  s = Math.floor(s) || 0
  const m = Math.floor(s / 60)
    .toString()
    .padStart(2, '0')
  const sec = (s % 60).toString().padStart(2, '0')
  return `${m}:${sec}`
}

function togglePlay() {
  if (!audio) return
  if (store.isplaying) {
    audio.pause()
    store.isplaying = false
  } else {
    // 如果 currentSong 没有 url，store.playNextSong / store.playcurrentSong 应负责拉取 url
    audio
      .play()
      .then(() => {
        store.isplaying = true
      })
      .catch((e) => {
        console.error('play failed', e)
        store.isplaying = false
      })
  }
}

function onSeek() {
  if (!audio) return
  audio.currentTime = seekValue.value
  currentTime.value = seekValue.value
}

function onVolume() {
  // watch 已把 audio.volume 设好
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
function next() {
  store.playNextSong && store.playNextSong()
}
</script>

<style scoped>
.touchbar {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  height: 64px;
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 6px 16px;
  background: linear-gradient(180deg, rgba(10, 10, 10, 0.95), rgba(10, 10, 10, 0.98));
  color: #fff;
  box-shadow: 0 -2px 8px rgba(0, 0, 0, 0.6);
  z-index: 1000;
  box-sizing: border-box;
}

/* 左侧封面与文字 */
.left {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 220px;
  max-width: 320px;
}
.cover {
  width: 48px;
  height: 48px;
  border-radius: 6px;
  object-fit: cover;
  background: #222;
}
.meta {
  overflow: hidden;
}
.title {
  font-weight: 700;
  font-size: 13px;
  color: #fff;
  white-space: nowrap;
  text-overflow: ellipsis;
  overflow: hidden;
  max-width: 200px;
}
.artist {
  font-size: 12px;
  color: #9aa0a6;
  white-space: nowrap;
  text-overflow: ellipsis;
  overflow: hidden;
  max-width: 200px;
}

/* 中间控制区 */
.center {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 6px;
  align-items: center;
}
.controls {
  display: flex;
  gap: 10px;
  align-items: center;
  margin-bottom: 4px;
}
.btn {
  background: transparent;
  border: none;
  color: #fff;
  font-size: 18px;
  cursor: pointer;
  width: 36px;
  height: 36px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}
.play {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: #fff;
  color: #000;
  font-weight: 700;
}

/* 进度条 */
.progress-wrap {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  max-width: 820px;
}
.time {
  font-size: 12px;
  color: #9aa0a6;
  width: 46px;
  text-align: center;
}
.progress {
  -webkit-appearance: none;
  appearance: none;
  width: 100%;
  height: 6px;
  background: #333;
  border-radius: 6px;
  outline: none;
}
.progress::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: #0bdc9a;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.4);
  cursor: pointer;
}

/* 右侧音量 */
.right {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 140px;
  justify-content: flex-end;
}
.vol {
  display: flex;
  align-items: center;
  gap: 8px;
}
.mini {
  background: transparent;
  border: none;
  color: #fff;
  cursor: pointer;
}
input[type='range'] {
  -webkit-appearance: none;
  height: 6px;
  background: #333;
  border-radius: 6px;
}
input[type='range']::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: #0bdc9a;
  cursor: pointer;
}
</style>
