import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import TopBar from './TopBar'
import ToastContainer from '../ui/ToastContainer'
import { useAppStore } from '../../store'
import FocusOverlay from '../focus/FocusOverlay'

export default function AppShell(): JSX.Element {
  const focusState = useAppStore((s) => s.focusState)

  return (
    <div className="flex h-full w-full overflow-hidden" style={{ background: 'var(--bg-primary)' }}>
      {/* macOS traffic light spacing */}
      <Sidebar />
      <div className="flex flex-col flex-1 min-w-0">
        <TopBar />
        <main className="flex-1 overflow-auto p-6">
          <Outlet />
        </main>
      </div>
      <ToastContainer />
      {focusState.active && <FocusOverlay />}
    </div>
  )
}
