const { ipcMain, BrowserWindow, app } = require('electron')
const path = require('path')

ipcMain.on('quit-app', () => {
  app.quit()
})

ipcMain.on('reload-page', () => {
  const win = BrowserWindow.getFocusedWindow()
  win.reload()
})
