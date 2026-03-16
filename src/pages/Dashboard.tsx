import { Tv, Banknote, Users, Calendar, Megaphone, Heart, CalendarClock } from 'lucide-react'
import { PageHeader } from '@/components/shared/PageHeader'
import { StatCard } from '@/components/shared/StatCard'

export function Dashboard() {
  const greeting = (() => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good morning'
    if (hour < 18) return 'Good afternoon'
    return 'Good evening'
  })()

  return (
    <div className="space-y-10 animate-fade-in">
      <div>
        <PageHeader
          title="Dashboard"
          subtitle="Overview of church operations"
        />
        <p className="mt-2 text-muted">
          {greeting}. Here&apos;s a snapshot of your church activities.
        </p>
      </div>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        <StatCard
          title="Media Prompter"
          value="—"
          subtitle="Last scripture/hymn"
          icon={Tv}
        />
        <StatCard
          title="Tithe & Offering"
          value="—"
          subtitle="This month"
          icon={Banknote}
        />
        <StatCard
          title="Attendance"
          value="—"
          subtitle="Last Sunday"
          icon={Users}
        />
        <StatCard
          title="Volunteer Rota"
          value="—"
          subtitle="Unconfirmed this week"
          icon={Calendar}
        />
        <StatCard
          title="Announcements"
          value="—"
          subtitle="Active"
          icon={Megaphone}
        />
        <StatCard
          title="Evangelism"
          value="—"
          subtitle="Awaiting follow-up"
          icon={Heart}
        />
        <StatCard
          title="Counselling"
          value="—"
          subtitle="This week"
          icon={CalendarClock}
        />
      </div>
    </div>
  )
}
