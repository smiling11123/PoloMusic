import {
  MusicUrl,
  GetMusicDetail,
  GetMusicLyric,
  UnblockMusicUrl,
  GetWordMusicLyric,
} from '@/api/GetMusic'
import { defineStore } from 'pinia'
import { computed, ComputedRef, ref } from 'vue'
import { GetPersonalFM } from '@/api/GetMusicList'
import { userInfo } from './userInfo'
export interface Song {
  id: number
  name: string
  album: string
  artist: string
  duration: number
  cover: string
}
export interface Artist {
  id: number
  name: string
}

export interface SongItem {
  id: number
  name: string
  alias?: string // 歌曲别名
  artists: Artist[]
  album: string
  cover: string
  duration?: number
  fee?: number
}
export interface Playlist {
  id: number
  name: string
  coverImgUrl: string
  description: string
  playCount: number
  trackCount: number
  creator?: {
    nickname: string
    avatarUrl: string
  }
}
export const Player = defineStore(
  'Player',
  () => {
    const audio = new Audio() // 音频对象
    const audiovolume = ref<number>(null)
    //audio.volume = audiovolume
    const isplaying = ref(false) // 播放状态
    const playnormal = ref(true)
    const playFM = ref(false)
    const playlist = ref<(number | string)[]>([]) // 播放列表 (支持网易云ID和本地歌曲ID)
    const playmodel = ref('')
    const currentSong = ref<number | string | null>(null) // 当前播放的歌曲

    // 判断是否为本地歌曲
    const isLocalSong = (id: number | string | null): boolean => {
      return typeof id === 'string' && id.startsWith('local_')
    }
    const currentSongUrl = ref<string | null>(null)
    const currentSongTime = ref<number>(0) //上次播放位置
    const currentSongLyric = ref<string>(null)
    const currentSongLrcLine = ref<string>(null) //当前歌词行，用于发送给桌面歌词
    const currentSongYrc = ref<string>(null)
    const currentSongTYrc = ref<string>(null)
    const currentSongRoMaYrc = ref<string>(null)
    const currentSongTLyric = ref<string>(null)
    const useCookie = ref<String | null>(null)
    const currentSongDetail = ref<SongItem>(null)
    const nextSongDetail = ref<SongItem>(null)
    const nextSongUrl = ref<string | null>(null)
    const currentSongList = ref<SongItem[]>([])
    const nextSongLyric = ref<string>(null)
    const nextSongLrc = ref<string>(null)
    const userinfo = userInfo()
    const isSwitch = ref(false)
    const currentSongIndex: ComputedRef<number> = computed(() => {
      if (currentSong.value === null) return -1
      return playlist.value.findIndex((songId) => songId === currentSong.value)
    }) // 获取当前播放歌曲索引

    const End = async () => {
      if (playFM.value) {
        const mappedFmSongs = ref()
        if (currentSongIndex.value - playlist.value.length <= 3) {
          const fmRes = await GetPersonalFM()

          const fmList = fmRes.data
          mappedFmSongs.value = fmList.map((song: any) => ({
            id: song.id,
            name: song.name,
            album: song.album?.name,
            artist: song.artists?.[0]?.name,
            duration: Math.floor(song.duration / 1000),
            cover: song.album?.picUrl,
          }))
          const idRes: any = mappedFmSongs.value

          // 从响应中提取 id 列表（根据你的后端结构调整）
          let ids: number[] = []
          if (Array.isArray(idRes)) {
            ids = idRes.map((v: any) => (typeof v === 'object' ? (v.id ?? v) : v))
          } else if (Array.isArray(idRes?.ids)) {
            ids = idRes.ids.map((v: any) => (typeof v === 'object' ? (v.id ?? v) : v))
          } else if (Array.isArray(idRes?.data)) {
            ids = idRes.data.map((v: any) => (typeof v === 'object' ? (v.id ?? v) : v))
          } else if (idRes?.id) {
            ids = [idRes.id]
          }

          if (!ids.length) {
            console.error('No track ids returned from MusicIdList', idRes)
            return
          }
          addSongsToPlaylist(ids)
        }
      }
      await playNextSong() // 播放下一首歌曲
    }

    audio.addEventListener('ended', End)
    // 监听错误
    audio.addEventListener('error', async (e) => {
      if (!isSwitch.value) {
        if(isLocalSong(currentSong.value)){
          audio.src = currentSongUrl.value.toString()
          await audio.load()
          audio.currentTime = currentSongTime.value
          audio.play()
          return
        }
        console.error('音频加载错误:', e)
        const reloadurl = ref(null)
        const reloadurlUnblock = ref(null)
        const reloadnexturl = ref(null)
        const normalurl = await MusicUrl({ id: playlist.value[currentSongIndex.value] })
        const nextindex = currentSongIndex.value + 1
        reloadurl.value = normalurl[0].url
        if (reloadurl.value === null) {
          reloadurlUnblock.value = await UnblockMusicUrl(playlist.value[currentSongIndex.value])
          reloadurl.value = reloadurlUnblock.value.data.url // 获取歌曲 URL
        }
        reloadnexturl.value = await MusicUrl({ id: playlist.value[nextindex] })
        nextSongUrl.value = reloadnexturl.value[0].url
        if (
          nextSongUrl.value === null ||
          ((currentSongDetail.value.fee === 1 || 4) && userinfo.viptype === 0)
        ) {
          reloadnexturl.value = await UnblockMusicUrl(playlist.value[nextindex])
          nextSongUrl.value = reloadnexturl.value.data.url
        }
        audio.src = reloadurl.value.toString()
        await audio.load()
        audio.currentTime = currentSongTime.value
        audio.play()
        //isplaying.value = false
      }
    })
    const play = async () => {
      if (currentSong.value && isplaying.value === false) {
        isplaying.value = true
        if(isLocalSong(currentSong.value)){
          audio.src = currentSongUrl.value.toString()
          await audio.load()
          audio.currentTime = currentSongTime.value
          audio.play()
          return
        }
        const urls = await MusicUrl({ id: currentSong.value })
        const url = currentSongUrl.value ?? urls[0].url
        audio.src = url
        //setupAudioListener()
        await audio.load()
        audio.currentTime = currentSongTime.value
        audio.play()
      }
    }

    //采用预加载下一首歌曲来降低请求带来的延迟 , ispre: 上一首或者切换播放列表（不是执行下一首的操作）
    const playcurrentSong = async (input: number | string, ispre = false) => {
      isSwitch.value = true // 切换锁
      if (audio) {
        audio.src = null
        audio.pause()
      }

      const id = (input as any).firstId || input

      // 检查是否为本地歌曲
      if (isLocalSong(id)) {
        // 本地歌曲播放逻辑
        try {
          const localSongRes = await window.electronAPI?.getLocalSongById(id)
          if (!localSongRes?.success || !localSongRes.song) {
            console.error('获取本地歌曲失败:', localSongRes?.error)
            isSwitch.value = false
            return
          }

          const localSong = localSongRes.song

          // 获取本地文件URL
          const urlRes = await window.electronAPI?.getLocalFileUrl(localSong.path)
          if (!urlRes?.success || !urlRes.url) {
            console.error('获取本地文件URL失败:', urlRes?.error)
            isSwitch.value = false
            return
          }

          // 使用 local-resource 协议
          const fileUrl = `local-resource://${localSong.path.replace(/\\/g, '/')}`

          isplaying.value = true
          currentSongUrl.value = fileUrl

          // 尝试获取歌词 (如果有匹配的网易云ID)
          if (localSong.neteaseId) {
            try {
              const lyricRes = await GetMusicLyric(localSong.neteaseId)
              const lrcRes = await GetWordMusicLyric(localSong.neteaseId)

              currentSongLyric.value = lyricRes.lrc?.lyric || null
              currentSongTLyric.value = lyricRes.tlyric?.lyric || null
              currentSongYrc.value = lrcRes.yrc?.lyric || null
              currentSongTYrc.value = lrcRes.ytlrc?.lyric || null
              currentSongRoMaYrc.value = lrcRes.romalrc?.lyric || null
            } catch (e) {
              console.warn('获取本地歌曲歌词失败:', e)
              currentSongLyric.value = null
              currentSongTLyric.value = null
              currentSongYrc.value = null
              currentSongTYrc.value = null
              currentSongRoMaYrc.value = null
            }
          } else {
            currentSongLyric.value = null // 本地歌曲暂无歌词
            currentSongTLyric.value = null
            currentSongYrc.value = null
            currentSongTYrc.value = null
            currentSongRoMaYrc.value = null
          }

          currentSongDetail.value = {
            id: localSong.id as any, // 本地歌曲ID为字符串
            name: localSong.title,
            artists: [{ id: 0, name: localSong.artist }],
            cover: localSong.coverUrl || localSong.cover || '',
            duration: Math.floor(localSong.duration || 0),
            album: localSong.album,
            fee: 0,
          }

          currentSong.value = id
          audio.src = fileUrl
          currentSongTime.value = 0
          audio.currentTime = 0
          await audio.load()
          await audio.play()
          isSwitch.value = false
          if(!isLocalSong(playlist.value[currentSongIndex.value + 1])){
            preload()
          }
          return
        } catch (error) {
          console.error('播放本地歌曲失败:', error)
          isSwitch.value = false
          return
        }
      }

      // 原有的网易云歌曲播放逻辑
      const unblockurls = ref(null)
      const canUsePreload = nextSongUrl.value && !ispre //
      const urls = ref(null)
      const data = ref(null)
      const lyric = ref(null)
      const lrc = ref(null)
      const currentdetail = ref(null)
      isplaying.value = true // 设置播放状态为 true
      console.log('nexturl', nextSongUrl.value)
      if (!canUsePreload) {
        console.log('不使用预加载')
        const normalurl = await MusicUrl({ id: id })
        urls.value = normalurl[0].url
        if (urls.value === null) {
          unblockurls.value = await UnblockMusicUrl(id)
          urls.value = unblockurls.value.data.url // 获取歌曲 URL
        }
        // 获取歌曲详细信息
        currentdetail.value = await GetMusicDetail({ ids: id })
        data.value = currentdetail.value
        console.log('fee', typeof currentdetail.value.songs[0].fee)
        console.log('currentdetail', currentdetail.value.privilege)
        if (
          (currentdetail.value.songs[0].fee === 1 || currentdetail.value.songs[0].fee === 4) &&
          userinfo.viptype === 0
        ) {
          const freeurl = await UnblockMusicUrl(id)
          urls.value = freeurl.data.url
        }

        lyric.value = await GetMusicLyric(id)
        lrc.value = await GetWordMusicLyric(id) //逐字歌词
      } else {
        urls.value = nextSongUrl.value
        data.value = nextSongDetail.value
        lyric.value = nextSongLyric.value
        lrc.value = nextSongLrc.value
        console.log('nextdetail', nextSongDetail.value)
        console.log('data', data.value)
      }
      //const wordlyric = await GetWordMusicLyric(id)
      const detail = data.value.songs[0]
      console.log('detail', detail)
      // 设置当前歌曲详细信息
      currentSongUrl.value = urls.value
      const url = currentSongUrl.value.toString()
      currentSongLyric.value = lyric.value.lrc?.lyric
      currentSongTLyric.value = lyric.value.tlyric?.lyric || null
      currentSongYrc.value = lrc.value.yrc?.lyric || null //逐字
      currentSongTYrc.value = lrc.value.ytlrc?.lyric || null // 翻译
      currentSongRoMaYrc.value = lrc.value.romalrc?.lyric || null //罗马音
      //currentSongWordLyric.value = wordlyric
      currentSongDetail.value = {
        id: detail.id,
        name: detail.name,
        artists: detail.ar.map((ar: any) => ({ id: ar.id, name: ar.name })),
        cover: detail.al.picUrl,
        duration: detail.dt ? Math.floor(detail.dt / 1000) : 0,
        album: detail.al.name,
        fee: detail.fee,
      }

      currentSong.value = id
      audio.src = url // 设置音频源
      currentSongTime.value = 0 //audio.currentTime
      audio.currentTime = 0
      //setupAudioListener() // 设置音频监听器
      await audio.load()
      await audio.play() // 播放音频
      isSwitch.value = false //恢复锁
      const nextIndex = currentSongIndex.value + 1 //用于判断
      console.log('预加载', nextIndex)
      if (nextIndex <= playlist.value.length - 1) {
        preload()
      } else nextSongUrl.value = null
    }

    //预加载
    const preload = async () => {
      const nextdata = ref(null) //临时url
      const nextdetail = ref(null) //临时detail
      const nextindex = currentSongIndex.value + 1 //用于索引
      console.log('current', currentSongIndex.value)
      console.log('next', nextindex)
      const nexturls = await MusicUrl({ id: playlist.value[nextindex] })
      console.log('nextid', playlist.value[nextindex])
      nextSongUrl.value = nexturls[0].url
      if (nexturls[0].url === null) {
        const nextunblock = await UnblockMusicUrl(playlist.value[nextindex]) // 获取歌曲 URL
        nextdata.value = nextunblock.data.url
        nextSongUrl.value = nextdata.value
      }
      nextdetail.value = await GetMusicDetail({ ids: playlist.value[nextindex] }) // 获取歌曲详细信息
      console.log('nextdetail', nextdetail)
      nextSongDetail.value = nextdetail.value
      if (
        (nextdetail.value.songs[0].fee === 1 || nextdetail.value.songs[0].fee === 4) &&
        userinfo.viptype === 0
      ) {
        const freeurl = await UnblockMusicUrl(playlist.value[nextindex])
        nextdata.value = freeurl.data.url
        nextSongUrl.value = nextdata.value
      }
      nextSongLyric.value = await GetMusicLyric(playlist.value[nextindex])
      nextSongLrc.value = await GetWordMusicLyric(playlist.value[nextindex])
    }
    //加载数据，根据playlist中的歌曲Id把信息加入播放列表（currentSonglist）
    const loadPlaylistData = async () => {
      try {
        const songIds = playlist.value
        if (songIds.length === 0) {
          currentSongList.value = []
          return
        }

        const localIds: string[] = []
        const onlineIds: number[] = []
        const idMap = new Map<string | number, SongItem>()

        // 分离本地和在线歌曲ID
        songIds.forEach((id) => {
          if (isLocalSong(id)) {
            localIds.push(id as string)
          } else {
            onlineIds.push(id as number)
          }
        })

        // 并行获取数据
        const promises = []

        // 1. 获取在线歌曲详情
        if (onlineIds.length > 0) {
          // 网易云API通常支持批量获取，这里为了简单还是并发请求，或者优化为批量请求
          // 注意：GetMusicDetail 支持 ids 参数为逗号分隔字符串或数组
          // 如果 GetMusicDetail 支持批量:
          const onlinePromise = GetMusicDetail({ ids: onlineIds.join(',') })
            .then((res) => {
              if (res && res.songs) {
                res.songs.forEach((song: any) => {
                  idMap.set(song.id, {
                    id: song.id,
                    name: song.name,
                    album: song.al?.name || '未知专辑',
                    artists: song.ar.map((ar: any) => ({ id: ar.id, name: ar.name })),
                    duration: song.dt ? Math.floor(song.dt / 1000) : 0,
                    cover: song.al?.picUrl || '',
                    fee: song.fee,
                  })
                })
              }
            })
            .catch((err) => console.error('获取在线歌曲详情失败:', err))
          promises.push(onlinePromise)
        }

        // 2. 获取本地歌曲详情
        if (localIds.length > 0) {
          const localPromise = window.electronAPI
            ?.getLocalByIds(localIds)
            .then((res) => {
              if (res && res.success && res.songs) {
                res.songs.forEach((song) => {
                  idMap.set(song.id, {
                    id: song.id as any,
                    name: song.title,
                    album: song.album || '未知专辑',
                    artists: [{ id: 0, name: song.artist }],
                    duration: Math.floor(song.duration || 0),
                    cover: song.coverUrl || song.cover || '',
                    fee: 0,
                  })
                })
              }
            })
            .catch((err) => console.error('获取本地歌曲详情失败:', err))
          promises.push(localPromise)
        }

        await Promise.all(promises)

        // 按原始顺序重建列表
        currentSongList.value = songIds
          .map((id) => idMap.get(id))
          .filter((item): item is SongItem => !!item)
      } catch (error) {
        console.error('加载歌曲失败:', error)
      }
    }

    const addSongToPlaylist = async (songid: number | string, next: number) => {
      if (playlist.value.includes(songid)) {
        return
        //如果歌曲已经存在就不再添加
      }
      nextSongUrl.value = null
      await playlist.value.splice(next, 0, songid) // 添加歌曲到播放列表

      // 本地歌曲不需要从API获取详情
      if (isLocalSong(songid)) {
        preload()
        return
      }

      const res = await GetMusicDetail({ ids: songid as number })
      const song = res.songs[0]
      currentSongList.value.splice(next, 0, {
        id: song.id,
        name: song.name,
        album: song.al?.name || '未知专辑',
        artists: song.ar.map((ar: any) => ({ id: ar.id, name: ar.name })),
        duration: song.dt ? Math.floor(song.dt / 1000) : 0,
        cover: song.al?.picUrl || '',
      })
      preload()
    }
    const addWholePlaylist = (songs: (number | string)[]) => {
      playlist.value = songs // 替换整个播放列表
    }
    const removeSongFromPlaylist = (songId: number | string) => {
      const wasPlaying = currentSong.value === songId // 检查是否是当前播放的歌曲
      const nextid = playlist.value[currentSongIndex.value + 1]
      playlist.value = playlist.value.filter((song) => song !== songId) // 从播放列表中移除歌曲
      currentSongList.value = currentSongList.value.filter((song) => song.id !== songId)
      if (wasPlaying && playlist.value.length > 0) {
        playcurrentSong(nextid) // 如果移除的是当前播放的歌曲且播放列表不为空，切换到下一首
      } else if (playlist.value.length === 0) {
        currentSong.value = null
        audio.pause()
        isplaying.value = false
      }
      //loadPlaylistData()
    }
    const togglePlay = async () => {
      if (isplaying.value) {
        audio.pause()
        isplaying.value = false
      } else {
        // 如果 currentSong 没有 url，store.playNextSong / store.playcurrentSong 应负责拉取 url
        if (!audio.src) {
          play()
          return
        }
        audio.src = currentSongUrl.value.toString()
        await audio.load()
        audio.currentTime = currentSongTime.value
        audio
          .play()
          .then(() => {
            isplaying.value = true
          })
          .catch((e) => {
            console.error('play failed', e)
            isplaying.value = false
          })
      }
    }
    const playNextSong = async () => {
      if (playlist.value.length === 0) return // 如果播放列表为空，直接返回

      // 如果 currentSongIndex 为 -1（当前没有匹配 id），从 0 开始
      console.log(playlist.value.length)
      console.log(currentSongList.value.length)
      console.log(currentSongIndex.value)
      const song = ref<number | string>(null)
      const currentIndex = currentSongIndex.value === -1 ? 0 : currentSongIndex.value
      const nextIndex = (currentIndex + 1) % playlist.value.length // 计算下一首歌曲索引
      song.value = playlist.value[nextIndex]
      //currentSongTime.value = 0
      //audio.currentTime = currentSongTime.value
      console.log(playmodel.value)
      if (playmodel.value === 'onlyone') {
        const onlyonesong = playlist.value[currentIndex]
        song.value = onlyonesong
      } else if (playmodel.value === 'random') {
        console.log('israndom')
        let randomindex
        do {
          randomindex = Math.floor(Math.random() * playlist.value.length)
        } while (playlist.value.includes(randomindex))
        const randomsong = playlist.value[randomindex]
        console.log(randomsong)
        console.log(randomindex)
        song.value = randomsong
      }
      const mappedFmSongs = ref()
      if (playFM) {
        if (currentSongIndex.value - playlist.value.length <= 3) {
          const fmRes = await GetPersonalFM()
          const fmList = fmRes.data
          mappedFmSongs.value = fmList.map((song) => ({
            id: song.id,
            name: song.name,
            album: song.album?.name,
            artist: song.artists?.[0]?.name,
            duration: Math.floor(song.duration / 1000),
            cover: song.album?.picUrl,
          }))
          const idRes = mappedFmSongs.value

          let ids = []
          if (Array.isArray(idRes)) {
            ids = idRes.map((v) => (typeof v === 'object' ? (v.id ?? v) : v))
          } else if (Array.isArray(idRes?.ids)) {
            ids = idRes.ids.map((v) => (typeof v === 'object' ? (v.id ?? v) : v))
          } else if (Array.isArray(idRes?.data)) {
            ids = idRes.data.map((v) => (typeof v === 'object' ? (v.id ?? v) : v))
          } else if (idRes?.id) {
            ids = [idRes.id]
          }

          if (!ids.length) {
            console.error('No track ids returned from MusicIdList', idRes)
            return
          }
          await addSongsToPlaylist(ids)
        }
      }
      playcurrentSong(song.value)
    }
    const randomplaymodel = () => {
      playmodel.value = playmodel.value === 'random' ? 'normal' : 'random'
    }
    const onlyoneplaymodel = () => {
      playmodel.value = playmodel.value === 'onlyone' ? 'normal' : 'onlyone'
    }
    const playPrevSong = async () => {
      if (playlist.value.length === 0) return // 如果播放列表为空，直接返回

      const length = playlist.value.length
      const currentIndex = currentSongIndex.value === -1 ? 0 : currentSongIndex.value
      // 修复负数取模：先加上 length 再取模
      const prevIndex = (currentIndex - 1 + length) % length
      const song = playlist.value[prevIndex]
      playcurrentSong(song, true)
    }
    const addSongsToPlaylist = async (
      songIds: number[],
      options: {
        startIndex?: number // 开始插入的位置（默认为末尾）
        skipDuplicates?: boolean // 是否跳过已存在的歌曲（默认 true）
      } = {},
    ) => {
      const { startIndex, skipDuplicates = true } = options

      // 过滤掉已存在的歌曲（去重）
      const filteredIds = skipDuplicates
        ? songIds.filter((id) => !playlist.value.includes(id))
        : songIds

      if (filteredIds.length === 0) {
        console.warn('所有歌曲都已存在于播放列表中')
        return
      }

      // 确定插入位置（越界时自动调整为末尾）
      const insertIndex =
        startIndex === undefined || startIndex < 0 || startIndex > playlist.value.length
          ? playlist.value.length
          : startIndex

      // 批量插入到 playlist
      playlist.value.splice(insertIndex, 0, ...filteredIds)

      // 批量获取歌曲详情（并行请求，性能更好）
      try {
        const results = await Promise.all(
          filteredIds.map((id) =>
            GetMusicDetail({ ids: id }).catch((err) => {
              console.error(`歌曲 ${id} 加载失败:`, err)
              return null // 失败时返回 null
            }),
          ),
        )

        // 过滤成功的结果并转换为 Song 对象
        const validSongs = results
          .filter((res): res is NonNullable<typeof res> => Boolean(res?.songs?.[0]))
          .map((res) => {
            const song = res.songs[0]
            return {
              id: song.id,
              name: song.name,
              album: song.al?.name || '未知专辑',
              artists: song.ar.map((ar: any) => ({ id: ar.id, name: ar.name })),
              duration: song.dt ? Math.floor(song.dt / 1000) : 0,
              cover: song.al?.picUrl || '',
            } as SongItem
          })

        // 批量插入到 currentSongList（保持同步）
        currentSongList.value.splice(insertIndex, 0, ...validSongs)

        // 如果有失败的歌曲，从 playlist 中移除
        if (validSongs.length < filteredIds.length) {
          const failedIds = filteredIds.filter((id) => !validSongs.some((song) => song.id === id))
          playlist.value = playlist.value.filter((id) => !failedIds.includes(id as number))
          console.warn(`部分歌曲添加失败，已跳过:`, failedIds)
        }

        console.log(`成功添加 ${validSongs.length} 首歌曲`)
      } catch (error) {
        console.error('批量添加歌曲失败:', error)
        // 发生错误时回滚：移除刚才添加的所有歌曲
        playlist.value.splice(insertIndex, filteredIds.length)
      }
    }
    return {
      audio,
      audiovolume,
      isplaying,
      playnormal,
      playFM,
      playmodel,
      playlist,
      currentSong,
      currentSongDetail,
      currentSongLyric,
      currentSongLrcLine,
      currentSongTLyric,
      currentSongYrc,
      currentSongTYrc,
      currentSongRoMaYrc,
      currentSongUrl,
      useCookie,
      isLocalSong,
      currentSongList,
      currentSongIndex,
      currentSongTime,
      nextSongDetail,
      nextSongLyric,
      nextSongLrc,
      nextSongUrl,
      playcurrentSong,
      loadPlaylistData,
      addSongToPlaylist,
      addWholePlaylist,
      removeSongFromPlaylist,
      togglePlay,
      playNextSong,
      playPrevSong,
      addSongsToPlaylist,
      randomplaymodel,
      onlyoneplaymodel,
      
    }
  },
  {
    persist: {
      key: 'Player',
      storage: localStorage,
      paths: [
        'playlist',
        'currentSongList',
        'playnormal',
        'playFM',
        'playmodel',
        'currentSong',
        'currentSongDetail',
        'currentSongUrl',
        'audiovolume',
        'currentSongTime',
        'currentSongLyric',
        'currentSongTLyric',
        'currentSongLrc',
        'currentSongTLrc',
        'currentSongRoMaLrc',
        'nextSongDetail',
        'nextSongLyric',
        'nextSongLrc',
        'nextSongUrl',
      ],
    } as any,
  },
)
