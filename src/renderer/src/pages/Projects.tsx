import { useState, useEffect } from 'react'
import { Plus, Archive, Trash2, Edit2 } from 'lucide-react'
import { useAppStore } from '../store'
import api from '../lib/api'
import type { Project, CreateProjectData } from '../../../shared/types'
import Button from '../components/ui/Button'
import Modal from '../components/ui/Modal'
import Input from '../components/ui/Input'
import ColorPicker from '../components/ui/ColorPicker'
import Badge from '../components/ui/Badge'
import { PROJECT_COLORS, PROJECT_ICONS } from '../lib/utils'

function ProjectForm({
  initial,
  onSave,
  onCancel
}: {
  initial?: Partial<Project>
  onSave: (data: CreateProjectData) => Promise<void>
  onCancel: () => void
}): JSX.Element {
  const [name, setName] = useState(initial?.name ?? '')
  const [color, setColor] = useState(initial?.color ?? PROJECT_COLORS[0])
  const [icon, setIcon] = useState(initial?.icon ?? '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent): Promise<void> {
    e.preventDefault()
    if (!name.trim()) { setError('Name is required'); return }
    setSaving(true)
    await onSave({ name: name.trim(), color, icon: icon || null })
    setSaving(false)
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <Input
        label="Project Name"
        value={name}
        onChange={(e) => { setName(e.target.value); setError('') }}
        placeholder="e.g. Design Work"
        error={error}
        autoFocus
      />

      <div className="flex flex-col gap-2">
        <label className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>Color</label>
        <ColorPicker value={color} onChange={setColor} />
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>Icon (optional)</label>
        <div className="flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={() => setIcon('')}
            className="w-8 h-8 rounded-lg text-sm border flex items-center justify-center"
            style={{
              borderColor: icon === '' ? color : 'var(--border)',
              background: icon === '' ? 'var(--bg-hover)' : undefined
            }}
          >
            —
          </button>
          {PROJECT_ICONS.map((i) => (
            <button
              key={i}
              type="button"
              onClick={() => setIcon(i)}
              className="w-8 h-8 rounded-lg text-base border flex items-center justify-center"
              style={{
                borderColor: icon === i ? color : 'var(--border)',
                background: icon === i ? 'var(--bg-hover)' : undefined
              }}
            >
              {i}
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-2 justify-end pt-1">
        <Button type="button" variant="ghost" onClick={onCancel}>Cancel</Button>
        <Button type="submit" variant="primary" loading={saving}>
          {initial?.id ? 'Save Changes' : 'Create Project'}
        </Button>
      </div>
    </form>
  )
}

export default function Projects(): JSX.Element {
  const { projects, setProjects } = useAppStore()
  const [showCreate, setShowCreate] = useState(false)
  const [editing, setEditing] = useState<Project | null>(null)
  const [showArchived, setShowArchived] = useState(false)

  useEffect(() => {
    api.getProjects(showArchived).then(setProjects)
  }, [showArchived])

  async function handleCreate(data: CreateProjectData): Promise<void> {
    const p = await api.createProject(data)
    setProjects([...projects, p])
    setShowCreate(false)
  }

  async function handleEdit(data: CreateProjectData): Promise<void> {
    if (!editing) return
    const updated = await api.updateProject(editing.id, data)
    setProjects(projects.map((p) => (p.id === editing.id ? updated : p)))
    setEditing(null)
  }

  async function handleArchive(project: Project): Promise<void> {
    await api.updateProject(project.id, { isArchived: !project.isArchived })
    const updated = await api.getProjects(showArchived)
    setProjects(updated)
  }

  async function handleDelete(project: Project): Promise<void> {
    if (!confirm(`Delete "${project.name}"? All time entries will be lost.`)) return
    await api.deleteProject(project.id)
    setProjects(projects.filter((p) => p.id !== project.id))
  }

  const active = projects.filter((p) => !p.isArchived)
  const archived = projects.filter((p) => p.isArchived)

  return (
    <div className="max-w-2xl mx-auto animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>Projects</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>
            {active.length} active project{active.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Button variant="primary" onClick={() => setShowCreate(true)}>
          <Plus size={16} /> New Project
        </Button>
      </div>

      {/* Active Projects */}
      <div className="space-y-2">
        {active.length === 0 ? (
          <div
            className="rounded-xl border-2 border-dashed p-10 text-center"
            style={{ borderColor: 'var(--border)' }}
          >
            <p className="text-sm mb-3" style={{ color: 'var(--text-muted)' }}>
              No projects yet. Create your first one to start tracking time.
            </p>
            <Button variant="primary" onClick={() => setShowCreate(true)}>
              <Plus size={16} /> Create Project
            </Button>
          </div>
        ) : (
          active.map((project) => (
            <ProjectRow
              key={project.id}
              project={project}
              onEdit={() => setEditing(project)}
              onArchive={() => handleArchive(project)}
              onDelete={() => handleDelete(project)}
            />
          ))
        )}
      </div>

      {/* Archived */}
      {archived.length > 0 && (
        <div className="mt-8">
          <button
            className="flex items-center gap-2 text-sm mb-3"
            style={{ color: 'var(--text-muted)' }}
            onClick={() => setShowArchived((v) => !v)}
          >
            <Archive size={14} />
            {showArchived ? 'Hide' : 'Show'} archived ({archived.length})
          </button>
          {showArchived && (
            <div className="space-y-2 opacity-60">
              {archived.map((project) => (
                <ProjectRow
                  key={project.id}
                  project={project}
                  onEdit={() => setEditing(project)}
                  onArchive={() => handleArchive(project)}
                  onDelete={() => handleDelete(project)}
                />
              ))}
            </div>
          )}
        </div>
      )}

      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="New Project">
        <ProjectForm onSave={handleCreate} onCancel={() => setShowCreate(false)} />
      </Modal>

      <Modal open={!!editing} onClose={() => setEditing(null)} title="Edit Project">
        {editing && (
          <ProjectForm initial={editing} onSave={handleEdit} onCancel={() => setEditing(null)} />
        )}
      </Modal>
    </div>
  )
}

function ProjectRow({
  project,
  onEdit,
  onArchive,
  onDelete
}: {
  project: Project
  onEdit: () => void
  onArchive: () => void
  onDelete: () => void
}): JSX.Element {
  return (
    <div
      className="flex items-center gap-3 p-3 rounded-xl border group transition-colors hover:bg-hover"
      style={{ borderColor: 'var(--border)', background: 'var(--bg-secondary)' }}
    >
      <div
        className="w-9 h-9 rounded-lg flex items-center justify-center text-base shrink-0"
        style={{ background: project.color + '22', color: project.color }}
      >
        {project.icon ?? <span className="text-xs font-bold">{project.name[0]}</span>}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm truncate" style={{ color: 'var(--text-primary)' }}>
          {project.name}
        </p>
        <Badge label={project.color} color={project.color} />
      </div>
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button onClick={onEdit} className="p-1.5 rounded-lg hover:bg-hover" title="Edit" style={{ color: 'var(--text-muted)' }}>
          <Edit2 size={14} />
        </button>
        <button onClick={onArchive} className="p-1.5 rounded-lg hover:bg-hover" title={project.isArchived ? 'Unarchive' : 'Archive'} style={{ color: 'var(--text-muted)' }}>
          <Archive size={14} />
        </button>
        <button onClick={onDelete} className="p-1.5 rounded-lg hover:bg-hover" title="Delete" style={{ color: 'var(--danger)' }}>
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  )
}
