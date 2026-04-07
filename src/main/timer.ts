import { BrowserWindow } from 'electron'
import type { Session, TimerState } from '../shared/types'
import {
  createSession,
  endSession,
  getActiveSession
} from './db/queries/sessions'
import type { CreateSessionData } from '../shared/types'
import { updateTray } from './tray'

interface ActiveTimer {
  session: Session
  intervalId: NodeJS.Timeout
  elapsed: number
}

let activeTimer: ActiveTimer | null = null
let windows: BrowserWindow[] = []

export function registerTimerWindow(win: BrowserWindow): void {
  windows = windows.filter((w) => !w.isDestroyed())
  windows.push(win)
}

function broadcast(channel: string, data: unknown): void {
  windows = windows.filter((w) => !w.isDestroyed())
  for (const win of windows) {
    win.webContents.send(channel, data)
  }
}

function startTicking(session: Session): void {
  if (activeTimer) {
    clearInterval(activeTimer.intervalId)
  }

  const intervalId = setInterval(() => {
    if (!activeTimer) return
    activeTimer.elapsed = Date.now() - activeTimer.session.startedAt
    broadcast('timer:tick', {
      elapsed: activeTimer.elapsed,
      session: activeTimer.session
    })
    updateTray()
  }, 1000)

  activeTimer = {
    session,
    intervalId,
    elapsed: Date.now() - session.startedAt
  }

  broadcast('timer:started', { session, elapsed: activeTimer.elapsed })
}

export function startTimer(data: CreateSessionData): Session {
  if (activeTimer) {
    stopTimer()
  }
  const session = createSession(data)
  startTicking(session)
  return session
}

export function stopTimer(): Session | null {
  if (!activeTimer) return null

  clearInterval(activeTimer.intervalId)
  const ended = endSession(activeTimer.session.id)
  activeTimer = null

  broadcast('timer:stopped', { session: ended })
  return ended
}

export function getTimerState(): TimerState {
  if (!activeTimer) {
    return { active: false, session: null, elapsed: 0 }
  }
  return {
    active: true,
    session: activeTimer.session,
    elapsed: activeTimer.elapsed
  }
}

export function getActiveSess(): Session | null {
  return activeTimer?.session ?? null
}

export function restoreActiveSession(): void {
  const session = getActiveSession()
  if (session) {
    startTicking(session)
  }
}
