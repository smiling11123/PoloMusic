import { request } from "./request";
// 获取歌单详情
export const GetMusicFromList = async (params) => {
  return request({
    url: "/playlist/detail",
    params,
  }).then((res) => res.data);
}
// 获取歌单内的音乐列表
export const MusicId = async (params) => {
    return await GetMusicFromList(params).then((data)=>data.privileges)
}