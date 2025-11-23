import { request, requestwordlyric, withCookie } from './request'

//传入歌曲Id，获取歌曲的播放地址url
export const GetMusicUrl = async (params) => {
  return request({
    url: '/song/url',
    params: withCookie(params),
  }).then((res) => res.data)
}
//传入歌曲Id，获取解析出来的url
export const MusicUrl = async (params) => {
  return await GetMusicUrl(params).then((data) => data.data)
}
//传入歌曲Id，获取歌曲的详细信息
export const GetMusicDetail = async (params) => {
  return request({
    url: '/song/detail',
    params,
  }).then((res) => res.data)
}
// 新增批量版本
export const GetMusicUrls = async (params) => {
  return request({
    url: '/song/url',
    params: { id: params.ids.join(',') },
  }).then((res) => res.data)
}

//获取歌词
export const GetMusicLyric = async (params) => {
  return request({
    url: '/lyric',
    params: {id: params},
  }).then((res) => res.data)
}
//
export const GetWordMusicLyric = async (param) => {
  try {
    const response = await requestwordlyric({
      url: `/${param}.yrc`,
    })
    
    // 如果是 axios 实例，2xx 状态会到这里
    return response.data || response // 根据你的 requestwordlyric 配置
    
  } catch (error) {
    // 捕获错误
    if (error.response?.status === 404) {
      console.warn(`歌词未找到: 歌曲ID ${param}`)
      return null // ✅ 返回 null 表示无歌词
    }
    
    console.error('获取歌词失败:', error)
    return null // 其他错误也返回 null
  }
}
export const GetMusicPicUrl = async (params) => {
  return request({
    url: '/song/detail',
    params,
  }).then((res) => res.data.songs[0].al.picUrl)
}
