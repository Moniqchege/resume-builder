import { NavLink, useNavigate } from 'react-router-dom'
import { useAuthStore } from '@store/authStore'
import { cn } from '@lib/utils'
import { LayoutDashboard, Sparkles, Target, LogOut } from 'lucide-react'

const NAV = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/resume-builder',   icon: Sparkles,        label: 'Builder'   },
  { to: '/ats-analyzer',       icon: Target,          label: 'ATS Analyzer' },
]

export default function Sidebar() {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()

  return (
    <aside className="fixed left-0 top-0 bottom-0 w-[220px] z-50
                      bg-space-bg/95 border-r border-space-border
                      backdrop-blur-xl flex flex-col px-3">

      {/* Logo */}
      <div className="px-3 py-7 border-b border-space-border">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-grad-cyan flex items-center justify-center
                          text-space-bg font-bold text-lg glow-cyan shrink-0">
            ✦
          </div>
          <div>
            <p className="text-[15px] font-bold text-ink-primary leading-tight">ResumeAI</p>
            <p className="text-[9px] text-cyan font-mono tracking-[2px]">ATS PRO</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 pt-4 space-y-1">
        {NAV.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              cn('nav-item', isActive && 'active')
            }
          >
            {({ isActive }) => (
              <>
                <Icon size={17} />
                <span>{label}</span>
                {isActive && (
                  <span className="ml-auto w-1.5 h-1.5 rounded-full bg-cyan
                                   animate-pulse-dot glow-cyan" />
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* User */}
      <div className="px-1 py-4 border-t border-space-border">
        <div className="flex items-center gap-2.5 p-2.5 rounded-xl
                        bg-space-surface/50 border border-space-border">
          {/* Avatar */}
          <div className="w-8 h-8 rounded-full bg-grad-cyan flex items-center
                          justify-center text-xs font-bold text-space-bg shrink-0">
            {user?.name?.slice(0, 2).toUpperCase() ?? 'MS'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-bold text-ink-primary truncate">
              {user?.name ?? 'User'}
            </p>
            <p className="text-[10px] text-cyan font-mono">{user?.plan ?? 'FREE'}</p>
          </div>
          <button
            onClick={() => logout()}
            title="Logout"
            className="text-ink-dim hover:text-status-danger transition-colors p-1"
          >
            <LogOut size={14} />
          </button>
        </div>
      </div>
    </aside>
  )
}
