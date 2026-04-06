import { ipcMain } from 'electron'
import { startFocus, cancelFocus, getFocusState } from '../focus-timer'
import type { StartFocusConfig } from '../../shared/types'

export function registerFocusHandlers(): void {
  ipcMain.handle('focus:start', (_event, config: StartFocusConfig) => {
    return startFocus(config)
  })

  ipcMain.handle('focus:stop', () => {
    return cancelFocus()
  })

  ipcMain.handle('focus:getState', () => {
    return getFocusState()
  })
}
