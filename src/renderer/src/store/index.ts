import { create } from 'zustand'
import type { Session, FocusSession, Project, Client, TimerState, FocusState } from '../../../shared/types'

interface Toast {
  id: string
  message: string
  type: 'info' | 'success' | 'warning' | 'error'
  appName?: string
  onAssign?: (projectId: string) => void
}

interface AppState {
  // Timer
  timerState: TimerState
  setTimerState: (state: TimerState) => void
  updateElapsed: (elapsed: number, session: Session) => void

  // Focus
  focusState: FocusState
  setFocusState: (state: FocusState) => void
  updateFocusRemaining: (remaining: number, elapsed: number, focusSession: FocusSession) => void

  // Projects cache
  projects: Project[]
  setProjects: (projects: Project[]) => void

  // Clients cache
  clients: Client[]
  setClients: (clients: Client[]) => void

  // Toasts
  toasts: Toast[]
  addToast: (toast: Omit<Toast, 'id'>) => void
  removeToast: (id: string) => void

  // Settings cache
  settings: Record<string, string>
  setSettings: (settings: Record<string, string>) => void
  updateSetting: (key: string, value: string) => void
}

export const useAppStore = create<AppState>((set) => ({
  timerState: { active: false, session: null, elapsed: 0 },
  setTimerState: (state) => set({ timerState: state }),
  updateElapsed: (elapsed, session) =>
    set((s) => ({ timerState: { ...s.timerState, active: true, elapsed, session } })),

  focusState: { active: false, focusSession: null, remaining: 0, elapsed: 0 },
  setFocusState: (state) => set({ focusState: state }),
  updateFocusRemaining: (remaining, elapsed, focusSession) =>
    set({ focusState: { active: true, focusSession, remaining, elapsed } }),

  projects: [],
  setProjects: (projects) => set({ projects }),

  clients: [],
  setClients: (clients) => set({ clients }),

  toasts: [],
  addToast: (toast) => {
    const id = Math.random().toString(36).slice(2)
    set((s) => ({ toasts: [...s.toasts, { ...toast, id }] }))
    setTimeout(() => {
      set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }))
    }, 5000)
  },
  removeToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),

  settings: {},
  setSettings: (settings) => set({ settings }),
  updateSetting: (key, value) =>
    set((s) => ({ settings: { ...s.settings, [key]: value } }))
}))
