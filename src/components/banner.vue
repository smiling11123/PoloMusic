<template>
  <div class="banner">
    <n-carousel
      effect="card"
      prev-slide-style="transform: translateX(-150%) translateZ(-800px);"
      next-slide-style="transform: translateX(50%) translateZ(-800px);"
      style="height: 240px"
      :show-dots="false"
      :autoplay="true"
      :draggable="false"
    >
      <n-carousel-item
        :style="{ width: '60%' }"
        v-for="(banner, index) in BannerList"
        :key="index"
        :alt="banner.typeTitle"
        
      >
        <!-- 圆角卡片包装 -->
        <div class="carousel-item" @click="TurnTo()">
          <img class="carousel-img" :src="banner.bigImageUrl" />
        </div>
      </n-carousel-item>
    </n-carousel>
  </div>
</template>

<script setup lang="ts">
import { GetBanner, GetBannerList } from '@/api/banner'
import { ref, onMounted } from 'vue'
const BannerList = ref<any[]>()

onMounted(async () => {
  try {
    const res = await GetBannerList()
    // 如果返回是 { banners: [...] }，改为 BannerList.value = res.banners
    BannerList.value = res ?? []
  } catch (err) {
    console.error('GetBannerList failed:', err)
    BannerList.value = []
  }
})
function TurnTo() {
  
}
</script>

<style scoped>
/* 圆角卡片容器 */
.carousel-item {
  user-select: none;
  width: 100%;
  height: 100%;
  border-radius: 16px; /* 根据需要调整圆角 */
  overflow: hidden; /* 裁切图片以显示圆角 */
  display: flex;
  align-items: center;
  justify-content: center;
  background: #111;
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.25);
}

/* 图片铺满并裁切 */
.carousel-img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

/* 如果需要可以给外层 n-carousel-item 额外样式 */
:deep(.n-carousel-item) {
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
