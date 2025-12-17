export {}

declare global {
  interface ElectronAPI {
    minimize: () => Promise<void> | void
    toggleMaximize: () => Promise<boolean> | boolean
    close: () => Promise<void> | void
    isMaximized?: () => Promise<boolean> | boolean
    toggleDesktopLyric: () => void
    sendLyricUpdate: (data: { text: string; trans: string }) => void
    setIgnoreMouse: (ignore: boolean) => void
    onLyricUpdate: (callback: (event: any, data: any) => void) => void
    removeLyricListener: (callback: (event: any, data: any) => void) => void
    onTogglePlay: (callback: () => void) => void
    onPlayNext: (callback: () => void) => void
    onPlayPrev: (callback: () => void) => void
    removeTogglePlay: (callback: () => void) => void
    removePlayNext: (callback: () => void) => void
    removePlayPrev: (callback: () => void) => void
    deskLyricStatus: (callback: (event: any, Status: boolean) => void) => void
    // Auto Updater
    checkForUpdate: () => void
    downloadUpdate: () => void
    quitAndInstall: () => void
    onAutoUpdaterMessage: (
      callback: (event: any, data: { message: string; data: any }) => void,
    ) => void

    // Local Music
    openMusicFiles: () => Promise<{ canceled: boolean; filePaths: string[] }>
    openMusicFolder: () => Promise<{ canceled: boolean; folderPath: string | null }>
    scanFolder: (folder: string) => Promise<string[]>
    getMusicTags: (path: string) => Promise<LocalSong>
    readMusicCover: (path: string) => Promise<string | null>
    addLocalSong: (
      song: LocalSong,
    ) => Promise<{ success: boolean; id?: string; error?: string; message?: string }>
    // addLocalSongs: (
    //   songs: LocalSong[],
    // ) => Promise<{ success: boolean; addedCount?: number; error?: string }>
    getAllLocalSongs: () => Promise<{ success: boolean; songs: LocalSong[]; error?: string }>
    getLocalSongById: (
      id: string,
    ) => Promise<{ success: boolean; song?: LocalSong; error?: string }>
    // getPlaylistSongs: (
    //   id: string,
    // ) => Promise<{ success: boolean; songs?: LocalSong[]; error?: string }>
    getLocalByIds: (
      ids: string[],
    ) => Promise<{ success: boolean; songs: LocalSong[]; error?: string }>
    deleteLocalSong: (id: string) => Promise<{ success: boolean; error?: string }>
    // deleteLocalSongs: (
    //   ids: string[],
    // ) => Promise<{ success: boolean; deletedCount?: number; error?: string }>
    // checkLocalFileExists: (path: string) => Promise<boolean>
    // searchLocalSongs: (
    //   keyword: string,
    // ) => Promise<{ success: boolean; songs: LocalSong[]; error?: string }>
    // getLocalSongCount: () => Promise<{ success: boolean; count: number; error?: string }>
    getLocalFileUrl: (
      path: string,
    ) => Promise<{ success: boolean; url?: string; error?: string; message?: string }>
    // onLocalFileChange: (
    //   callback: (event: any, data: { type: string; path: string }) => void,
    // ) => void
    // removeLocalFileChangeListener: (
    //   callback: (event: any, data: { type: string; path: string }) => void,
    // ) => void
    updateLocalSongMatchInfo: (data: {
      id: string
      neteaseId?: number
      coverUrl?: string
      artist?: string
      album?: string
      title?: string
      lyric?: string
      Tlyric?: string
      yrc?: string
      Tyrc?: string
      Romaji?: string
    }) => Promise<{ success: boolean; error?: string }>

    // Local Playlist Methods
    getAllLocalPlaylists: () => Promise<{ success: boolean; playlists: any[]; error?: string }>
    getLocalPlaylistSongs: (
      playlistId: string,
    ) => Promise<{ success: boolean; songs: LocalSong[]; error?: string }>
    // getSongCountByList: (
    //   playlistId: string,
    // ) => Promise<{ success: boolean; songs: LocalSong[]; error?: string }>
    addSongToLocalPlaylist: (data: {
      playlistId: string
      songId: string
    }) => Promise<{ success: boolean; error?: string }>
    // removeSongFromLocalPlaylist: (data: {
    //   playlistId: string
    //   songId: string
    // }) => Promise<{ success: boolean; error?: string }>
    createLocalPlaylist: (
      name: string,
    ) => Promise<{ success: boolean; id?: string; error?: string }>
    deleteLocalPlaylist: (id: string) => Promise<{ success: boolean; error?: string }>

    //网络检测
    getnetstatuschange: () => Promise<boolean>
    getnetstatuslistener: (callback: (status: boolean) => void ) => void
    // 如需更多方法，按上面格式继续添加

  }

  interface LocalSong {
    id: string
    md5: string
    path: string
    title: string
    artist: string
    album: string
    duration: number
    cover: string | null
    neteaseId?: number
    coverUrl?: string
    importAt?: number
    lyric?: string | null
    yrc?: string | null
    Tlyric?: string | null
    Tyrc?: string | null
    Romaji?: string | null
  }

  interface Window {
    electronAPI?: ElectronAPI
  }
}
