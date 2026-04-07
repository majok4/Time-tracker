import { getDb } from '../index'
import type { Client, CreateClientData, UpdateClientData } from '../../../shared/types'
import { randomUUID } from 'crypto'

function toClient(row: Record<string, unknown>): Client {
  return {
    id: row.id as string,
    name: row.name as string,
    color: row.color as string,
    createdAt: row.created_at as number,
    updatedAt: row.updated_at as number
  }
}

export function getAllClients(): Client[] {
  const db = getDb()
  const rows = db.prepare('SELECT * FROM clients ORDER BY name ASC').all()
  return (rows as Record<string, unknown>[]).map(toClient)
}

export function getClientById(id: string): Client | null {
  const db = getDb()
  const row = db.prepare('SELECT * FROM clients WHERE id = ?').get(id)
  return row ? toClient(row as Record<string, unknown>) : null
}

export function createClient(data: CreateClientData): Client {
  const db = getDb()
  const now = Date.now()
  const id = randomUUID()
  db.prepare(
    'INSERT INTO clients (id, name, color, created_at, updated_at) VALUES (?, ?, ?, ?, ?)'
  ).run(id, data.name, data.color, now, now)
  return getClientById(id)!
}

export function updateClient(id: string, data: UpdateClientData): Client | null {
  const db = getDb()
  const client = getClientById(id)
  if (!client) return null

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

  if (updates.length === 0) return client

  updates.push('updated_at = ?')
  values.push(Date.now())
  values.push(id)

  db.prepare(`UPDATE clients SET ${updates.join(', ')} WHERE id = ?`).run(...values)
  return getClientById(id)
}

export function deleteClient(id: string): void {
  const db = getDb()
  // Nullify client_id on projects before deleting
  db.prepare('UPDATE projects SET client_id = NULL WHERE client_id = ?').run(id)
  db.prepare('DELETE FROM clients WHERE id = ?').run(id)
}
