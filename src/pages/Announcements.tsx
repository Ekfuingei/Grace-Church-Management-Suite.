import { PageHeader } from '@/components/shared/PageHeader'
import { EmptyState } from '@/components/shared/EmptyState'
import { Megaphone } from 'lucide-react'

export function Announcements() {
  return (
    <div className="space-y-8 animate-fade-in">
      <PageHeader
        title="Church Announcement Board"
        subtitle="Manage and display announcements"
      />
      <EmptyState
        icon={Megaphone}
        title="Announcement Board"
        description="Build Module 5: CRUD, scheduling, fullscreen display mode."
      />
    </div>
  )
}
