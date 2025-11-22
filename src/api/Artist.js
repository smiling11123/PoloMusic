import { request } from "./request"

//获取热门歌手
export const HotArtist = async (params) => {
    return request({
        url: '/top/artists',
        params: {limit: params?.limit || 10, offset: params?.offset},
    }).then((res) => res.data)
}

export const GetArtist = async (param) => {
    return request({ 
        url: '/artists',
        params: {id: param},
    }).then((res) => res.data)
}