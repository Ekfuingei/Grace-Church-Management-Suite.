import { cn } from '@/lib/utils'

const statusColors: Record<string, string> = {
  Present: 'bg-success-muted text-success',
  Absent: 'bg-surface-secondary text-muted',
  Excused: 'bg-accent/10 text-accent',
  'First Timer': 'bg-accent/10 text-accent',
  Pending: 'bg-surface-secondary text-muted',
  Confirmed: 'bg-success-muted text-success',
  Declined: 'bg-danger-muted text-danger',
  Served: 'bg-success-muted text-success',
  Visitor: 'bg-accent/10 text-accent',
  Regular: 'bg-success-muted text-success',
  Member: 'bg-success-muted text-success',
  Inactive: 'bg-surface-secondary text-muted',
  Transferred: 'bg-surface-secondary text-muted',
}

interface StatusBadgeProps {
  status: string
  className?: string
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const colorClass = statusColors[status] ?? 'bg-surface-secondary text-muted'
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-lg px-2.5 py-1 text-xs font-medium',
        colorClass,
        className
      )}
    >
      {status}
    </span>
  )
}
