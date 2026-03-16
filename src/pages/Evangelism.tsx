import { PageHeader } from '@/components/shared/PageHeader'
import { EmptyState } from '@/components/shared/EmptyState'
import { Heart } from 'lucide-react'

export function Evangelism() {
  return (
    <div className="space-y-8 animate-fade-in">
      <PageHeader
        title="Evangelism & Follow-up Tracker"
        subtitle="Track outreach and new convert follow-up"
      />
      <EmptyState
        icon={Heart}
        title="Evangelism Tracker"
        description="Build Module 6: Contact pipeline, follow-up logging, reminders."
      />
    </div>
  )
}
