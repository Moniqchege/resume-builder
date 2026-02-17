import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuthStore } from '@store/authStore'
import { cn } from '@lib/utils'
import { LayoutDashboard, Sparkles, Target, LogOut, Menu } from 'lucide-react'

const NAV = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/resume-builder', icon: Sparkles, label: 'Builder' },
  { to: '/ats-analyzer', icon: Target, label: 'ATS Analyzer' },
]

export default function Sidebar() {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()
  const [isOpen, setIsOpen] = useState(false)

  const handleNavClick = (to: string) => {
    navigate(to)
    setIsOpen(false) // auto-close on mobile/tablet
  }

  return (
    <>
      {/* Hamburger Menu (visible only on small screens) */}
      <button
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-space-bg/90 rounded-md shadow-md"
        onClick={() => setIsOpen(prev => !prev)}
      >
        <Menu size={24} />
      </button>

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed top-0 left-0 h-full w-[220px] bg-space-bg/95 border-r border-space-border backdrop-blur-xl flex flex-col px-3 z-40 transform transition-transform duration-300",
          "lg:translate-x-0", // always visible on large screens
          isOpen ? "translate-x-0" : "-translate-x-full", // toggle on mobile
        )}
      >
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
            <button
              key={to}
              onClick={() => handleNavClick(to)}
              className="nav-item flex items-center gap-2 w-full px-2 py-2 rounded hover:bg-space-surface transition-colors"
            >
              <Icon size={17} />
              <span>{label}</span>
            </button>
          ))}
        </nav>

        {/* User */}
        <div className="px-1 py-4 border-t border-space-border mt-auto">
          <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-space-surface/50 border border-space-border">
            <div className="w-8 h-8 rounded-full bg-grad-cyan flex items-center justify-center text-xs font-bold text-space-bg shrink-0">
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

      {/* Overlay for mobile when sidebar is open */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-30 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  )
}
