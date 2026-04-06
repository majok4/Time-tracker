import { getDb } from '../index'
import type { Project, CreateProjectData, UpdateProjectData } from '../../../shared/types'
import { randomUUID } from 'crypto'

function toProject(row: Record<string, unknown>): Project {
  return {
    id: row.id as string,
    name: row.name as string,
    color: row.color as string,
    icon: row.icon as string | null,
    isArchived: Boolean(row.is_archived),
    createdAt: row.created_at as number,
    updatedAt: row.updated_at as number
  }
}

export function getAllProjects(includeArchived = false): Project[] {
  const db = getDb()
  const rows = includeArchived
    ? db.prepare('SELECT * FROM projects ORDER BY created_at ASC').all()
    : db.prepare('SELECT * FROM projects WHERE is_archived = 0 ORDER BY created_at ASC').all()
  return (rows as Record<string, unknown>[]).map(toProject)
}

export function getProjectById(id: string): Project | null {
  const db = getDb()
  const row = db.prepare('SELECT * FROM projects WHERE id = ?').get(id)
  return row ? toProject(row as Record<string, unknown>) : null
}

export function createProject(data: CreateProjectData): Project {
  const db = getDb()
  const now = Date.now()
  const id = randomUUID()
  db.prepare(
    'INSERT INTO projects (id, name, color, icon, is_archived, created_at, updated_at) VALUES (?, ?, ?, ?, 0, ?, ?)'
  ).run(id, data.name, data.color, data.icon ?? null, now, now)
  return getProjectById(id)!
}

export function updateProject(id: string, data: UpdateProjectData): Project | null {
  const db = getDb()
  const project = getProjectById(id)
  if (!project) return null

  const updates: string[] = []
  const values: unknown[] = []

  if (data.name !== undefined) {
    updates.push('name = ?')
    values.push(data.name)
  }
  if (data.color !== undefined) {
    updates.push('color = ?')
    values.push(data.color)
  }
  if (data.icon !== undefined) {
    updates.push('icon = ?')
    values.push(data.icon)
  }
  if (data.isArchived !== undefined) {
    updates.push('is_archived = ?')
    values.push(data.isArchived ? 1 : 0)
  }

  if (updates.length === 0) return project

  updates.push('updated_at = ?')
  values.push(Date.now())
  values.push(id)

  db.prepare(`UPDATE projects SET ${updates.join(', ')} WHERE id = ?`).run(...values)
  return getProjectById(id)
}

export function deleteProject(id: string): void {
  const db = getDb()
  db.prepare('DELETE FROM projects WHERE id = ?').run(id)
}
