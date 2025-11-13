<template>
  <div class="main">
    <Banner></Banner>
    <n-divider title-placement="left">
      <p>精品歌单</p>
    </n-divider>
    <HighQualityMusicList></HighQualityMusicList>
    <n-divider />
  </div>
</template>

<script setup lang="ts">
import Banner from './banner.vue'
import HighQualityMusicList from './HighQualityMusicList.vue'
</script>

<style scoped></style>
