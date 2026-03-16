/**
 * Demo mode — use when deploying without Supabase Auth.
 * Credentials are for demo only. Do NOT use in production with real data.
 */

const DEMO_STORAGE_KEY = 'grace-church-demo-session'

export type DemoRole = 'admin' | 'media'

export const DEMO_CREDENTIALS = {
  admin: {
    email: 'admin@demo.gracechurch.org',
    password: 'demo123',
  },
  media: {
    email: 'media@demo.gracechurch.org',
    password: 'demo123',
  },
} as const

export interface DemoUser {
  id: string
  email: string
  role: DemoRole
}

export function getDemoSession(): DemoUser | null {
  try {
    const stored = localStorage.getItem(DEMO_STORAGE_KEY)
    if (!stored) return null
    return JSON.parse(stored) as DemoUser
  } catch {
    return null
  }
}

export function setDemoSession(user: DemoUser): void {
  localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(user))
}

export function clearDemoSession(): void {
  localStorage.removeItem(DEMO_STORAGE_KEY)
}

export function getDemoUserByCredentials(email: string, password: string): DemoUser | null {
  if (email === DEMO_CREDENTIALS.admin.email && password === DEMO_CREDENTIALS.admin.password) {
    return { id: 'demo-admin-001', email: DEMO_CREDENTIALS.admin.email, role: 'admin' }
  }
  if (email === DEMO_CREDENTIALS.media.email && password === DEMO_CREDENTIALS.media.password) {
    return { id: 'demo-media-001', email: DEMO_CREDENTIALS.media.email, role: 'media' }
  }
  return null
}
