<template>
  <div class="music-library-page">
    <main class="content">
      <div class="top-tags-bar">
        <button
          class="tag-pill"
          :class="{ active: currentCat === '全部' }"
          @click="handleTagClick('全部')"
        >
          全部
        </button>
        <button
          v-for="tag in topTags"
          :key="tag"
          class="tag-pill"
          :class="{ active: currentCat === tag }"
          @click="handleTagClick(tag)"
        >
          {{ tag }}
        </button>
        <button class="tag-pill icon-btn" :class="{ active: isPanel }" @click="showPanel">
          •••
        </button>
      </div>

      <transition name="fade">
        <div class="filter-panel" v-if="isPanel">
          <div v-for="(category, index) in filterCategories" :key="index" class="filter-row">
            <div class="filter-label">{{ category.name }}</div>
            <div class="filter-options">
              <span
                v-for="opt in category.options"
                :key="opt"
                class="option-item"
                :class="{ active: currentCat === opt }"
                @click="handleTagClick(opt)"
              >
                {{ opt }}
              </span>
            </div>
          </div>
        </div>
      </transition>

      <div class="playlist-grid">
        <div
          class="playlist-card"
          v-for="item in playlists"
          :key="item.id"
          @click="goToDetail(item.id)"
        >
          <div class="cover-box">
            <img
              :src="item.coverImgUrl + '?param=300y300'"
              class="cover-img"
              loading="lazy"
              alt=""
            />
            <div class="hq-badge">{{ item.tag }}</div>
            <button class="play-btn" @click.stop="playPlaylist(item)">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                <path d="M8 5v14l11-7z" />
              </svg>
            </button>
          </div>
          <div class="card-name">{{ item.name }}</div>
        </div>

        <template v-if="loading">
          <div class="playlist-card skeleton" v-for="n in 5" :key="'skel-' + n">
            <div class="cover-box"></div>
            <div class="text-placeholder"></div>
          </div>
        </template>
      </div>

      <div ref="loadTrigger" class="load-trigger">
        <span v-if="loading">加载中...</span>
        <span v-else-if="!hasMore && playlists.length > 0">没有更多了</span>
      </div>

      <div v-if="!loading && playlists.length === 0" class="empty-state">暂无该分类歌单</div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { getHighQualityPlaylists } from '@/api/GetMusicList'
import { MusicIdList } from '@/api/GetMusicFromList'
import { Player } from '@/stores/index'

const router = useRouter()
const player = Player()

export interface PlaylistItem {
  id: number
  name: string
  coverImgUrl: string
  playCount: number
  tag: string
  updateTime: number // 必须有这个字段用于分页
  creator: {
    nickname: string
  }
}

// --- 状态定义 ---
const isPanel = ref(false)
const playlists = ref<PlaylistItem[]>([])
const currentCat = ref('全部')

// 分页核心状态
const loading = ref(false)
const hasMore = ref(true) // 是否还有更多数据
const lastTime = ref<number | undefined>(undefined) // 上一页最后一条的时间戳
const loadTrigger = ref<HTMLElement | null>(null) // DOM 引用
let observer: IntersectionObserver | null = null

// 静态配置
const topTags = ['华语', '流行', '摇滚', '民谣', '电子', '说唱', 'ACG']
const filterCategories = [
  { name: '语种', key: 'language', options: ['华语', '欧美', '日语', '韩语', '粤语'] },
  {
    name: '风格',
    key: 'style',
    options: [
      '流行',
      '摇滚',
      '民谣',
      '电子',
      '舞曲',
      '说唱',
      '轻音乐',
      '爵士',
      '古典',
      '金属',
      '朋克',
      '古风',
      '后摇',
    ],
  },
  {
    name: '场景',
    key: 'scenario',
    options: ['清晨', '夜晚', '学习', '工作', '午休', '驾车', '运动', '旅行', '酒吧'],
  },
  {
    name: '情感',
    key: 'mood',
    options: ['怀旧', '清新', '浪漫', '伤感', '治愈', '放松', '孤独', '感动', '兴奋', '快乐'],
  },
  {
    name: '主题',
    key: 'theme',
    options: ['影视原声', 'ACG', '儿童', '游戏', '经典', '翻唱', '吉他', '钢琴'],
  },
]

// --- 核心方法 ---

/**
 * 获取数据
 * @param isLoadMore true=追加数据(分页), false=覆盖数据(刷新/切换标签)
 */
const fetchData = async (isLoadMore = false) => {
  // 防止重复请求或在没有更多数据时请求
  if (loading.value) return
  if (isLoadMore && !hasMore.value) return

  loading.value = true
  try {
    const res: any = await getHighQualityPlaylists({
      cat: currentCat.value,
      limit: 20,
      before: isLoadMore ? lastTime.value : undefined, // 只有追加时才传 before
    })

    const newItems: PlaylistItem[] = res.playlists || []

    if (isLoadMore) {
      // 追加模式：拼接到原数组后面
      playlists.value.push(...newItems)
    } else {
      // 刷新模式：直接覆盖
      playlists.value = newItems
    }

    // 更新分页状态
    if (newItems.length > 0) {
      // 记录最后一条数据的 updateTime，供下一次请求使用
      lastTime.value = newItems[newItems.length - 1].updateTime
      hasMore.value = res.more // API 通常会返回 more 字段告诉是否还有下一页
    } else {
      hasMore.value = false
    }
  } catch (e) {
    console.error('获取歌单失败', e)
    hasMore.value = false // 出错时防止无限请求
  } finally {
    loading.value = false
  }
}

// 标签点击（重置并重新加载）
const handleTagClick = (tag: string) => {
  if (currentCat.value === tag && playlists.value.length > 0) return
  currentCat.value = tag

  // 重置所有状态
  playlists.value = []
  lastTime.value = undefined
  hasMore.value = true

  // 加载第一页
  fetchData(false)
}

// 初始化 IntersectionObserver 实现无限滚动
const setupIntersectionObserver = () => {
  observer = new IntersectionObserver(
    (entries) => {
      const entry = entries[0]
      // 只有当元素进入视口，且还有更多数据，且当前不在加载中时，才触发
      if (entry.isIntersecting && hasMore.value && !loading.value) {
        fetchData(true) // 加载下一页
      }
    },
    {
      rootMargin: '200px', // 提前 200px 触发，让体验更丝滑
    },
  )

  if (loadTrigger.value) {
    observer.observe(loadTrigger.value)
  }
}

// 播放逻辑
const playPlaylist = async (item: PlaylistItem) => {
  try {
    player.playFM = false
    player.playnormal = true
    if (!item?.id) {
      console.warn('play: missing item.id', item)
      return
    }
    console.log(typeof item.id)
    // 注意：以对象形式传参（避免 toFormData 报错）
    const idRes: any = await MusicIdList({ id: item.id })
    
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
    // 把标准化的 id 列表加入播放器
    await player.addWholePlaylist(ids)
    const firstId = idRes[0].id
    player.nextSongUrl = null
    // 调用播放（如果 store.playcurrentSong 支持传 url，可直接传；否则按你现有逻辑处理）
    await player.playcurrentSong({
      firstId,
    } as any)
    player.loadPlaylistData()
    console.log('isplaying', player.isplaying)
  } catch (err) {
    console.error('play failed:', err)
  }
}

const showPanel = () => {
  isPanel.value = !isPanel.value
}

const goToDetail = (id: number) => {
  router.push({ name: 'musiclist', params: { id: id } })
}

// 生命周期
onMounted(() => {
  fetchData(false) // 初始加载
  setupIntersectionObserver() // 启动监听
})

onUnmounted(() => {
  if (observer) observer.disconnect() // 销毁监听
})
</script>

<style scoped lang="scss">
// 变量
$bg-color: #1c1c1e;
$panel-bg: #1e1e1e;
$text-main: #e0e0e0;
$text-sub: #888888;
$accent-color: #3a3a3a;

.music-library-page {
  background-color: $bg-color;
  color: $text-main;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.content {
  padding: 20px 40px;
  max-width: 1400px;
  margin: 0 auto;
  width: 100%;
}

// --- 顶部标签 ---
.top-tags-bar {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 20px;

  .tag-pill {
    background: transparent;
    border: none;
    color: $text-sub;
    padding: 6px 16px;
    border-radius: 18px;
    cursor: pointer;
    font-size: 14px;
    transition: all 0.2s;

    &:hover {
      color: $text-main;
      background: rgba(255, 255, 255, 0.05);
    }
    &.active {
      background-color:#3a3a3a;
      color: $text-main;
      font-weight: bold;
    }
    &.icon-btn.active {
      background-color: $accent-color;
      color: white;
    }
  }
}

// --- 动画 ---
.fade-enter-active,
.fade-leave-active {
  transition:
    opacity 0.3s ease,
    transform 0.3s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

// --- 筛选面板 ---
.filter-panel {
  background-color: $panel-bg;
  border-radius: 12px;
  padding: 20px 30px;
  margin-bottom: 30px;

  .filter-row {
    display: flex;
    margin-bottom: 16px;
    line-height: 2;
    &:last-child {
      margin-bottom: 0;
    }

    .filter-label {
      width: 60px;
      color: $text-sub;
      font-weight: bold;
      font-size: 13px;
      padding-top: 2px;
    }
    .filter-options {
      flex: 1;
      display: flex;
      flex-wrap: wrap;
      gap: 8px 24px;
      font-size: 13px;
      .option-item {
        color: $text-sub;
        cursor: pointer;
        padding: 2px 8px;
        border-radius: 4px;
        transition: all 0.2s;
        &:hover {
          color: $text-main;
        }
        &.active {
          color: #fff;
          background: #3a3a3a;
          font-weight: 500;
        }
      }
    }
  }
}

// --- 歌单网格 ---
.playlist-grid {
  display: grid;
  // 响应式布局：每列最小180px
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 24px;

  .playlist-card {
    cursor: pointer;
    &:hover {
      .cover-box {
        transform: translateY(-4px); // 封面向上浮动
        .play-btn {
          opacity: 1;
          transform: translate(0, 0); // 按钮浮现
        }
      }
    }

    .cover-box {
      width: 100%;
      aspect-ratio: 1 / 1; // 保持正方形
      position: relative;
      border-radius: 12px; // 圆角
      overflow: hidden;
      background: #252525;
      margin-bottom: 12px;
      transition: transform 0.3s ease; // 平滑过渡

      .cover-img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }

      .hq-badge {
        position: absolute;
        top: 8px;
        right: 8px;
        background: rgba(0, 0, 0, 0.6); // 半透明黑
        backdrop-filter: blur(4px); // 磨砂效果
        color: #fff;
        padding: 4px 8px;
        border-radius: 6px;
        font-size: 11px;
        font-weight: 600;
        display: flex;
        align-items: center;
      }

      .play-btn {
        position: absolute;
        bottom: 12px;
        right: 12px;
        width: 40px;
        height: 40px;
        background: rgba(255, 255, 255, 0.2); // 玻璃拟态
        color: #fff;
        border: none;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        opacity: 0; // 默认隐藏
        transform: translate(0, 10px); // 默认向下偏移
        transition: all 0.3s ease;
        backdrop-filter: blur(4px);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);

        &:hover {
          background: rgba(255, 255, 255, 0.4); // 悬停更亮
          transform: scale(1.1) !important;
        }
        &:active {
          transform: scale(0.95) !important;
        }
      }
    }

    .card-name {
      font-size: 14px;
      color: $text-main;
      line-height: 1.4;
      font-weight: 500;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    &.skeleton {
      .cover-box {
        background: linear-gradient(90deg, #222 25%, #2a2a2a 37%, #222 63%);
        background-size: 400% 100%;
        animation: skeleton-load 1.4s ease infinite;
      }
      .text-placeholder {
        height: 16px;
        width: 80%;
        background: #222;
        border-radius: 4px;
      }
    }
  }
}

// --- 加载触发条 ---
.load-trigger {
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: $text-sub;
  font-size: 13px;
  margin-top: 20px;
}

.empty-state {
  text-align: center;
  padding: 60px;
  color: $text-sub;
}

@keyframes skeleton-load {
  0% {
    background-position: 100% 50%;
  }
  100% {
    background-position: 0 50%;
  }
}
</style>
