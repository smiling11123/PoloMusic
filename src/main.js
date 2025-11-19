import './assets/main.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import naive from 'naive-ui'
const app = createApp(App)
app.config.globalProperties.$host = 'http://localhost:3000'
const pinia = createPinia()
app.use(pinia)
app.use(router)
app.use(naive)
app.mount('#app')
