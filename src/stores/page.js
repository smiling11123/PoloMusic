import { defineStore } from 'pinia'

export const pagecontrol = defineStore('pagecontrol', {
    state: ()=>({
        ShowLricy: false, //是否显示歌词页面
        ShowPlayList: false,
        ShowAdditionRight: false,



    }),
    actions: {
        isShowLricy() {
            this.ShowLricy = !this.ShowLricy
        },
        isShowPlayList() {
            this.ShowPlayList = !this.ShowPlayList
        },

    }



})