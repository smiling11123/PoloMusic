import { request } from "./request.js";
// 获取轮播图json数据
export const  GetBanner =async () => {
    return await request.get('/banner/get').then(res => res.data);
}
//获取轮播图列表
export const  GetBannerList =async () =>{
    return  await GetBanner().then(data => data.banners);
}
//获取数据请求状态码
export function GetBannerState(){
    return GetBanner().then(data => data.code);
}
