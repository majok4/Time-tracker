import type {
  Project,
  Client,
  Session,
  FocusSession,
  FocusState,
  TimerState,
  DailyReport,
  WeeklyReport,
  AppRule,
  CreateProjectData,
  UpdateProjectData,
  CreateClientData,
  UpdateClientData,
  CreateSessionData,
  UpdateSessionData,
  SessionFilters,
  StartFocusConfig,
  ReportFilters
} from '../../../shared/types'

const api = window.api as {
  getProjects: (includeArchived?: boolean) => Promise<Project[]>
  createProject: (data: CreateProjectData) => Promise<Project>
  updateProject: (id: string, data: UpdateProjectData) => Promise<Project>
  deleteProject: (id: string) => Promise<void>

  startSession: (data: CreateSessionData) => Promise<Session>
  stopSession: () => Promise<Session | null>
  getActiveSession: () => Promise<Session | null>
  getTimerState: () => Promise<TimerState>
  getSessions: (filters?: SessionFilters) => Promise<Session[]>
  updateSession: (id: string, data: UpdateSessionData) => Promise<Session>
  deleteSession: (id: string) => Promise<void>

  startFocus: (config: StartFocusConfig) => Promise<FocusSession>
  stopFocus: () => Promise<FocusSession | null>
  getFocusState: () => Promise<FocusState>

  getDailyReport: (date: string) => Promise<DailyReport>
  getWeeklyReport: (startDate: string) => Promise<WeeklyReport>
  exportCSV: (filters: ReportFilters) => Promise<string | null>

  getClients: () => Promise<Client[]>
  createClient: (data: CreateClientData) => Promise<Client>
  updateClient: (id: string, data: UpdateClientData) => Promise<Client>
  deleteClient: (id: string) => Promise<void>

  getSetting: (key: string) => Promise<string | null>
  setSetting: (key: string, value: string) => Promise<void>
  getAllSettings: () => Promise<Record<string, string>>
  setAutoDetect: (enabled: boolean) => Promise<void>
  isAutoDetectEnabled: () => Promise<boolean>
  getAppRules: () => Promise<AppRule[]>
  setAppRule: (appName: string, projectId: string) => Promise<AppRule>
  deleteAppRule: (appName: string) => Promise<void>

  onTimerTick: (cb: (data: { elapsed: number; session: Session }) => void) => () => void
  onTimerStarted: (cb: (data: { session: Session; elapsed: number }) => void) => () => void
  onTimerStopped: (cb: (data: { session: Session | null }) => void) => () => void
  onFocusTick: (
    cb: (data: { remaining: number; elapsed: number; focusSession: FocusSession }) => void
  ) => () => void
  onFocusStarted: (cb: (data: { focusSession: FocusSession }) => void) => () => void
  onFocusCompleted: (cb: (data: { focusSession: FocusSession }) => void) => () => void
  onFocusCancelled: (cb: (data: { focusSession: FocusSession }) => void) => () => void
  onAutoDetectAppChanged: (
    cb: (data: { appName: string; windowTitle: string | null }) => void
  ) => () => void
  onAutoDetectUnknownApp: (
    cb: (data: { appName: string; windowTitle: string | null }) => void
  ) => () => void
}

export default api
