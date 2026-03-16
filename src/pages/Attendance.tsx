import { PageHeader } from '@/components/shared/PageHeader'
import { EmptyState } from '@/components/shared/EmptyState'
import { Users } from 'lucide-react'

export function Attendance() {
  return (
    <div className="space-y-8 animate-fade-in">
      <PageHeader
        title="Attendance Tracker"
        subtitle="Track service attendance and first-timers"
      />
      <EmptyState
        icon={Users}
        title="Attendance Tracker"
        description="Build Module 3: Service creation, mark attendance, first-timer capture."
      />
    </div>
  )
}
