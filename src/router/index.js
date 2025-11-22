import Homepage from '@/components/HomePage.vue'
import Artist from '@/components/Artist.vue'
import { createRouter, createWebHistory } from 'vue-router'
import MusicList from '@/components/MusicList.vue'
import Musichub from '@/components/MusicHub.vue'
import SearchResult from '@/components/SearchResult.vue'

const routes = [
  {
    path: '/',
    name: 'Hub',
    component: Musichub,
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
    path: '/SearchResult',
    name: 'searchresult',
    component: SearchResult,
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router
