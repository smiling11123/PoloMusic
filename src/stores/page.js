import { defineStore } from 'pinia'

export const pagecontrol = defineStore('pagecontrol', {
    state: ()=>({
        ShowLyric: false, //是否显示歌词页面
        ShowPlayList: false,
        ShowAdditionRight: false,
        IsLogin: false,
        ShowQRCode: false,

    }),
    actions: {
        isShowLyric() {
            this.ShowLyric = !this.ShowLyric
        },
        isShowPlayList() {
            this.ShowPlayList = !this.ShowPlayList
        },

    }



})