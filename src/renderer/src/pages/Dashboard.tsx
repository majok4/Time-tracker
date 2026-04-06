import { useEffect, useState } from 'react'
import { Play, Clock, TrendingUp, Zap } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAppStore } from '../store'
import api from '../lib/api'
import type { DailyReport } from '../../../shared/types'
import { formatMs, formatMsLong, formatTime, getToday } from '../lib/utils'
import Button from '../components/ui/Button'
import Badge from '../components/ui/Badge'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'

export default function Dashboard(): JSX.Element {
  const navigate = useNavigate()
  const { timerState, focusState, projects, setTimerState } = useAppStore()
  const [report, setReport] = useState<DailyReport | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load(): Promise<void> {
      const r = await api.getDailyReport(getToday())
      setReport(r)
      setLoading(false)
    }
    load()
  }, [timerState.active])

  async function handleStartProject(projectId: string): Promise<void> {
    const session = await api.startSession({ projectId, source: 'manual' })
    setTimerState({ active: true, session, elapsed: 0 })
  }

  async function handleStop(): Promise<void> {
    await api.stopSession()
    setTimerState({ active: false, session: null, elapsed: 0 })
    const r = await api.getDailyReport(getToday())
    setReport(r)
  }

  const activeProject = timerState.session
    ? projects.find((p) => p.id === timerState.session!.projectId)
    : null

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>
          {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
        </h1>
        <p className="text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>
          Today's overview
        </p>
      </div>

      {/* Active session card */}
      {timerState.active && activeProject ? (
        <div
          className="rounded-2xl border p-5"
          style={{ background: 'var(--bg-secondary)', borderColor: activeProject.color + '66' }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
                style={{ background: activeProject.color + '22' }}
              >
                {activeProject.icon ?? activeProject.name[0]}
              </div>
              <div>
                <p className="text-xs font-medium mb-0.5" style={{ color: 'var(--text-muted)' }}>
                  Currently tracking
                </p>
                <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                  {activeProject.name}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-2xl font-mono font-bold tabular-nums" style={{ color: 'var(--text-primary)' }}>
                  {formatMs(timerState.elapsed)}
                </p>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  elapsed
                </p>
              </div>
              <Button variant="danger" onClick={handleStop} size="sm">
                Stop
              </Button>
            </div>
          </div>
        </div>
      ) : focusState.active ? (
        <div
          className="rounded-2xl border p-5"
          style={{ background: 'var(--bg-secondary)', borderColor: 'var(--accent)' }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'var(--accent-dim)' }}>
                <Zap size={20} style={{ color: 'var(--accent)' }} />
              </div>
              <div>
                <p className="text-xs font-medium mb-0.5" style={{ color: 'var(--text-muted)' }}>Focus Mode Active</p>
                <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                  {focusState.focusSession?.goal ?? 'Deep work session'}
                </p>
              </div>
            </div>
            <p className="text-2xl font-mono font-bold" style={{ color: 'var(--accent)' }}>
              {formatMs(focusState.remaining)}
            </p>
          </div>
        </div>
      ) : null}

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4">
        <StatCard
          icon={<Clock size={18} />}
          label="Today"
          value={loading ? '—' : formatMsLong(report?.totalMs ?? 0)}
        />
        <StatCard
          icon={<TrendingUp size={18} />}
          label="Sessions"
          value={loading ? '—' : String(report?.sessions.length ?? 0)}
        />
        <StatCard
          icon={<Zap size={18} />}
          label="Projects"
          value={loading ? '—' : String(report?.byProject.length ?? 0)}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Project breakdown */}
        <div
          className="rounded-2xl border p-4"
          style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border)' }}
        >
          <h2 className="text-sm font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
            Today by Project
          </h2>
          {!loading && report && report.byProject.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={140}>
                <PieChart>
                  <Pie
                    data={report.byProject}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={60}
                    dataKey="totalMs"
                    paddingAngle={2}
                  >
                    {report.byProject.map((p, i) => (
                      <Cell key={i} fill={p.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(val: number) => [formatMsLong(val), 'Time']}
                    contentStyle={{
                      background: 'var(--bg-secondary)',
                      border: '1px solid var(--border)',
                      borderRadius: 8,
                      color: 'var(--text-primary)'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-1.5 mt-2">
                {report.byProject.map((p) => (
                  <div key={p.projectId} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ background: p.color }} />
                      <span style={{ color: 'var(--text-secondary)' }}>{p.projectName}</span>
                    </div>
                    <span className="font-medium tabular-nums" style={{ color: 'var(--text-primary)' }}>
                      {formatMsLong(p.totalMs)}
                    </span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-40 text-sm" style={{ color: 'var(--text-muted)' }}>
              No time tracked today
            </div>
          )}
        </div>

        {/* Quick start */}
        <div
          className="rounded-2xl border p-4"
          style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border)' }}
        >
          <h2 className="text-sm font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
            Quick Start
          </h2>
          {projects.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 gap-3">
              <p className="text-sm text-center" style={{ color: 'var(--text-muted)' }}>
                Create a project to start tracking
              </p>
              <Button variant="primary" size="sm" onClick={() => navigate('/projects')}>
                <Play size={14} /> Create Project
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {projects.slice(0, 5).map((p) => (
                <button
                  key={p.id}
                  onClick={() => handleStartProject(p.id)}
                  disabled={timerState.active || focusState.active}
                  className="w-full flex items-center gap-2.5 p-2.5 rounded-xl text-sm text-left transition-colors hover:bg-hover disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ color: 'var(--text-primary)' }}
                >
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                    style={{ background: p.color + '22', color: p.color }}>
                    {p.icon ?? p.name[0]}
                  </div>
                  <span className="flex-1 truncate">{p.name}</span>
                  <Play size={13} style={{ color: 'var(--text-muted)' }} />
                </button>
              ))}
              <button
                onClick={() => navigate('/focus')}
                disabled={timerState.active || focusState.active}
                className="w-full flex items-center gap-2.5 p-2.5 rounded-xl text-sm text-left transition-colors hover:bg-hover disabled:opacity-50"
                style={{ color: 'var(--accent)' }}
              >
                <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ background: 'var(--accent-dim)' }}>
                  <Zap size={14} />
                </div>
                Start Focus Mode
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Recent sessions */}
      {report && report.sessions.length > 0 && (
        <div
          className="rounded-2xl border p-4"
          style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border)' }}
        >
          <h2 className="text-sm font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>
            Recent Sessions
          </h2>
          <div className="space-y-1">
            {report.sessions.slice(0, 6).map((s) => {
              const project = projects.find((p) => p.id === s.projectId)
              return (
                <div key={s.id} className="flex items-center gap-3 py-1.5 text-sm">
                  <div className="w-2 h-2 rounded-full shrink-0" style={{ background: project?.color ?? '#666' }} />
                  <span className="flex-1 truncate" style={{ color: 'var(--text-primary)' }}>
                    {project?.name ?? 'Unknown'}
                  </span>
                  <span style={{ color: 'var(--text-muted)' }}>{formatTime(s.startedAt)}</span>
                  <Badge
                    label={formatMsLong(s.duration ?? 0)}
                    color={project?.color ?? '#666'}
                  />
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }): JSX.Element {
  return (
    <div
      className="rounded-2xl border p-4"
      style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border)' }}
    >
      <div className="flex items-center gap-2 mb-2">
        <span style={{ color: 'var(--text-muted)' }}>{icon}</span>
        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{label}</span>
      </div>
      <p className="text-2xl font-bold tabular-nums" style={{ color: 'var(--text-primary)' }}>
        {value}
      </p>
    </div>
  )
}
