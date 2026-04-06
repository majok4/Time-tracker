import { Play, Square, ChevronDown } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'
import { useAppStore } from '../../store'
import { formatMs } from '../../lib/utils'
import api from '../../lib/api'
import type { Project } from '../../../../shared/types'

export default function TopBar(): JSX.Element {
  const { timerState, focusState, projects, setTimerState } = useAppStore()
  const [showProjectPicker, setShowProjectPicker] = useState(false)
  const pickerRef = useRef<HTMLDivElement>(null)

  const activeProject = timerState.session
    ? projects.find((p) => p.id === timerState.session!.projectId)
    : null

  useEffect(() => {
    function handleClickOutside(e: MouseEvent): void {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setShowProjectPicker(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  async function handleStart(project: Project): Promise<void> {
    setShowProjectPicker(false)
    const session = await api.startSession({ projectId: project.id, source: 'manual' })
    setTimerState({ active: true, session, elapsed: 0 })
  }

  async function handleStop(): Promise<void> {
    await api.stopSession()
    setTimerState({ active: false, session: null, elapsed: 0 })
  }

  if (focusState.active) {
    return (
      <div
        className="flex items-center justify-between px-4 h-12 shrink-0 border-b drag-region"
        style={{ borderColor: 'var(--border)', background: 'var(--bg-secondary)' }}
      >
        <div className="w-16" /> {/* traffic light space */}
        <div className="flex items-center gap-3 no-drag">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: 'var(--accent)' }} />
            <span className="text-sm font-medium" style={{ color: 'var(--accent)' }}>
              Focus Mode
            </span>
          </div>
          <span className="text-2xl font-mono font-semibold" style={{ color: 'var(--text-primary)' }}>
            {formatMs(focusState.remaining)}
          </span>
        </div>
        <div className="w-16" />
      </div>
    )
  }

  return (
    <div
      className="flex items-center justify-between px-4 h-12 shrink-0 border-b drag-region"
      style={{ borderColor: 'var(--border)', background: 'var(--bg-secondary)' }}
    >
      <div className="w-16" /> {/* traffic light space */}

      <div className="flex items-center gap-3 no-drag">
        {timerState.active && activeProject ? (
          <>
            <div
              className="w-2.5 h-2.5 rounded-full animate-pulse-soft"
              style={{ background: activeProject.color }}
            />
            <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
              {activeProject.icon && <span className="mr-1">{activeProject.icon}</span>}
              {activeProject.name}
            </span>
            <span className="text-lg font-mono font-semibold tabular-nums" style={{ color: 'var(--text-primary)' }}>
              {formatMs(timerState.elapsed)}
            </span>
            <button
              onClick={handleStop}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
              style={{ background: 'var(--bg-tertiary)', color: 'var(--danger)' }}
            >
              <Square size={12} fill="currentColor" />
              Stop
            </button>
          </>
        ) : (
          <div className="relative" ref={pickerRef}>
            <button
              onClick={() => setShowProjectPicker((v) => !v)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
              style={{ background: 'var(--accent)', color: 'white' }}
            >
              <Play size={12} fill="white" />
              Start Tracking
              <ChevronDown size={12} />
            </button>

            {showProjectPicker && (
              <div
                className="absolute top-full mt-1 left-1/2 -translate-x-1/2 w-52 rounded-xl border shadow-xl z-50 py-1 animate-fade-in"
                style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border)' }}
              >
                {projects.length === 0 ? (
                  <div className="px-3 py-2 text-xs" style={{ color: 'var(--text-muted)' }}>
                    No projects yet. Create one first.
                  </div>
                ) : (
                  projects.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => handleStart(p)}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-left transition-colors hover:bg-hover"
                      style={{ color: 'var(--text-primary)' }}
                    >
                      <div className="w-2 h-2 rounded-full shrink-0" style={{ background: p.color }} />
                      {p.icon && <span>{p.icon}</span>}
                      {p.name}
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="w-16" />
    </div>
  )
}
