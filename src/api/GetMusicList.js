import { request, withCookie } from './request.js'
/* 
limit: 获取数量限制
offset: 偏移数量，用于分页
cat: 分类，如 "全部", "华语", "欧美", "日语", "韩语" 等
*/
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
//获取热门歌单
export const GetNewMusicList = async (params) => {
  return request({
    url: '/top/playlist',
    params: {limit: params?.limit || 30, offset: params?.offset || 0, cat: params?.cat || '全部'},
  }).then((res)=> res.data)
}
export const NewMusicList = async (params) => {
  return await GetNewMusicList(params).then((data) => data.playlists)
}

//获取推荐歌单
export const GetRecommendList = async (params) => {
  return request({
    url: '/personalized',
    params: {limit: params?.limit || 30},
  }).then((res) => res.data)
}

//获取热门单曲
export const GetHotMusic = async (params) => {
  return request({
    url: '/top/song',
    params: {type: params?.type || 0},
  }).then((res) => res.data)
}
//获取推荐新歌
export const GetRecommendNewMusic = async (params) => {
  return request({
    url: '/personalized/newsong',
    params: {offset: params?.offset || 0, limit: params?.limit || 10},
  }).then((res) => res.data)
}
//获取榜单
/* 19723756:飙升榜 3779629:新歌榜 2884035:原创榜
19723756:热歌榜 180106:UK排行榜 60198:美国Billboard
21845217:Beatport 
*/
export const GetTopList = async (params) => {
  return request({
    url: '/toplist/detail',
    params: {id: params?.id},
  })
}

//获取独家放送
export const GetPrivateContent = async (params) => {
  return request({
    url: '/presonalized/privatecontent',
    params,
  })
}

//获取每日推荐歌单，需要登录
export const GetDailyRecommendMusicList = async (params) => {
  return request({
    url: 'recommend/resource',
    params: withCookie(),
  })
}

//获取推荐歌曲，需要登录
export const GetDailyRecommendMusic = async (params) => {
  return request({
    url: 'recommend/songs',
    params: withCookie(),
  }).then((res) => res.data)
}

//获取推荐电台
export const GetRecommendDj = async (params) => {
  return request({
    url: '/personalized/djprogram',
    params: {limit: params?.limit || 30},
  })
}

//获取私人fm
export const GetPersonalFM = async (params) => {
  return request({
    url: '/personal_fm',
    params: withCookie(),
  }).then((res) => res.data)
}

//私人fm发送跳过信息获取下一首
export const GetNextPersonalFM = async (params) => {
  return request({
    url: '/personal_fm/trash',
    params: withCookie({id: params}),
    method: 'post',
  }).then((res) => res.data)
}

//获取用户歌单
export const GetUserMusicList = async (param) => {
  return request({
    url: '/user/playlist',
    params: withCookie({uid: param})
  }).then((res) => res.data)
}

//获取最近听过
export const GetRecnetList = async (params) => {
  return request({
    url: '/record/recent/song',
    params: withCookie({limit: params?.limit, offset: params?.offset}),
  }).then((res) => res.data)
}

//
export const getHighQualityPlaylists = async (params) => {
  return request({
     url: '/top/playlist/highquality',
     params: withCookie({cat: params?.cat || '全部', limit: params?.limit || 30, before: params?.before })
  }).then((res) => res.data)
};

//获取排行榜
export const getTopListDetail = async (params) => {
  return request({
    url: '/toplist/detail',
    params,
  }).then((res) => res.data)
}