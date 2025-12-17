<template>
  <div class="local-music-page">
    <div class="header-actions">
      <div class="title">本地音乐</div>
      <div class="actions">
        <button class="btn-import" @click="importFiles" :disabled="isMatching">导入音乐</button>
        <button class="btn-import" @click="importFolder" :disabled="isMatching">导入文件夹</button>
      </div>
    </div>

    <div v-if="isMatching" class="progress-panel">
      <div class="spinner"></div>
      <div class="status-text">
        <div>
          正在云端匹配: <span class="highlight">{{ currentProcessingName }}</span>
        </div>
        <div class="count">{{ processedCount }} / {{ totalCount }}</div>
      </div>
      <div class="progress-bar">
        <div class="fill" :style="{ width: (processedCount / totalCount) * 100 + '%' }"></div>
      </div>
    </div>

    <div v-else class="song-list-container">
      <div class="list-header">
        <div class="col-cover"></div>
        <div class="col-title">标题</div>
        <div class="col-artist">歌手</div>
        <div class="col-album">专辑</div>
        <div class="col-time">时长</div>
      </div>

      <div class="song-list">
        <div
          v-for="(song, index) in songs"
          :key="song.id"
          class="song-item"
          :class="{ 'menu-active': activeMenuId === song.id }"
          @dblclick="playSong(song)"
        >
          <div class="song-index">{{ index + 1 }}</div>

          <div class="cover-container">
            <img :src="song.cover || defaultCover" class="cover-img" @error="handleImgError" />
          </div>

          <div class="main-info">
            <div class="song-title">{{ song.name }}</div>
          </div>
          <div class="artist-info">{{ song.artist }}</div>
          <div class="album-info">{{ song.album }}</div>
          <div class="right-actions">
            <div class="match-dot" :class="{ active: song.neteaseId > 0 }" title="歌词已就绪"></div>

            <div class="more-container" @dblclick.stop>
              <button class="more" @click.stop="toggleMenu(song.id)">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                  <path
                    d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"
                  />
                </svg>
              </button>

              <transition name="fade">
                <div class="dropdown-menu" v-show="activeMenuId === song.id" @click.stop>
                  <div class="menu-item" @click="handleMenuAction('next', song)">
                    <svg viewBox="0 0 24 24" width="16" height="16">
                      <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" fill="currentColor" />
                    </svg>
                    <span>下一首播放</span>
                  </div>

                  <div class="menu-item delete" @click="handleMenuAction('delete', song)">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    >
                      <polyline points="3 6 5 6 21 6"></polyline>
                      <path
                        d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"
                      ></path>
                    </svg>
                    <span>从列表删除</span>
                  </div>
                </div>
              </transition>
            </div>

            <span class="song-duration">{{ formatTime(song.duration) }}</span>
          </div>
        </div>
      </div>

      <div v-if="songs.length === 0 && !isMatching" class="empty-tip">暂无音乐，请导入</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { findBestMatch } from '@/api/MatchService'
import { Player } from '@/stores/index'
import { useRoute } from 'vue-router'
import { pagecontrol } from '@/stores/page'
const player = Player()
const route = useRoute()
const songs = ref<any[]>([])
const isMatching = ref(false)
const processedCount = ref(0)
const totalCount = ref(0)
const currentProcessingName = ref('')
const defaultCover = 'https://p1.music.126.net/6y-UleORITEDbvrOLV0Q8A==/5639395138885805.jpg'
const localListid = ref(null)
const pagecontroler = pagecontrol()
// --- 菜单状态 ---
const activeMenuId = ref<number | null>(null)
watch(
  () => route.params.id,
  async (newid) => {
    if (!newid) return
    const rawId = Array.isArray(newid) ? newid[0] : newid
    localListid.value = rawId
    console.log(localListid.value)
  },
  { immediate: true },
)
onMounted(() => {
  loadLocalSongs()
  // 注册全局点击事件，用于关闭菜单
  document.addEventListener('click', closeMenu)
})

onUnmounted(() => {
  document.removeEventListener('click', closeMenu)
})

async function loadLocalSongs() {
  if (!window.electronAPI) return
  const id = localListid.value.toString()
  console.log('sid', id)
  const res = ref(null)
  if (id === 'whole') {
    res.value = await window.electronAPI.getAllLocalSongs()
  } else {
    res.value = await window.electronAPI.getLocalPlaylistSongs(id)
  }

  if (res.value && res.value.success) {
    songs.value = res.value.songs.map((s: any) => ({
      ...s,
      artist: s.artist,
      name: s.title,
      cover: s.coverUrl || s.cover, // 优先取数据库存的云端封面
    }))
  }
}

// --- 核心：导入并匹配 ---
async function importFiles() {
  if (!window.electronAPI) return
  const res = await window.electronAPI.openMusicFiles()
  if (res && !res.canceled && res.filePaths.length > 0) {
    await processPaths(res.filePaths)
  }
}

async function importFolder() {
  if (!window.electronAPI) return
  const res = await window.electronAPI.openMusicFolder()
  if (res && !res.canceled && res.folderPath) {
    const files = await window.electronAPI.scanFolder(res.folderPath)
    await processPaths(files)
  }
}

async function processPaths(paths: string[]) {
  isMatching.value = true
  totalCount.value = paths.length
  processedCount.value = 0
  console.log(localListid)
  for (const path of paths) {
    try {
      // 1. 读取本地 ID3 信息
      const tags = await window.electronAPI.getMusicTags(path)
      if (!tags) continue

      currentProcessingName.value = tags.title

      // 2. 存入本地数据库 (基础信息)
      const addRes = await window.electronAPI.addLocalSong(tags)
      const localId = tags.id
      if (localListid.value !== 'whole') {
        window.electronAPI.addSongToLocalPlaylist({
          playlistId: localListid.value,
          songId: localId,
        })
      }

      // 3. 只有当数据库里没有 neteaseId 或者想强制更新时才匹配
      if (addRes && (addRes.success || addRes.error === 'duplicate') && pagecontroler.IsOnline) {
        // --- 调用我们的精准匹配服务 ---
        const matchResult = await findBestMatch({
          title: tags.title,
          artist: tags.artist,
          album: tags.album,
          duration: tags.duration, // 秒
       
        })

        if (matchResult) {
          // 4. 更新数据库：写入网易云 ID 和封面
          await window.electronAPI.updateLocalSongMatchInfo({
            id: localId,
            neteaseId: matchResult.neteaseId,
            title: matchResult.title,
            artist: matchResult.artist,
            album: matchResult.album,
            coverUrl: matchResult.coverUrl,
            lyric: matchResult.lyric,
            Tlyric: matchResult.Tlyric,
            yrc: matchResult.yrc,
            Tyrc: matchResult.Tyrc,
            Romaji: matchResult.Romaji,
          })
          
        }
        
      }
    } catch (e) {
      console.error(e)
    } finally {
      processedCount.value++
    }
  }

  isMatching.value = false
  await loadLocalSongs() // 刷新列表显示最新封面
}

const playSong = async (song: any) => {
  player.playFM = false
  player.playnormal = true
  player.nextSongUrl = null
  await player.addWholePlaylist(songs.value.map((s) => s.id))
  await player.playcurrentSong(song.id)
  player.loadPlaylistData()
}
// --- 菜单相关逻辑 ---

// 1. 关闭菜单
const closeMenu = () => {
  activeMenuId.value = null
}

// 2. 切换菜单
const toggleMenu = (id: number) => {
  if (activeMenuId.value === id) {
    activeMenuId.value = null
  } else {
    activeMenuId.value = id
  }
}

// 3. 处理菜单动作
const handleMenuAction = async (action: string, song: any) => {
  closeMenu() // 点击后立即关闭菜单

  if (action === 'next') {
    // 下一首播放
    await player.addSongToPlaylist(song.id, player.currentSongIndex + 1)
    player.nextSongUrl = null // 清除预加载
    player.loadPlaylistData()
  } else if (action === 'delete') {
    // 从列表删除
    const confirmDelete = confirm(`确定要从列表中移除 "${song.name}" 吗？`)
    if (confirmDelete && window.electronAPI) {
      try {
        // 假设 electronAPI 提供了删除接口
        const res = await window.electronAPI.deleteLocalSong(song.id)
        if (res && res.success) {
          // 从当前视图移除，避免重新加载整个列表
          songs.value = songs.value.filter((s) => s.id !== song.id)
        } else {
          alert('删除失败')
        }
      } catch (e) {
        console.error('Delete failed:', e)
      }
    }
  }
}

function handleImgError(e: Event) {
  ;(e.target as HTMLImageElement).src = defaultCover
}
function formatTime(s: number) {
  if (!s || isNaN(s)) return '00:00'
  if (s > 10000) {
    s = s / 1000
  }
  const intSeconds = Math.floor(s)

  const m = Math.floor(intSeconds / 60)
    .toString()
    .padStart(2, '0')
  const sc = (intSeconds % 60).toString().padStart(2, '0')

  return `${m}:${sc}`
}
</script>

<style scoped lang="scss">
$bg: #1c1c1e;
$text: #e0e0e0;
$primary: #fff;
$menu-bg: #1c1c1e; // 菜单背景
$menu-hover: #3a3a3a; // 菜单悬停

.local-music-page {
  padding: 30px;
  background: $bg;
  min-height: 100vh;
  color: $text;
  font-family:
    system-ui,
    -apple-system,
    sans-serif;
  // 关键：防止菜单被底部截断，留出空间
  padding-bottom: 120px;
}

.header-actions {
  display: flex;
  justify-content: space-between;
  margin-bottom: 20px;
  .title {
    font-size: 24px;
    font-weight: bold;
  }
  .btn-import {
    background: rgba(255, 255, 255, 0.1);
    border: none;
    padding: 8px 16px;
    color: #fff;
    border-radius: 20px;
    cursor: pointer;
    margin-left: 10px;
    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
    &:hover:not(:disabled) {
      background: rgba(255, 255, 255, 0.2);
    }
  }
}

.progress-panel {
  background: #2c2c2e;
  padding: 20px;
  border-radius: 12px;
  margin-bottom: 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  .spinner {
    width: 24px;
    height: 24px;
    border: 3px solid #444;
    border-top: 3px solid $primary;
    border-radius: 50%;
    animation: spin 1s infinite linear;
    margin-bottom: 10px;
  }
  .status-text {
    text-align: center;
    font-size: 14px;
    margin-bottom: 10px;
    .highlight {
      color: $primary;
      font-weight: 500;
    }
    .count {
      color: #888;
      font-size: 12px;
      margin-top: 4px;
    }
  }
  .progress-bar {
    width: 300px;
    height: 4px;
    background: #444;
    border-radius: 2px;
    overflow: hidden;
    .fill {
      height: 100%;
      background: $primary;
      transition: width 0.3s;
    }
  }
}

/* 表头 */
.list-header {
  display: flex;
  color: #888;
  font-size: 13px;
  padding-bottom: 10px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  .col-cover {
    width: 50px;
  }
  .col-title {
    flex: 2;
  }
  .col-artist {
    flex: 1;
  }
  .col-album {
    flex: 1;
  }
  .col-time {
    width: 80px;
    text-align: right;
  }
}

/* 歌曲列表项 */
.song-item {
  display: flex;
  align-items: center;
  height: 60px;
  padding: 0 10px;
  border-radius: 8px;
  transition: background-color 0.2s;
  // 关键：用于 z-index 层级管理，确保菜单在上方
  position: relative;
  z-index: 1;

  &:hover,
  &.menu-active {
    background: rgba(255, 255, 255, 0.05);
    .more-container {
      opacity: 1;
    }
  }

  // 菜单打开时提高层级
  &.menu-active {
    z-index: 100;
  }

  .song-index {
    width: 30px;
    color: #666;
    font-size: 14px;
    text-align: center;
  }
  .cover-img {
    width: 40px;
    height: 40px;
    border-radius: 4px;
    object-fit: cover;
    margin-right: 15px;
  }
  .main-info {
    flex: 2;
    font-size: 15px;
    color: #fff;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .artist-info {
    flex: 1;
    color: #888;
    font-size: 13px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .album-info {
    flex: 1;
    color: #888;
    font-size: 13px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .right-actions {
    width: 80px;
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 10px;

    .match-dot {
      width: 6px;
      height: 6px;
      background: #444;
      border-radius: 50%;
      &.active {
        background: $primary;
        box-shadow: 0 0 4px $primary;
      }
    }
    .song-duration {
      font-size: 13px;
      color: #666;
      width: 40px;
      text-align: right;
    }
  }
}

/* --- 更多操作容器 (三个点按钮) --- */
.more-container {
  position: relative; // 如下拉菜单的定位锚点
  opacity: 0; // 默认隐藏
  transition: opacity 0.2s ease;

  // 手机端或菜单打开时一直显示
  .menu-active & {
    opacity: 1;
  }

  .more {
    width: 28px;
    height: 28px;
    background: none;
    border: none;
    color: #888;
    cursor: pointer;
    padding: 5px;
    border-radius: 50%;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    justify-content: center;

    &:hover {
      background: rgba(255, 255, 255, 0.1);
      color: #fff;
    }
  }
}

/* --- 下拉菜单样式 (复刻 NewSongs) --- */
.dropdown-menu {
  position: absolute;
  top: 100%;
  right: 0;
  width: 140px;
  background-color: rgba($menu-bg, 0.8);
  border-radius: 8px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.6);
  padding: 5px;
  margin-top: 4px;
  border: 1px solid rgba(255, 255, 255, 0.05);
  z-index: 101;

  /* 毛玻璃特效 */
  backdrop-filter: blur(20px) saturate(180%);
  -webkit-backdrop-filter: blur(20px) saturate(180%);
}

.menu-item {
  display: flex;
  align-items: center;
  padding: 8px 10px;
  border-radius: 4px;
  cursor: pointer;
  color: #ddd;
  font-size: 13px;
  transition: background-color 0.2s;

  &:hover {
    background-color: $menu-hover;
    color: #fff;
  }
  &.delete {
    color: #ff5e5e; // 删除红色
    &:hover {
      background-color: rgba(255, 94, 94, 0.1);
    }
  }

  svg {
    margin-right: 8px;
    opacity: 0.8;
    flex-shrink: 0;
  }
}

/* 动画 */
.fade-enter-active,
.fade-leave-active {
  transition:
    opacity 0.2s ease,
    transform 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(-5px);
}

.empty-tip {
  padding: 40px;
  text-align: center;
  color: #666;
}

@keyframes spin {
  100% {
    transform: rotate(360deg);
  }
}
</style>
