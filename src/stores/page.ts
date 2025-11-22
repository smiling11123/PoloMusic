import { defineStore } from 'pinia'
import { ref } from 'vue'
export const pagecontrol = defineStore('pagecontrol', () => {
  const ShowLyric = ref(false) //是否显示歌词页面
  const ShowPlayList = ref(false)
  const ShowAdditionRight = ref(false)
  //IsLogin: false
  const ShowQRCode = ref(false)
  const IsLogin = ref(false)
  const IsFold = ref(false)
  const isShowLyric = () => {
    ShowLyric.value = !ShowLyric.value
  }
  const isShowPlayList = () => {
    ShowPlayList.value = !ShowPlayList.value
  }


  return {
    ShowLyric,
    ShowPlayList,
    ShowAdditionRight,
    ShowQRCode,
    IsLogin,
    IsFold,
    isShowLyric,
    isShowPlayList,
  }

},
   { 
    persist: {
        key: 'pagecontrol',
      storage: localStorage,
      paths: [
        'IsLogin',
        'IsFold'
      ],
    } as any
}

)
