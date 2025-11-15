import { MusicUrl, GetMusicDetail } from '@/api/GetMusic'
import { defineStore } from 'pinia'

export const Player = defineStore('Player', {
  state: () => ({
    audio: new Audio(), // 音频对象
    isplaying: false, // 播放状态
    playlist: [], // 播放列表
    currentSong: null, // 当前播放的歌曲
    currentSongDetial: {
      name: null,
      artist: null,
      cover: null,
    }, // 当前播放歌曲的详细信息
  }),
  getters: {
    currentSongIndex: (state) => state.playlist.findIndex((item) => item === state.currentSong), // 获取当前播放歌曲索引
  },
  actions: {
    setupAudioListener() {
      // 移除旧的监听器（防止重复添加）
      this.audio.removeEventListener('ended', this.End.bind(this))

      // 添加新监听器
      this.audio.addEventListener('ended', this.End.bind(this))

      // 监听错误
      this.audio.addEventListener('error', (e) => {
        console.error('音频加载错误:', e)
        this.isplaying = false
      })
    },
    async playcurrentSong(input) {
      const id = input.firstId || input
      console.log('Playing song with id:', id)
      this.isplaying = true // 设置播放状态为 true
      const urls = await MusicUrl({ id: id }) // 获取歌曲 URL
      const data = await GetMusicDetail({ ids: id }) // 获取歌曲详细信息
      const detail = data.songs[0] // 设置当前歌曲详细信息
      this.currentSongDetial = {
        name: detail.name,
        artist: detail.ar.map((artist) => artist.name).join(', '),
        cover: detail.al.picUrl,
      }
      this.currentSong = id
      this.audio.src = urls[0].url // 设置音频源
      this.setupAudioListener() // 设置音频监听器
      this.audio.load()
      this.audio.play() // 播放音频
    },
    End() {
      this.playNextSong() // 播放下一首歌曲
    },
    addSongToPlaylist(song) {
      this.playlist.push(song) // 添加歌曲到播放列表
    },
    addWholePlaylist(songs) {
      this.playlist = songs // 替换整个播放列表
    },
    removeSongFromPlaylist(songId) {
      const wasPlaying = this.currentSong?.id === songId // 检查是否是当前播放的歌曲
      this.playlist = this.playlist.filter((song) => song.id !== songId) // 从播放列表中移除歌曲
      if (wasPlaying && this.playlist.length > 0) {
        this.playNextSong() // 如果移除的是当前播放的歌曲且播放列表不为空，切换到下一首
      }
    },
    togglePlay() {
      if (!this.audio) return
      if (this.isplaying) {
        this.audio.pause()
        this.isplaying = false
      } else {
        // 如果 currentSong 没有 url，store.playNextSong / store.playcurrentSong 应负责拉取 url
        this.audio
          .play()
          .then(() => {
            this.isplaying = true
          })
          .catch((e) => {
            console.error('play failed', e)
            this.isplaying = false
          })
      }
    },
    async playNextSong() {
      if (this.playlist.length === 0) return // 如果播放列表为空，直接返回

      // 如果 currentSongIndex 为 -1（当前没有匹配 id），从 0 开始
      const currentIndex = this.currentSongIndex === -1 ? 0 : this.currentSongIndex
      const nextIndex = (currentIndex + 1) % this.playlist.length // 计算下一首歌曲索引
      const song = this.playlist[nextIndex]
      this.playcurrentSong(song)
    },
    async playPrevSong() {
      if (this.playlist.length === 0) return // 如果播放列表为空，直接返回

      const length = this.playlist.length
      const currentIndex = this.currentSongIndex === -1 ? 0 : this.currentSongIndex
      // 修复负数取模：先加上 length 再取模
      const prevIndex = (currentIndex - 1 + length) % length
      const song = this.playlist[prevIndex]
      this.playcurrentSong(song)
    },
  },
})
