<template>
  <div class="hq-wrap">
    <div class="controls">
      <button class="ctrl" @click="prev" :disabled="currentPage === 0">‹</button>
      <div class="dots">
        <button
          v-for="(p, i) in pageCount"
          :key="i"
          class="dot"
          :class="{ active: i === currentPage }"
          @click="goto(i)"
        />
      </div>
      <button class="ctrl" @click="next" :disabled="currentPage === pageCount - 1">›</button>
    </div>

    <div class="viewport">
      <div class="slides" :style="{ transform: `translateX(-${currentPage * 100}%)` }">
        <div v-for="(page, pi) in pages" :key="pi" class="slide">
          <div v-for="(item, idx) in page" :key="idx" class="hq-item">
            <div class="hq-card" @click="TurnIn() /*做一个页面跳转 */">
              <img :src="item.image" alt="" class="hq-img" />
              <div class="hq-badge">{{ item.badgeText ?? '每日推荐' }}</div>
              <button class="play-btn" @click.stop="play(item)" aria-label="play">
                <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden>
                  <path d="M8 5v14l11-7z" />
                </svg>
              </button>
            </div>

            <div class="meta">
              <div class="meta-title">{{ item.title }}</div>
              <div class="meta-sub">{{ item.subtitle ?? '' }}</div>
            </div>
          </div>
          <!-- 如果某页不足 itemsPerPage，用占位填充保持布局 -->
          <div
            v-for="n in Math.max(0, itemsPerPage - page.length)"
            :key="'ph-' + n"
            class="hq-item placeholder"
            aria-hidden="true"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { GetMusicFromList, MusicIdList } from '@/api/GetMusicFromList'
import { ref, onMounted, computed } from 'vue'
import { HighQualityMusicList } from '@/api/GetHighQualityMusicList'
import { MusicUrl } from '@/api/GetMusic'
import { Player } from '@/stores/index'
import { M } from 'motion-v/es'
interface Item {
  image: string
  title: string
  subtitle?: string
  badgeText?: string
  id: number
}
const store = Player()
const items = ref<Item[]>([])

// 布局配置：两行 * cols 每页
const rows = 2
const cols = 3
const itemsPerPage = rows * cols

const currentPage = ref(0)

onMounted(async () => {
  try {
    const res = await HighQualityMusicList()
    items.value = (res || []).map((MusicList: any) => ({
      image: MusicList.coverImgUrl,
      title: MusicList.name,
      subtitle: (MusicList.artists || []).map((a: any) => a.name).join('、'),
      badgeText: MusicList.tag || '每日推荐',
      id: MusicList.id,
    }))
  } catch (err) {
    console.error('MusicList failed:', err)
    items.value = []
  }
})

// 把 items 切分为 pages
const pages = computed(() => {
  const out: Item[][] = []
  for (let i = 0; i < items.value.length; i += itemsPerPage) {
    out.push(items.value.slice(i, i + itemsPerPage))
  }
  if (out.length === 0) out.push([]) // 最少一个空页
  return out
})
const pageCount = computed(() => pages.value.length)

function prev() {
  if (currentPage.value > 0) currentPage.value--
}
function next() {
  if (currentPage.value < pageCount.value - 1) currentPage.value++
}
function goto(i: number) {
  currentPage.value = i
}
function TurnIn() {
  // 做一个页面跳转
  console.log('跳转到推荐页面')
}
async function play(item: Item) {
  try {
    if (!item?.id) {
      console.warn('play: missing item.id', item)
      return
    }

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

<style scoped>
.hq-wrap {
  width: 100%;
  box-sizing: border-box;
}

/* 顶部分页控制 */
.controls {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 12px;
  padding: 6px 8px;
}
.ctrl {
  background: transparent;
  border: none;
  color: #fff;
  font-size: 20px;
  width: 36px;
  height: 36px;
  cursor: pointer;
}
.ctrl:disabled {
  opacity: 0.3;
  cursor: default;
}

.dots {
  display: flex;
  gap: 6px;
  align-items: center;
}
.dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  border: none;
  background: #444;
  cursor: pointer;
}
.dot.active {
  background: #0bdc9a;
}

/* 视窗与滑动 */
.viewport {
  overflow: hidden;
  width: 100%;
  padding: 0 12px; /* 给左右留白，避免紧贴边界 */
}
.slides {
  display: flex;
  transition: transform 300ms ease;
  width: 100%;
  box-sizing: border-box;
}

/* 每个 slide 占满视窗宽度
   关键：使用 minmax 确保每列最小宽度，不会被无限压扁；
   限制 max-width 保持整体不被拉得太长并居中显示 */
.slide {
  flex: 0 0 100%;
  box-sizing: border-box;
  padding: 8px 6px;
  display: grid;
  grid-template-columns: repeat(var(--cols), minmax(220px, 1fr));
  gap: 16px;
  align-items: start;
  justify-items: center;
  --cols: 3;
  max-width: 1200px; /* 整页最大宽度，防止卡片被无限拉伸 */
  margin: 0 auto; /* 居中 slide 内容 */
}

/* 单个卡片项 */
.hq-item {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  max-width: 360px; /* 防止单个卡片过宽 */
}
.hq-item.placeholder {
  visibility: hidden;
}

/* 卡片（图片区域）—— 更矮的比例，视觉更紧凑 */
.hq-card {
  width: 100%;
  aspect-ratio: 4 / 3;
  position: relative;
  border-radius: 10px;
  overflow: hidden;
  background: #111;
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.45);
  cursor: pointer;
  transition:
    transform 0.18s ease,
    box-shadow 0.18s ease;
}
.hq-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 28px rgba(0, 0, 0, 0.55);
}

/* 图片铺满并裁切 */
.hq-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

/* 左下的标签（青色）*/
.hq-badge {
  position: absolute;
  left: 10px;
  bottom: 12px;
  background: #00e0d0;
  color: #002322;
  font-weight: 700;
  padding: 6px 10px;
  border-radius: 6px;
  font-size: 13px;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.25);
}

/* 右下的播放按钮 */
.play-btn {
  position: absolute;
  right: 12px;
  bottom: 12px;
  width: 44px;
  height: 44px;
  border-radius: 50%;
  border: none;
  background: #00d27f;
  color: #fff;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 6px 14px rgba(0, 0, 0, 0.35);
  cursor: pointer;
  transition: transform 0.12s ease;
}
.play-btn:hover {
  transform: scale(1.05);
}
.play-btn:active {
  transform: scale(0.98);
}

/* 标题与副标题 */
.meta {
  width: 100%;
  margin-top: 10px;
  text-align: left;
  padding: 0 6px;
  box-sizing: border-box;
}
.meta-title {
  color: #fff;
  font-size: 14px;
  font-weight: 600;
  line-height: 1.2;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.meta-sub {
  margin-top: 6px;
  color: #9aa0a6;
  font-size: 13px;
  line-height: 1.2;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* 响应式：宽度不足时减少列数，改用更小的最小列宽 */
@media (max-width: 1100px) {
  .slide {
    --cols: 2;
    grid-template-columns: repeat(var(--cols), minmax(180px, 1fr));
    max-width: 760px;
  }
}
@media (max-width: 700px) {
  .slide {
    --cols: 2;
    grid-template-columns: repeat(2, minmax(140px, 1fr));
    max-width: 480px;
  }
}
</style>
