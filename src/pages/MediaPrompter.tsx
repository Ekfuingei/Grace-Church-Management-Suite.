import { PageHeader } from '@/components/shared/PageHeader'
import { EmptyState } from '@/components/shared/EmptyState'
import { Tv } from 'lucide-react'

export function MediaPrompter() {
  return (
    <div className="space-y-8 animate-fade-in">
      <PageHeader
        title="Media Prompter"
        subtitle="Voice scripture & hymns for projection"
      />
      <EmptyState
        icon={Tv}
        title="Media Prompter"
        description="Integrate existing build. Add recently used, favourites, font size controls, and service setlist."
      />
    </div>
  )
}
