/* eslint-disable global-require */
const { app, BrowserWindow, ipcMain } = require('electron')
const { join } = require('path')
const { sync } = require('glob')

const env = process.env.NODE_ENV || 'development'

let mainWin = null
let loginWin = null

function initialize() {
  loadFiles()

  function createMainWin() {
    const winOptions = {
      icon: join(__dirname, 'build/png/192x192.png'),
      webPreferences: {
        nodeIntegration: true,
        contextIsolation: false,
        enableRemoteModule: true,
      },
    }

    mainWin = new BrowserWindow(winOptions)
    mainWin.loadURL(join('file://', __dirname, 'index.html'))
    mainWin.setMenuBarVisibility(false)

    mainWin.once('ready-to-show', () => mainWin.maximize())
    mainWin.on('closed', () => {
      mainWin = null
    })
  }

  function createLoginWin() {
    const winOptions = {
      width: 450,
      height: 315,
      show: false,
      icon: join(__dirname, 'build/png/192x192.png'),
      webPreferences: {
        nodeIntegration: true,
        contextIsolation: false,
        enableRemoteModule: true,
      },
    }

    loginWin = new BrowserWindow(winOptions)
    loginWin.loadURL(join('file://', __dirname, 'app/renderer-process/sections/login.html'))
    loginWin.setMenuBarVisibility(false)
    loginWin.setMaximizable(false)
    loginWin.setResizable(false)

    loginWin.once('ready-to-show', () => loginWin.show())
    loginWin.on('closed', () => {
      loginWin = null
    })
  }

  app.on('ready', () => {
    createLoginWin()
  })

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
      app.quit()
    }
  })

  app.on('activate', () => {
    if (mainWin === null) {
      createLoginWin()
    }
  })

  ipcMain.handle('user-authorized', () => {
    createMainWin()
    loginWin.close()
  })
}


// Require each JS file in the main-process dir
function loadFiles() {
  const files = sync(join(__dirname, 'app/main-process/**/*.js'))
  files.forEach((file) => {
    // eslint-disable-next-line import/no-dynamic-require
    require(file)
  })
}

// Hot reload
if (env === 'development') {
  require('electron-reload')(__dirname, {
    electron: join(__dirname, 'node_modules', '.bin', 'electron'),
    hardResetMethod: 'exit',
  })
}

initialize()
