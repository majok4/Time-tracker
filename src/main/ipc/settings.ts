import { ipcMain } from 'electron'
import {
  getSetting,
  setSetting,
  getAllSettings,
  getAppRules,
  setAppRule,
  deleteAppRule
} from '../db/queries/settings'
import { startAutoDetect, stopAutoDetect, isAutoDetectEnabled } from '../auto-detect'

export function registerSettingsHandlers(): void {
  ipcMain.handle('settings:get', (_event, key: string) => {
    return getSetting(key)
  })

  ipcMain.handle('settings:set', (_event, key: string, value: string) => {
    setSetting(key, value)
  })

  ipcMain.handle('settings:getAll', () => {
    return getAllSettings()
  })

  ipcMain.handle('settings:setAutoDetect', (_event, enabled: boolean) => {
    setSetting('auto_detect_enabled', enabled ? 'true' : 'false')
    if (enabled) {
      startAutoDetect()
    } else {
      stopAutoDetect()
    }
  })

  ipcMain.handle('settings:isAutoDetectEnabled', () => {
    return isAutoDetectEnabled()
  })

  ipcMain.handle('settings:getAppRules', () => {
    return getAppRules()
  })

  ipcMain.handle('settings:setAppRule', (_event, appName: string, projectId: string) => {
    return setAppRule(appName, projectId)
  })

  ipcMain.handle('settings:deleteAppRule', (_event, appName: string) => {
    deleteAppRule(appName)
  })
}
