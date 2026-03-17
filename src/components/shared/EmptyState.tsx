import type { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description?: string
  action?: ReactNode
  className?: string
}

export function EmptyState({ icon: Icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border-subtle bg-surface-secondary/30 py-12 sm:py-20 px-4 sm:px-8 text-center',
        className
      )}
    >
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-accent/5">
        <Icon className="h-8 w-8 text-accent" strokeWidth={1.5} />
      </div>
      <h3 className="mt-4 sm:mt-6 font-display text-lg sm:text-xl font-semibold text-foreground">{title}</h3>
      {description && (
        <p className="mt-3 max-w-sm text-sm leading-relaxed text-muted">{description}</p>
      )}
      {action && <div className="mt-8">{action}</div>}
    </div>
  )
}
