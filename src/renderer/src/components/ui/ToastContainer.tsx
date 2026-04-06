import { X, Info, CheckCircle, AlertTriangle, AlertCircle } from 'lucide-react'
import { useAppStore } from '../../store'
import { useState } from 'react'
import api from '../../lib/api'
import Modal from './Modal'
import Select from './Select'

export default function ToastContainer(): JSX.Element {
  const { toasts, removeToast, projects } = useAppStore()
  const [assignModal, setAssignModal] = useState<{ appName: string } | null>(null)
  const [selectedProject, setSelectedProject] = useState('')

  const icons = {
    info: Info,
    success: CheckCircle,
    warning: AlertTriangle,
    error: AlertCircle
  }

  const colors = {
    info: 'var(--accent)',
    success: 'var(--success)',
    warning: 'var(--warning)',
    error: 'var(--danger)'
  }

  async function handleAssign(): Promise<void> {
    if (!assignModal || !selectedProject) return
    await api.setAppRule(assignModal.appName, selectedProject)
    setAssignModal(null)
    setSelectedProject('')
  }

  return (
    <>
      <div className="fixed bottom-4 right-4 z-40 flex flex-col gap-2 pointer-events-none">
        {toasts.map((toast) => {
          const Icon = icons[toast.type]
          return (
            <div
              key={toast.id}
              className="flex items-start gap-3 p-3 pr-4 rounded-xl border shadow-xl animate-slide-up pointer-events-auto max-w-xs"
              style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border)' }}
            >
              <Icon size={16} style={{ color: colors[toast.type], marginTop: 2, flexShrink: 0 }} />
              <div className="flex-1 min-w-0">
                <p className="text-sm" style={{ color: 'var(--text-primary)' }}>
                  {toast.message}
                </p>
                {toast.appName && (
                  <button
                    className="text-xs mt-1 underline"
                    style={{ color: 'var(--accent)' }}
                    onClick={() => setAssignModal({ appName: toast.appName! })}
                  >
                    Assign to project
                  </button>
                )}
              </div>
              <button
                onClick={() => removeToast(toast.id)}
                className="p-0.5 rounded"
                style={{ color: 'var(--text-muted)' }}
              >
                <X size={14} />
              </button>
            </div>
          )
        })}
      </div>

      <Modal
        open={!!assignModal}
        onClose={() => setAssignModal(null)}
        title={`Assign "${assignModal?.appName}" to project`}
        size="sm"
      >
        <div className="flex flex-col gap-4">
          <Select
            label="Project"
            value={selectedProject}
            onChange={(e) => setSelectedProject(e.target.value)}
            options={projects.map((p) => ({ value: p.id, label: `${p.icon ?? ''} ${p.name}`.trim() }))}
            placeholder="Select a project..."
          />
          <div className="flex gap-2 justify-end">
            <button
              onClick={() => setAssignModal(null)}
              className="px-3 py-1.5 rounded-lg text-sm"
              style={{ color: 'var(--text-secondary)' }}
            >
              Cancel
            </button>
            <button
              onClick={handleAssign}
              disabled={!selectedProject}
              className="px-3 py-1.5 rounded-lg text-sm font-medium text-white disabled:opacity-50"
              style={{ background: 'var(--accent)' }}
            >
              Assign
            </button>
          </div>
        </div>
      </Modal>
    </>
  )
}
