const Database = require('better-sqlite3')
const path = require('node:path')
const { app } = require('electron')

// 获取数据库存储路径 - 使用用户数据目录以确保持久化
const getDbPath = () => {
  const userDataPath = app.getPath('userData')
  return path.join(userDataPath, 'local-music.db')
}

let db = null

/**
 * 初始化数据库连接并创建表结构
 */
const initDatabase = () => {
  const dbPath = getDbPath()
  console.log('Database path:', dbPath)

  db = new Database(dbPath)

  // 开启外键约束
  db.pragma('foreign_keys = ON')

  // 创建本地歌曲表
  db.exec(`
    CREATE TABLE IF NOT EXISTS songs (
      id TEXT PRIMARY KEY,
      md5 TEXT UNIQUE,
      path TEXT NOT NULL,
      title TEXT,
      artist TEXT,
      album TEXT,
      duration REAL,
      cover TEXT,
      neteaseId INTEGER,
      coverUrl TEXT,
      importAt INTEGER DEFAULT (strftime('%s', 'now')),
      lyric TEXT,
      yrc TEXT,
      Tlyric TEXT,
      Tyrc TEXT,
      Romaji TEXT
    )
  `)

  // 迁移: 为旧表添加新列 (如果不存在)
  try {
    db.exec(`ALTER TABLE songs ADD COLUMN neteaseId INTEGER`)
  } catch (e) {
    // 列已存在，忽略错误
  }
  try {
    db.exec(`ALTER TABLE songs ADD COLUMN coverUrl TEXT`)
  } catch (e) {
    // 列已存在，忽略错误
  }

  // 创建索引以加速查询
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_songs_md5 ON songs(md5);
    CREATE INDEX IF NOT EXISTS idx_songs_path ON songs(path);
  `)

  // 创建本地歌单表
  db.exec(`
    CREATE TABLE IF NOT EXISTS playlists (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      createdAt INTEGER DEFAULT (strftime('%s', 'now'))
    )
  `)

  // 创建歌单-歌曲关联表
  db.exec(`
    CREATE TABLE IF NOT EXISTS playlist_songs (
      playlistId TEXT,
      songId TEXT,
      addedAt INTEGER DEFAULT (strftime('%s', 'now')),
      PRIMARY KEY (playlistId, songId),
      FOREIGN KEY (playlistId) REFERENCES playlists(id) ON DELETE CASCADE,
      FOREIGN KEY (songId) REFERENCES songs(id) ON DELETE CASCADE
    )
  `)

  // 默认创建一个"我喜欢的音乐"歌单
  try {
    const defaultPlaylistId = 'local_favorites'
    const stmt = db.prepare('INSERT OR IGNORE INTO playlists (id, name) VALUES (?, ?)')
    stmt.run(defaultPlaylistId, '我喜欢的音乐')
  } catch (e) {
    console.error('Failed to create default playlist:', e)
  }

  console.log('Local music database initialized')
  return db
}

/**
 * 获取数据库实例
 */
const getDatabase = () => {
  if (!db) {
    throw new Error('Database not initialized. Call initDatabase() first.')
  }
  return db
}

/**
 * 添加歌曲到数据库
 * @param {Object} song - 歌曲信息对象
 * @returns {Object} 插入结果
 */
const addSong = (song) => {
  const stmt = db.prepare(`
    INSERT OR IGNORE INTO songs (id, md5, path, title, artist, album, duration, cover)
    VALUES (@id, @md5, @path, @title, @artist, @album, @duration, @cover)
  `)
  return stmt.run(song)
}

/**
 * 批量添加歌曲
 * @param {Array} songs - 歌曲数组
 * @returns {number} 成功添加的数量
 */
const addSongs = (songs) => {
  const stmt = db.prepare(`
    INSERT OR IGNORE INTO songs (id, md5, path, title, artist, album, duration, cover)
    VALUES (@id, @md5, @path, @title, @artist, @album, @duration, @cover)
  `)

  const insertMany = db.transaction((items) => {
    let count = 0
    for (const song of items) {
      const result = stmt.run(song)
      count += result.changes
    }
    return count
  })

  return insertMany(songs)
}

/**
 * 获取所有本地歌曲
 * @returns {Array} 歌曲列表
 */
const getAllSongs = () => {
  const stmt = db.prepare('SELECT * FROM songs ORDER BY importAt DESC')
  return stmt.all()
}

/**
 * 根据ID获取歌曲
 * @param {string} id - 歌曲ID
 * @returns {Object|null} 歌曲信息
 */
const getSongById = (id) => {
  const stmt = db.prepare('SELECT * FROM songs WHERE id = ?')
  return stmt.get(id)
}

/**
 * 根据ID数组批量获取歌曲
 * @param {Array<string>} ids - 歌曲ID数组
 * @returns {Array} 歌曲列表
 */
const getSongsByIds = (ids) => {
  if (!ids || ids.length === 0) return []
  const placeholders = ids.map(() => '?').join(',')
  const stmt = db.prepare(`SELECT * FROM songs WHERE id IN (${placeholders})`)
  return stmt.all(...ids)
}

/**
 * 根据MD5检查歌曲是否已存在
 * @param {string} md5 - 文件MD5值
 * @returns {boolean} 是否存在
 */
const songExistsByMd5 = (md5) => {
  const stmt = db.prepare('SELECT 1 FROM songs WHERE md5 = ?')
  return !!stmt.get(md5)
}

/**
 * 根据路径检查歌曲是否已存在
 * @param {string} filePath - 文件路径
 * @returns {boolean} 是否存在
 */
const songExistsByPath = (filePath) => {
  const stmt = db.prepare('SELECT 1 FROM songs WHERE path = ?')
  return !!stmt.get(filePath)
}

/**
 * 删除歌曲（仅从数据库删除，不删除文件）
 * @param {string} id - 歌曲ID
 * @returns {Object} 删除结果
 */
const deleteSong = (id) => {
  const stmt = db.prepare('DELETE FROM songs WHERE id = ?')
  return stmt.run(id)
}

/**
 * 批量删除歌曲
 * @param {Array<string>} ids - 歌曲ID数组
 * @returns {number} 删除的数量
 */
const deleteSongs = (ids) => {
  if (!ids || ids.length === 0) return 0
  const placeholders = ids.map(() => '?').join(',')
  const stmt = db.prepare(`DELETE FROM songs WHERE id IN (${placeholders})`)
  return stmt.run(...ids).changes
}

/**
 * 更新歌曲文件路径（文件移动后更新）
 * @param {string} id - 歌曲ID
 * @param {string} newPath - 新路径
 * @returns {Object} 更新结果
 */
const updateSongPath = (id, newPath) => {
  const stmt = db.prepare('UPDATE songs SET path = ? WHERE id = ?')
  return stmt.run(newPath, id)
}

/**
 * 获取歌曲数量
 * @returns {number} 歌曲总数
 */
const getSongCount = () => {
  const stmt = db.prepare('SELECT COUNT(*) as count FROM songs')
  return stmt.get().count
}
/**
 * 获取歌曲数量
 * @returns {number} 歌曲总数
 */
const getSongCountByList = (playlistid) => {
  const stmt = db.prepare('SELECT COUNT(*) as total FROM playlist_songs WHERE playlistId = ?')
  return stmt.get(playlistid).total
}
/**
 * 搜索歌曲（按标题、艺术家、专辑）
 * @param {string} keyword - 搜索关键词
 * @returns {Array} 搜索结果
 */
const searchSongs = (keyword) => {
  const searchTerm = `%${keyword}%`
  const stmt = db.prepare(`
    SELECT * FROM songs
    WHERE title LIKE ? OR artist LIKE ? OR album LIKE ?
    ORDER BY importAt DESC
  `)
  return stmt.all(searchTerm, searchTerm, searchTerm)
}

/**
 * 更新歌曲匹配信息（网易云ID、封面URL等）
 * @param {string} id - 歌曲ID
 * @param {Object} matchInfo - 匹配信息
 * @returns {Object} 更新结果
 */
const updateSongMatchInfo = (id, matchInfo) => {
  const { neteaseId, coverUrl, artist, album, title, lyric, Tlyric, yrc, Tyrc, Romaji } = matchInfo
  const stmt = db.prepare(`
    UPDATE songs
    SET neteaseId = COALESCE(?, neteaseId),
        coverUrl = COALESCE(coverUrl, ?),
        artist = COALESCE(?, artist),
        album = COALESCE(?, album),
        title = COALESCE(?, title),
        lyric = COALESCE(lyric, ?),
        Tlyric = COALESCE(Tlyric, ?),
        yrc = COALESCE(yrc, ?),
        Tyrc = COALESCE(Tyrc, ?),
        Romaji = COALESCE(Romaji, ?)
    WHERE id = ?
  `)
  return stmt.run(neteaseId, coverUrl, artist, album, title, lyric, Tlyric, yrc, Tyrc, Romaji, id)
}

// --- Playlist Functions ---

/**
 * 获取所有本地歌单
 * @returns {Array} 歌单列表
 */
const getAllPlaylists = () => {
  const stmt = db.prepare(`
    SELECT p.*, COUNT(ps.songId) as trackCount
    FROM playlists p
    LEFT JOIN playlist_songs ps ON p.id = ps.playlistId
    GROUP BY p.id
    ORDER BY p.createdAt ASC
  `)
  return stmt.all()
}

/**
 * 创建歌单
 * @param {string} name - 歌单名称
 * @returns {Object} 创建结果
 */
const createPlaylist = (name) => {
  const id = `local_pl_${Date.now()}`
  const stmt = db.prepare('INSERT INTO playlists (id, name) VALUES (?, ?)')
  const result = stmt.run(id, name)
  return { id, changes: result.changes }
}

/**
 * 删除歌单
 * @param {string} id - 歌单ID
 * @returns {Object} 删除结果
 */
const deletePlaylist = (id) => {
  const stmt = db.prepare('DELETE FROM playlists WHERE id = ?')
  return stmt.run(id)
}

/**
 * 添加歌曲到歌单
 * @param {string} playlistId - 歌单ID
 * @param {string} songId - 歌曲ID
 * @returns {Object} 结果
 */
const addSongToPlaylist = (playlistId, songId) => {
  console.log(`Adding song ${songId} to playlist ${playlistId}`)
  const stmt = db.prepare('INSERT OR IGNORE INTO playlist_songs (playlistId, songId) VALUES (?, ?)')
  return stmt.run(playlistId, songId)
}

/**
 * 从歌单移除歌曲
 * @param {string} playlistId - 歌单ID
 * @param {string} songId - 歌曲ID
 * @returns {Object} 结果
 */
const removeSongFromPlaylist = (playlistId, songId) => {
  const stmt = db.prepare('DELETE FROM playlist_songs WHERE playlistId = ? AND songId = ?')
  return stmt.run(playlistId, songId)
}

/**
 * 获取歌单内的歌曲
 * @param {string} playlistId - 歌单ID
 * @returns {Array} 歌曲列表
 */
const getPlaylistSongs = (playlistId) => {
  const stmt = db.prepare(`
    SELECT s.*
    FROM songs s
    JOIN playlist_songs ps ON s.id = ps.songId
    WHERE ps.playlistId = ?
    ORDER BY ps.addedAt DESC
  `)
  return stmt.all(playlistId)
}

/**
 * 关闭数据库连接
 */
const closeDatabase = () => {
  if (db) {
    db.close()
    db = null
  }
}

module.exports = {
  initDatabase,
  getDatabase,
  addSong,
  addSongs,
  getAllSongs,
  getSongById,
  getSongsByIds,
  songExistsByMd5,
  songExistsByPath,
  deleteSong,
  deleteSongs,
  updateSongPath,
  updateSongMatchInfo,
  getSongCount,
  searchSongs,
  getSongCountByList,
  // Playlist exports
  getAllPlaylists,
  createPlaylist,
  deletePlaylist,
  addSongToPlaylist,
  removeSongFromPlaylist,
  getPlaylistSongs,
  closeDatabase,
}
