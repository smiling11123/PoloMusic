import Homepage from '@/components/homepage.vue';
import Artist from '@/components/artist.vue';
import { createRouter, createWebHistory } from 'vue-router';
import MusicList from '@/components/MusicList.vue';
import Musichub from '@/components/musichub.vue';

const routes = [
    {
      path: '/',
      name: 'Hub',
      component: Musichub
    },
    {
      path: '/artist',
      name: 'Artist',
      component: Artist,
    },
    {
      path: '/musiclist/:id',
      name: 'musiclist',
      component: MusicList

    }

];

const router = createRouter({
    history: createWebHistory(),
    routes,
  });

export default router;