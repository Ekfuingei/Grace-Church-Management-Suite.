import { PageHeader } from '@/components/shared/PageHeader'
import { EmptyState } from '@/components/shared/EmptyState'
import { Banknote } from 'lucide-react'

export function Tithe() {
  return (
    <div className="space-y-8 animate-fade-in">
      <PageHeader
        title="Tithe & Offering Recorder"
        subtitle="Record giving and generate PDF statements"
      />
      <EmptyState
        icon={Banknote}
        title="Tithe & Offering"
        description="Build Module 2: Recording form, member giving history, PDF download. Priority #2."
      />
    </div>
  )
}
