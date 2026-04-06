export interface Project {
  id: string
  name: string
  color: string
  icon: string | null
  isArchived: boolean
  createdAt: number
  updatedAt: number
}

export interface Session {
  id: string
  projectId: string
  source: 'manual' | 'auto' | 'focus'
  appName: string | null
  windowTitle: string | null
  startedAt: number
  endedAt: number | null
  duration: number | null
  notes: string | null
}

export interface FocusSession {
  id: string
  sessionId: string | null
  projectId: string
  goal: string | null
  durationTarget: number
  durationActual: number | null
  completed: boolean
  startedAt: number
  endedAt: number | null
}

export interface AppRule {
  id: string
  appName: string
  projectId: string
  createdAt: number
}

export interface FocusState {
  active: boolean
  focusSession: FocusSession | null
  remaining: number
  elapsed: number
}

export interface TimerState {
  active: boolean
  session: Session | null
  elapsed: number
}

export interface DailyReport {
  date: string
  totalMs: number
  byProject: ProjectStat[]
  sessions: Session[]
}

export interface WeeklyReport {
  startDate: string
  endDate: string
  totalMs: number
  byProject: ProjectStat[]
  byDay: DayStat[]
}

export interface ProjectStat {
  projectId: string
  projectName: string
  color: string
  totalMs: number
  percentage: number
}

export interface DayStat {
  date: string
  totalMs: number
  byProject: ProjectStat[]
}

export interface CreateProjectData {
  name: string
  color: string
  icon?: string | null
}

export interface UpdateProjectData {
  name?: string
  color?: string
  icon?: string | null
  isArchived?: boolean
}

export interface CreateSessionData {
  projectId: string
  source?: 'manual' | 'auto' | 'focus'
  appName?: string | null
  windowTitle?: string | null
}

export interface UpdateSessionData {
  notes?: string | null
  projectId?: string
  startedAt?: number
  endedAt?: number | null
}

export interface StartFocusConfig {
  projectId: string
  durationMs: number
  goal?: string | null
}

export interface SessionFilters {
  projectId?: string
  startDate?: number
  endDate?: number
  source?: string
  limit?: number
  offset?: number
}

export interface ReportFilters {
  startDate: number
  endDate: number
  projectId?: string
}
