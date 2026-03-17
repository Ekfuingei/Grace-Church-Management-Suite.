import { Outlet } from 'react-router-dom'
import { LogOut } from 'lucide-react'
import { Sidebar } from './Sidebar'
import { BottomNav } from './BottomNav'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/contexts/AuthContext'

export function AppLayout() {
  const { user, signOut, isDemoMode } = useAuth()
  const today = new Date().toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  return (
    <div className="flex min-h-screen min-h-[100dvh] flex-col bg-background">
      <div className="flex flex-1 min-w-0">
        <Sidebar />
        <main className="flex-1 min-w-0 pb-24 lg:pb-0 overflow-x-hidden">
          <header className="sticky top-0 z-30 flex h-14 sm:h-16 items-center justify-between gap-2 border-b border-border-subtle bg-surface/95 px-3 sm:px-4 lg:px-8 backdrop-blur-sm">
            <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-4">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-xs sm:text-sm font-medium text-foreground truncate">{today}</p>
                  {isDemoMode && (
                    <span className="rounded-full bg-accent/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-accent">
                      Demo
                    </span>
                  )}
                </div>
                <p className="text-[11px] sm:text-xs text-muted truncate">{user?.email ?? 'Admin'}</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => signOut()}
              title="Sign out"
              className="rounded-xl text-muted hover:bg-surface-secondary hover:text-foreground"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </header>
          <div className="p-3 sm:p-4 lg:p-8 max-w-full">
            <Outlet />
          </div>
        </main>
      </div>
      <BottomNav />
    </div>
  )
}
