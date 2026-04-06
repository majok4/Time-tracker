import { useState, useEffect } from 'react'
import { Trash2, Plus, Monitor } from 'lucide-react'
import { useAppStore } from '../store'
import api from '../lib/api'
import type { AppRule } from '../../../shared/types'
import Button from '../components/ui/Button'
import Select from '../components/ui/Select'
import Modal from '../components/ui/Modal'

export default function Settings(): JSX.Element {
  const { projects, settings, updateSetting } = useAppStore()
  const [appRules, setAppRules] = useState<AppRule[]>([])
  const [addRuleModal, setAddRuleModal] = useState(false)
  const [newAppName, setNewAppName] = useState('')
  const [newProjectId, setNewProjectId] = useState('')

  useEffect(() => {
    api.getAppRules().then(setAppRules)
  }, [])

  async function handleAutoDetectToggle(enabled: boolean): Promise<void> {
    await api.setAutoDetect(enabled)
    updateSetting('auto_detect_enabled', enabled ? 'true' : 'false')
  }

  async function handleNotifToggle(enabled: boolean): Promise<void> {
    await api.setSetting('notifications_enabled', enabled ? 'true' : 'false')
    updateSetting('notifications_enabled', enabled ? 'true' : 'false')
  }

  async function handleAddRule(): Promise<void> {
    if (!newAppName.trim() || !newProjectId) return
    const rule = await api.setAppRule(newAppName.trim(), newProjectId)
    setAppRules((prev) => [...prev.filter((r) => r.appName !== rule.appName), rule])
    setNewAppName('')
    setNewProjectId('')
    setAddRuleModal(false)
  }

  async function handleDeleteRule(appName: string): Promise<void> {
    await api.deleteAppRule(appName)
    setAppRules((prev) => prev.filter((r) => r.appName !== appName))
  }

  const autoDetect = settings['auto_detect_enabled'] === 'true'
  const notifications = settings['notifications_enabled'] !== 'false'

  return (
    <div className="max-w-xl mx-auto space-y-6 animate-fade-in">
      <h1 className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>Settings</h1>

      {/* Auto-detect */}
      <Section title="Auto-Detection">
        <ToggleRow
          label="Auto-detect active app"
          description="Automatically track time based on the app you're using. Requires Accessibility permission on macOS."
          checked={autoDetect}
          onChange={handleAutoDetectToggle}
        />

        {autoDetect && (
          <div className="mt-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
                App Rules ({appRules.length})
              </p>
              <Button variant="secondary" size="sm" onClick={() => setAddRuleModal(true)}>
                <Plus size={14} /> Add Rule
              </Button>
            </div>

            {appRules.length === 0 ? (
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                No rules yet. Rules map detected apps to projects automatically.
              </p>
            ) : (
              <div className="space-y-1.5">
                {appRules.map((rule) => {
                  const project = projects.find((p) => p.id === rule.projectId)
                  return (
                    <div
                      key={rule.id}
                      className="flex items-center gap-3 p-2.5 rounded-lg border"
                      style={{ background: 'var(--bg-tertiary)', borderColor: 'var(--border)' }}
                    >
                      <Monitor size={14} style={{ color: 'var(--text-muted)' }} />
                      <span className="flex-1 text-sm truncate" style={{ color: 'var(--text-primary)' }}>
                        {rule.appName}
                      </span>
                      <span className="text-xs" style={{ color: 'var(--text-muted)' }}>→</span>
                      {project && (
                        <div className="flex items-center gap-1.5">
                          <div className="w-2 h-2 rounded-full" style={{ background: project.color }} />
                          <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                            {project.name}
                          </span>
                        </div>
                      )}
                      <button
                        onClick={() => handleDeleteRule(rule.appName)}
                        className="p-1 rounded"
                        style={{ color: 'var(--danger)' }}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </Section>

      {/* Notifications */}
      <Section title="Notifications">
        <ToggleRow
          label="Enable notifications"
          description="Get notified when focus sessions complete."
          checked={notifications}
          onChange={handleNotifToggle}
        />
      </Section>

      {/* Data */}
      <Section title="Data">
        <p className="text-xs mb-3" style={{ color: 'var(--text-muted)' }}>
          Export all your time tracking data as a CSV file.
        </p>
        <Button
          variant="secondary"
          size="sm"
          onClick={async () => {
            const now = Date.now()
            const yearAgo = now - 365 * 24 * 60 * 60 * 1000
            await api.exportCSV({ startDate: yearAgo, endDate: now })
          }}
        >
          Export All Data (CSV)
        </Button>
      </Section>

      {/* About */}
      <Section title="About">
        <div className="space-y-1.5 text-sm" style={{ color: 'var(--text-secondary)' }}>
          <p>Time Tracker v0.1.0</p>
          <p style={{ color: 'var(--text-muted)' }}>Built with Electron, React, and SQLite</p>
        </div>
      </Section>

      {/* Add Rule Modal */}
      <Modal open={addRuleModal} onClose={() => setAddRuleModal(false)} title="Add App Rule" size="sm">
        <div className="flex flex-col gap-4">
          <div>
            <label className="text-xs font-medium block mb-1.5" style={{ color: 'var(--text-secondary)' }}>
              App Name
            </label>
            <input
              value={newAppName}
              onChange={(e) => setNewAppName(e.target.value)}
              placeholder="e.g. Google Chrome"
              className="w-full px-3 py-2 rounded-lg text-sm border outline-none"
              style={{
                background: 'var(--bg-tertiary)',
                color: 'var(--text-primary)',
                borderColor: 'var(--border)'
              }}
              autoFocus
            />
            <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
              Use the exact app name as it appears in the tray notification
            </p>
          </div>
          <Select
            label="Assign to Project"
            value={newProjectId}
            onChange={(e) => setNewProjectId(e.target.value)}
            options={projects.map((p) => ({ value: p.id, label: `${p.icon ?? ''} ${p.name}`.trim() }))}
            placeholder="Select project..."
          />
          <div className="flex gap-2 justify-end">
            <Button variant="ghost" onClick={() => setAddRuleModal(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleAddRule} disabled={!newAppName.trim() || !newProjectId}>
              Add Rule
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }): JSX.Element {
  return (
    <div
      className="rounded-2xl border p-5"
      style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border)' }}
    >
      <h2 className="text-sm font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
        {title}
      </h2>
      {children}
    </div>
  )
}

function ToggleRow({
  label,
  description,
  checked,
  onChange
}: {
  label: string
  description: string
  checked: boolean
  onChange: (v: boolean) => void
}): JSX.Element {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{label}</p>
        <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{description}</p>
      </div>
      <button
        onClick={() => onChange(!checked)}
        className="shrink-0 w-10 h-6 rounded-full relative transition-colors"
        style={{ background: checked ? 'var(--accent)' : 'var(--bg-tertiary)' }}
      >
        <div
          className="absolute top-1 w-4 h-4 rounded-full bg-white shadow-sm transition-transform"
          style={{ left: checked ? '22px' : '4px' }}
        />
      </button>
    </div>
  )
}
