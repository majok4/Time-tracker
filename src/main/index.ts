import { app, BrowserWindow } from 'electron'
import { electronApp, optimizer } from '@electron-toolkit/utils'
import { createMainWindow } from './windows'
import { createTray, destroyTray } from './tray'
import { registerAllIpcHandlers } from './ipc/index'
import { registerTimerWindow, restoreActiveSession, stopTimer } from './timer'
import { registerFocusWindow } from './focus-timer'
import { registerAutoDetectWindow, startAutoDetect, stopAutoDetect } from './auto-detect'
import { getDb, closeDb } from './db/index'
import { getSetting } from './db/queries/settings'

app.whenReady().then(() => {
  electronApp.setAppUserModelId('com.timetracker.app')

  // Initialize DB early
  getDb()

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  registerAllIpcHandlers()

  const mainWindow = createMainWindow()

  registerTimerWindow(mainWindow)
  registerFocusWindow(mainWindow)
  registerAutoDetectWindow(mainWindow)

  createTray(mainWindow)

  // Restore any active session from before crash/restart
  restoreActiveSession()

  // Restore auto-detect setting
  const autoDetectEnabled = getSetting('auto_detect_enabled')
  if (autoDetectEnabled === 'true') {
    startAutoDetect()
  }

  // macOS: keep app running when last window is closed (menu bar app)
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      const win = createMainWindow()
      registerTimerWindow(win)
      registerFocusWindow(win)
      registerAutoDetectWindow(win)
    }
  })
})

app.on('window-all-closed', () => {
  // On macOS, keep running in the menu bar
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('before-quit', () => {
  stopTimer()
  stopAutoDetect()
  destroyTray()
  closeDb()
})
