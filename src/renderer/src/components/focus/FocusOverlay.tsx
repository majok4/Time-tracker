import { Zap, Square } from 'lucide-react'
import { useAppStore } from '../../store'
import api from '../../lib/api'
import { formatMs } from '../../lib/utils'

export default function FocusOverlay(): JSX.Element {
  const { focusState, setFocusState } = useAppStore()

  if (!focusState.active || !focusState.focusSession) return <></>

  const progress = focusState.focusSession
    ? ((focusState.focusSession.durationTarget - focusState.remaining) /
        focusState.focusSession.durationTarget) *
      100
    : 0

  async function handleStop(): Promise<void> {
    await api.stopFocus()
    setFocusState({ active: false, focusSession: null, remaining: 0, elapsed: 0 })
  }

  return (
    <div
      className="fixed top-0 right-0 w-72 p-4 rounded-bl-2xl border-l border-b shadow-2xl z-30 animate-slide-up"
      style={{ background: 'var(--bg-secondary)', borderColor: 'var(--accent)' }}
    >
      <div className="flex items-center gap-2 mb-3">
        <Zap size={14} style={{ color: 'var(--accent)' }} />
        <span className="text-xs font-semibold" style={{ color: 'var(--accent)' }}>FOCUS MODE</span>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 rounded-full mb-3" style={{ background: 'var(--bg-tertiary)' }}>
        <div
          className="h-full rounded-full transition-all duration-1000"
          style={{ width: `${progress}%`, background: 'var(--accent)' }}
        />
      </div>

      <div className="flex items-center justify-between">
        <div>
          <p className="text-2xl font-mono font-bold tabular-nums" style={{ color: 'var(--text-primary)' }}>
            {formatMs(focusState.remaining)}
          </p>
          {focusState.focusSession.goal && (
            <p className="text-xs mt-0.5 truncate max-w-[180px]" style={{ color: 'var(--text-muted)' }}>
              {focusState.focusSession.goal}
            </p>
          )}
        </div>
        <button
          onClick={handleStop}
          className="p-2 rounded-lg transition-colors hover:bg-hover"
          style={{ color: 'var(--danger)' }}
          title="End focus session"
        >
          <Square size={16} fill="currentColor" />
        </button>
      </div>
    </div>
  )
}
