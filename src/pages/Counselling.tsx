import { useState, useEffect } from 'react'
import { Plus, ChevronLeft, ChevronRight, FileText, Stethoscope } from 'lucide-react'
import { PageHeader } from '@/components/shared/PageHeader'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { EmptyState } from '@/components/shared/EmptyState'
import { MemberSearchInput } from '@/components/shared/MemberSearchInput'
import { supabase } from '@/lib/supabase'
import type { CounsellingCase, CounsellingAppointment, SessionNote, Member } from '@/types/database'
import * as Dialog from '@radix-ui/react-dialog'
import { cn } from '@/lib/utils'

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const HOURS = Array.from({ length: 10 }, (_, i) => i + 8) // 8am-5pm

export function Counselling() {
  const [cases, setCases] = useState<CounsellingCase[]>([])
  const [appointments, setAppointments] = useState<(CounsellingAppointment & { members?: { full_name?: string }; admin_users?: { full_name?: string } })[]>([])
  const [adminUsers, setAdminUsers] = useState<{ id: string; full_name: string | null }[]>([])
  const [, setLoading] = useState(true)
  const [weekStart, setWeekStart] = useState(() => {
    const d = new Date()
    d.setDate(d.getDate() - d.getDay())
    return d
  })
  const [caseFormOpen, setCaseFormOpen] = useState(false)
  const [apptFormOpen, setApptFormOpen] = useState(false)
  const [notesOpen, setNotesOpen] = useState<CounsellingAppointment | null>(null)
  const [existingNotes, setExistingNotes] = useState<SessionNote[]>([])
  const [caseMember, setCaseMember] = useState<Member | null>(null)
  const [apptMember, setApptMember] = useState<Member | null>(null)
  const [apptForm, setApptForm] = useState({
    counsellor_id: '',
    appointment_type: 'General',
    date: new Date().toISOString().slice(0, 10),
    time_start: '09:00',
    time_end: '10:00',
    location: '',
    is_urgent: false,
    notes_for_counsellor: '',
  })
  const [noteForm, setNoteForm] = useState({
    content: '',
    action_items: '',
    next_appointment_recommended: false,
    risk_flag: false,
  })

  async function loadCases() {
    const { data } = await supabase.from('counselling_cases').select('*, members(full_name)').order('created_at', { ascending: false })
    setCases(data ?? [])
  }

  async function loadAppointments() {
    const start = weekStart.toISOString().slice(0, 10)
    const end = new Date(weekStart)
    end.setDate(end.getDate() + 6)
    const endStr = end.toISOString().slice(0, 10)
    const { data } = await supabase
      .from('counselling_appointments')
      .select('*, members(full_name)')
      .gte('date', start)
      .lte('date', endStr)
      .order('date')
      .order('time_start')
    setAppointments((data ?? []) as (CounsellingAppointment & { members?: { full_name?: string }; admin_users?: { full_name?: string } })[])
  }

  async function loadAdminUsers() {
    const { data } = await supabase.from('admin_users').select('id, full_name')
    setAdminUsers(data ?? [])
  }

  useEffect(() => {
    loadCases()
    loadAdminUsers()
    setLoading(false)
  }, [])

  useEffect(() => {
    loadAppointments()
  }, [weekStart])

  const handleCreateCase = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!caseMember) return
    await supabase.from('counselling_cases').insert({ member_id: caseMember.id, status: 'Open' })
    setCaseFormOpen(false)
    setCaseMember(null)
    loadCases()
  }

  const handleCreateAppt = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!apptMember) return
    const { data: { user } } = await supabase.auth.getUser()
    await supabase.from('counselling_appointments').insert({
      member_id: apptMember.id,
      counsellor_id: apptForm.counsellor_id || user?.id,
      appointment_type: apptForm.appointment_type,
      date: apptForm.date,
      time_start: apptForm.time_start,
      time_end: apptForm.time_end,
      location: apptForm.location || null,
      is_urgent: apptForm.is_urgent,
      notes_for_counsellor: apptForm.notes_for_counsellor || null,
      booked_by: user?.id,
    })
    setApptFormOpen(false)
    setApptMember(null)
    setApptForm({ counsellor_id: '', appointment_type: 'General', date: new Date().toISOString().slice(0, 10), time_start: '09:00', time_end: '10:00', location: '', is_urgent: false, notes_for_counsellor: '' })
    loadAppointments()
  }

  const handleOpenNotes = (appt: CounsellingAppointment) => {
    setNotesOpen(appt)
    if (appt.status === 'Completed') {
      supabase.from('session_notes').select('*').eq('appointment_id', appt.id).then(({ data }) => setExistingNotes(data ?? []))
    } else {
      setExistingNotes([])
    }
  }

  const handleSaveNote = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!notesOpen) return
    const { data: { user } } = await supabase.auth.getUser()
    await supabase.from('session_notes').insert({
      appointment_id: notesOpen.id,
      content: noteForm.content,
      action_items: noteForm.action_items || null,
      next_appointment_recommended: noteForm.next_appointment_recommended,
      risk_flag: noteForm.risk_flag,
      created_by: user?.id,
    })
    if (notesOpen.status !== 'Completed') {
      await supabase.from('counselling_appointments').update({ status: 'Completed' }).eq('id', notesOpen.id)
    }
    setNotesOpen(null)
    setNoteForm({ content: '', action_items: '', next_appointment_recommended: false, risk_flag: false })
    setExistingNotes([])
    loadAppointments()
  }

  const weekDates = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart)
    d.setDate(d.getDate() + i)
    return d
  })

  const getApptsForSlot = (date: Date, hour: number) => {
    const dateStr = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`
    const hourStart = `${hour.toString().padStart(2, '0')}:00`
    const hourEnd = `${(hour + 1).toString().padStart(2, '0')}:00`
    return appointments.filter((a) => a.date === dateStr && a.time_start >= hourStart && a.time_start < hourEnd)
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <PageHeader
        title="Counselling Appointment Scheduler"
        subtitle="Manage pastoral appointments and session notes"
        actions={
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => setCaseFormOpen(true)}>
              <Stethoscope className="h-4 w-4" />
              New Case
            </Button>
            <Button onClick={() => setApptFormOpen(true)}>
              <Plus className="h-4 w-4" />
              New Appointment
            </Button>
          </div>
        }
      />

      {caseFormOpen && (
        <Dialog.Root open={caseFormOpen} onOpenChange={setCaseFormOpen}>
          <Dialog.Portal>
            <Dialog.Overlay className="fixed inset-0 z-50 bg-foreground/40 backdrop-blur-sm" />
            <Dialog.Content className="fixed left-[50%] top-[50%] z-50 w-[calc(100vw-2rem)] max-w-md translate-x-[-50%] translate-y-[-50%] rounded-2xl border border-border-subtle bg-surface p-4 sm:p-6 shadow-soft-lg">
              <Dialog.Title className="font-display text-xl font-semibold">New Counselling Case</Dialog.Title>
              <form onSubmit={handleCreateCase} className="mt-6 space-y-4">
                <div className="space-y-2">
                  <Label>Member</Label>
                  <MemberSearchInput value={caseMember} onSelect={setCaseMember} placeholder="Search member..." />
                </div>
                <div className="flex gap-3 pt-2">
                  <Button type="submit" disabled={!caseMember}>Create</Button>
                  <Button type="button" variant="outline" onClick={() => setCaseFormOpen(false)}>Cancel</Button>
                </div>
              </form>
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>
      )}

      {apptFormOpen && (
        <Dialog.Root open={apptFormOpen} onOpenChange={setApptFormOpen}>
          <Dialog.Portal>
            <Dialog.Overlay className="fixed inset-0 z-50 bg-foreground/40 backdrop-blur-sm" />
            <Dialog.Content className="fixed left-[50%] top-[50%] z-50 max-h-[90vh] w-[calc(100vw-2rem)] max-w-md translate-x-[-50%] translate-y-[-50%] overflow-y-auto rounded-2xl border border-border-subtle bg-surface p-4 sm:p-6 shadow-soft-lg">
              <Dialog.Title className="font-display text-xl font-semibold">New Appointment</Dialog.Title>
              <form onSubmit={handleCreateAppt} className="mt-6 space-y-4">
                <div className="space-y-2">
                  <Label>Member *</Label>
                  <MemberSearchInput value={apptMember} onSelect={setApptMember} placeholder="Search member..." />
                </div>
                <div className="space-y-2">
                  <Label>Counsellor</Label>
                  <select
                    value={apptForm.counsellor_id}
                    onChange={(e) => setApptForm((f) => ({ ...f, counsellor_id: e.target.value }))}
                    className="flex h-10 w-full rounded-xl border border-border-subtle bg-surface px-4 py-2.5 text-sm"
                  >
                    <option value="">—</option>
                    {adminUsers.map((u) => (
                      <option key={u.id} value={u.id}>{u.full_name ?? u.id.slice(0, 8)}</option>
                    ))}
                  </select>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="appt_date">Date</Label>
                    <Input id="appt_date" type="date" value={apptForm.date} onChange={(e) => setApptForm((f) => ({ ...f, date: e.target.value }))} required />
                  </div>
                  <div className="space-y-2">
                    <Label>Type</Label>
                    <select value={apptForm.appointment_type} onChange={(e) => setApptForm((f) => ({ ...f, appointment_type: e.target.value }))} className="flex h-10 w-full rounded-xl border border-border-subtle bg-surface px-4 py-2.5 text-sm">
                      <option value="General">General</option>
                      <option value="Marriage">Marriage</option>
                      <option value="Youth">Youth</option>
                      <option value="Crisis">Crisis</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="time_start">Start</Label>
                    <Input id="time_start" type="time" value={apptForm.time_start} onChange={(e) => setApptForm((f) => ({ ...f, time_start: e.target.value }))} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="time_end">End</Label>
                    <Input id="time_end" type="time" value={apptForm.time_end} onChange={(e) => setApptForm((f) => ({ ...f, time_end: e.target.value }))} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="location">Location</Label>
                  <Input id="location" value={apptForm.location} onChange={(e) => setApptForm((f) => ({ ...f, location: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="notes_c">Notes for Counsellor</Label>
                  <textarea id="notes_c" rows={2} value={apptForm.notes_for_counsellor} onChange={(e) => setApptForm((f) => ({ ...f, notes_for_counsellor: e.target.value }))} className="flex w-full rounded-xl border border-border-subtle bg-surface px-4 py-2.5 text-sm" />
                </div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={apptForm.is_urgent} onChange={(e) => setApptForm((f) => ({ ...f, is_urgent: e.target.checked }))} className="rounded border-border" />
                  <span className="text-sm">Urgent</span>
                </label>
                <div className="flex gap-3 pt-2">
                  <Button type="submit" disabled={!apptMember}>Create</Button>
                  <Button type="button" variant="outline" onClick={() => setApptFormOpen(false)}>Cancel</Button>
                </div>
              </form>
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>
      )}

      {notesOpen && (
        <Dialog.Root open={!!notesOpen} onOpenChange={(o) => { if (!o) { setNotesOpen(null); setExistingNotes([]) } }}>
          <Dialog.Portal>
            <Dialog.Overlay className="fixed inset-0 z-50 bg-foreground/40 backdrop-blur-sm" />
            <Dialog.Content className="fixed left-[50%] top-[50%] z-50 max-h-[90vh] w-[calc(100vw-2rem)] max-w-lg translate-x-[-50%] translate-y-[-50%] overflow-y-auto rounded-2xl border border-border-subtle bg-surface p-4 sm:p-6 shadow-soft-lg">
              <Dialog.Title className="font-display text-xl font-semibold">Session Notes</Dialog.Title>
              <p className="mt-1 text-sm text-muted">{(notesOpen as { members?: { full_name?: string } }).members?.full_name ?? '—'}</p>
              {existingNotes.length > 0 && (
                <div className="mt-4 space-y-3 rounded-xl border border-border-subtle bg-surface-secondary/50 p-4">
                  <h4 className="font-medium">Existing notes</h4>
                  {existingNotes.map((n) => (
                    <div key={n.id} className="rounded-lg bg-surface p-3 text-sm">
                      <p className="whitespace-pre-wrap">{n.content}</p>
                      {n.action_items && <p className="mt-2 text-muted">Actions: {n.action_items}</p>}
                      {(n.risk_flag || n.next_appointment_recommended) && (
                        <p className="mt-1 text-xs">
                          {n.risk_flag && <span className="text-danger">Risk flag</span>}
                          {n.risk_flag && n.next_appointment_recommended && ' • '}
                          {n.next_appointment_recommended && <span>Next appt recommended</span>}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
              <form onSubmit={handleSaveNote} className="mt-6 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="content">Content *</Label>
                  <textarea id="content" rows={5} value={noteForm.content} onChange={(e) => setNoteForm((f) => ({ ...f, content: e.target.value }))} className="flex w-full rounded-xl border border-border-subtle bg-surface px-4 py-2.5 text-sm" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="actions">Action Items</Label>
                  <textarea id="actions" rows={2} value={noteForm.action_items} onChange={(e) => setNoteForm((f) => ({ ...f, action_items: e.target.value }))} className="flex w-full rounded-xl border border-border-subtle bg-surface px-4 py-2.5 text-sm" />
                </div>
                <div className="flex flex-col sm:flex-row gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={noteForm.next_appointment_recommended} onChange={(e) => setNoteForm((f) => ({ ...f, next_appointment_recommended: e.target.checked }))} className="rounded border-border" />
                    <span className="text-sm">Next appointment recommended</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={noteForm.risk_flag} onChange={(e) => setNoteForm((f) => ({ ...f, risk_flag: e.target.checked }))} className="rounded border-border" />
                    <span className="text-sm text-danger">Risk flag</span>
                  </label>
                </div>
                <div className="flex gap-3 pt-2">
                  <Button type="submit">{notesOpen.status === 'Completed' ? 'Add Another Note' : 'Save Notes'}</Button>
                  <Button type="button" variant="outline" onClick={() => { setNotesOpen(null); setExistingNotes([]) }}>Close</Button>
                </div>
              </form>
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>
      )}

      <div className="grid gap-6 sm:gap-8 lg:grid-cols-3 min-w-0">
        <div>
          <h3 className="mb-4 font-display text-lg font-semibold">Cases</h3>
          {cases.length === 0 ? (
            <EmptyState icon={Stethoscope} title="No cases" description="Create a counselling case for a member." />
          ) : (
            <ul className="space-y-2 rounded-2xl border border-border-subtle bg-surface p-4">
              {cases.map((c) => (
                <li key={c.id} className="flex items-center justify-between rounded-xl px-4 py-3 bg-surface-secondary/50">
                  <span className="font-medium">{(c as { members?: { full_name?: string } }).members?.full_name ?? '—'}</span>
                  <span className={cn(
                    'rounded-full px-2.5 py-0.5 text-xs',
                    c.status === 'Open' && 'bg-amber-100 text-amber-800',
                    c.status === 'In Progress' && 'bg-accent/10 text-accent',
                    c.status === 'Closed' && 'bg-success-muted text-success'
                  )}>{c.status}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="lg:col-span-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <h3 className="font-display text-lg font-semibold">Week View</h3>
            <div className="flex items-center gap-2 flex-wrap">
              <Button variant="outline" size="icon" onClick={() => setWeekStart((d) => { const x = new Date(d); x.setDate(x.getDate() - 7); return x })}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="py-2 text-xs sm:text-sm font-medium whitespace-nowrap">
                {weekStart.toLocaleDateString()} – {new Date(weekStart.getTime() + 6 * 24 * 60 * 60 * 1000).toLocaleDateString()}
              </span>
              <Button variant="outline" size="icon" onClick={() => setWeekStart((d) => { const x = new Date(d); x.setDate(x.getDate() + 7); return x })}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div className="overflow-x-auto rounded-2xl border border-border-subtle bg-surface -mx-3 sm:mx-0">
            <table className="w-full text-sm min-w-[600px]">
              <thead>
                <tr className="border-b border-border-subtle bg-surface-secondary/50">
                  <th className="w-12 sm:w-16 p-2 text-left text-xs font-semibold text-muted">Time</th>
                  {weekDates.map((d) => (
                    <th key={d.toISOString()} className="min-w-[90px] sm:min-w-[120px] p-2 text-center text-xs font-semibold text-muted">
                      {DAYS[d.getDay()]} {d.getDate()}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {HOURS.map((hour) => (
                  <tr key={hour} className="border-b border-border-subtle">
                    <td className="p-2 text-muted">{hour}:00</td>
                    {weekDates.map((d) => (
                      <td key={d.toISOString()} className="min-w-[90px] sm:min-w-[120px] align-top p-2">
                        {getApptsForSlot(d, hour).map((a) => (
                          <div
                            key={a.id}
                            className={cn(
                              'mb-2 rounded-lg p-2 text-xs cursor-pointer',
                              a.status === 'Completed' ? 'bg-success-muted' : a.is_urgent ? 'bg-danger-muted' : 'bg-accent/10'
                            )}
                            onClick={() => handleOpenNotes(a)}
                          >
                            <p className="font-medium truncate">{(a as { members?: { full_name?: string } }).members?.full_name ?? '—'}</p>
                            <p className="text-muted truncate">{a.appointment_type}</p>
                            {a.status === 'Completed' && (
                              <Button variant="ghost" size="sm" className="mt-1 h-6 text-xs" onClick={(e) => { e.stopPropagation(); handleOpenNotes(a) }}>
                                <FileText className="h-3 w-3" /> View notes
                              </Button>
                            )}
                          </div>
                        ))}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
