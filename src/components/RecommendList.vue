<template>
  <div class="hq-container">
    
    <div class="header-row">
      <h2 class="section-title">推荐歌单</h2>
      
      <div class="nav-controls" v-if="pageCount > 1">
        <button class="ctrl-btn prev" @click="prev" :disabled="currentPage === 0" aria-label="上一页">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
        </button>
        <button class="ctrl-btn next" @click="next" :disabled="currentPage === pageCount - 1" aria-label="下一页">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
        </button>
      </div>
    </div>

    <div class="viewport">
      <div class="slides" :style="{ transform: `translateX(-${currentPage * 100}%)` }">
        <div v-for="(page, pi) in pages" :key="pi" class="slide">
          
          <div v-for="(item, idx) in page" :key="item.id" class="hq-item">
            <div class="hq-card" @click="TurnIn(item)">
              <img :src="item.image" alt="" class="hq-img" loading="lazy" />
              
              <div class="hq-badge" v-if="!pagecontroler.ShowPlayList">
                {{ item.badgeText || '每日推荐' }}
              </div>
              
              <button class="play-btn" @click.stop="play(item)">
                <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </button>
            </div>

            <div class="meta">
              <div class="meta-title">{{ item.title }}</div>
              </div>
          </div>

          <div
            v-for="n in (itemsPerPage - page.length)"
            :key="'ph-' + n"
            class="hq-item placeholder"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed, watchEffect } from 'vue'
import { GetRecommendList } from '@/api/GetMusicList' // 确保路径正确
import { MusicIdList } from '@/api/GetMusicFromList'
import { Player } from '@/stores/index'
import { useRouter } from 'vue-router'
import { pagecontrol } from '@/stores/page'

const router = useRouter()
const store = Player()
const pagecontroler = pagecontrol()

interface Item {
  image: string
  title: string
  subtitle?: string
  badgeText?: string
  id: number
}

const items = ref<Item[]>([])
const currentPage = ref(0)

// --- 响应式布局核心逻辑 ---
const windowWidth = ref(window.innerWidth)
const currentCols = ref(5) // 默认大屏显示5列

// 根据屏幕宽度计算每页显示的个数
const updateColumns = () => {
  windowWidth.value = window.innerWidth
  if (windowWidth.value > 1400) {
    currentCols.value = 5
  } else if (windowWidth.value > 1100) {
    currentCols.value = 4
  } else if (windowWidth.value > 768) {
    currentCols.value = 3
  } else {
    currentCols.value = 2
  }
}

// 监听 resize
onMounted(() => {
  window.addEventListener('resize', updateColumns)
  updateColumns() // 初始化执行一次
  fetchData()
})

onUnmounted(() => {
  window.removeEventListener('resize', updateColumns)
})

// 计算属性：每页数量 = 行数(1) * 动态列数
const itemsPerPage = computed(() => currentCols.value * 1)

// 当列数发生变化时（比如缩放窗口），重置到第一页，防止页码溢出
watchEffect(() => {
  if (currentCols.value) {
    // 可选：重置页码，或者重新计算当前页码使其对应当前的item
    // currentPage.value = 0 
  }
})

// 数据获取
const fetchData = async () => {
  try {
    const res = await GetRecommendList()
    items.value = (res.result || []).map((m: any) => ({
      image: m.picUrl,
      title: m.name,
      subtitle: m.copywriter, // 网易云推荐语通常在 copywriter
      badgeText: m.tag,
      id: m.id,
    }))
  } catch (err) {
    console.error(err)
  }
}

// 分页计算
const pages = computed(() => {
  const result: Item[][] = []
  // 必须要保证 items.value 存在
  if (!items.value.length) return []
  
  for (let i = 0; i < items.value.length; i += itemsPerPage.value) {
    result.push(items.value.slice(i, i + itemsPerPage.value))
  }
  return result
})

const pageCount = computed(() => pages.value.length)

// 翻页逻辑
const prev = () => { if (currentPage.value > 0) currentPage.value-- }
const next = () => { if (currentPage.value < pageCount.value - 1) currentPage.value++ }

// 跳转详情
const TurnIn = (item: Item) => {
  router.push({ name: 'musiclist', params: { id: item.id } })
}

async function play(item: Item) {
  try {
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
    store.addWholePlaylist(ids)

    // 取第一首，先获取可播放 url
    const firstId = ids[0]
    console.log('First track id to play:', firstId)

    // 调用播放（如果 store.playcurrentSong 支持传 url，可直接传；否则按你现有逻辑处理）
    store.playcurrentSong({
      firstId,
    })

    console.log('isplaying', store.isplaying)
  } catch (err) {
    console.error('play failed:', err)
  }
}
</script>

<style scoped lang="scss">
/* 核心布局变量 */
$container-max-width: 1200px; // 与 For You 保持一致
$card-gap: 20px; // 卡片间距

.hq-container {
  width: 100%;
  max-width: $container-max-width;
  margin: 0 auto; // 居中
  padding: 20px 0; // 上下内边距
  position: relative;
  box-sizing: border-box;
  user-select: none;
}

/* 头部样式：标题与按钮对齐 */
.header-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-end; // 底部对齐
  margin-bottom: 16px;
  padding: 0 4px; // 微调对齐
}

.section-title {
  font-size: 24px;
  font-weight: 700;
  color: #fff;
  margin: 0;
}

.nav-controls {
  display: flex;
  gap: 12px;
}

.ctrl-btn {
  background: rgba(255, 255, 255, 0.1);
  border: none;
  color: #fff;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;

  &:hover:not(:disabled) {
    background: rgba(255, 255, 255, 0.2);
  }
  &:disabled {
    opacity: 0.3;
    cursor: default;
  }
  svg {
    width: 18px;
    height: 18px;
  }
}

/* 视口与滑动区域 */
.viewport {
  width: 100%;
  overflow: hidden;
  // border-radius: 12px; // 可选：防止滚动时边缘溢出
}

.slides {
  padding-top: 4px;
  display: flex;
  width: 100%;
  transition: transform 0.4s cubic-bezier(0.25, 1, 0.5, 1); // 更顺滑的动画
}

.slide {
  flex: 0 0 100%; // 每一页占满 100%
  width: 100%;
  display: grid;
  /* 核心修改：使用 JS 计算的 cols，配合 css grid 实现整齐排列 */
  grid-template-columns: repeat(auto-fit, minmax(0, 1fr));
  gap: $card-gap;
  box-sizing: border-box;
}

.hq-item {
  width: 100%;
  /* 占位符样式 */
  &.placeholder {
    pointer-events: none;
    visibility: hidden;
  }
}

/* 卡片样式 */
.hq-card {
  width: 100%;
  aspect-ratio: 1 / 1; // 推荐歌单通常是正方形
  position: relative;
  border-radius: 12px;
  overflow: hidden;
  background: #1a1a1a;
  cursor: pointer;
  transition: transform 0.3s ease;

  &:hover {
    transform: translateY(-4px);
    .play-btn {
      opacity: 1;
      transform: translate(0, 0);
    }
  }
}

.hq-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.hq-badge {
  position: absolute;
  top: 8px;
  right: 8px; // 标签改到右上角更符合现代审美，也可放回原位
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(4px);
  color: #fff;
  padding: 4px 8px;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 600;
}

/* 播放按钮：右下角浮现 */
.play-btn {
  position: absolute;
  bottom: 12px;
  right: 12px;
  width: 40px;
  height: 40px;
  background: rgba(255, 255, 255, 0.2);
  color: #fff;
  border: none;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0; // 默认隐藏
  transform: translate(0, 10px); // 默认向下偏移一点
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  
  &:hover {
    transform: scale(1.1) !important;
    background: rgba(255, 255, 255, 0.2);
  }
  &:active {
    transform: scale(0.95) !important;
  }
}

.meta {
  margin-top: 12px;
}

.meta-title {
  font-size: 14px;
  font-weight: 500;
  color: #fff;
  line-height: 1.4;
  // 限制两行显示
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* 响应式媒体查询：这里主要控制 Grid 的列数显示效果 */
/* JS 已经处理了 itemsPerPage，CSS 只需要配合 */

/* 大屏 */
@media (min-width: 1401px) {
  .slide { grid-template-columns: repeat(5, 1fr); }
}

/* 中屏 */
@media (max-width: 1400px) and (min-width: 1101px) {
  .slide { grid-template-columns: repeat(4, 1fr); }
}

/* 平板 */
@media (max-width: 1100px) and (min-width: 769px) {
  .slide { grid-template-columns: repeat(3, 1fr); }
}

/* 手机 */
@media (max-width: 768px) {
  .slide { grid-template-columns: repeat(2, 1fr); }
  
  // 手机端隐藏左右切换按钮，或者改小
  .ctrl-btn { width: 28px; height: 28px; }
}
</style>
