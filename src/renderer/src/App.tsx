import { useEffect } from 'react'
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import AppShell from './components/layout/AppShell'
import Dashboard from './pages/Dashboard'
import Projects from './pages/Projects'
import Clients from './pages/Clients'
import Reports from './pages/Reports'
import Focus from './pages/Focus'
import Settings from './pages/Settings'
import { useAppStore } from './store'
import api from './lib/api'

export default function App(): JSX.Element {
  const { setTimerState, updateElapsed, setFocusState, updateFocusRemaining, setProjects, setClients, addToast, setSettings } = useAppStore()

  useEffect(() => {
    // Load initial state
    async function init(): Promise<void> {
      const [timerState, focusState, projects, clients, settings] = await Promise.all([
        api.getTimerState(),
        api.getFocusState(),
        api.getProjects(),
        api.getClients(),
        api.getAllSettings()
      ])
      setTimerState(timerState)
      setFocusState(focusState)
      setProjects(projects)
      setClients(clients)
      setSettings(settings)
    }
    init()

    // Subscribe to timer events
    const unsubTick = api.onTimerTick(({ elapsed, session }) => {
      updateElapsed(elapsed, session)
    })
    const unsubStarted = api.onTimerStarted(({ session, elapsed }) => {
      updateElapsed(elapsed, session)
    })
    const unsubStopped = api.onTimerStopped(() => {
      setTimerState({ active: false, session: null, elapsed: 0 })
    })

    // Subscribe to focus events
    const unsubFocusTick = api.onFocusTick(({ remaining, elapsed, focusSession }) => {
      updateFocusRemaining(remaining, elapsed, focusSession)
    })
    const unsubFocusStarted = api.onFocusStarted(({ focusSession }) => {
      updateFocusRemaining(focusSession.durationTarget, 0, focusSession)
    })
    const unsubFocusCompleted = api.onFocusCompleted(() => {
      setFocusState({ active: false, focusSession: null, remaining: 0, elapsed: 0 })
      addToast({ message: 'Focus session complete! Great work.', type: 'success' })
    })
    const unsubFocusCancelled = api.onFocusCancelled(() => {
      setFocusState({ active: false, focusSession: null, remaining: 0, elapsed: 0 })
    })

    // Auto-detect unknown app toast
    const unsubUnknown = api.onAutoDetectUnknownApp(({ appName }) => {
      addToast({
        message: `Detected: ${appName}`,
        type: 'info',
        appName
      })
    })

    return () => {
      unsubTick()
      unsubStarted()
      unsubStopped()
      unsubFocusTick()
      unsubFocusStarted()
      unsubFocusCompleted()
      unsubFocusCancelled()
      unsubUnknown()
    }
  }, [])

  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<AppShell />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="projects" element={<Projects />} />
          <Route path="clients" element={<Clients />} />
          <Route path="reports" element={<Reports />} />
          <Route path="focus" element={<Focus />} />
          <Route path="settings" element={<Settings />} />
        </Route>
      </Routes>
    </HashRouter>
  )
}
