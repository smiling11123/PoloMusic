<template>
    <div class="Tittle">
        <button class="NewTittle">新歌单></button>
    </div>
  <div class="hq-wrap">
    <!-- 修改 controls：绝对定位 + 箭头按钮 -->
    <div class="controls">
      <div class="nav-arrows">
        <button class="ctrl prev" @click="prev" :disabled="currentPage === 0" aria-label="上一页">
          ‹
        </button>
        <button
          class="ctrl next"
          @click="next"
          :disabled="currentPage === pageCount - 1"
          aria-label="下一页"
        >
          ›
        </button>
      </div>
    </div>

    <div class="viewport">
      <div class="slides" :style="{ transform: `translateX(-${currentPage * 100}%)` }">
        <div v-for="(page, pi) in pages" :key="pi" class="slide">
          <div v-for="(item, idx) in page" :key="idx" class="hq-item">
            <div class="hq-card" @click="TurnIn(item) /*做一个页面跳转 */">
              <img :src="item.image" alt="" class="hq-img" />
              <div class="hq-badge" v-if="!pagecontroler.ShowPlayList">{{ item.badgeText ?? '每日推荐' }}</div>
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
import { NewMusicList } from '@/api/GetMusicList'
import { MusicUrl } from '@/api/GetMusic'
import { Player } from '@/stores/index'
import { M } from 'motion-v/es'
import { useRouter } from 'vue-router'
import { pagecontrol } from '@/stores/page'
const router = useRouter()
interface Item {
  image: string
  title: string
  subtitle?: string
  badgeText?: string
  id: number
}
const store = Player()
const items = ref<Item[]>([])
const pagecontroler = pagecontrol()
// 布局配置：两行 * cols 每页
const rows = 1
const cols = 6
const itemsPerPage = rows * cols

const currentPage = ref(0)

onMounted(async () => {
  try {
    const res = await NewMusicList()
    items.value = (res || []).map((MusicList: any) => ({
      image: MusicList.coverImgUrl,
      title: MusicList.name,
      subtitle: (MusicList.artists || []).map((a: any) => a.name).join('、'),
      badgeText: MusicList.tags || '每日推荐',
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
function TurnIn(item: Item) {
  console.log(item.id)
  router.push({
    name: 'musiclist',
    params: { id: item.id },
  })
  // 做一个页面跳转
  console.log('跳转到推荐页面')
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
  store.loadPlaylistData()
}
</script>

<style scoped>
.Tittle {
  user-select: none;
  display: flex;
  .moreList{
  }
}
.NewTittle {
  font-size: 28px;
  color: #fff;
  margin-left: 30px;
}
.hq-wrap {
  width: 100%;
  box-sizing: border-box;
  position: relative;

  &:hover .nav-arrows .ctrl {
    opacity: 1;
  }
}

.controls {
  user-select: none;
  position: absolute;
  top: 50%;
  left: 0;
  right: 0;
  transform: translateY(-50%);
  height: 0;
  z-index: 10;
}

.nav-arrows {
  position: relative;
  width: 100%;
  height: 100%;
}

.ctrl {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  background: rgba(0, 0, 0, 0.6);
  border: none;
  color: #fff;
  font-size: 24px;
  width: 48px;
  height: 48px;
  border-radius: 50%;
  cursor: pointer;
  opacity: 0;
  transition:
    opacity 0.3s ease,
    background 0.2s ease,
    transform 0.15s ease;

  &:hover:not(:disabled) {
    background: rgba(0, 0, 0, 0.8);
    transform: translateY(-50%) scale(1.1);
  }

  &:active:not(:disabled) {
    transform: translateY(-50%) scale(0.95);
  }
}

.ctrl.prev {
  left: 12px;
}

.ctrl.next {
  right: 12px;
}

.ctrl:disabled {
  opacity: 0.1 !important;
  cursor: default;
}

/* 重要：去掉外层水平 padding，避免出现“peek” */
.viewport {
  overflow: hidden;
  width: 100%;
  padding: 0; /* 改为 0，所有间距改由内部元素处理 */
}

/* slides 作为整行容器，不留额外间隙 */
.slides {
  display: flex;
  transition: transform 300ms ease;
  width: 100%;
  box-sizing: border-box;
  gap: 0; /* 去掉 gap，避免影响滑动对齐 */
}

/* 每个 slide 必须占满可视宽度，不能被 max-width 居中缩窄导致右边露出下一页 */
.slide {
  user-select: none;
  flex: 0 0 100%;
  min-width: 100%;
  width: 100%;
  box-sizing: border-box;
  padding: 8px 12px; /* 内部间距，外面不再有 padding */
  display: grid;
  grid-template-columns: repeat(var(--cols), minmax(90px, 1fr));
  gap: 14px;
  align-items: start;
  justify-items: center;
  --cols: 6;
  max-width: none; /* 取消 max-width，确保占满宽度 */
  margin: 0; /* 取消居中 */
}

/* 保持卡片尺寸控制，但不影响 slide 占满宽度 */
.hq-item {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  max-width: 260px;
}
.hq-item.placeholder {
  visibility: hidden;
}

/* 卡片视觉调整保持不变 */
.hq-card {
  width: 100%;
  aspect-ratio: 4 / 3.2;
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

.hq-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.hq-badge {
  position: absolute;
  left: 8px;
  bottom: 10px;
  background: #00e0d0;
  color: #002322;
  font-weight: 700;
  padding: 5px 8px;
  border-radius: 6px;
  font-size: 11px;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.25);
}

.play-btn {
  position: absolute;
  right: 10px;
  bottom: 10px;
  width: 38px;
  height: 38px;
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
  opacity: 0;
  transform: scale(0.95);
  transition:
    opacity 0.3s ease,
    transform 0.15s ease;
}
.hq-card:hover .play-btn {
  opacity: 1;
  transform: scale(1);
}

.play-btn:active {
  transform: scale(0.98);
}
.play-btn:hover {
  transform: scale(1.05);
}
.play-btn:active {
  transform: scale(0.98);
}

.meta {
  width: 100%;
  margin-top: 8px;
  text-align: left;
  padding: 0 4px;
  box-sizing: border-box;
}
.meta-title {
  color: #fff;
  font-size: 13px;
  font-weight: 600;
  line-height: 1.2;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.meta-sub {
  margin-top: 4px;
  color: #9aa0a6;
  font-size: 12px;
  line-height: 1.2;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

@media (max-width: 1100px) {
  .slide {
    --cols: 2;
    grid-template-columns: repeat(var(--cols), minmax(160px, 1fr)); /* 缩小最小宽度 */
    /* 不再设置 max-width，确保 slide 占满视口 */
  }
}
@media (max-width: 700px) {
  .slide {
    --cols: 2;
    grid-template-columns: repeat(2, minmax(120px, 1fr)); /* 缩小最小宽度 */
    /* 不再设置 max-width，确保 slide 占满视口 */
  }
}
</style>
