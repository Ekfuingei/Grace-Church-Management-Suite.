import { useState } from 'react'
import { useNavigate, Navigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { DEMO_CREDENTIALS } from '@/lib/demo-auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export function Login() {
  const { user, signIn, isDemoMode, role } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  if (user) return <Navigate to={role === 'media' ? '/media' : '/'} replace />

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    const { error: signInError } = await signIn(email, password)
    setLoading(false)
    if (signInError) {
      setError(signInError.message)
      return
    }
    // Media Operator goes straight to Media Prompter
    const isMedia = email === DEMO_CREDENTIALS.media.email
    navigate(isMedia ? '/media' : '/')
  }

  return (
    <div className="relative flex min-h-screen min-h-[100dvh] items-center justify-center overflow-hidden bg-login bg-pattern p-3 sm:p-4">
      {/* Decorative cross / accent */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-[0.03]">
        <svg width="320" height="320" viewBox="0 0 24 24" fill="currentColor" className="text-foreground">
          <path d="M12 2L12 22M2 12L22 12" stroke="currentColor" strokeWidth="0.5" fill="none" />
          <circle cx="12" cy="12" r="2" fill="currentColor" />
        </svg>
      </div>

      <div className="relative w-full max-w-[420px] min-w-0 animate-fade-in">
        {/* Brand header */}
        <div className="mb-10 text-center">
          <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-accent/10">
            <span className="font-display text-2xl font-semibold text-accent">✝</span>
          </div>
          <h1 className="font-display text-display-md font-semibold tracking-tight text-foreground">
            Grace Church
          </h1>
          <p className="mt-2 text-sm text-muted">
            Management Suite
          </p>
        </div>

        {/* Login card */}
        <div className="overflow-hidden rounded-2xl border border-border-subtle bg-surface shadow-soft-lg">
          <div className="border-b border-border-subtle bg-surface-secondary/50 px-4 sm:px-8 py-5 sm:py-6">
            <h2 className="font-display text-lg font-medium text-foreground">Sign in</h2>
            <p className="mt-1 text-sm text-muted">
            {isDemoMode
              ? 'Demo mode — use the credentials below'
              : 'Enter your credentials to continue'}
          </p>
          </div>
          <form onSubmit={handleSubmit} className="p-4 sm:p-8">
            <div className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-foreground-muted">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder={isDemoMode ? DEMO_CREDENTIALS.admin.email : 'admin@gracechurch.org'}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-11"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-foreground-muted">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-11"
                  required
                />
              </div>
            </div>
            {error && (
              <p className="mt-4 rounded-lg bg-danger-muted px-4 py-3 text-sm text-danger">
                {error}
              </p>
            )}
            <Button
              type="submit"
              className="mt-6 h-11 w-full text-base font-medium"
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Signing in...
                </span>
              ) : (
                'Sign in'
              )}
            </Button>
          </form>
        </div>

        {isDemoMode && (
          <div className="mt-6 rounded-xl border border-accent/20 bg-accent/5 px-3 sm:px-4 py-3 overflow-x-auto">
            <p className="text-center text-sm font-medium text-accent">Demo credentials</p>
            <div className="mt-3 space-y-2 text-sm">
              <div className="rounded-lg bg-surface/50 px-3 py-2 min-w-0">
                <p className="font-medium text-foreground">Admin (full access)</p>
                <p className="text-muted text-xs sm:text-sm break-all">
                  <code className="rounded px-1 font-mono text-[10px] sm:text-xs">{DEMO_CREDENTIALS.admin.email}</code> / <code className="rounded px-1 font-mono text-[10px] sm:text-xs">{DEMO_CREDENTIALS.admin.password}</code>
                </p>
              </div>
              <div className="rounded-lg bg-surface/50 px-3 py-2 min-w-0">
                <p className="font-medium text-foreground">Media Operator (Media Prompter only)</p>
                <p className="text-muted text-xs sm:text-sm break-all">
                  <code className="rounded px-1 font-mono text-[10px] sm:text-xs">{DEMO_CREDENTIALS.media.email}</code> / <code className="rounded px-1 font-mono text-[10px] sm:text-xs">{DEMO_CREDENTIALS.media.password}</code>
                </p>
              </div>
            </div>
          </div>
        )}
        <p className="mt-8 text-center text-xs text-muted-light">
          {isDemoMode ? 'Demo mode — no database required' : 'Secure access for church administrators'}
        </p>
      </div>
    </div>
  )
}
