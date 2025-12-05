const { app, BrowserWindow, ipcMain, globalShortcut, screen, protocol } = require('electron/main')
const path = require('node:path')
const generateConfig = require('../net/generateConfig')
const { initLocalMusic, closeLocalMusic } = require('./electron/localMusic')

let mainWindow = null
let lyricWindow = null
const createWindow = () => {
  mainWindow = new BrowserWindow({
    width: 1500,
    height: 900,
    frame: false,
    transparent: false,
    titleBarStyle: 'hidden',
    webPreferences: {
      webSecurity: true,
      preload: path.join(__dirname, 'electron', 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      backgroundThrottling: false,
    },
  })
  mainWindow.webContents.session.setProxy({
    mode: 'direct',
  })
  if (app.isPackaged) {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'))
  } else {
    mainWindow.loadURL('http://localhost:5173/')
  }

  ipcMain.handle('window-minimize', () => {
    if (mainWindow) mainWindow.minimize()
  })
  ipcMain.handle('window-toggle-maximize', () => {
    if (!mainWindow) return
    if (mainWindow.isMaximized()) mainWindow.unmaximize()
    else mainWindow.maximize()
    return mainWindow.isMaximized()
  })
  ipcMain.handle('window-close', () => {
    if (mainWindow) mainWindow.close()
  })
  ipcMain.handle('window-is-maximized', () => {
    return mainWindow ? mainWindow.isMaximized() : false
  })

  let moveTimer = null
  mainWindow.on('move', () => {
    if (!lyricWindow || lyricWindow.isDestroyed()) return

    if (moveTimer) clearTimeout(moveTimer)

    lyricWindow.webContents.send('main-window-moving', true)

    lyricWindow.setIgnoreMouseEvents(true, { forward: false })

    moveTimer = setTimeout(() => {
      if (lyricWindow && !lyricWindow.isDestroyed()) {
        lyricWindow.webContents.send('main-window-moving', false)

        lyricWindow.setIgnoreMouseEvents(true, { forward: true })
      }
    }, 100)
  })
  mainWindow.on('close', () => {
    if (lyricWindow && !lyricWindow.isDestroyed()) {
      mainWindow.webContents.send('deskLyric-Status', false)
    }
  })
  mainWindow.on('closed', () => {
    mainWindow = null
    // 如果歌词窗口存在且未被销毁，则关闭它
    if (lyricWindow && !lyricWindow.isDestroyed()) {
      lyricWindow.close()
    }
  })
}

const createLyricWindow = () => {
  const { width, height } = screen.getPrimaryDisplay().workAreaSize
  lyricWindow = new BrowserWindow({
    width: 800,
    height: 150,
    x: (width - 800) / 2,
    y: 100,
    frame: false,
    transparent: true,
    show: false,
    backgroundColor: '#00000000',
    alwaysOnTop: true,
    skipTaskbar: true,
    resizable: false,
    hasShadow: false,
    webPreferences: {
      webSecurity: true,
      preload: path.join(__dirname, 'electron', 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
  })
  if (app.isPackaged) {
    lyricWindow.loadFile(path.join(__dirname, '../dist/deskLyric.html'))
  } else {
    lyricWindow.loadURL('http://localhost:5173/desklyric.html')
  }

  lyricWindow.once('ready-to-show', () => {
    lyricWindow.show()
  })

  lyricWindow.on('closed', () => {
    lyricWindow = null
  })
}

// 1. 打开/关闭歌词窗口
ipcMain.on('toggle-desktop-lyric', () => {
  if (lyricWindow) {
    lyricWindow.close()
    mainWindow.webContents.send('deskLyric-Status', false)
  } else {
    createLyricWindow()
    mainWindow.webContents.send('deskLyric-Status', true)
  }
})

// 2. 接收主窗口发来的歌词，转发给歌词窗口
ipcMain.on('update-lyric-info', (event, data) => {
  if (lyricWindow && !lyricWindow.isDestroyed()) {
    lyricWindow.webContents.send('on-lyric-update', data)
  }
})

ipcMain.on('set-ignore-mouse-events', (event, ignore, options) => {
  const win = BrowserWindow.fromWebContents(event.sender)
  if (!win) return
  win.setIgnoreMouseEvents(ignore, { forward: true })
})

function RegisterGlobalShortCut() {
  if (!mainWindow) {
    return
  }
  globalShortcut.register('Ctrl+Alt+c', () => {
    console.log('global-play-toggle')
    mainWindow?.webContents.send('global-toggle-play')
  })
  globalShortcut.register('Ctrl+Alt+x', () => {
    mainWindow?.webContents.send('global-next')
  })
  globalShortcut.register('Ctrl+Alt+z', () => {
    mainWindow?.webContents.send('global-prev')
  })
}
// === Auto Updater ===
const { autoUpdater } = require('electron-updater')

// 配置自动更新
autoUpdater.autoDownload = false // 默认不自动下载，由用户点击确认
autoUpdater.logger = require('electron-log')
autoUpdater.logger.transports.file.level = 'info'

const initAutoUpdater = () => {
  // 转发更新事件给渲染进程
  const sendUpdateMessage = (message, data) => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('auto-updater-message', { message, data })
    }
  }

  autoUpdater.on('checking-for-update', () => {
    sendUpdateMessage('checking-for-update')
  })

  autoUpdater.on('update-available', (info) => {
    sendUpdateMessage('update-available', info)
  })

  autoUpdater.on('update-not-available', (info) => {
    sendUpdateMessage('update-not-available', info)
  })

  autoUpdater.on('error', (err) => {
    sendUpdateMessage('error', err)
  })

  autoUpdater.on('download-progress', (progressObj) => {
    sendUpdateMessage('download-progress', progressObj)
  })

  autoUpdater.on('update-downloaded', (info) => {
    sendUpdateMessage('update-downloaded', info)
  })

  // IPC 监听
  ipcMain.on('check-for-update', () => {
    autoUpdater.checkForUpdates()
  })

  ipcMain.on('download-update', () => {
    autoUpdater.downloadUpdate()
  })

  ipcMain.on('quit-and-install', () => {
    autoUpdater.quitAndInstall()
  })
}

app.whenReady().then(async () => {
  // Generate anonymous token
  await generateConfig()

  // Start API server
  if (app.isPackaged) {
    const port = 3000
    try {
      const { serveNcmApi } = require('../net/server')
      await serveNcmApi({
        port,
        checkVersion: false,
      })
      console.log(`API server started on port ${port}`)
    } catch (error) {
      console.error('Failed to start API server:', error)
    }
  }

  // 初始化本地音乐模块
  initLocalMusic()

  // 注册 local-resource 协议用于播放本地文件
  protocol.registerFileProtocol('local-resource', (request, callback) => {
    let filePath = decodeURIComponent(request.url.replace('local-resource://', ''))
    // Windows 路径处理: 如果是类似 D/path 的格式,恢复为 D:/path
    if (/^[A-Za-z]\//.test(filePath)) {
      filePath = filePath[0] + ':' + filePath.slice(1)
    }
    callback({ path: filePath })
  })

  await createWindow()
  initAutoUpdater() // 初始化自动更新
  RegisterGlobalShortCut()
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
      RegisterGlobalShortCut()
    }
  })
})
app.on('will-quit', () => {
  globalShortcut.unregisterAll()
  closeLocalMusic() // 关闭本地音乐数据库
})
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
