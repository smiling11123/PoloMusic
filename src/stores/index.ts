import { MusicUrl, GetMusicDetail, GetMusicLyric } from '@/api/GetMusic'
import { defineStore } from 'pinia'
import { useLocalStorage } from '@vueuse/core'
import { computed, ComputedRef, ref } from 'vue'
import { GetPersonalFM } from '@/api/GetMusicList'
export interface Song {
  id: number
  name: string
  album: string
  artist: string
  duration: number
  cover: string
}
interface Artist {
  id: number
  name: string
}

interface SongItem {
  id: number
  name: string
  alias?: string // 歌曲别名（如：抖音DJ版）
  artists: Artist[]
  album: string
  cover: string
  duration?: number
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
    const playlist = ref<number[]>([]) // 播放列表
    const currentSong = ref<number | null>(null) // 当前播放的歌曲
    const currentSongUrl = ref<String | null>(null) //上次播放位置
    const currentSongTime = ref<number>(0)
    const currentSongLyric = ref<String>(null)
    const currentSongTLyric = ref<String>(null)
    const useCookie = ref<String | null>(null)
    const currentSongDetial = ref({
      id: null,
      name: null,
      artist: null,
      cover: null,
      duration: null,
      album: null,
    }) // 当前播放歌曲的详细信息

    const currentSongList = ref<SongItem[]>([])

    const currentSongIndex: ComputedRef<number> = computed(() => {
      if (currentSong.value === null) return -1
      return playlist.value.findIndex((songId) => songId === currentSong.value)
    }) // 获取当前播放歌曲索引

    const setupAudioListener = () => {
      // 移除旧的监听器（防止重复添加）
      audio.removeEventListener('ended', End.bind(this))
      // 添加新监听器
      audio.addEventListener('ended', End.bind(this))
      // 监听错误
      audio.addEventListener('error', (e) => {
        console.error('音频加载错误:', e)
        isplaying.value = false
      })
    }
    const play = async () => {
      if (currentSong.value && isplaying.value === false) {
        isplaying.value = true
        const urls = await MusicUrl({ id: currentSong.value })
        const url = urls[0].url
        audio.src = url
        setupAudioListener()
        audio.load()
        audio.currentTime = currentSongTime.value
        audio.play()
      }
    }
    const playcurrentSong = async (input) => {
      const id = input.firstId || input
      console.log('Playing song with id:', id)
      isplaying.value = true // 设置播放状态为 true
      const urls = await MusicUrl({ id: id }) // 获取歌曲 URL
      const data = await GetMusicDetail({ ids: id }) // 获取歌曲详细信息
      const lyric = await GetMusicLyric(id)
      const detail = data.songs[0] // 设置当前歌曲详细信息
      currentSongUrl.value = urls[0].url
      currentSongLyric.value = lyric.lrc?.lyric
      currentSongTLyric.value = lyric.tlyric?.lyric || null

      currentSongDetial.value = {
        id: detail.id,
        name: detail.name,
        artist: detail.ar.map((artist) => artist.name).join(', '),
        cover: detail.al.picUrl,
        duration: detail.dt ? Math.floor(detail.dt / 1000) : 0,
        album: detail.al.name,
      }
      currentSong.value = id
      audio.src = urls[0].url // 设置音频源
      currentSongTime.value = audio.currentTime
      setupAudioListener() // 设置音频监听器
      audio.load()
      audio.play() // 播放音频
    }
    const loadPlaylistData = async () => {
      try {
        const songIds = playlist.value // 假设是 number[]
        if (songIds.length === 0) {
          currentSongList.value = []
          return
        }
        const results = await Promise.all(
          songIds.map((id) =>
            GetMusicDetail({ ids: id }) // 单个请求
              .then((res) => res) // 提取数据
              .catch((err) => {
                console.error(`歌曲 ${id} 加载失败:`, err)
                return null // 失败时返回null
              }),
          ),
        )
        currentSongList.value = results
          .filter(Boolean) // 移除null
          .map((song) => ({
            id: song.songs[0].id,
            name: song.songs[0].name,
            album: song.songs[0].al?.name || '未知专辑',
            artists: song.songs[0].ar.map((ar: any) => ({ id: ar.id, name: ar.name })),
            duration: song.songs[0].dt ? Math.floor(song.songs[0].dt / 1000) : 0,
            cover: song.songs[0].al?.picUrl || '',
          }))
        console.log(currentSongList.value)
      } catch (error) {
        console.error('加载歌曲失败:', error)
      } finally {
      }
    }
    const End = async () => {
      if (playFM) {
        const mappedFmSongs = ref()
        if (currentSongIndex.value - playlist.value.length <= 3) {
          const fmRes = await GetPersonalFM()
          console.log(fmRes)
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
          console.log('MusicIdList response:', idRes)

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
      playNextSong() // 播放下一首歌曲
    }
    const addSongToPlaylist = async (songid, next) => {
      if (playlist.value.includes(songid)) {
        return
      }
      playlist.value.splice(next, 0, songid) // 添加歌曲到播放列表
      console.log(playlist.value)
      console.log(songid)
      console.log(currentSongIndex.value)
      const res = await GetMusicDetail({ ids: songid })
      const song = res.songs[0]
      currentSongList.value.splice(next, 0, {
        id: song.id,
        name: song.name,
        album: song.al?.name || '未知专辑',
        artists: song.ar?.map((a) => a.name).join('/') || '未知艺术家',
        duration: song.dt ? Math.floor(song.dt / 1000) : 0,
        cover: song.al?.picUrl || '',
      })
    }
    const addWholePlaylist = (songs) => {
      playlist.value = songs // 替换整个播放列表
      loadPlaylistData()
    }
    const removeSongFromPlaylist = (songId) => {
      const wasPlaying = currentSong.value === songId // 检查是否是当前播放的歌曲
      playlist.value = playlist.value.filter((song) => song !== songId) // 从播放列表中移除歌曲
      if (wasPlaying && playlist.value.length > 0) {
        playNextSong() // 如果移除的是当前播放的歌曲且播放列表不为空，切换到下一首
      } else if (playlist.value.length === 0) {
        currentSong.value = null
        audio.pause()
        isplaying.value = false
      }
    }
    const togglePlay = () => {
      if (isplaying.value) {
        audio.pause()
        isplaying.value = false
      } else {
        // 如果 currentSong 没有 url，store.playNextSong / store.playcurrentSong 应负责拉取 url
        if (!audio.src) {
          play()
          return
        }
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
      const currentIndex = currentSongIndex.value === -1 ? 0 : currentSongIndex.value
      const nextIndex = (currentIndex + 1) % playlist.value.length // 计算下一首歌曲索引
      const song = playlist.value[nextIndex]
      await playcurrentSong(song)
    }
    const playPrevSong = async () => {
      if (playlist.value.length === 0) return // 如果播放列表为空，直接返回

      const length = playlist.value.length
      const currentIndex = currentSongIndex.value === -1 ? 0 : currentSongIndex.value
      // 修复负数取模：先加上 length 再取模
      const prevIndex = (currentIndex - 1 + length) % length
      const song = playlist.value[prevIndex]
      playcurrentSong(song)
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
          playlist.value = playlist.value.filter((id) => !failedIds.includes(id))
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
      playlist,
      currentSong,
      currentSongDetial,
      currentSongLyric,
      currentSongTLyric,
      useCookie,
      currentSongList,
      currentSongIndex,
      currentSongTime,
      playcurrentSong,
      loadPlaylistData,
      addSongToPlaylist,
      addWholePlaylist,
      removeSongFromPlaylist,
      togglePlay,
      playNextSong,
      playPrevSong,
      addSongsToPlaylist,
    }
  },
  {
    persist: {
      key: 'Player',
      storage: localStorage,
      paths: [
        'playlist',
        'currentSongList',
        'currentSong',
        'currentSongDetail',
        'currentSongUrl',
        'audiovolume',
        'currentSongTime',
        'currentSongLyric',
        'currentSongTLyric',
      ],
    } as any,
  },
)
