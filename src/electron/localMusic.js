const { ipcMain, dialog } = require('electron')
const path = require('node:path')
const fs = require('node:fs')
const crypto = require('node:crypto')
const db = require('./db')


// 支持的音频格式
const SUPPORTED_AUDIO_EXTENSIONS = ['.mp3', '.flac', '.wav', '.aac', '.m4a', '.ogg', '.wma']

/**
 * 初始化本地音乐模块 - 注册所有IPC处理器
 */
const initLocalMusic = () => {
  // 初始化数据库
  db.initDatabase()

  // 打开文件选择对话框
  ipcMain.handle('dialog:openMusic', async () => {
    const result = await dialog.showOpenDialog({
      title: '选择音乐文件',
      properties: ['openFile', 'multiSelections'],
      filters: [
        { name: '音频文件', extensions: ['mp3', 'flac', 'wav', 'aac', 'm4a', 'ogg', 'wma'] },
      ],
    })

    if (result.canceled) {
      return { canceled: true, filePaths: [] }
    }

    return { canceled: false, filePaths: result.filePaths }
  })

  // 打开文件夹选择对话框
  ipcMain.handle('dialog:openFolder', async () => {
    const result = await dialog.showOpenDialog({
      title: '选择音乐文件夹',
      properties: ['openDirectory'],
    })

    if (result.canceled) {
      return { canceled: true, folderPath: null }
    }

    return { canceled: false, folderPath: result.filePaths[0] }
  })

  // 扫描文件夹获取音频文件
  ipcMain.handle('scan:folder', async (event, folderPath) => {
    const audioFiles = []

    const scanDir = (dirPath) => {
      try {
        const entries = fs.readdirSync(dirPath, { withFileTypes: true })

        for (const entry of entries) {
          const fullPath = path.join(dirPath, entry.name)

          if (entry.isDirectory()) {
            scanDir(fullPath) // 递归扫描子目录
          } else if (entry.isFile()) {
            const ext = path.extname(entry.name).toLowerCase()
            if (SUPPORTED_AUDIO_EXTENSIONS.includes(ext)) {
              audioFiles.push(fullPath)
            }
          }
        }
      } catch (error) {
        console.error('扫描目录出错:', error)
      }
    }

    scanDir(folderPath)
    return audioFiles
  })

  // 获取音乐元数据
  ipcMain.handle('tags:get', async (event, filePath) => {
    try {
      // 动态导入 music-metadata (ESM 模块)
      const mm = await import('music-metadata')
      const metadata = await mm.parseFile(filePath)

      // 生成文件 MD5
      const fileBuffer = fs.readFileSync(filePath)
      const md5 = crypto.createHash('md5').update(fileBuffer).digest('hex')

      // 生成唯一ID (使用 MD5 前16位 + 时间戳)
      const id = `local_${md5.substring(0, 16)}`

      // 提取封面图片并转换为 base64
      let coverBase64 = null
      if (metadata.common.picture && metadata.common.picture.length > 0) {
        const picture = metadata.common.picture[0]
        coverBase64 = `data:${picture.format};base64,${picture.data.toString('base64')}`
      }
      let lyric = null
      let yrc = null
      const extname = path.extname(filePath)
      const lrcpath = filePath.slice(0, -extname.length) + '.lrc'
      const yrcpath = filePath.slice(0, -extname.length) + '.yrc'
      try {
        if (fs.existsSync(lrcpath)) {
          lyric = fs.readFileSync(lrcpath, 'utf-8')
        }
        if (fs.existsSync(yrcpath)) {
          yrc = fs.readFileSync(yrcpath, 'utf-8')
        }
      } catch (error) {
        console.log('无外挂歌词')
      }
      if (!lyric && !yrc && metadata.common.lyrics && metadata.common.lyrics.length > 0) {
        // music-metadata 返回的 lyrics 是一个字符串数组，通常直接 join 即可
        lyric = metadata.common.lyrics.join('\n')
      }
      return {
        id,
        md5,
        path: filePath,
        title: metadata.common.title || path.basename(filePath, path.extname(filePath)),
        artist: metadata.common.artist || '未知艺术家',
        album: metadata.common.album || '未知专辑',
        duration: metadata.format.duration || 0,
        cover: coverBase64,
        lyric: lyric || null,
        yrc: yrc || null,
      }
    } catch (error) {
      console.error('解析元数据失败:', error)
      // 返回基本信息
      const fileBuffer = fs.readFileSync(filePath)
      const md5 = crypto.createHash('md5').update(fileBuffer).digest('hex')
      const id = `local_${md5.substring(0, 16)}`

      return {
        id,
        md5,
        path: filePath,
        title: path.basename(filePath, path.extname(filePath)),
        artist: '未知艺术家',
        album: '未知专辑',
        duration: 0,
        cover: null,
        lyric: null,
        yrc: null,
      }
    }
  })

  // 读取音乐封面
  ipcMain.handle('cover:read', async (event, filePath) => {
    try {
      const mm = await import('music-metadata')
      const metadata = await mm.parseFile(filePath, { skipCovers: false })

      if (metadata.common.picture && metadata.common.picture.length > 0) {
        const picture = metadata.common.picture[0]
        return `data:${picture.format};base64,${picture.data.toString('base64')}`
      }
      return null
    } catch (error) {
      console.error('读取封面失败:', error)
      return null
    }
  })

  // 添加歌曲到数据库
  ipcMain.handle('local:addSong', async (event, song) => {
    try {
      // 检查是否已存在（通过 MD5）
      if (db.songExistsByMd5(song.md5)) {
        return { success: false, error: 'duplicate', message: '歌曲已存在' }
      }

      const result = db.addSong(song)
      return { success: result.changes > 0, id: song.id }
    } catch (error) {
      console.error('添加歌曲失败:', error)
      return { success: false, error: error.message }
    }
  })

  // 批量添加歌曲
  ipcMain.handle('local:addSongs', async (event, songs) => {
    try {
      const count = db.addSongs(songs)
      return { success: true, addedCount: count }
    } catch (error) {
      console.error('批量添加歌曲失败:', error)
      return { success: false, error: error.message }
    }
  })

  // 获取所有本地歌曲
  ipcMain.handle('local:getAllSongs', async () => {
    try {
      const songs = db.getAllSongs()
      return { success: true, songs }
    } catch (error) {
      console.error('获取歌曲列表失败:', error)
      return { success: false, error: error.message, songs: [] }
    }
  })

  // 根据ID获取歌曲
  ipcMain.handle('local:getSongById', async (event, id) => {
    try {
      const song = db.getSongById(id)
      return { success: true, song }
    } catch (error) {
      console.error('获取歌曲失败:', error)
      return { success: false, error: error.message }
    }
  })

  // 根据ID数组批量获取歌曲
  ipcMain.handle('local:getByIds', async (event, ids) => {
    try {
      const songs = db.getSongsByIds(ids)
      return { success: true, songs }
    } catch (error) {
      console.error('批量获取歌曲失败:', error)
      return { success: false, error: error.message, songs: [] }
    }
  })

  // 删除歌曲（仅从数据库）
  ipcMain.handle('local:deleteSong', async (event, id) => {
    try {
      const result = db.deleteSong(id)
      return { success: result.changes > 0 }
    } catch (error) {
      console.error('删除歌曲失败:', error)
      return { success: false, error: error.message }
    }
  })

  // 批量删除歌曲
  ipcMain.handle('local:deleteSongs', async (event, ids) => {
    try {
      const count = db.deleteSongs(ids)
      return { success: true, deletedCount: count }
    } catch (error) {
      console.error('批量删除歌曲失败:', error)
      return { success: false, error: error.message }
    }
  })

  // 检查文件是否存在
  ipcMain.handle('local:checkFileExists', async (event, filePath) => {
    try {
      return fs.existsSync(filePath)
    } catch (error) {
      return false
    }
  })

  // 搜索本地歌曲
  ipcMain.handle('local:search', async (event, keyword) => {
    try {
      const songs = db.searchSongs(keyword)
      return { success: true, songs }
    } catch (error) {
      console.error('搜索歌曲失败:', error)
      return { success: false, error: error.message, songs: [] }
    }
  })

  // 获取歌曲数量
  ipcMain.handle('local:getCount', async () => {
    try {
      const count = db.getSongCount()
      return { success: true, count }
    } catch (error) {
      console.error('获取歌曲数量失败:', error)
      return { success: false, error: error.message, count: 0 }
    }
  })

  // 读取本地文件为 base64 或 URL（用于播放）
  ipcMain.handle('local:getFileUrl', async (event, filePath) => {
    try {
      // 检查文件是否存在
      if (!fs.existsSync(filePath)) {
        return { success: false, error: 'file_not_found', message: '文件不存在' }
      }
      // 返回 file:// 协议 URL
      const fileUrl = `file://${filePath.replace(/\\/g, '/')}`
      return { success: true, url: fileUrl }
    } catch (error) {
      console.error('获取文件URL失败:', error)
      return { success: false, error: error.message }
    }
  })

  // 更新歌曲匹配信息（网易云ID、封面URL等）
  ipcMain.handle(
    'local:updateMatchInfo',
    async (event, { id, neteaseId, coverUrl, artist, album, title, lyric, Tlyric, yrc, Tyrc, Romaji }) => {
      try {
        const result = db.updateSongMatchInfo(id, { neteaseId, coverUrl, artist, album, title, lyric, Tlyric, yrc, Tyrc, Romaji  })
        return { success: result.changes > 0 }
      } catch (error) {
        console.error('更新匹配信息失败:', error)
        return { success: false, error: error.message }
      }
    },
  )

  // --- Playlist IPC Handlers ---

  // 获取所有本地歌单
  ipcMain.handle('local:getAllPlaylists', async () => {
    try {
      const playlists = db.getAllPlaylists()
      return { success: true, playlists }
    } catch (error) {
      console.error('获取歌单列表失败:', error)
      return { success: false, error: error.message, playlists: [] }
    }
  })

  // 创建歌单
  ipcMain.handle('local:createPlaylist', async (event, name) => {
    try {
      const result = db.createPlaylist(name)
      return { success: true, id: result.id }
    } catch (error) {
      console.error('创建歌单失败:', error)
      return { success: false, error: error.message }
    }
  })

  // 删除歌单
  ipcMain.handle('local:deletePlaylist', async (event, id) => {
    try {
      const result = db.deletePlaylist(id)
      return { success: result.changes > 0 }
    } catch (error) {
      console.error('删除歌单失败:', error)
      return { success: false, error: error.message }
    }
  })

  // 添加歌曲到歌单
  ipcMain.handle('local:addSongToPlaylist', async (event, { playlistId, songId }) => {
    try {
      const result = db.addSongToPlaylist(playlistId, songId)
      return { success: result.changes > 0 }
    } catch (error) {
      console.error('添加歌曲到歌单失败:', error)
      return { success: false, error: error.message }
    }
  })

  // 从歌单移除歌曲
  ipcMain.handle('local:removeSongFromPlaylist', async (event, { playlistId, songId }) => {
    try {
      const result = db.removeSongFromPlaylist(playlistId, songId)
      return { success: result.changes > 0 }
    } catch (error) {
      console.error('从歌单移除歌曲失败:', error)
      return { success: false, error: error.message }
    }
  })

  // 获取歌单内的歌曲
  ipcMain.handle('local:getPlaylistSongs', async (event, playlistId) => {
    try {
      const songs = db.getPlaylistSongs(playlistId)
      return { success: true, songs }
    } catch (error) {
      console.error('获取歌单歌曲失败:', error)
      return { success: false, error: error.message, songs: [] }
    }
  })

  console.log('本地音乐模块初始化完成')
}
ipcMain.handle('local:localplaylistcount', async (playlistId) => {
  try {
    const songcount = db.getSongCountByList(playlistId)
    return { success: true, songcount }
  } catch (error) {
    console.log('获取歌曲数量失败')
    return { success: false, error: error.message, songs: [] }
  }
})
/**
 * 关闭本地音乐模块
 */
const closeLocalMusic = () => {
  db.closeDatabase()
}

module.exports = {
  initLocalMusic,
  closeLocalMusic,
}
