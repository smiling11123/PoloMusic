import { request } from './request.js'
//获取精品歌单
export const GetHighQualityMusicList = async (params) => {
  return request({
    url: '/top/playlist/highquality',
    params,
  }).then((res) => res.data)
}

export const HighQualityMusicList = async () => {
  return await GetHighQualityMusicList().then((data) => data.playlists)
}
//获取最新推荐歌单
export const GetNewMusicList = async (params) => {
  return request({
    url: '/top/playlist',
    params,
  }).then((res)=> res.data)
}
export const NewMusicList = async () => {
  return await GetNewMusicList().then((data) => data.playlists)
}