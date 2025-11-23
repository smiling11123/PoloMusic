import { timestamp } from '@vueuse/core'
import axios from 'axios'

export const request = axios.create({
  baseURL: import.meta.env.VITE_API_HOST || 'http://localhost:3000',
  timeout: 0,
  withCredentials: true, // 默认尝试携带凭证（如果服务端设置了 CORS allow-credentials）
})
export const requestwordlyric = axios.create({
  baseURL: 'https://raw.githubusercontent.com/Steve-xmh/amll-ttml-db/refs/heads/main/ncm-lyrics',
  timeout: 0,
})
export const withCookie = (params = {}) => {
  const cacheBuster = Date.now
  const cookie = localStorage.getItem('neteaseCookie')
  return {
    ...params,
    // ✅ 通过 params 传递（NeteaseCloudMusicApi 支持）
    //timestamp: cacheBuster, //添加时间戳
    cookie: cookie || undefined
  }
}
