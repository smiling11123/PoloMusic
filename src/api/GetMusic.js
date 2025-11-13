import { request } from "./request";

export const GetMusicUrl = async (params) => {
  return request({
    url: "/song/url",
    params,
  }).then((res) => res.data);
}

export const MusicUrl = async (params) => {
  return await GetMusicUrl(params);
}


 export async function PlayMusicFromList(item) {
  console.log('Play music list:', item)
  const pid = item.id
  if (!pid) {
    console.warn('missing id for playlist/item', item)
    return
  }

  try {
    // 获取歌单内音乐 id 列表（确保传入对象）
    const idRes = await MusicId({ id: pid })
    // 根据你的 API 返回结构调整这里的取法
    const firstId =
      Array.isArray(idRes) && idRes.length > 0
        ? idRes[0].id
        : (idRes?.[0]?.id ?? idRes?.ids?.[0]?.id ?? idRes?.id)

    if (!firstId) {
      console.error('no track id found from MusicId response', idRes)
      return
    }

    // 注意：传入对象 { id: firstId }，不要直接传 number
    const detailRes = await MusicUrl({ id: firstId })
    console.log('MusicUrl res:', detailRes)

    // 根据你的接口返回结构取出可播放 url
    const playUrl =
      detailRes?.data?.[0]?.url || detailRes?.data?.url || detailRes?.url || detailRes?.playUrl

    if (!playUrl) {
      console.error('no playable url found', detailRes)
      return
    }

    const audio = new Audio(playUrl)
    await audio.play().catch((e) => console.error('audio.play failed', e))
  } catch (err) {
    console.error('play failed:', err)
  }
}