import { contextBridge, ipcRenderer } from 'electron'

const api = {
  // Projects
  getProjects: (includeArchived = false) =>
    ipcRenderer.invoke('projects:getAll', includeArchived),
  createProject: (data: unknown) => ipcRenderer.invoke('projects:create', data),
  updateProject: (id: string, data: unknown) => ipcRenderer.invoke('projects:update', id, data),
  deleteProject: (id: string) => ipcRenderer.invoke('projects:delete', id),

  // Sessions
  startSession: (data: unknown) => ipcRenderer.invoke('sessions:start', data),
  stopSession: () => ipcRenderer.invoke('sessions:stop'),
  getActiveSession: () => ipcRenderer.invoke('sessions:getActive'),
  getTimerState: () => ipcRenderer.invoke('sessions:getTimerState'),
  getSessions: (filters: unknown) => ipcRenderer.invoke('sessions:getAll', filters),
  updateSession: (id: string, data: unknown) => ipcRenderer.invoke('sessions:update', id, data),
  deleteSession: (id: string) => ipcRenderer.invoke('sessions:delete', id),

  // Focus
  startFocus: (config: unknown) => ipcRenderer.invoke('focus:start', config),
  stopFocus: () => ipcRenderer.invoke('focus:stop'),
  getFocusState: () => ipcRenderer.invoke('focus:getState'),

  // Reports
  getDailyReport: (date: string) => ipcRenderer.invoke('reports:getDaily', date),
  getWeeklyReport: (startDate: string) => ipcRenderer.invoke('reports:getWeekly', startDate),
  exportCSV: (filters: unknown) => ipcRenderer.invoke('reports:exportCSV', filters),

  // Settings
  getSetting: (key: string) => ipcRenderer.invoke('settings:get', key),
  setSetting: (key: string, value: string) => ipcRenderer.invoke('settings:set', key, value),
  getAllSettings: () => ipcRenderer.invoke('settings:getAll'),
  setAutoDetect: (enabled: boolean) => ipcRenderer.invoke('settings:setAutoDetect', enabled),
  isAutoDetectEnabled: () => ipcRenderer.invoke('settings:isAutoDetectEnabled'),
  getAppRules: () => ipcRenderer.invoke('settings:getAppRules'),
  setAppRule: (appName: string, projectId: string) =>
    ipcRenderer.invoke('settings:setAppRule', appName, projectId),
  deleteAppRule: (appName: string) => ipcRenderer.invoke('settings:deleteAppRule', appName),

  // Event listeners (main → renderer push)
  onTimerTick: (cb: (data: { elapsed: number; session: unknown }) => void) => {
    ipcRenderer.on('timer:tick', (_e, data) => cb(data))
    return () => ipcRenderer.removeAllListeners('timer:tick')
  },
  onTimerStarted: (cb: (data: { session: unknown; elapsed: number }) => void) => {
    ipcRenderer.on('timer:started', (_e, data) => cb(data))
    return () => ipcRenderer.removeAllListeners('timer:started')
  },
  onTimerStopped: (cb: (data: { session: unknown }) => void) => {
    ipcRenderer.on('timer:stopped', (_e, data) => cb(data))
    return () => ipcRenderer.removeAllListeners('timer:stopped')
  },
  onFocusTick: (cb: (data: { remaining: number; elapsed: number; focusSession: unknown }) => void) => {
    ipcRenderer.on('focus:tick', (_e, data) => cb(data))
    return () => ipcRenderer.removeAllListeners('focus:tick')
  },
  onFocusStarted: (cb: (data: { focusSession: unknown }) => void) => {
    ipcRenderer.on('focus:started', (_e, data) => cb(data))
    return () => ipcRenderer.removeAllListeners('focus:started')
  },
  onFocusCompleted: (cb: (data: { focusSession: unknown }) => void) => {
    ipcRenderer.on('focus:completed', (_e, data) => cb(data))
    return () => ipcRenderer.removeAllListeners('focus:completed')
  },
  onFocusCancelled: (cb: (data: { focusSession: unknown }) => void) => {
    ipcRenderer.on('focus:cancelled', (_e, data) => cb(data))
    return () => ipcRenderer.removeAllListeners('focus:cancelled')
  },
  onAutoDetectAppChanged: (cb: (data: { appName: string; windowTitle: string | null }) => void) => {
    ipcRenderer.on('auto-detect:app-changed', (_e, data) => cb(data))
    return () => ipcRenderer.removeAllListeners('auto-detect:app-changed')
  },
  onAutoDetectUnknownApp: (
    cb: (data: { appName: string; windowTitle: string | null }) => void
  ) => {
    ipcRenderer.on('auto-detect:unknown-app', (_e, data) => cb(data))
    return () => ipcRenderer.removeAllListeners('auto-detect:unknown-app')
  }
}

contextBridge.exposeInMainWorld('api', api)

export type ElectronAPI = typeof api
