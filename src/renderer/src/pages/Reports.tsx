import { useState, useEffect, useCallback } from 'react'
import { ChevronLeft, ChevronRight, Download } from 'lucide-react'
import { format, addWeeks, subWeeks, startOfWeek, addDays } from 'date-fns'
import { useAppStore } from '../store'
import api from '../lib/api'
import type { WeeklyReport, Session } from '../../../shared/types'
import { formatMsLong, formatDate, formatMs } from '../lib/utils'
import Button from '../components/ui/Button'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie
} from 'recharts'

export default function Reports(): JSX.Element {
  const { projects } = useAppStore()
  const [weekStart, setWeekStart] = useState(() => {
    const d = startOfWeek(new Date(), { weekStartsOn: 1 })
    return format(d, 'yyyy-MM-dd')
  })
  const [report, setReport] = useState<WeeklyReport | null>(null)
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)

  const loadReport = useCallback(async () => {
    setLoading(true)
    const start = new Date(weekStart + 'T00:00:00')
    const end = addDays(start, 6)
    end.setHours(23, 59, 59, 999)
    const [r, s] = await Promise.all([
      api.getWeeklyReport(weekStart),
      api.getSessions({ startDate: start.getTime(), endDate: end.getTime() })
    ])
    setReport(r)
    setSessions(s)
    setLoading(false)
  }, [weekStart])

  useEffect(() => {
    loadReport()
  }, [loadReport])

  function prevWeek(): void {
    const d = subWeeks(new Date(weekStart + 'T00:00:00'), 1)
    setWeekStart(format(startOfWeek(d, { weekStartsOn: 1 }), 'yyyy-MM-dd'))
  }

  function nextWeek(): void {
    const d = addWeeks(new Date(weekStart + 'T00:00:00'), 1)
    setWeekStart(format(startOfWeek(d, { weekStartsOn: 1 }), 'yyyy-MM-dd'))
  }

  async function handleExport(): Promise<void> {
    if (!report) return
    setExporting(true)
    const start = new Date(weekStart + 'T00:00:00')
    const end = addDays(start, 6)
    end.setHours(23, 59, 59, 999)
    await api.exportCSV({ startDate: start.getTime(), endDate: end.getTime() })
    setExporting(false)
  }

  const barData = report?.byDay.map((d) => ({
    day: format(new Date(d.date + 'T00:00:00'), 'EEE'),
    hours: Math.round(d.totalMs / 360000) / 10,
    ms: d.totalMs,
    ...Object.fromEntries(
      (report?.byProject ?? []).map((p) => [
        p.projectId,
        d.byProject?.find((bp) => bp.projectId === p.projectId)?.totalMs ?? 0
      ])
    )
  })) ?? []

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>Reports</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>
            {report ? `${formatDate(new Date(weekStart + 'T00:00:00').getTime())} – ${formatDate(new Date(report.endDate + 'T00:00:00').getTime())}` : 'Loading...'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={prevWeek} className="p-2 rounded-lg hover:bg-hover" style={{ color: 'var(--text-secondary)' }}>
            <ChevronLeft size={18} />
          </button>
          <button onClick={nextWeek} className="p-2 rounded-lg hover:bg-hover" style={{ color: 'var(--text-secondary)' }}>
            <ChevronRight size={18} />
          </button>
          <Button variant="secondary" size="sm" onClick={handleExport} loading={exporting}>
            <Download size={14} /> Export CSV
          </Button>
        </div>
      </div>

      {/* Total */}
      <div
        className="rounded-2xl border p-5"
        style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border)' }}
      >
        <p className="text-sm mb-1" style={{ color: 'var(--text-muted)' }}>Total this week</p>
        <p className="text-4xl font-bold" style={{ color: 'var(--text-primary)' }}>
          {loading ? '—' : formatMsLong(report?.totalMs ?? 0)}
        </p>
      </div>

      {/* Bar chart */}
      <div
        className="rounded-2xl border p-5"
        style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border)' }}
      >
        <h2 className="text-sm font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
          Hours per Day
        </h2>
        {loading ? (
          <div className="h-40 flex items-center justify-center text-sm" style={{ color: 'var(--text-muted)' }}>
            Loading...
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={barData} barSize={28}>
              <XAxis
                dataKey="day"
                tick={{ fill: 'var(--text-muted)', fontSize: 12 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => `${v}h`}
              />
              <Tooltip
                formatter={(val: number) => [`${val}h`, 'Hours']}
                contentStyle={{
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border)',
                  borderRadius: 8,
                  color: 'var(--text-primary)'
                }}
                cursor={{ fill: 'var(--bg-hover)' }}
              />
              <Bar dataKey="hours" radius={[4, 4, 0, 0]}>
                {barData.map((_, i) => (
                  <Cell key={i} fill="var(--accent)" fillOpacity={0.8} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Project breakdown */}
      {!loading && report && report.byProject.length > 0 && (
        <div className="grid grid-cols-2 gap-4">
          <div
            className="rounded-2xl border p-5"
            style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border)' }}
          >
            <h2 className="text-sm font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
              By Project
            </h2>
            <ResponsiveContainer width="100%" height={160}>
              <PieChart>
                <Pie
                  data={report.byProject}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={65}
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
          </div>

          <div
            className="rounded-2xl border p-5"
            style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border)' }}
          >
            <h2 className="text-sm font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
              Breakdown
            </h2>
            <div className="space-y-3">
              {report.byProject.map((p) => {
                const goalMs = p.goalHours ? p.goalHours * 3600000 : null
                const goalPct = goalMs ? Math.min(100, Math.round((p.totalMs / goalMs) * 100)) : null
                return (
                  <div key={p.projectId}>
                    <div className="flex justify-between text-xs mb-1">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full" style={{ background: p.color }} />
                        <span style={{ color: 'var(--text-secondary)' }}>{p.projectName}</span>
                      </div>
                      <div className="flex gap-2 items-center">
                        {goalMs && (
                          <span style={{ color: 'var(--text-muted)' }}>
                            {formatMsLong(p.totalMs)} / {p.goalHours}h {p.goalPeriod}
                          </span>
                        )}
                        {!goalMs && (
                          <>
                            <span style={{ color: 'var(--text-muted)' }}>{p.percentage}%</span>
                            <span className="font-medium" style={{ color: 'var(--text-primary)' }}>
                              {formatMsLong(p.totalMs)}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="h-1.5 rounded-full" style={{ background: 'var(--bg-tertiary)' }}>
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${goalPct ?? p.percentage}%`,
                          background: goalPct !== null && goalPct >= 100 ? '#22c55e' : p.color
                        }}
                      />
                    </div>
                    {goalPct !== null && (
                      <p className="text-xs mt-0.5" style={{ color: goalPct >= 100 ? '#22c55e' : 'var(--text-muted)' }}>
                        {goalPct >= 100 ? 'Goal reached!' : `${goalPct}% of goal`}
                      </p>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* No data */}
      {!loading && (!report || report.totalMs === 0) && (
        <div
          className="rounded-2xl border p-10 text-center"
          style={{ borderColor: 'var(--border)' }}
        >
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            No time tracked this week
          </p>
        </div>
      )}

      {/* Sessions table */}
      {!loading && sessions.length > 0 && (
        <div
          className="rounded-2xl border overflow-hidden"
          style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border)' }}
        >
          <div className="px-5 py-4 border-b" style={{ borderColor: 'var(--border)' }}>
            <h2 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
              Sessions ({sessions.length})
            </h2>
          </div>
          <div className="divide-y" style={{ borderColor: 'var(--border)' }}>
            {sessions.map((s) => {
              const project = projects.find((p) => p.id === s.projectId)
              return (
                <div key={s.id} className="flex items-center gap-3 px-5 py-3 text-sm">
                  <div className="w-2 h-2 rounded-full shrink-0" style={{ background: project?.color ?? '#666' }} />
                  <div className="flex-1 min-w-0">
                    <span className="font-medium" style={{ color: 'var(--text-primary)' }}>
                      {project?.name ?? 'Unknown'}
                    </span>
                    {s.title && (
                      <span className="ml-2 text-xs" style={{ color: 'var(--text-muted)' }}>
                        {s.title}
                      </span>
                    )}
                  </div>
                  <span className="text-xs shrink-0" style={{ color: 'var(--text-muted)' }}>
                    {format(new Date(s.startedAt), 'EEE d MMM, HH:mm')}
                  </span>
                  <span className="text-xs font-medium tabular-nums shrink-0" style={{ color: 'var(--text-primary)' }}>
                    {formatMs(s.duration ?? 0)}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
