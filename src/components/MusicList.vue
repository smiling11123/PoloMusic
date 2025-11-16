<template>
  <div class="playlist-page">
    <!-- 骨架屏：加载时显示 -->
    <div v-if="isLoading" class="skeleton-loader">
      <!-- 头部骨架 -->
      <div class="playlist-header skeleton">
        <div class="skeleton-cover shimmer"></div>
        <div class="info">
          <div class="skeleton-tags">
            <span class="skeleton-tag shimmer"></span>
            <span class="skeleton-tag shimmer"></span>
          </div>
          <div class="skeleton-title shimmer"></div>
          <div class="skeleton-description shimmer"></div>
          <div class="skeleton-stats">
            <span class="shimmer"></span>
            <span class="shimmer"></span>
          </div>
          <div class="skeleton-actions">
            <div class="skeleton-btn shimmer"></div>
            <div class="skeleton-btn circle shimmer"></div>
            <div class="skeleton-btn circle shimmer"></div>
            <div class="skeleton-btn circle shimmer"></div>
          </div>
        </div>
      </div>

      <!-- 歌曲列表骨架 -->
      <div class="song-list-skeleton">
        <div v-for="i in 10" :key="i" class="song-item-skeleton">
          <span class="skeleton-index shimmer"></span>
          <div class="skeleton-title shimmer"></div>
          <div class="skeleton-album shimmer"></div>
          <div class="skeleton-duration shimmer"></div>
          <div class="skeleton-artist shimmer"></div>
        </div>
      </div>
    </div>

    <!-- 真实内容：加载完成后显示 -->
    <div v-else>
      <!-- 歌单头部信息 -->
      <div class="playlist-header">
        <img :src="playlist.coverImgUrl" alt="歌单封面" class="cover" />
        <div class="info">
          <h1 class="title">{{ playlist.name }}</h1>
          <div class="description-wrapper">
            <p class="description" :class="{ collapsed: shouldCollapse && !isDescriptionExpanded }">
              {{ displayDescription }}
            </p>
            <button v-if="shouldCollapse" class="toggle-btn" @click="toggleDescription">
              {{ isDescriptionExpanded ? '收起' : '展开更多' }}
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" width="16" height="16">
                <path d="M6 9l6 6 6-6" :class="{ rotated: isDescriptionExpanded }" />
              </svg>
            </button>
          </div>
          <div class="stats">
            <span>播放量: {{ formatPlayCount(playlist.playCount) }}</span>
            <span>歌曲数: {{ playlist.trackCount }}</span>
          </div>
          <div class="actions">
            <n-button type="primary" size="large" @click="playAll">
              <template #icon>
                <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </template>
              播放全部
            </n-button>
            <n-button size="large" circle>
              <template #icon>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" width="18" height="18">
                  <path
                    d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
                  />
                </svg>
              </template>
            </n-button>
            <n-button size="large" circle>
              <template #icon>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" width="18" height="18">
                  <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
                  <polyline points="16 6 12 2 8 6" />
                  <line x1="12" y1="2" x2="12" y2="15" />
                </svg>
              </template>
            </n-button>
            <n-button size="large" circle>
              <template #icon>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" width="18" height="18">
                  <circle cx="11" cy="11" r="8"></circle>
                  <path d="m21 21-4.35-4.35"></path>
                </svg>
              </template>
            </n-button>
          </div>
        </div>
      </div>

      <!-- 歌曲列表 -->
      <div class="song-list">
        <n-list :show-divider="false">
          <n-list-item
            v-for="(song, index) in songs"
            :key="song.id"
            class="song-item"
            :class="{ playing: currentSongId === song.id }"
            @click="playSong(song, index)"
          >
            <template #prefix>
              <span class="index">{{ index + 1 }}</span>
              <button class="play-btn" aria-label="播放">
                <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </button>
            </template>
            <div class="leftinfo">
              <div class="song-cover">
                <img :src="song.cover + '?param=50y50'" alt="歌曲封面" />
              </div>

              <div class="song-main-info">
                <div class="song-title">{{ song.name }}</div>
                <div class="song-artist">{{ song.artist }}</div>
              </div>

              <div class="song-album">{{ song.album }}</div>

              <div class="song-duration">{{ formatTime(song.duration) }}</div>
            </div>
          </n-list-item>
        </n-list>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { Player } from '@/stores/index'
import { NButton, NList, NListItem } from 'naive-ui'
import { GetMusicFromList } from '@/api/GetMusicFromList'

// 接口定义
interface Song {
  id: number
  name: string
  album: string
  artist: string
  duration: number
  cover: string
}

interface Playlist {
  id: number
  name: string
  coverImgUrl: string
  description: string
  playCount: number
  trackCount: number
  creator?: {
    nickname: string
    avatarUrl: string
  }
}

// 状态管理
const playerStore = Player()
const route = useRoute()
const isLoading = ref(true)

const playlist = ref<Playlist>({
  id: 0,
  name: '加载中...',
  coverImgUrl: '',
  description: '',
  playCount: 0,
  trackCount: 0,
})

const songs = ref<Song[]>([])

const currentSongId = computed(() => playerStore.currentSong?.id)

// 路由参数处理
const MusicListId = computed(() => {
  const id = route.params.id
  const idStr = Array.isArray(id) ? id[0] : id
  const num = Number(idStr)
  return isNaN(num) ? 0 : num
})

// 加载数据
async function loadPlaylistData() {
  try {
    const id = MusicListId.value
    if (!id) {
      console.error('无效的歌单ID')
      isLoading.value = false
      return
    }

    const res = await GetMusicFromList({ id })
    const playlistData = res.playlist

    // 更新歌单数据
    playlist.value = {
      id: playlistData.id,
      name: playlistData.name,
      coverImgUrl: playlistData.coverImgUrl,
      description: playlistData.description,
      playCount: playlistData.playCount,
      trackCount: playlistData.trackCount,
      creator: playlistData.creator,
    }

    // 更新歌曲列表
    const tracks = playlistData.tracks || []
    songs.value = tracks.map((track: any) => ({
      id: track.id,
      cover: track.al.picUrl,
      name: track.name,
      album: track.al?.name || '未知专辑',
      artist: track.ar?.map((a: any) => a.name).join('、') || '未知歌手',
      duration: track.dt ? Math.floor(track.dt / 1000) : 0,
    }))
  } catch (err) {
    console.error('加载歌单失败:', err)
    playlist.value.name = '加载失败'
  } finally {
    isLoading.value = false
  }
}

// 生命周期
onMounted(() => {
  loadPlaylistData()
})

watch(
  () => MusicListId.value,
  (newId) => {
    if (newId) {
      isLoading.value = true
      loadPlaylistData()
    }
  },
  { immediate: true },
)

// 工具函数
function formatPlayCount(count: number): string {
  if (count > 1000000) return (count / 1000000).toFixed(1) + 'M'
  if (count > 1000) return (count / 1000).toFixed(1) + 'K'
  return count.toString()
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
    .toString()
    .padStart(2, '0')
  const s = (seconds % 60).toString().padStart(2, '0')
  return `${m}:${s}`
}

function playAll() {
  if (songs.value.length > 0) {
    playerStore.addWholePlaylist(songs.value.map((s) => s.id))
    playerStore.playcurrentSong(songs.value[0].id)
  }
}

function playSong(song: Song, index: number) {
  playerStore.addWholePlaylist(songs.value.map((s) => s.id))
  playerStore.playcurrentSong(song.id)
}
// 描述折叠状态
const isDescriptionExpanded = ref(false)
const MAX_DESC_LENGTH = 180 // 最大字符数限制

// 判断是否显示折叠功能
const shouldCollapse = computed(() => {
  return playlist.value.description.length > MAX_DESC_LENGTH
})

// 获取显示的文本
const displayDescription = computed(() => {
  if (!shouldCollapse.value || isDescriptionExpanded.value) {
    return playlist.value.description
  }
  // 截断并添加省略号
  return playlist.value.description.slice(0, MAX_DESC_LENGTH) + '...'
})

// 切换折叠状态
function toggleDescription() {
  isDescriptionExpanded.value = !isDescriptionExpanded.value
}
</script>

<style scoped lang="scss">
.playlist-page {
  padding: 20px;
  color: #000000;
  background: #121212;
  min-height: 100vh;
}

// 骨架屏样式（同步更新为紧凑布局）
.skeleton-loader {
  padding: 20px;
}

.shimmer {
  background: linear-gradient(
    90deg,
    rgba(30, 30, 30, 0.5) 25%,
    rgba(50, 50, 50, 0.7) 50%,
    rgba(30, 30, 30, 0.5) 75%
  );
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}

@keyframes shimmer {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}

.skeleton {
  display: flex;
  gap: 24px;
  margin-bottom: 32px;
  padding-bottom: 24px;

  .skeleton-cover {
    width: 200px;
    height: 200px;
    border-radius: 8px;
  }

  .info {
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: flex-end;

    .skeleton-tags {
      display: flex;
      gap: 8px;
      margin-bottom: 12px;
    }

    .skeleton-tag {
      width: 60px;
      height: 20px;
      border-radius: 12px;
    }

    .skeleton-title {
      width: 70%;
      height: 32px;
      border-radius: 4px;
      margin-bottom: 8px;
    }

    .skeleton-description {
      width: 90%;
      height: 16px;
      border-radius: 4px;
      margin-bottom: 16px;
    }

    .skeleton-stats {
      display: flex;
      gap: 24px;
      margin-bottom: 24px;

      span {
        width: 100px;
        height: 14px;
        border-radius: 4px;
      }
    }

    .skeleton-actions {
      display: flex;
      gap: 12px;
      align-items: center;

      .skeleton-btn {
        width: 120px;
        height: 44px;
        border-radius: 8px;

        &.circle {
          width: 44px;
          height: 44px;
          border-radius: 50%;
        }
      }
    }
  }
}

// ✅ 优化：骨架屏歌曲列表（5列紧凑布局）
.song-list-skeleton {
  max-width: 960px; // ✅ 限制最大宽度
  margin: 32px auto 0; // ✅ 居中

  .song-item-skeleton {
    display: flex;
    align-items: center;
    gap: 12px; // ✅ 减小间距
    padding: 10px 12px; // ✅ 减小内边距
    margin-bottom: 8px;

    .skeleton-index {
      width: 36px;
      height: 14px;
      border-radius: 4px;
    }

    .skeleton-title {
      height: 16px;
      border-radius: 4px;
      width: 60%;
    }
    .skeleton-cover {
      width: 44px; // ✅ 添加封面骨架
      height: 44px;
      border-radius: 6px;
    }
    .skeleton-main-info {
      flex: 1; // ✅ 主信息区
      display: flex;
      flex-direction: column;
      gap: 3px;
    }
    .skeleton-album {
      height: 14px;
      border-radius: 4px;
      width: 80%;
    }

    .skeleton-duration {
      height: 14px;
      border-radius: 4px;
      width: 60%;
    }
  }
}

// 真实内容样式
.playlist-header {
  display: flex;
  gap: 24px;
  margin-bottom: 32px;
  padding-bottom: 24px;
  //border-bottom: 1px solid #333;
  .description-wrapper {
    margin-bottom: 16px;

    .description {
      font-size: 14px;
      color: #9aa0a6;
      line-height: 1.6;
      margin: 0;
      transition: all 0.3s ease;

      // 折叠时的多行截断效果
      &.collapsed {
        display: -webkit-box;
        -webkit-line-clamp: 3; // 最多显示3行
        -webkit-box-orient: vertical;
        overflow: hidden;
        text-overflow: ellipsis;
      }
    }

    .toggle-btn {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      margin-top: 8px;
      background: none;
      border: none;
      color: #00d27f;
      font-size: 13px;
      font-weight: 500;
      cursor: pointer;
      padding: 4px 8px;
      border-radius: 8px;
      transition: all 0.2s ease;

      &:hover {
        background: rgba(0, 210, 127, 0.1);
      }

      svg {
        transition: transform 0.3s ease;

        &.rotated {
          transform: rotate(180deg);
        }
      }
    }
  }
  .cover {
    width: 200px;
    height: 200px;
    border-radius: 8px;
    object-fit: cover;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.5);
  }

  .info {
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: flex-end;


    .title {
      font-size: 32px;
      font-weight: 700;
      margin-bottom: 8px;
      color: #fff;
    }

    .description {
      font-size: 14px;
      color: #9aa0a6;
      margin-bottom: 16px;
    }

    .stats {
      display: flex;
      gap: 24px;
      font-size: 14px;
      color: #9aa0a6;
      margin-bottom: 24px;
    }

    .actions {
      display: flex;
      gap: 12px;
      align-items: center;
      border-radius: 8px;
    }
  }
}
.leftinfo {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1; // ✅ 占据剩余空间
}
// ✅ 优化：歌曲列表容器
.song-list {
  max-width: 960px; // ✅ 限制最大宽度
  margin: 0 auto; // ✅ 居中
  :deep(.n-list),
  :deep(.n-list-item) {
    background-color: transparent !important;
  }
  .song-item {
    padding: 10px 12px; // ✅ 减小内边距
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.3s ease;
    display: grid;
    // ✅ 修正为5列，大幅减小固定宽度
    grid-template-columns: 48px 44px minmax(200px, 2.5fr) 1.5fr 60px;
    align-items: center;
    gap: 12px; // ✅ 减小列间距

    &:hover {
      background: rgba(84, 84, 84, 0.05);
      transform: translateY(-2px);

      .index {
        display: none;
      }
      .play-btn {
        display: inline-flex;
      }
    }

    &.playing {
      background: rgba(11, 220, 154, 0.1);
      border-left: 3px solid #0bdc9a;

      .song-title {
        color: #0bdc9a;
        font-weight: 600;
      }
    }

    // ✅ 序号区域（更窄）
    .index {
      color: #ffffff;
      font-size: 13px; // ✅ 稍微减小
      text-align: center;
      font-weight: 500;
    }

    // ✅ 播放按钮
    .play-btn {
      display: none;
      background: none;
      border: none;
      color: #ffffff;
      cursor: pointer;
      padding: 6px; // ✅ 减小按钮区域
      border-radius: 50%;
      transition: background 0.2s ease;

      &:hover {
        background: rgba(71, 71, 71, 0.1);
      }

      svg {
        width: 16px; // ✅ 减小图标
        height: 16px;
      }
    }

    // ✅ 封面图（更小）
    .song-cover {
      width: 44px; // ✅ 减小
      height: 44px;
      border-radius: 6px;
      overflow: hidden;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
      flex-shrink: 0; // ✅ 防止被压缩

      img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        transition: transform 0.2s ease;

        &:hover {
          transform: scale(1.1);
        }
      }
    }

    // ✅ 主信息区（标题+歌手）
    .song-main-info {
      display: flex;
      flex-direction: column;
      gap: 0px; // ✅ 稍微减小间距
      flex: 1;
      min-width: 200px;
    }

    // ✅ 歌曲标题
    .song-title {
      color: #ffffff;
      font-size: 12px; // ✅ 稍微减小
      font-weight: 500;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    // ✅ 歌手
    .song-artist {
      color: #ffffff;
      font-size: 12px; // ✅ 稍微减小
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    // ✅ 专辑
    .song-album {
      color: #ffffff;
      font-size: 12px; // ✅ 稍微减小
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    // ✅ 时长
    .song-duration {
      color: #ffffff;
      font-size: 12px; // ✅ 稍微减小
      text-align: right;
      font-variant-numeric: tabular-nums;
    }
  }
}

// 📱 响应式优化
@media (max-width: 768px) {
  .song-list {
    .song-item {
      grid-template-columns: 36px 40px 1fr 50px; // ✅ 更紧凑的4列布局
      gap: 8px;
      padding: 8px;

      .song-album {
        display: none; // 隐藏专辑列
      }

      .song-cover {
        width: 40px;
        height: 40px;
      }

      .song-title {
        font-size: 13px;
      }

      .song-artist {
        font-size: 11px;
      }

      .song-duration {
        font-size: 11px;
      }
    }
  }
}

// 💡 大屏优化（可选）
@media (min-width: 1400px) {
  .song-list {
    max-width: 1100px; // ✅ 在大屏下可以稍宽
  }
}
</style>
