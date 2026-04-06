import { BrowserWindow } from 'electron'
import { getAppRuleForApp } from './db/queries/settings'
import { startTimer, stopTimer, getActiveSess } from './timer'

let pollInterval: NodeJS.Timeout | null = null
let lastAppName: string | null = null
let windows: BrowserWindow[] = []
let enabled = false

export function registerAutoDetectWindow(win: BrowserWindow): void {
  windows = windows.filter((w) => !w.isDestroyed())
  windows.push(win)
}

function broadcast(channel: string, data: unknown): void {
  windows = windows.filter((w) => !w.isDestroyed())
  for (const win of windows) {
    win.webContents.send(channel, data)
  }
}

async function poll(): Promise<void> {
  try {
    // dynamic import to avoid issues in non-mac environments
    const { default: activeWin } = await import('active-win')
    const result = await activeWin()
    if (!result) return

    const appName = result.owner.name
    const windowTitle = result.title ?? null

    if (appName === lastAppName) return
    lastAppName = appName

    broadcast('auto-detect:app-changed', { appName, windowTitle })

    const rule = getAppRuleForApp(appName)
    const activeSession = getActiveSess()

    if (rule) {
      // If already tracking for this project, don't restart
      if (activeSession && activeSession.projectId === rule.projectId && activeSession.source === 'auto') {
        return
      }
      // Stop current auto session if any
      if (activeSession && activeSession.source === 'auto') {
        stopTimer()
      }
      // Start new auto session for mapped project
      if (!activeSession || activeSession.source === 'auto') {
        startTimer({
          projectId: rule.projectId,
          source: 'auto',
          appName,
          windowTitle
        })
      }
    } else {
      // Unknown app — emit event so renderer can prompt user to assign
      broadcast('auto-detect:unknown-app', { appName, windowTitle })
    }
  } catch {
    // active-win may not be available in dev/Linux environments
  }
}

export function startAutoDetect(): void {
  if (pollInterval) return
  enabled = true
  pollInterval = setInterval(poll, 5000)
  poll()
}

export function stopAutoDetect(): void {
  if (pollInterval) {
    clearInterval(pollInterval)
    pollInterval = null
  }
  enabled = false
  lastAppName = null
}

export function isAutoDetectEnabled(): boolean {
  return enabled
}
