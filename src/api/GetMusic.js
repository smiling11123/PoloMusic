import { request } from "./request";
import { MusicIdList } from "./GetMusicFromList";
export const GetMusicUrl = async (params) => {
  return request({
    url: "/song/url",
    params,
  }).then((res) => res.data);
}

export const MusicUrl = async (params) => {
  return await GetMusicUrl(params).then((data)=>data.data);
}

export const GetMusicDetail = async (params) => {
  return request({
    url: "/song/detail",
    params,
  }).then((res) => res.data);
}