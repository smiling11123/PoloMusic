import { request } from "./request";
// 获取歌单详情，传入歌单Id
export const GetMusicFromList = async (params) => {
  return request({
    url: "/playlist/detail",
    params,
  }).then((res) => res.data);
}
// 获取歌单内的音乐列表
export const MusicIdList = async (params) => {
    return await GetMusicFromList(params).then((data)=>data.privileges)
}
//获取歌单信息
export const MusicListInfo = async (params) => {
  return await GetMusicFromList(params).then((data)=>data.playlist)
}