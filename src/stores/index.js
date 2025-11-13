import { GetMusicUrl } from '@/api/GetMusic'
import { defineStore } from 'pinia'

export const Player = defineStore('Player', {
  state: () => ({
    audio: new Audio(), // 音频对象
    isplaying: false, // 播放状态
    playlist: [], // 播放列表
    currentSong: null, // 当前播放的歌曲
  }),
  getters: {
    currentSongIndex: (state) =>
      state.playlist.findIndex((item) => item.id === state.currentSong?.id), // 获取当前播放歌曲索引
  },
  actions: {
    playcurrentSong(input) {
      const url = typeof input === 'string' ? input : (input?.url ?? input?.playUrl)
      this.isplaying = true // 设置播放状态为播放
      this.audio.src = url // 设置音频源
      this.audio.load()
      this.audio.play() // 播放音频
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
    playNextSong() {
      if (this.playlist.length === 0) return // 如果播放列表为空，直接返回
      const currentIndex = this.currentSongIndex
      const nextIndex = (currentIndex + 1) % this.playlist.length // 计算下一首歌曲索引
      this.currentSong = this.playlist[nextIndex] // 更新当前播放的歌曲
    },
    playPrevSong() {
      if (this.playlist.length === 0) return // 如果播放列表为空，直接返回
      const currentIndex = this.currentSongIndex
      const nextIndex = (currentIndex - 1) % this.playlist.length // 计算下一首歌曲索引
      this.currentSong = this.playlist[nextIndex] // 更新当前播放的歌曲
    },
  },
})
