<template>
  <div class="main">
    <Banner></Banner>
    <p class="HighQualityTittle">精品音乐</p>
    <HighQualityMusicList></HighQualityMusicList>
  </div>
</template>

<script setup lang="ts">

import Banner from './banner.vue'
import HighQualityMusicList from './HighQualityMusicList.vue'
</script>

<style scoped>
.HighQualityTittle {
  font-size: 28px;
  color: #fff;
  margin-left: 30px;
}
</style>
