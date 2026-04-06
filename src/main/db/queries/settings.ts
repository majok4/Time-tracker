import { getDb } from '../index'
import type { AppRule } from '../../../shared/types'
import { randomUUID } from 'crypto'

export function getSetting(key: string): string | null {
  const db = getDb()
  const row = db.prepare('SELECT value FROM settings WHERE key = ?').get(key) as
    | { value: string }
    | undefined
  return row?.value ?? null
}

export function setSetting(key: string, value: string): void {
  const db = getDb()
  db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)').run(key, value)
}

export function getAllSettings(): Record<string, string> {
  const db = getDb()
  const rows = db.prepare('SELECT key, value FROM settings').all() as Array<{
    key: string
    value: string
  }>
  return Object.fromEntries(rows.map((r) => [r.key, r.value]))
}

export function getAppRules(): AppRule[] {
  const db = getDb()
  const rows = db
    .prepare('SELECT * FROM app_rules ORDER BY app_name ASC')
    .all() as Array<Record<string, unknown>>
  return rows.map((r) => ({
    id: r.id as string,
    appName: r.app_name as string,
    projectId: r.project_id as string,
    createdAt: r.created_at as number
  }))
}

export function setAppRule(appName: string, projectId: string): AppRule {
  const db = getDb()
  const existing = db
    .prepare('SELECT id FROM app_rules WHERE app_name = ?')
    .get(appName) as { id: string } | undefined

  const now = Date.now()
  if (existing) {
    db.prepare('UPDATE app_rules SET project_id = ? WHERE app_name = ?').run(projectId, appName)
    return {
      id: existing.id,
      appName,
      projectId,
      createdAt: now
    }
  } else {
    const id = randomUUID()
    db.prepare(
      'INSERT INTO app_rules (id, app_name, project_id, created_at) VALUES (?, ?, ?, ?)'
    ).run(id, appName, projectId, now)
    return { id, appName, projectId, createdAt: now }
  }
}

export function deleteAppRule(appName: string): void {
  const db = getDb()
  db.prepare('DELETE FROM app_rules WHERE app_name = ?').run(appName)
}

export function getAppRuleForApp(appName: string): AppRule | null {
  const db = getDb()
  const row = db
    .prepare('SELECT * FROM app_rules WHERE app_name = ?')
    .get(appName) as Record<string, unknown> | undefined
  if (!row) return null
  return {
    id: row.id as string,
    appName: row.app_name as string,
    projectId: row.project_id as string,
    createdAt: row.created_at as number
  }
}
