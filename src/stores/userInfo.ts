import { defineStore } from 'pinia'
import { ref } from 'vue'

export const userInfo = defineStore('userInfo', () => {
  // 定义状态
  const userProfile = ref(localStorage.getItem('userProfile') || null)
  const userDetail = ref(localStorage.getItem('userDetail') || null)
  const userId = ref(userProfile.value ? JSON.parse(userProfile.value).userId || null : null)
  const avatarUrl = ref(userProfile.value ? JSON.parse(userProfile.value).avatarUrl || null : null)
  const nickname = ref(userProfile.value ? JSON.parse(userProfile.value).nickname || null : null)
  const backgroundUrl = ref(userProfile.value ? JSON.parse(userProfile.value).backgroundUrl || null : null)
  const signature = ref(userProfile.value ? JSON.parse(userProfile.value).signature || null : null)
  const profileVillageInfoUrl = ref(userDetail.value ? JSON.parse(userDetail.value).profileVillageInfo.imageUrl || null : null)
  const cookies = ref(localStorage.getItem('neteaseCookie') || null)
  const viptype = ref(userProfile.value ? JSON.parse(userProfile.value).viptype || null : 0)

  // 定义持久化配置
  return { userProfile, userDetail, userId, avatarUrl, nickname, backgroundUrl, signature, profileVillageInfoUrl, cookies, viptype }
}, {
  persist: true,
})