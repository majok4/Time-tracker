import { BrowserWindow, Notification } from 'electron'
import type { FocusSession, FocusState, StartFocusConfig } from '../shared/types'
import { createFocusSession, completeFocusSession, cancelFocusSession } from './db/queries/focus'
import { startTimer, stopTimer } from './timer'

interface ActiveFocus {
  focusSession: FocusSession
  intervalId: NodeJS.Timeout
  startTime: number
  targetMs: number
}

let activeFocus: ActiveFocus | null = null
let windows: BrowserWindow[] = []

export function registerFocusWindow(win: BrowserWindow): void {
  windows = windows.filter((w) => !w.isDestroyed())
  windows.push(win)
}

function broadcast(channel: string, data: unknown): void {
  windows = windows.filter((w) => !w.isDestroyed())
  for (const win of windows) {
    win.webContents.send(channel, data)
  }
}

export function startFocus(config: StartFocusConfig): FocusSession {
  if (activeFocus) {
    cancelFocus()
  }

  const session = startTimer({ projectId: config.projectId, source: 'focus' })
  const focusSession = createFocusSession({
    sessionId: session.id,
    projectId: config.projectId,
    goal: config.goal ?? null,
    durationTarget: config.durationMs
  })

  const startTime = Date.now()

  const intervalId = setInterval(() => {
    if (!activeFocus) return

    const elapsed = Date.now() - activeFocus.startTime
    const remaining = Math.max(0, activeFocus.targetMs - elapsed)

    broadcast('focus:tick', { remaining, elapsed, focusSession: activeFocus.focusSession })

    if (remaining <= 0) {
      completeFocusInternal()
    }
  }, 1000)

  activeFocus = {
    focusSession,
    intervalId,
    startTime,
    targetMs: config.durationMs
  }

  broadcast('focus:started', { focusSession })
  return focusSession
}

function completeFocusInternal(): void {
  if (!activeFocus) return

  clearInterval(activeFocus.intervalId)
  const elapsed = Date.now() - activeFocus.startTime
  const completed = completeFocusSession(activeFocus.focusSession.id, elapsed)
  stopTimer()

  broadcast('focus:completed', { focusSession: completed })

  new Notification({
    title: 'Focus Session Complete!',
    body: activeFocus.focusSession.goal
      ? `Great work on: "${activeFocus.focusSession.goal}"`
      : 'You completed your focus session. Time for a break!',
    silent: false
  }).show()

  activeFocus = null
}

export function cancelFocus(): FocusSession | null {
  if (!activeFocus) return null

  clearInterval(activeFocus.intervalId)
  const elapsed = Date.now() - activeFocus.startTime
  const cancelled = cancelFocusSession(activeFocus.focusSession.id, elapsed)
  stopTimer()

  broadcast('focus:cancelled', { focusSession: cancelled })
  activeFocus = null
  return cancelled
}

export function getFocusState(): FocusState {
  if (!activeFocus) {
    return { active: false, focusSession: null, remaining: 0, elapsed: 0 }
  }
  const elapsed = Date.now() - activeFocus.startTime
  const remaining = Math.max(0, activeFocus.targetMs - elapsed)
  return {
    active: true,
    focusSession: activeFocus.focusSession,
    remaining,
    elapsed
  }
}
