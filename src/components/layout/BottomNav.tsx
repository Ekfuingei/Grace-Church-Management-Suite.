import { NavLink } from 'react-router-dom'
import { LayoutDashboard, Tv, Banknote, Users, Settings } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { cn } from '@/lib/utils'

const allNavItems = [
  { to: '/', icon: LayoutDashboard, label: 'Home' },
  { to: '/media', icon: Tv, label: 'Media' },
  { to: '/tithe', icon: Banknote, label: 'Tithe' },
  { to: '/attendance', icon: Users, label: 'Attendance' },
  { to: '/settings', icon: Settings, label: 'Settings' },
]

export function BottomNav() {
  const { role } = useAuth()
  const isMediaOperator = role === 'media'
  const navItems = isMediaOperator
    ? allNavItems.filter((item) => item.to === '/media')
    : allNavItems

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-border-subtle bg-surface/95 px-2 pb-safe pt-2 backdrop-blur-sm lg:hidden">
      <div className="flex items-center justify-around rounded-2xl bg-surface-secondary/50 py-2">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              cn(
                'flex flex-col items-center gap-1 rounded-xl px-5 py-2 text-xs font-medium transition-all duration-200',
                isActive
                  ? 'bg-accent/10 text-accent'
                  : 'text-muted hover:text-foreground'
              )
            }
          >
            <Icon className="h-5 w-5" strokeWidth={1.75} />
            {label}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
