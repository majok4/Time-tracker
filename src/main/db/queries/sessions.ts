import { getDb } from '../index'
import type {
  Session,
  CreateSessionData,
  UpdateSessionData,
  SessionFilters
} from '../../../shared/types'
import { randomUUID } from 'crypto'

function toSession(row: Record<string, unknown>): Session {
  return {
    id: row.id as string,
    projectId: row.project_id as string,
    source: row.source as 'manual' | 'auto' | 'focus',
    appName: row.app_name as string | null,
    windowTitle: row.window_title as string | null,
    title: row.title as string | null,
    startedAt: row.started_at as number,
    endedAt: row.ended_at as number | null,
    duration: row.duration as number | null,
    notes: row.notes as string | null
  }
}

export function getActiveSession(): Session | null {
  const db = getDb()
  const row = db.prepare('SELECT * FROM sessions WHERE ended_at IS NULL LIMIT 1').get()
  return row ? toSession(row as Record<string, unknown>) : null
}

export function getSessionById(id: string): Session | null {
  const db = getDb()
  const row = db.prepare('SELECT * FROM sessions WHERE id = ?').get(id)
  return row ? toSession(row as Record<string, unknown>) : null
}

export function createSession(data: CreateSessionData): Session {
  const db = getDb()
  const now = Date.now()
  const id = randomUUID()
  db.prepare(
    'INSERT INTO sessions (id, project_id, source, app_name, window_title, title, started_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
  ).run(
    id,
    data.projectId,
    data.source ?? 'manual',
    data.appName ?? null,
    data.windowTitle ?? null,
    data.title ?? null,
    now
  )
  return getSessionById(id)!
}

export function endSession(id: string): Session | null {
  const db = getDb()
  const session = getSessionById(id)
  if (!session) return null

  const now = Date.now()
  const duration = now - session.startedAt
  db.prepare('UPDATE sessions SET ended_at = ?, duration = ? WHERE id = ?').run(now, duration, id)
  return getSessionById(id)
}

export function updateSession(id: string, data: UpdateSessionData): Session | null {
  const db = getDb()
  const session = getSessionById(id)
  if (!session) return null

  const updates: string[] = []
  const values: unknown[] = []

  if (data.title !== undefined) {
    updates.push('title = ?')
    values.push(data.title)
  }
  if (data.notes !== undefined) {
    updates.push('notes = ?')
    values.push(data.notes)
  }
  if (data.projectId !== undefined) {
    updates.push('project_id = ?')
    values.push(data.projectId)
  }
  if (data.startedAt !== undefined) {
    updates.push('started_at = ?')
    values.push(data.startedAt)
  }
  if (data.endedAt !== undefined) {
    updates.push('ended_at = ?')
    values.push(data.endedAt)
    if (data.endedAt && data.startedAt) {
      updates.push('duration = ?')
      values.push(data.endedAt - data.startedAt)
    } else if (data.endedAt) {
      updates.push('duration = ?')
      values.push(data.endedAt - session.startedAt)
    }
  }

  if (updates.length === 0) return session

  values.push(id)
  db.prepare(`UPDATE sessions SET ${updates.join(', ')} WHERE id = ?`).run(...values)
  return getSessionById(id)
}

export function deleteSession(id: string): void {
  const db = getDb()
  db.prepare('DELETE FROM sessions WHERE id = ?').run(id)
}

export function getSessions(filters: SessionFilters = {}): Session[] {
  const db = getDb()
  const conditions: string[] = ['ended_at IS NOT NULL']
  const values: unknown[] = []

  if (filters.projectId) {
    conditions.push('project_id = ?')
    values.push(filters.projectId)
  }
  if (filters.startDate) {
    conditions.push('started_at >= ?')
    values.push(filters.startDate)
  }
  if (filters.endDate) {
    conditions.push('started_at <= ?')
    values.push(filters.endDate)
  }
  if (filters.source) {
    conditions.push('source = ?')
    values.push(filters.source)
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''
  const limit = filters.limit ? `LIMIT ${filters.limit}` : ''
  const offset = filters.offset ? `OFFSET ${filters.offset}` : ''

  const rows = db
    .prepare(`SELECT * FROM sessions ${where} ORDER BY started_at DESC ${limit} ${offset}`)
    .all(...values)
  return (rows as Record<string, unknown>[]).map(toSession)
}

export function getTotalMsByProject(
  startDate: number,
  endDate: number
): Array<{ projectId: string; totalMs: number }> {
  const db = getDb()
  const rows = db
    .prepare(
      `SELECT project_id, SUM(duration) as total_ms
       FROM sessions
       WHERE started_at >= ? AND started_at <= ? AND ended_at IS NOT NULL
       GROUP BY project_id`
    )
    .all(startDate, endDate) as Array<{ project_id: string; total_ms: number }>
  return rows.map((r) => ({ projectId: r.project_id, totalMs: r.total_ms ?? 0 }))
}

export function getDailyTotals(
  startDate: number,
  endDate: number
): Array<{ date: string; projectId: string; totalMs: number }> {
  const db = getDb()
  const rows = db
    .prepare(
      `SELECT
        date(started_at / 1000, 'unixepoch', 'localtime') as date,
        project_id,
        SUM(duration) as total_ms
       FROM sessions
       WHERE started_at >= ? AND started_at <= ? AND ended_at IS NOT NULL
       GROUP BY date, project_id
       ORDER BY date ASC`
    )
    .all(startDate, endDate) as Array<{ date: string; project_id: string; total_ms: number }>
  return rows.map((r) => ({ date: r.date, projectId: r.project_id, totalMs: r.total_ms ?? 0 }))
}
