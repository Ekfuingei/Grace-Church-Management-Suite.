import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { User, Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import {
  getDemoSession,
  setDemoSession,
  clearDemoSession,
  getDemoUserByCredentials,
  type DemoRole,
} from '@/lib/demo-auth'

const isSupabaseConfigured = () => {
  const url = import.meta.env.VITE_SUPABASE_URL ?? ''
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY ?? ''
  return Boolean(url && key)
}

/** Create Supabase User shape from demo user */
function createDemoUser(id: string, email: string, role: DemoRole): User {
  return {
    id,
    email,
    app_metadata: { role },
    user_metadata: { role },
    aud: 'authenticated',
    created_at: new Date().toISOString(),
  } as User
}

interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  role: DemoRole | 'admin' | null
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>
  signOut: () => Promise<void>
  isDemoMode: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [role, setRole] = useState<DemoRole | 'admin' | null>(null)
  const isDemoMode = !isSupabaseConfigured()

  useEffect(() => {
    // Always check demo session first (hardcoded fallback)
    const demoUser = getDemoSession()
    if (demoUser) {
      const u = createDemoUser(demoUser.id, demoUser.email, demoUser.role)
      setUser(u)
      setSession({ user: u } as Session)
      setRole(demoUser.role)
      setLoading(false)
      return
    }

    if (isDemoMode) {
      setLoading(false)
      return
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      setRole(session?.user?.user_metadata?.role ?? 'admin')
      setLoading(false)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
      setRole(session?.user?.user_metadata?.role ?? 'admin')
    })

    return () => subscription.unsubscribe()
  }, [isDemoMode])

  const signIn = async (email: string, password: string) => {
    // Always try hardcoded demo credentials first
    const demoUser = getDemoUserByCredentials(email, password)
    if (demoUser) {
      setDemoSession(demoUser)
      const u = createDemoUser(demoUser.id, demoUser.email, demoUser.role)
      setUser(u)
      setSession({ user: u } as Session)
      setRole(demoUser.role)
      return { error: null }
    }

    if (isDemoMode) {
      return {
        error: new Error(
          'Invalid credentials. Admin: admin@demo.gracechurch.org | Media: media@demo.gracechurch.org (password: demo123)'
        ),
      }
    }

    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return { error: error as Error | null }
  }

  const signOut = async () => {
    const demoUser = getDemoSession()
    if (demoUser) {
      clearDemoSession()
      setUser(null)
      setSession(null)
      setRole(null)
      return
    }
    await supabase.auth.signOut()
  }

  return (
    <AuthContext.Provider value={{ user, session, loading, role, signIn, signOut, isDemoMode }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
