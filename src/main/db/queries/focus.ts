import { getDb } from '../index'
import type { FocusSession } from '../../../shared/types'
import { randomUUID } from 'crypto'

function toFocusSession(row: Record<string, unknown>): FocusSession {
  return {
    id: row.id as string,
    sessionId: row.session_id as string | null,
    projectId: row.project_id as string,
    goal: row.goal as string | null,
    durationTarget: row.duration_target as number,
    durationActual: row.duration_actual as number | null,
    completed: Boolean(row.completed),
    startedAt: row.started_at as number,
    endedAt: row.ended_at as number | null
  }
}

export function createFocusSession(data: {
  sessionId: string | null
  projectId: string
  goal: string | null
  durationTarget: number
}): FocusSession {
  const db = getDb()
  const id = randomUUID()
  const now = Date.now()
  db.prepare(
    'INSERT INTO focus_sessions (id, session_id, project_id, goal, duration_target, started_at) VALUES (?, ?, ?, ?, ?, ?)'
  ).run(id, data.sessionId, data.projectId, data.goal, data.durationTarget, now)
  return getFocusSessionById(id)!
}

export function getFocusSessionById(id: string): FocusSession | null {
  const db = getDb()
  const row = db.prepare('SELECT * FROM focus_sessions WHERE id = ?').get(id)
  return row ? toFocusSession(row as Record<string, unknown>) : null
}

export function completeFocusSession(id: string, durationActual: number): FocusSession | null {
  const db = getDb()
  const now = Date.now()
  db.prepare(
    'UPDATE focus_sessions SET ended_at = ?, completed = 1, duration_actual = ? WHERE id = ?'
  ).run(now, durationActual, id)
  return getFocusSessionById(id)
}

export function cancelFocusSession(id: string, durationActual: number): FocusSession | null {
  const db = getDb()
  const now = Date.now()
  db.prepare(
    'UPDATE focus_sessions SET ended_at = ?, completed = 0, duration_actual = ? WHERE id = ?'
  ).run(now, durationActual, id)
  return getFocusSessionById(id)
}

export function getRecentFocusSessions(limit = 10): FocusSession[] {
  const db = getDb()
  const rows = db
    .prepare('SELECT * FROM focus_sessions ORDER BY started_at DESC LIMIT ?')
    .all(limit)
  return (rows as Record<string, unknown>[]).map(toFocusSession)
}
