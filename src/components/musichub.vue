<template>
  <div class="Banner">
    <Banner></Banner>
  </div>
  <div>
    <HighQualityMusicList></HighQualityMusicList>
  </div>
  
  <div>
    <NewMusicList></NewMusicList>
  </div>
  <div>
    <ArtistList></ArtistList>
  </div>
</template>

<script setup lang="ts">
import ArtistList from './ArtistList.vue';
import Banner from './banner.vue'
import HighQualityMusicList from './HighQualityMusicList.vue'
import NewMusicList from './NewMusicList.vue';
</script>

<style scoped>

</style>
