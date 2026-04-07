import { NavLink } from 'react-router-dom'
import { LayoutDashboard, FolderKanban, BarChart2, Zap, Settings, Users } from 'lucide-react'
import { cn } from '../../lib/utils'

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/projects', icon: FolderKanban, label: 'Projects' },
  { to: '/clients', icon: Users, label: 'Clients' },
  { to: '/reports', icon: BarChart2, label: 'Reports' },
  { to: '/focus', icon: Zap, label: 'Focus' }
]

export default function Sidebar(): JSX.Element {
  return (
    <div
      className="flex flex-col w-52 shrink-0 border-r"
      style={{
        background: 'var(--bg-secondary)',
        borderColor: 'var(--border)',
        paddingTop: '44px' // leave room for macOS traffic lights
      }}
    >
      {/* Logo */}
      <div className="px-4 pb-6 pt-2">
        <div className="flex items-center gap-2">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-sm font-bold"
            style={{ background: 'var(--accent)' }}
          >
            T
          </div>
          <span className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
            Time Tracker
          </span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 space-y-0.5">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                isActive
                  ? 'text-accent'
                  : 'hover:bg-hover'
              )
            }
            style={({ isActive }) => ({
              color: isActive ? 'var(--accent)' : 'var(--text-secondary)',
              background: isActive ? 'var(--accent-dim)' : undefined
            })}
          >
            <Icon size={16} />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Settings at bottom */}
      <div className="px-2 pb-4">
        <NavLink
          to="/settings"
          className={({ isActive }) =>
            cn(
              'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
              isActive ? '' : 'hover:bg-hover'
            )
          }
          style={({ isActive }) => ({
            color: isActive ? 'var(--accent)' : 'var(--text-secondary)',
            background: isActive ? 'var(--accent-dim)' : undefined
          })}
        >
          <Settings size={16} />
          Settings
        </NavLink>
      </div>
    </div>
  )
}
