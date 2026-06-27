<template>
  <div class="rank-page">
    <div class="rank-container">
      <h2 class="section-title">官方榜</h2>
      
      <div v-if="loading" class="rank-grid">
        <div class="rank-card skeleton" v-for="n in 10" :key="n"></div>
      </div>

      <div v-else class="rank-grid">
        <div 
          v-for="item in rankList" 
          :key="item.id" 
          class="rank-card"
          @click="goToDetail(item.id)"
        >
          <div class="cover-box">
            <img :src="item.coverImgUrl + '?param=300y300'" loading="lazy" class="cover-img" />
            
            <div class="update-freq">{{ item.updateFrequency }}</div>
            
            <button class="play-btn" @click.stop="playRank(item)">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M8 5v14l11-7z" />
              </svg>
            </button>
          </div>
          
          <div class="rank-name">{{ item.name }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'

import { MusicIdList } from '@/api/GetMusicFromList' 
import { Player } from '@/stores/index' 
import { getTopListDetail } from '@/api/GetMusicList';

export interface RankItem {
  id: number;
  name: string;
  coverImgUrl: string;
  updateFrequency: string; 
  description: string;
  tracks: Array<{
    first: string;
    second: string;
  }>; // 前三名预览
  playCount: number;
}
const router = useRouter()
const player = Player()

const rankList = ref<RankItem[]>([])
const loading = ref(true)

// 获取榜单数据
const fetchData = async () => {
  loading.value = true
  try {
    const res: any = await getTopListDetail()
    if (res.list) {
      rankList.value = res.list
    }
  } catch (e) {
    console.error('获取榜单失败', e)
  } finally {
    loading.value = false
  }
}

const goToDetail = (id: number) => {
  router.push({ name: 'musiclist', params: { id } })
}

const playRank = async (item: RankItem) => {
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

onMounted(() => {
  fetchData()
})
</script>

<style scoped lang="scss">
$bg-color: #121212;
$text-main: #d0d0d0;
$text-sub: #7d7d7d;

.rank-page {
  width: 100%;
  padding-bottom: 40px;
}

.rank-container {
  max-width: 1200px;
  margin: 0 auto;
}

.section-title {
  font-size: 20px;
  font-weight: 700;
  margin-bottom: 20px;
  color: #fff;
}

// 网格布局
.rank-grid {
  display: grid;
  // 响应式列：最小宽度 150px，自动填充
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 24px;
}

.rank-card {
  cursor: pointer;
  
  &:hover {
    .cover-box {
      transform: translateY(-4px); // 轻微上浮
    }
    .play-btn {
      opacity: 1;
      transform: translate(-50%, -50%) scale(1);
    }
  }
}

.cover-box {
  width: 100%;
  aspect-ratio: 1 / 1; // 正方形
  border-radius: 8px; // 截图中的圆角
  overflow: hidden;
  position: relative;
  background-color: #252525;
  margin-bottom: 10px;
  transition: transform 0.3s ease;
  box-shadow: 0 4px 10px rgba(0,0,0,0.2);

  .cover-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  // 更新频率文本 (截图风格: 左下角，白色半透明)
  .update-freq {
    position: absolute;
    bottom: 8px;
    left: 8px;
    font-size: 12px;
    color: #fff;
    text-shadow: 0 1px 2px rgba(0,0,0,0.6);
    opacity: 0.9;
  }

  // 播放按钮 (居中悬浮)
  .play-btn {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%) scale(0.8);
    width: 44px;
    height: 44px;
    background: rgba(255, 255, 255, 0.9);
    border-radius: 50%;
    border: none;
    color: #335eea; // 主题色
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0; // 默认隐藏
    transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
    cursor: pointer;
    box-shadow: 0 2px 8px rgba(0,0,0,0.3);

    svg {
      width: 20px;
      height: 20px;
      margin-left: 2px; // 视觉修正
    }
    
    &:hover {
      background: #fff;
      transform: translate(-50%, -50%) scale(1.1);
    }
  }
}

.rank-name {
  font-size: 14px;
  color: $text-main;
  line-height: 1.4;
  margin-top: 8px;
  // 截图风格是单行或两行，这里限制两行
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden; 
}

// 骨架屏
.rank-card.skeleton {
  aspect-ratio: 1 / 1;
  border-radius: 8px;
  background: linear-gradient(90deg, #222 25%, #2a2a2a 37%, #222 63%);
  background-size: 400% 100%;
  animation: skeleton-load 1.4s ease infinite;
}

@keyframes skeleton-load {
  0% { background-position: 100% 50% }
  100% { background-position: 0 50% }
}
</style>
