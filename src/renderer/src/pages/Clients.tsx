import { useState, useEffect } from 'react'
import { Plus, Trash2, Edit2, FolderKanban } from 'lucide-react'
import { useAppStore } from '../store'
import api from '../lib/api'
import type { Client, CreateClientData } from '../../../shared/types'
import Button from '../components/ui/Button'
import Modal from '../components/ui/Modal'
import Input from '../components/ui/Input'

const CLIENT_COLORS = [
  '#6366F1', '#8B5CF6', '#EC4899', '#EF4444',
  '#F97316', '#EAB308', '#22C55E', '#14B8A6',
  '#3B82F6', '#06B6D4'
]

function ClientForm({
  initial,
  onSave,
  onCancel
}: {
  initial?: Partial<Client>
  onSave: (data: CreateClientData) => Promise<void>
  onCancel: () => void
}): JSX.Element {
  const [name, setName] = useState(initial?.name ?? '')
  const [color, setColor] = useState(initial?.color ?? CLIENT_COLORS[0])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent): Promise<void> {
    e.preventDefault()
    if (!name.trim()) { setError('Name is required'); return }
    setSaving(true)
    await onSave({ name: name.trim(), color })
    setSaving(false)
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <Input
        label="Client Name"
        value={name}
        onChange={(e) => { setName(e.target.value); setError('') }}
        placeholder="e.g. Acme Corp"
        error={error}
        autoFocus
      />

      <div className="flex flex-col gap-2">
        <label className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>Color</label>
        <div className="flex flex-wrap gap-2">
          {CLIENT_COLORS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setColor(c)}
              className="w-7 h-7 rounded-full transition-transform"
              style={{
                background: c,
                transform: color === c ? 'scale(1.25)' : undefined,
                outline: color === c ? `2px solid ${c}` : undefined,
                outlineOffset: color === c ? '2px' : undefined
              }}
            />
          ))}
        </div>
      </div>

      <div className="flex gap-2 justify-end pt-1">
        <Button type="button" variant="ghost" onClick={onCancel}>Cancel</Button>
        <Button type="submit" variant="primary" loading={saving}>
          {initial?.id ? 'Save Changes' : 'Create Client'}
        </Button>
      </div>
    </form>
  )
}

export default function Clients(): JSX.Element {
  const { clients, setClients, projects } = useAppStore()
  const [showCreate, setShowCreate] = useState(false)
  const [editing, setEditing] = useState<Client | null>(null)

  useEffect(() => {
    api.getClients().then(setClients)
  }, [])

  async function handleCreate(data: CreateClientData): Promise<void> {
    const c = await api.createClient(data)
    setClients([...clients, c])
    setShowCreate(false)
  }

  async function handleEdit(data: CreateClientData): Promise<void> {
    if (!editing) return
    const updated = await api.updateClient(editing.id, data)
    setClients(clients.map((c) => (c.id === editing.id ? updated : c)))
    setEditing(null)
  }

  async function handleDelete(client: Client): Promise<void> {
    const clientProjects = projects.filter((p) => p.clientId === client.id)
    const msg = clientProjects.length > 0
      ? `Delete "${client.name}"? ${clientProjects.length} project(s) will be unlinked.`
      : `Delete "${client.name}"?`
    if (!confirm(msg)) return
    await api.deleteClient(client.id)
    setClients(clients.filter((c) => c.id !== client.id))
  }

  return (
    <div className="max-w-2xl mx-auto animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>Clients</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>
            {clients.length} client{clients.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Button variant="primary" onClick={() => setShowCreate(true)}>
          <Plus size={16} /> New Client
        </Button>
      </div>

      {clients.length === 0 ? (
        <div
          className="rounded-xl border-2 border-dashed p-10 text-center"
          style={{ borderColor: 'var(--border)' }}
        >
          <p className="text-sm mb-3" style={{ color: 'var(--text-muted)' }}>
            No clients yet. Create one to group projects by client.
          </p>
          <Button variant="primary" onClick={() => setShowCreate(true)}>
            <Plus size={16} /> Create Client
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {clients.map((client) => {
            const clientProjects = projects.filter((p) => p.clientId === client.id && !p.isArchived)
            return (
              <div
                key={client.id}
                className="rounded-2xl border overflow-hidden"
                style={{ borderColor: 'var(--border)', background: 'var(--bg-secondary)' }}
              >
                {/* Client header */}
                <div
                  className="flex items-center gap-3 px-4 py-3 border-b group"
                  style={{ borderColor: 'var(--border)', borderLeft: `3px solid ${client.color}` }}
                >
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold text-white"
                    style={{ background: client.color }}
                  >
                    {client.name[0].toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
                      {client.name}
                    </p>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                      {clientProjects.length} project{clientProjects.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => setEditing(client)}
                      className="p-1.5 rounded-lg hover:bg-hover"
                      title="Edit"
                      style={{ color: 'var(--text-muted)' }}
                    >
                      <Edit2 size={14} />
                    </button>
                    <button
                      onClick={() => handleDelete(client)}
                      className="p-1.5 rounded-lg hover:bg-hover"
                      title="Delete"
                      style={{ color: 'var(--danger)' }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                {/* Client projects */}
                {clientProjects.length > 0 ? (
                  <div className="divide-y" style={{ borderColor: 'var(--border)' }}>
                    {clientProjects.map((p) => (
                      <div key={p.id} className="flex items-center gap-3 px-4 py-2.5 text-sm">
                        <div
                          className="w-6 h-6 rounded-md flex items-center justify-center text-xs shrink-0"
                          style={{ background: p.color + '22', color: p.color }}
                        >
                          {p.icon ?? p.name[0]}
                        </div>
                        <span className="flex-1 truncate" style={{ color: 'var(--text-primary)' }}>
                          {p.name}
                        </span>
                        {p.goalHours && (
                          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                            {p.goalHours}h/{p.goalPeriod}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="px-4 py-3 flex items-center gap-2 text-xs" style={{ color: 'var(--text-muted)' }}>
                    <FolderKanban size={13} />
                    No projects assigned yet — edit a project to assign it here
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="New Client">
        <ClientForm onSave={handleCreate} onCancel={() => setShowCreate(false)} />
      </Modal>

      <Modal open={!!editing} onClose={() => setEditing(null)} title="Edit Client">
        {editing && (
          <ClientForm initial={editing} onSave={handleEdit} onCancel={() => setEditing(null)} />
        )}
      </Modal>
    </div>
  )
}
