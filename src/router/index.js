import Homepage from '@/components/HomePage.vue'
import Artist from '@/components/Artist.vue'
import { createRouter, createWebHistory } from 'vue-router'
import MusicList from '@/components/MusicList.vue'
import Musichub from '@/components/MusicHub.vue'
import SearchResult from '@/components/SearchResult.vue'
import Album from '@/components/Album.vue'
import DailyRecommendMusic from '@/components/DailyRecommendMusic.vue'

const routes = [
  {
    path: '/',
    name: 'Hub',
    component: Musichub,
  },
  {
    path: '/SearchResult/artist/:id',
    name: 'searchartist',
    component: Artist,
  },
  {
    path: '/artist/:id',
    name: 'artist',
    component: Artist,
  },
  {
    path: '/musiclist/:id',
    name: 'musiclist',
    component: MusicList,
  },
    {
    path: '/SearchResult/musiclist/:id',
    name: 'searchmusiclist',
    component: MusicList,
  },
  {
    path: '/SearchResult',
    name: 'searchresult',
    component: SearchResult,
  },
  {
    path: '/SearchResult/Album/:id',
    name: 'searchalbum',
    component: Album,
  },
  {
    path: '/Album/:id',
    name: 'album',
    component: Album,
  },
  {
    path: '/DailyRecommendMusic',
    name: 'DailyRecommendMusic',
    component: DailyRecommendMusic,
  },

]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router
