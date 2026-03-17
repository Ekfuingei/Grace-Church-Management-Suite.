import { useState, useEffect } from 'react'
import { Plus, Users, Calendar, UserPlus } from 'lucide-react'
import { PageHeader } from '@/components/shared/PageHeader'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { EmptyState } from '@/components/shared/EmptyState'
import { supabase } from '@/lib/supabase'
import type { Service, AttendanceRecord, Member, AttendanceStatus } from '@/types/database'
import * as Dialog from '@radix-ui/react-dialog'
import { cn } from '@/lib/utils'

const SERVICE_TYPES = ['Sunday Morning', 'Sunday Evening', 'Midweek', 'Special', 'Other'] as const

export function Attendance() {
  const [services, setServices] = useState<Service[]>([])
  const [selectedService, setSelectedService] = useState<Service | null>(null)
  const [attendance, setAttendance] = useState<(AttendanceRecord & { members?: { full_name?: string; member_id?: string } })[]>([])
  const [members, setMembers] = useState<Member[]>([])
  const [, setLoading] = useState(true)
  const [formOpen, setFormOpen] = useState(false)
  const [firstTimerOpen, setFirstTimerOpen] = useState(false)
  const [serviceForm, setServiceForm] = useState({
    date: new Date().toISOString().slice(0, 10),
    service_type: 'Sunday Morning' as Service['service_type'],
    theme: '',
    preacher: '',
    notes: '',
  })
  const [firstTimerForm, setFirstTimerForm] = useState({
    full_name: '',
    phone: '',
    email: '',
    address: '',
  })

  async function loadServices() {
    const { data } = await supabase.from('services').select('*').order('date', { ascending: false }).limit(20)
    setServices(data ?? [])
  }

  async function loadAttendance(serviceId: string) {
    const { data } = await supabase
      .from('attendance_records')
      .select('*, members(full_name, member_id)')
      .eq('service_id', serviceId)
    setAttendance((data ?? []) as (AttendanceRecord & { members?: { full_name?: string; member_id?: string } })[])
  }

  async function loadMembers() {
    const { data } = await supabase.from('members').select('*').order('full_name')
    setMembers(data ?? [])
  }

  useEffect(() => {
    loadServices()
    loadMembers()
    setLoading(false)
  }, [])

  useEffect(() => {
    if (selectedService) loadAttendance(selectedService.id)
    else setAttendance([])
  }, [selectedService])

  const handleCreateService = async (e: React.FormEvent) => {
    e.preventDefault()
    const { data: { user } } = await supabase.auth.getUser()
    const { data } = await supabase.from('services').insert({
      date: serviceForm.date,
      service_type: serviceForm.service_type,
      theme: serviceForm.theme || null,
      preacher: serviceForm.preacher || null,
      notes: serviceForm.notes || null,
      created_by: user?.id,
    }).select().single()
    if (data) {
      setServices((s) => [data as Service, ...s])
      setSelectedService(data as Service)
      setFormOpen(false)
      setServiceForm({ date: new Date().toISOString().slice(0, 10), service_type: 'Sunday Morning', theme: '', preacher: '', notes: '' })
    }
  }

  const handleMarkAttendance = async (member: Member, status: AttendanceStatus) => {
    if (!selectedService) return
    const existing = attendance.find((a) => a.member_id === member.id)
    if (existing) {
      await supabase.from('attendance_records').update({ status }).eq('id', existing.id)
    } else {
      await supabase.from('attendance_records').insert({
        service_id: selectedService.id,
        member_id: member.id,
        status,
      })
    }
    loadAttendance(selectedService.id)
    if (status === 'First Timer') {
      setFirstTimerForm({ full_name: member.full_name, phone: member.phone ?? '', email: member.email ?? '', address: member.address ?? '' })
      setFirstTimerOpen(true)
    }
  }

  const handleAddFirstTimer = async (e: React.FormEvent) => {
    e.preventDefault()
    const { data: { user } } = await supabase.auth.getUser()
    const { data: newMember } = await supabase.from('members').insert({
      full_name: firstTimerForm.full_name,
      phone: firstTimerForm.phone || null,
      email: firstTimerForm.email || null,
      address: firstTimerForm.address || null,
      status: 'Visitor',
      created_by: user?.id,
    }).select().single()
    if (newMember && selectedService) {
      await supabase.from('attendance_records').insert({
        service_id: selectedService.id,
        member_id: newMember.id,
        status: 'First Timer',
      })
      loadAttendance(selectedService.id)
      loadMembers()
      setFirstTimerOpen(false)
      setFirstTimerForm({ full_name: '', phone: '', email: '', address: '' })
    }
  }

  const presentCount = attendance.filter((a) => a.status === 'Present').length
  const firstTimerCount = attendance.filter((a) => a.status === 'First Timer').length

  return (
    <div className="space-y-8 animate-fade-in">
      <PageHeader
        title="Attendance Tracker"
        subtitle="Track service attendance and first-timers"
        actions={
          <Button onClick={() => setFormOpen(true)}>
            <Plus className="h-4 w-4" />
            New Service
          </Button>
        }
      />

      {formOpen && (
        <Dialog.Root open={formOpen} onOpenChange={setFormOpen}>
          <Dialog.Portal>
            <Dialog.Overlay className="fixed inset-0 z-50 bg-foreground/40 backdrop-blur-sm" />
            <Dialog.Content className="fixed left-[50%] top-[50%] z-50 w-[calc(100vw-2rem)] max-w-md translate-x-[-50%] translate-y-[-50%] rounded-2xl border border-border-subtle bg-surface p-4 sm:p-6 shadow-soft-lg">
              <Dialog.Title className="font-display text-xl font-semibold">Create Service</Dialog.Title>
              <form onSubmit={handleCreateService} className="mt-6 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="date">Date</Label>
                  <Input id="date" type="date" value={serviceForm.date} onChange={(e) => setServiceForm((f) => ({ ...f, date: e.target.value }))} required />
                </div>
                <div className="space-y-2">
                  <Label>Service Type</Label>
                  <select
                    value={serviceForm.service_type}
                    onChange={(e) => setServiceForm((f) => ({ ...f, service_type: e.target.value as Service['service_type'] }))}
                    className="flex h-10 w-full rounded-xl border border-border-subtle bg-surface px-4 py-2.5 text-sm"
                  >
                    {SERVICE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="theme">Theme</Label>
                    <Input id="theme" value={serviceForm.theme} onChange={(e) => setServiceForm((f) => ({ ...f, theme: e.target.value }))} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="preacher">Preacher</Label>
                    <Input id="preacher" value={serviceForm.preacher} onChange={(e) => setServiceForm((f) => ({ ...f, preacher: e.target.value }))} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="notes">Notes</Label>
                  <textarea
                    id="notes"
                    rows={2}
                    value={serviceForm.notes}
                    onChange={(e) => setServiceForm((f) => ({ ...f, notes: e.target.value }))}
                    className="flex w-full rounded-xl border border-border-subtle bg-surface px-4 py-2.5 text-sm"
                  />
                </div>
                <div className="flex gap-3 pt-2">
                  <Button type="submit">Create</Button>
                  <Button type="button" variant="outline" onClick={() => setFormOpen(false)}>Cancel</Button>
                </div>
              </form>
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>
      )}

      {firstTimerOpen && (
        <Dialog.Root open={firstTimerOpen} onOpenChange={setFirstTimerOpen}>
          <Dialog.Portal>
            <Dialog.Overlay className="fixed inset-0 z-50 bg-foreground/40 backdrop-blur-sm" />
            <Dialog.Content className="fixed left-[50%] top-[50%] z-50 w-[calc(100vw-2rem)] max-w-md translate-x-[-50%] translate-y-[-50%] rounded-2xl border border-border-subtle bg-surface p-4 sm:p-6 shadow-soft-lg">
              <Dialog.Title className="font-display text-xl font-semibold">First Timer Details</Dialog.Title>
              <p className="mt-1 text-sm text-muted">Add this first-timer to members for follow-up.</p>
              <form onSubmit={handleAddFirstTimer} className="mt-6 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="ft_name">Full Name *</Label>
                  <Input id="ft_name" value={firstTimerForm.full_name} onChange={(e) => setFirstTimerForm((f) => ({ ...f, full_name: e.target.value }))} required />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="ft_phone">Phone</Label>
                    <Input id="ft_phone" value={firstTimerForm.phone} onChange={(e) => setFirstTimerForm((f) => ({ ...f, phone: e.target.value }))} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="ft_email">Email</Label>
                    <Input id="ft_email" type="email" value={firstTimerForm.email} onChange={(e) => setFirstTimerForm((f) => ({ ...f, email: e.target.value }))} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ft_address">Address</Label>
                  <Input id="ft_address" value={firstTimerForm.address} onChange={(e) => setFirstTimerForm((f) => ({ ...f, address: e.target.value }))} />
                </div>
                <div className="flex gap-3 pt-2">
                  <Button type="submit">Add to Members</Button>
                  <Button type="button" variant="outline" onClick={() => setFirstTimerOpen(false)}>Skip</Button>
                </div>
              </form>
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>
      )}

      <div className="grid gap-6 sm:gap-8 lg:grid-cols-3">
        <div className="lg:col-span-1 order-2 lg:order-1">
          <h3 className="mb-4 font-display text-lg font-semibold">Services</h3>
          {services.length === 0 ? (
            <EmptyState icon={Calendar} title="No services" description="Create a service to start tracking attendance." />
          ) : (
            <ul className="space-y-1 rounded-2xl border border-border-subtle bg-surface p-2">
              {services.map((s) => (
                <li key={s.id}>
                  <button
                    type="button"
                    onClick={() => setSelectedService(s)}
                    className={cn(
                      'w-full rounded-xl px-4 py-3 text-left text-sm transition-colors',
                      selectedService?.id === s.id ? 'bg-accent/10 text-accent' : 'hover:bg-surface-secondary'
                    )}
                  >
                    <span className="font-medium">{s.date}</span>
                    <span className="ml-2 text-muted">— {s.service_type}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="lg:col-span-2 order-1 lg:order-2 min-w-0">
          {selectedService ? (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center justify-between gap-3 sm:gap-4">
                <div>
                  <h3 className="font-display text-lg font-semibold">{selectedService.date} — {selectedService.service_type}</h3>
                  <p className="text-sm text-muted">Present: {presentCount} | First Timers: {firstTimerCount}</p>
                </div>
                <MarkAttendanceButton members={members} attendance={attendance} onMark={handleMarkAttendance} />
              </div>

              <div className="rounded-2xl border border-border-subtle bg-surface overflow-hidden">
                {attendance.length === 0 ? (
                  <div className="py-12 text-center text-muted text-sm">No attendance recorded yet. Mark members above.</div>
                ) : (
                  <>
                    {/* Mobile: card layout */}
                    <div className="md:hidden divide-y divide-border-subtle">
                      {attendance.map((a) => {
                        const m = members.find((x) => x.id === a.member_id) ?? { id: a.member_id } as Member
                        return (
                          <div key={a.id} className="p-4 flex flex-wrap items-center justify-between gap-2">
                            <div className="min-w-0 flex-1">
                              <p className="font-medium truncate">{(a as { members?: { full_name?: string } }).members?.full_name ?? '—'}</p>
                              <span className={cn(
                                'inline-block mt-1 rounded-full px-2.5 py-0.5 text-xs font-medium',
                                a.status === 'Present' && 'bg-success-muted text-success',
                                a.status === 'Absent' && 'bg-danger-muted text-danger',
                                a.status === 'First Timer' && 'bg-accent/10 text-accent'
                              )}>
                                {a.status}
                              </span>
                            </div>
                            <div className="flex gap-1 shrink-0">
                              <Button variant="ghost" size="sm" onClick={() => handleMarkAttendance(m, 'Present')}>Present</Button>
                              <Button variant="ghost" size="sm" onClick={() => handleMarkAttendance(m, 'Absent')}>Absent</Button>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                    {/* Desktop: table */}
                    <div className="hidden md:block overflow-x-auto">
                      <table className="w-full text-sm min-w-[400px]">
                        <thead>
                          <tr className="border-b border-border-subtle bg-surface-secondary/50">
                            <th className="px-6 py-4 text-left text-xs font-semibold uppercase text-muted">Member</th>
                            <th className="px-6 py-4 text-left text-xs font-semibold uppercase text-muted">Status</th>
                            <th className="px-6 py-4 text-right text-xs font-semibold uppercase text-muted">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border-subtle">
                          {attendance.map((a) => (
                            <tr key={a.id} className="hover:bg-surface-secondary/30">
                              <td className="px-6 py-4 font-medium">
                                {(a as { members?: { full_name?: string } }).members?.full_name ?? '—'}
                              </td>
                              <td className="px-6 py-4">
                                <span className={cn(
                                  'rounded-full px-2.5 py-0.5 text-xs font-medium',
                                  a.status === 'Present' && 'bg-success-muted text-success',
                                  a.status === 'Absent' && 'bg-danger-muted text-danger',
                                  a.status === 'First Timer' && 'bg-accent/10 text-accent'
                                )}>
                                  {a.status}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-right">
                                <div className="flex justify-end gap-1">
                                  {(() => {
                                    const m = members.find((x) => x.id === a.member_id) ?? { id: a.member_id } as Member
                                    return (
                                      <>
                                        <Button variant="ghost" size="sm" onClick={() => handleMarkAttendance(m, 'Present')}>Present</Button>
                                        <Button variant="ghost" size="sm" onClick={() => handleMarkAttendance(m, 'Absent')}>Absent</Button>
                                      </>
                                    )
                                  })()}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </>
                )}
              </div>
            </div>
          ) : (
            <EmptyState icon={Users} title="Select a service" description="Choose a service from the list to mark attendance." />
          )}
        </div>
      </div>
    </div>
  )
}

function MarkAttendanceButton({
  members,
  onMark,
}: {
  members: Member[]
  attendance: (AttendanceRecord & { members?: unknown })[]
  onMark: (member: Member, status: AttendanceStatus) => void
}) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const filtered = members.filter((m) =>
    m.full_name.toLowerCase().includes(query.toLowerCase()) ||
    m.member_id.toLowerCase().includes(query.toLowerCase())
  ).slice(0, 10)

  return (
    <div className="relative">
      <Button onClick={() => setOpen(true)} className="w-full sm:w-auto">
        <UserPlus className="h-4 w-4 shrink-0" />
        Mark Attendance
      </Button>
      {open && (
        <div className="absolute right-0 sm:right-0 left-0 sm:left-auto top-full z-10 mt-2 w-[calc(100vw-2rem)] sm:w-80 max-w-sm rounded-xl border border-border-subtle bg-surface p-4 shadow-soft-lg">
          <Input
            placeholder="Search member..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="mb-3"
          />
          <ul className="max-h-48 overflow-y-auto space-y-1">
            {filtered.map((m) => (
              <li key={m.id}>
                <div className="flex items-center justify-between gap-2 rounded-lg px-3 py-2 hover:bg-surface-secondary">
                  <span className="text-sm font-medium">{m.full_name}</span>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="sm" onClick={() => { onMark(m, 'Present'); setOpen(false) }}>Present</Button>
                    <Button variant="ghost" size="sm" onClick={() => { onMark(m, 'First Timer'); setOpen(false) }}>First Timer</Button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
          <Button variant="outline" size="sm" className="mt-3 w-full" onClick={() => setOpen(false)}>Close</Button>
        </div>
      )}
    </div>
  )
}
