import { request } from './request.js'

export const GetHighQualityMusicList = async (params) => {
  return request({
    url: '/top/playlist/highquality',
    params,
  }).then((res) => res.data)
}

export const HighQualityMusicList = async () => {
  return await GetHighQualityMusicList().then((data) => data.playlists)
}
