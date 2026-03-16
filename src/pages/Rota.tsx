import { PageHeader } from '@/components/shared/PageHeader'
import { EmptyState } from '@/components/shared/EmptyState'
import { Calendar } from 'lucide-react'

export function Rota() {
  return (
    <div className="space-y-8 animate-fade-in">
      <PageHeader
        title="Volunteer Rota Manager"
        subtitle="Schedule volunteers across departments"
      />
      <EmptyState
        icon={Calendar}
        title="Volunteer Rota"
        description="Build Module 4: Department management, rota builder, conflict detection."
      />
    </div>
  )
}
