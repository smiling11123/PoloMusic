const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
  minimize: () => ipcRenderer.invoke('window-minimize'),
  toggleMaximize: () => ipcRenderer.invoke('window-toggle-maximize'),
  close: () => ipcRenderer.invoke('window-close'),
  isMaximized: () => ipcRenderer.invoke('window-is-maximized'),
  global_toggle: (callback) => ipcRenderer.on('global-toggle-play', callback),
  global_next: (callback) => ipcRenderer.on('global-next', callback),
  global_prev: (callback) => ipcRenderer.on('global-prev', callback),
  remove_toggle: (callback) => ipcRenderer.removeListener('global-toggle-play', callback),
  remove_next: (callback) => ipcRenderer.removeListener('global-next', callback),
  remove_prev: (callback) => ipcRenderer.removeListener('global-prev', callback),
  toggleDesktopLyric: () => ipcRenderer.send('toggle-desktop-lyric'),
  sendLyricUpdate: (data) => ipcRenderer.send('update-lyric-info', data),
  setIgnoreMouse: (ignore) => ipcRenderer.send('set-ignore-mouse-events', ignore),
  onLyricUpdate: (callback) => ipcRenderer.on('on-lyric-update', callback),
  removeLyricListener: (callback) => ipcRenderer.removeListener('on-lyric-update', callback),
  onMainWindowMoving: (callback) => ipcRenderer.on('main-window-moving', callback),
  deskLyricStatus: (callback) => ipcRenderer.on('deskLyric-Status', callback),
  // Auto Updater
  checkForUpdate: () => ipcRenderer.send('check-for-update'),
  downloadUpdate: () => ipcRenderer.send('download-update'),
  quitAndInstall: () => ipcRenderer.send('quit-and-install'),
  onAutoUpdaterMessage: (callback) => ipcRenderer.on('auto-updater-message', callback),

  // Local Music
  openMusicFiles: () => ipcRenderer.invoke('dialog:openMusic'),
  openMusicFolder: () => ipcRenderer.invoke('dialog:openFolder'),
  scanFolder: (folder) => ipcRenderer.invoke('scan:folder', folder),
  getMusicTags: (path) => ipcRenderer.invoke('tags:get', path),
  readMusicCover: (path) => ipcRenderer.invoke('cover:read', path),
  addLocalSong: (song) => ipcRenderer.invoke('local:addSong', song),
  addLocalSongs: (songs) => ipcRenderer.invoke('local:addSongs', songs),
  getAllLocalSongs: () => ipcRenderer.invoke('local:getAllSongs'),
  getLocalSongById: (id) => ipcRenderer.invoke('local:getSongById', id),
  getLocalByIds: (ids) => ipcRenderer.invoke('local:getByIds', ids),
  deleteLocalSong: (id) => ipcRenderer.invoke('local:deleteSong', id),
  deleteLocalSongs: (ids) => ipcRenderer.invoke('local:deleteSongs', ids),
  checkLocalFileExists: (path) => ipcRenderer.invoke('local:checkFileExists', path),
  searchLocalSongs: (keyword) => ipcRenderer.invoke('local:search', keyword),
  getLocalSongCount: () => ipcRenderer.invoke('local:getCount'),
  getLocalFileUrl: (path) => ipcRenderer.invoke('local:getFileUrl', path),
  updateLocalSongMatchInfo: (data) => ipcRenderer.invoke('local:updateMatchInfo', data),
  onLocalFileChange: (callback) => ipcRenderer.on('local-file-change', callback),
  removeLocalFileChangeListener: (callback) =>
    ipcRenderer.removeListener('local-file-change', callback),

  // Playlist Methods
  getAllLocalPlaylists: () => ipcRenderer.invoke('local:getAllPlaylists'),
  createLocalPlaylist: (name) => ipcRenderer.invoke('local:createPlaylist', name),
  deleteLocalPlaylist: (id) => ipcRenderer.invoke('local:deletePlaylist', id),
  addSongToLocalPlaylist: (data) => ipcRenderer.invoke('local:addSongToPlaylist', data),
  removeSongFromLocalPlaylist: (data) => ipcRenderer.invoke('local:removeSongFromPlaylist', data),
  getLocalPlaylistSongs: (playlistId) => ipcRenderer.invoke('local:getPlaylistSongs', playlistId),
  getSongCountByList: (playlistid) => ipcRenderer.invoke('local:localplaylistcount', playlistid),

  //网络检测
  getnetstatuslistener: (callback) => {
    const newcallback = (event, status) => callback(status)
    ipcRenderer.on('netstatuschange', newcallback)
    return () => {
      ipcRenderer.removeListener('netstatuschange', newcallback)
    }
  },
  //remove_netstatuslistener: () => ipcRenderer.removeListener('')
  getnetstatus: () => ipcRenderer.invoke('checknetstatus')
})
