import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  Tv,
  Banknote,
  Users,
  UserCircle,
  Calendar,
  Megaphone,
  Heart,
  CalendarClock,
  Settings,
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { cn } from '@/lib/utils'

const allNavItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/members', icon: UserCircle, label: 'Members' },
  { to: '/media', icon: Tv, label: 'Media Prompter' },
  { to: '/tithe', icon: Banknote, label: 'Tithe & Offering' },
  { to: '/attendance', icon: Users, label: 'Attendance' },
  { to: '/rota', icon: Calendar, label: 'Volunteer Rota' },
  { to: '/announcements', icon: Megaphone, label: 'Announcements' },
  { to: '/evangelism', icon: Heart, label: 'Evangelism' },
  { to: '/counselling', icon: CalendarClock, label: 'Counselling' },
  { to: '/settings', icon: Settings, label: 'Settings' },
]

export function Sidebar() {
  const { role } = useAuth()
  const isMediaOperator = role === 'media'
  const navItems = isMediaOperator
    ? allNavItems.filter((item) => item.to === '/media')
    : allNavItems

  return (
    <aside className="hidden w-[260px] shrink-0 flex-col border-r border-border-subtle bg-surface lg:flex">
      {/* Brand */}
      <div className="flex h-[72px] items-center gap-3 border-b border-border-subtle px-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10">
          <span className="font-display text-lg font-semibold text-accent">✝</span>
        </div>
        <div>
          <span className="font-display text-lg font-semibold tracking-tight text-foreground">
            Grace Church
          </span>
          <p className="text-[11px] text-muted">
            {isMediaOperator ? 'Media Prompter' : 'Management Suite'}
          </p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-0.5 p-4">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200',
                isActive
                  ? 'bg-accent/10 text-accent shadow-sm'
                  : 'text-muted hover:bg-surface-secondary hover:text-foreground'
              )
            }
          >
            <span
              className={cn(
                'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg',
                'text-current'
              )}
            >
              <Icon className="h-[18px] w-[18px]" strokeWidth={1.75} />
            </span>
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Footer accent */}
      <div className="border-t border-border-subtle p-4">
        <div className="rounded-xl bg-background-deep/80 px-3 py-2.5">
          <p className="text-xs font-medium text-foreground">
            {isMediaOperator ? 'Media Operator' : 'Church Admin'}
          </p>
          <p className="text-[11px] text-muted">
            {isMediaOperator ? 'Media Prompter only' : 'Full access'}
          </p>
        </div>
      </div>
    </aside>
  )
}
