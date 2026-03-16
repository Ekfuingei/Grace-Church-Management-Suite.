import { PageHeader } from '@/components/shared/PageHeader'
import { EmptyState } from '@/components/shared/EmptyState'
import { CalendarClock } from 'lucide-react'

export function Counselling() {
  return (
    <div className="space-y-8 animate-fade-in">
      <PageHeader
        title="Counselling Appointment Scheduler"
        subtitle="Manage pastoral appointments and session notes"
      />
      <EmptyState
        icon={CalendarClock}
        title="Counselling Scheduler"
        description="Build Module 7: Appointment calendar, session notes, cases."
      />
    </div>
  )
}
