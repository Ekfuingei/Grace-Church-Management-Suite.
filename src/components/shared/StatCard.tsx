import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface StatCardProps {
  title: string
  value: string | number
  subtitle?: string
  icon?: LucideIcon
  trend?: 'up' | 'down' | 'neutral'
  className?: string
}

export function StatCard({ title, value, subtitle, icon: Icon, trend, className }: StatCardProps) {
  return (
    <div
      className={cn(
        'group relative overflow-hidden rounded-2xl border border-border-subtle bg-surface p-4 sm:p-6 shadow-card transition-all duration-250 hover:shadow-card-hover hover:border-border min-w-0',
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[13px] font-medium uppercase tracking-wider text-muted">{title}</p>
          <p className="mt-2 sm:mt-3 font-display text-xl sm:text-2xl font-semibold tracking-tight text-foreground">
            {value}
          </p>
          {subtitle && (
            <p className="mt-1.5 text-sm text-muted">{subtitle}</p>
          )}
        </div>
        {Icon && (
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent/10 text-accent transition-colors group-hover:bg-accent/15">
            <Icon className="h-6 w-6" strokeWidth={1.5} />
          </div>
        )}
      </div>
      {trend && (
        <div className="mt-3 flex items-center gap-1">
          {trend === 'up' && (
            <span className="inline-flex items-center rounded-full bg-success-muted px-2 py-0.5 text-xs font-medium text-success">
              ↑ Trend up
            </span>
          )}
          {trend === 'down' && (
            <span className="inline-flex items-center rounded-full bg-danger-muted px-2 py-0.5 text-xs font-medium text-danger">
              ↓ Trend down
            </span>
          )}
        </div>
      )}
    </div>
  )
}
