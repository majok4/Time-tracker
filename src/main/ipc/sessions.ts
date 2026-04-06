import { ipcMain } from 'electron'
import { getSessions, updateSession, deleteSession } from '../db/queries/sessions'
import { startTimer, stopTimer, getTimerState, getActiveSess } from '../timer'
import type { CreateSessionData, UpdateSessionData, SessionFilters } from '../../shared/types'

export function registerSessionHandlers(): void {
  ipcMain.handle('sessions:start', (_event, data: CreateSessionData) => {
    return startTimer(data)
  })

  ipcMain.handle('sessions:stop', () => {
    return stopTimer()
  })

  ipcMain.handle('sessions:getActive', () => {
    return getActiveSess()
  })

  ipcMain.handle('sessions:getTimerState', () => {
    return getTimerState()
  })

  ipcMain.handle('sessions:getAll', (_event, filters: SessionFilters = {}) => {
    return getSessions(filters)
  })

  ipcMain.handle('sessions:update', (_event, id: string, data: UpdateSessionData) => {
    return updateSession(id, data)
  })

  ipcMain.handle('sessions:delete', (_event, id: string) => {
    deleteSession(id)
  })
}
