import { ipcMain, dialog } from 'electron'
import { getSessions, getTotalMsByProject, getDailyTotals } from '../db/queries/sessions'
import { getAllProjects } from '../db/queries/projects'
import type { DailyReport, WeeklyReport, ProjectStat, DayStat, ReportFilters } from '../../shared/types'
import { writeFileSync } from 'fs'
import { format } from 'date-fns'

function buildProjectStats(
  totals: Array<{ projectId: string; totalMs: number }>,
  projects: Array<{ id: string; name: string; color: string }>
): ProjectStat[] {
  const grandTotal = totals.reduce((s, t) => s + t.totalMs, 0)
  return totals.map((t) => {
    const project = projects.find((p) => p.id === t.projectId)
    return {
      projectId: t.projectId,
      projectName: project?.name ?? 'Unknown',
      color: project?.color ?? '#6366F1',
      totalMs: t.totalMs,
      percentage: grandTotal > 0 ? Math.round((t.totalMs / grandTotal) * 100) : 0
    }
  })
}

export function registerReportHandlers(): void {
  ipcMain.handle('reports:getDaily', (_event, date: string): DailyReport => {
    const start = new Date(date)
    start.setHours(0, 0, 0, 0)
    const end = new Date(date)
    end.setHours(23, 59, 59, 999)

    const projects = getAllProjects(true)
    const totals = getTotalMsByProject(start.getTime(), end.getTime())
    const sessions = getSessions({ startDate: start.getTime(), endDate: end.getTime() })
    const byProject = buildProjectStats(totals, projects)
    const totalMs = totals.reduce((s, t) => s + t.totalMs, 0)

    return { date, totalMs, byProject, sessions }
  })

  ipcMain.handle('reports:getWeekly', (_event, startDate: string): WeeklyReport => {
    const start = new Date(startDate)
    start.setHours(0, 0, 0, 0)
    const end = new Date(startDate)
    end.setDate(end.getDate() + 6)
    end.setHours(23, 59, 59, 999)

    const projects = getAllProjects(true)
    const totals = getTotalMsByProject(start.getTime(), end.getTime())
    const dailyTotals = getDailyTotals(start.getTime(), end.getTime())

    const byProject = buildProjectStats(totals, projects)
    const totalMs = totals.reduce((s, t) => s + t.totalMs, 0)

    // Group daily totals by date
    const dayMap = new Map<string, DayStat>()
    for (const daily of dailyTotals) {
      if (!dayMap.has(daily.date)) {
        dayMap.set(daily.date, { date: daily.date, totalMs: 0, byProject: [] })
      }
      const day = dayMap.get(daily.date)!
      day.totalMs += daily.totalMs
    }

    // Fill missing days
    const byDay: DayStat[] = []
    for (let i = 0; i < 7; i++) {
      const d = new Date(start)
      d.setDate(d.getDate() + i)
      const dateStr = format(d, 'yyyy-MM-dd')
      byDay.push(
        dayMap.get(dateStr) ?? { date: dateStr, totalMs: 0, byProject: [] }
      )
    }

    return {
      startDate: format(start, 'yyyy-MM-dd'),
      endDate: format(end, 'yyyy-MM-dd'),
      totalMs,
      byProject,
      byDay
    }
  })

  ipcMain.handle('reports:exportCSV', async (_event, filters: ReportFilters): Promise<string | null> => {
    const sessions = getSessions({
      startDate: filters.startDate,
      endDate: filters.endDate,
      projectId: filters.projectId
    })
    const projects = getAllProjects(true)
    const projectMap = new Map(projects.map((p) => [p.id, p]))

    const header = 'Date,Start Time,End Time,Duration (min),Project,Source,Notes'
    const rows = sessions.map((s) => {
      const project = projectMap.get(s.projectId)
      const startDate = format(new Date(s.startedAt), 'yyyy-MM-dd')
      const startTime = format(new Date(s.startedAt), 'HH:mm:ss')
      const endTime = s.endedAt ? format(new Date(s.endedAt), 'HH:mm:ss') : ''
      const durationMins = s.duration ? Math.round(s.duration / 60000) : ''
      const notes = (s.notes ?? '').replace(/,/g, ';')
      return `${startDate},${startTime},${endTime},${durationMins},${project?.name ?? 'Unknown'},${s.source},${notes}`
    })

    const csv = [header, ...rows].join('\n')

    const result = await dialog.showSaveDialog({
      defaultPath: `time-tracker-export-${format(new Date(), 'yyyy-MM-dd')}.csv`,
      filters: [{ name: 'CSV Files', extensions: ['csv'] }]
    })

    if (!result.filePath) return null

    writeFileSync(result.filePath, csv, 'utf-8')
    return result.filePath
  })
}
