import pinia from 'pinia'

export const MusicState = defineStore('MusicState', {
    state: () => ({
        isPlaying: false,
        currentTrack: null,
        playlist: [],
    }),




})