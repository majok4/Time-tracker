import { useState, useEffect } from 'react'
import { Zap, Play, Square, Target } from 'lucide-react'
import { useAppStore } from '../store'
import api from '../lib/api'
import type { FocusSession } from '../../../shared/types'
import { formatMs, formatMsLong } from '../lib/utils'
import Button from '../components/ui/Button'
import Select from '../components/ui/Select'
import Input from '../components/ui/Input'

const DURATION_OPTIONS = [
  { value: '900000', label: '15 minutes' },
  { value: '1500000', label: '25 minutes (Pomodoro)' },
  { value: '2700000', label: '45 minutes' },
  { value: '3600000', label: '1 hour' },
  { value: '5400000', label: '1.5 hours' },
  { value: '7200000', label: '2 hours' }
]

export default function Focus(): JSX.Element {
  const { focusState, setFocusState, timerState, projects } = useAppStore()
  const [projectId, setProjectId] = useState('')
  const [durationMs, setDurationMs] = useState('1500000')
  const [goal, setGoal] = useState('')
  const [recentSessions, setRecentSessions] = useState<FocusSession[]>([])
  const [starting, setStarting] = useState(false)
  const [completedSession, setCompletedSession] = useState<FocusSession | null>(null)

  useEffect(() => {
    if (projects.length > 0 && !projectId) {
      setProjectId(projects[0].id)
    }
  }, [projects])

  useEffect(() => {
    // Listen for focus completion to show summary
    const unsub = api.onFocusCompleted(({ focusSession }) => {
      setCompletedSession(focusSession)
      setRecentSessions((prev) => [focusSession, ...prev.slice(0, 4)])
    })
    return unsub
  }, [])

  async function handleStart(): Promise<void> {
    if (!projectId) return
    setStarting(true)
    try {
      await api.startFocus({ projectId, durationMs: Number(durationMs), goal: goal || null })
    } finally {
      setStarting(false)
    }
  }

  async function handleStop(): Promise<void> {
    await api.stopFocus()
    setFocusState({ active: false, focusSession: null, remaining: 0, elapsed: 0 })
  }

  if (focusState.active && focusState.focusSession) {
    return <FocusActiveView focusState={focusState} onStop={handleStop} projects={projects} />
  }

  if (completedSession) {
    return (
      <FocusCompleteView
        session={completedSession}
        projects={projects}
        onDismiss={() => setCompletedSession(null)}
        onStartAnother={() => {
          setCompletedSession(null)
          handleStart()
        }}
      />
    )
  }

  return (
    <div className="max-w-lg mx-auto animate-fade-in">
      <div className="text-center mb-8">
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
          style={{ background: 'var(--accent-dim)' }}
        >
          <Zap size={28} style={{ color: 'var(--accent)' }} />
        </div>
        <h1 className="text-xl font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
          Focus Mode
        </h1>
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
          Set a timer and immerse in deep work
        </p>
      </div>

      <div
        className="rounded-2xl border p-6 space-y-5"
        style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border)' }}
      >
        <Select
          label="Project"
          value={projectId}
          onChange={(e) => setProjectId(e.target.value)}
          options={projects.map((p) => ({ value: p.id, label: `${p.icon ?? ''} ${p.name}`.trim() }))}
          placeholder={projects.length === 0 ? 'Create a project first' : 'Select project...'}
        />

        <Select
          label="Duration"
          value={durationMs}
          onChange={(e) => setDurationMs(e.target.value)}
          options={DURATION_OPTIONS}
        />

        <Input
          label="Goal (optional)"
          value={goal}
          onChange={(e) => setGoal(e.target.value)}
          placeholder="What do you want to accomplish?"
        />

        <Button
          variant="primary"
          className="w-full py-3 text-base"
          onClick={handleStart}
          loading={starting}
          disabled={!projectId || timerState.active}
        >
          <Play size={18} />
          Start Focus Session
        </Button>

        {timerState.active && (
          <p className="text-xs text-center" style={{ color: 'var(--text-muted)' }}>
            Stop the current timer first to start a focus session
          </p>
        )}
      </div>

      {/* Tips */}
      <div className="mt-6 space-y-2">
        {['Put your phone away', 'Close distracting tabs', 'Use headphones if possible'].map((tip) => (
          <div key={tip} className="flex items-center gap-2 text-sm" style={{ color: 'var(--text-muted)' }}>
            <span>•</span> {tip}
          </div>
        ))}
      </div>
    </div>
  )
}

function FocusActiveView({
  focusState,
  onStop,
  projects
}: {
  focusState: { active: boolean; focusSession: FocusSession | null; remaining: number; elapsed: number }
  onStop: () => void
  projects: Array<{ id: string; name: string; color: string; icon: string | null }>
}): JSX.Element {
  const project = focusState.focusSession
    ? projects.find((p) => p.id === focusState.focusSession!.projectId)
    : null

  const progress = focusState.focusSession
    ? ((focusState.focusSession.durationTarget - focusState.remaining) /
        focusState.focusSession.durationTarget) *
      100
    : 0

  return (
    <div className="max-w-lg mx-auto flex flex-col items-center justify-center min-h-[60vh] animate-fade-in">
      {/* Circular progress */}
      <div className="relative w-52 h-52 mb-8">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="44" fill="none" stroke="var(--bg-tertiary)" strokeWidth="6" />
          <circle
            cx="50"
            cy="50"
            r="44"
            fill="none"
            stroke="var(--accent)"
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={`${2 * Math.PI * 44}`}
            strokeDashoffset={`${2 * Math.PI * 44 * (1 - progress / 100)}`}
            style={{ transition: 'stroke-dashoffset 1s linear' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-4xl font-mono font-bold tabular-nums" style={{ color: 'var(--text-primary)' }}>
            {formatMs(focusState.remaining)}
          </span>
          <span className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>remaining</span>
        </div>
      </div>

      {project && (
        <div className="flex items-center gap-2 mb-2">
          <div className="w-3 h-3 rounded-full" style={{ background: project.color }} />
          <span className="font-medium" style={{ color: 'var(--text-primary)' }}>{project.name}</span>
        </div>
      )}

      {focusState.focusSession?.goal && (
        <div className="flex items-center gap-2 mb-8">
          <Target size={14} style={{ color: 'var(--text-muted)' }} />
          <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            {focusState.focusSession.goal}
          </span>
        </div>
      )}

      <Button variant="danger" onClick={onStop} size="lg">
        <Square size={16} />
        End Focus Session
      </Button>

      <p className="text-xs mt-4" style={{ color: 'var(--text-muted)' }}>
        {formatMsLong(focusState.elapsed)} elapsed
      </p>
    </div>
  )
}

function FocusCompleteView({
  session,
  projects,
  onDismiss,
  onStartAnother
}: {
  session: FocusSession
  projects: Array<{ id: string; name: string; color: string; icon: string | null }>
  onDismiss: () => void
  onStartAnother: () => void
}): JSX.Element {
  const project = projects.find((p) => p.id === session.projectId)

  return (
    <div className="max-w-sm mx-auto flex flex-col items-center justify-center min-h-[60vh] text-center animate-fade-in">
      <div className="text-6xl mb-4">🎉</div>
      <h2 className="text-xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
        Session Complete!
      </h2>
      <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>
        You focused for {formatMsLong(session.durationActual ?? session.durationTarget)}
        {project && ` on ${project.name}`}
      </p>
      {session.goal && (
        <div
          className="px-4 py-3 rounded-xl mb-6 text-sm"
          style={{ background: 'var(--bg-secondary)', color: 'var(--text-secondary)' }}
        >
          Goal: {session.goal}
        </div>
      )}
      <div className="flex gap-3">
        <Button variant="secondary" onClick={onDismiss}>Done</Button>
        <Button variant="primary" onClick={onStartAnother}>
          <Play size={14} /> Start Another
        </Button>
      </div>
    </div>
  )
}
