import { useState, useEffect } from 'react'
import { Plus, Heart, Phone, Mail, Calendar, MoreVertical } from 'lucide-react'
import { PageHeader } from '@/components/shared/PageHeader'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { EmptyState } from '@/components/shared/EmptyState'
import { MemberSearchInput } from '@/components/shared/MemberSearchInput'
import { supabase } from '@/lib/supabase'
import type { EvangelismContact, Member, PipelineStage } from '@/types/database'
import * as Dialog from '@radix-ui/react-dialog'
import * as Dropdown from '@radix-ui/react-dropdown-menu'

const PIPELINE_STAGES: PipelineStage[] = ['New Contact', 'First Visit', 'Regular', 'Membership Class', 'Full Member']

export function Evangelism() {
  const [contacts, setContacts] = useState<EvangelismContact[]>([])
  const [loading, setLoading] = useState(true)
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<EvangelismContact | null>(null)
  const [followupOpen, setFollowupOpen] = useState<EvangelismContact | null>(null)
  const [convertOpen, setConvertOpen] = useState<EvangelismContact | null>(null)
  const [form, setForm] = useState({
    full_name: '',
    phone: '',
    email: '',
    address: '',
    source: '',
    first_contact_date: '',
    initial_outcome: '',
    pipeline_stage: 'New Contact' as PipelineStage,
    notes: '',
  })
  const [followupForm, setFollowupForm] = useState({
    date: new Date().toISOString().slice(0, 10),
    type: 'Call',
    outcome: '',
    next_step: '',
    next_followup_date: '',
  })
  const [convertMember, setConvertMember] = useState<Member | null>(null)

  async function load() {
    const { data } = await supabase.from('evangelism_contacts').select('*').order('created_at', { ascending: false })
    setContacts(data ?? [])
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [])

  const byStage = PIPELINE_STAGES.map((stage) => ({
    stage,
    contacts: contacts.filter((c) => c.pipeline_stage === stage),
  }))

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    const { data: { user } } = await supabase.auth.getUser()
    const payload = {
      full_name: form.full_name,
      phone: form.phone || null,
      email: form.email || null,
      address: form.address || null,
      source: form.source || null,
      first_contact_date: form.first_contact_date || null,
      initial_outcome: form.initial_outcome || null,
      pipeline_stage: form.pipeline_stage,
      notes: form.notes || null,
      assigned_to: user?.id,
    }
    if (editing) {
      await supabase.from('evangelism_contacts').update(payload).eq('id', editing.id)
    } else {
      await supabase.from('evangelism_contacts').insert(payload)
    }
    setFormOpen(false)
    setEditing(null)
    setForm({ full_name: '', phone: '', email: '', address: '', source: '', first_contact_date: '', initial_outcome: '', pipeline_stage: 'New Contact', notes: '' })
    load()
  }

  const handleStageChange = async (contact: EvangelismContact, stage: PipelineStage) => {
    await supabase.from('evangelism_contacts').update({ pipeline_stage: stage }).eq('id', contact.id)
    load()
  }

  const handleLogFollowup = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!followupOpen) return
    const { data: { user } } = await supabase.auth.getUser()
    await supabase.from('followup_activities').insert({
      contact_id: followupOpen.id,
      date: followupForm.date,
      type: followupForm.type,
      outcome: followupForm.outcome || null,
      next_step: followupForm.next_step || null,
      logged_by: user?.id,
    })
    if (followupForm.next_followup_date) {
      await supabase.from('evangelism_contacts').update({ next_followup_date: followupForm.next_followup_date }).eq('id', followupOpen.id)
    }
    setFollowupOpen(null)
    setFollowupForm({ date: new Date().toISOString().slice(0, 10), type: 'Call', outcome: '', next_step: '', next_followup_date: '' })
    load()
  }

  const handleConvert = async () => {
    if (!convertOpen || !convertMember) return
    await supabase.from('evangelism_contacts').update({ converted_to_member_id: convertMember.id, pipeline_stage: 'Full Member' }).eq('id', convertOpen.id)
    setConvertOpen(null)
    setConvertMember(null)
    load()
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <PageHeader
        title="Evangelism & Follow-up Tracker"
        subtitle="Track outreach and new convert follow-up"
        actions={
          <Button onClick={() => { setEditing(null); setForm({ full_name: '', phone: '', email: '', address: '', source: '', first_contact_date: '', initial_outcome: '', pipeline_stage: 'New Contact', notes: '' }); setFormOpen(true) }}>
            <Plus className="h-4 w-4" />
            Add Contact
          </Button>
        }
      />

      {formOpen && (
        <Dialog.Root open={formOpen} onOpenChange={setFormOpen}>
          <Dialog.Portal>
            <Dialog.Overlay className="fixed inset-0 z-50 bg-foreground/40 backdrop-blur-sm" />
            <Dialog.Content className="fixed left-[50%] top-[50%] z-50 max-h-[90vh] w-[calc(100vw-2rem)] max-w-lg translate-x-[-50%] translate-y-[-50%] overflow-y-auto rounded-2xl border border-border-subtle bg-surface p-4 sm:p-6 shadow-soft-lg">
              <Dialog.Title className="font-display text-xl font-semibold">{editing ? 'Edit Contact' : 'Add Contact'}</Dialog.Title>
              <form onSubmit={handleSave} className="mt-6 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name *</Label>
                  <Input id="name" value={form.full_name} onChange={(e) => setForm((f) => ({ ...f, full_name: e.target.value }))} required />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input id="phone" value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address">Address</Label>
                  <Input id="address" value={form.address} onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))} />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="source">Source</Label>
                    <Input id="source" value={form.source} onChange={(e) => setForm((f) => ({ ...f, source: e.target.value }))} placeholder="e.g. Crusade, Referral" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="first_date">First Contact Date</Label>
                    <Input id="first_date" type="date" value={form.first_contact_date} onChange={(e) => setForm((f) => ({ ...f, first_contact_date: e.target.value }))} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Pipeline Stage</Label>
                  <select value={form.pipeline_stage} onChange={(e) => setForm((f) => ({ ...f, pipeline_stage: e.target.value as PipelineStage }))} className="flex h-10 w-full rounded-xl border border-border-subtle bg-surface px-4 py-2.5 text-sm">
                    {PIPELINE_STAGES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="notes">Notes</Label>
                  <textarea id="notes" rows={3} value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} className="flex w-full rounded-xl border border-border-subtle bg-surface px-4 py-2.5 text-sm" />
                </div>
                <div className="flex gap-3 pt-2">
                  <Button type="submit">Save</Button>
                  <Button type="button" variant="outline" onClick={() => setFormOpen(false)}>Cancel</Button>
                </div>
              </form>
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>
      )}

      {followupOpen && (
        <Dialog.Root open={!!followupOpen} onOpenChange={(o) => !o && setFollowupOpen(null)}>
          <Dialog.Portal>
            <Dialog.Overlay className="fixed inset-0 z-50 bg-foreground/40 backdrop-blur-sm" />
            <Dialog.Content className="fixed left-[50%] top-[50%] z-50 w-[calc(100vw-2rem)] max-w-md translate-x-[-50%] translate-y-[-50%] rounded-2xl border border-border-subtle bg-surface p-4 sm:p-6 shadow-soft-lg">
              <Dialog.Title className="font-display text-xl font-semibold">Log Follow-up: {followupOpen.full_name}</Dialog.Title>
              <form onSubmit={handleLogFollowup} className="mt-6 space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="fp_date">Date</Label>
                    <Input id="fp_date" type="date" value={followupForm.date} onChange={(e) => setFollowupForm((f) => ({ ...f, date: e.target.value }))} required />
                  </div>
                  <div className="space-y-2">
                    <Label>Type</Label>
                    <select value={followupForm.type} onChange={(e) => setFollowupForm((f) => ({ ...f, type: e.target.value }))} className="flex h-10 w-full rounded-xl border border-border-subtle bg-surface px-4 py-2.5 text-sm">
                      <option value="Call">Call</option>
                      <option value="Visit">Visit</option>
                      <option value="SMS">SMS</option>
                      <option value="WhatsApp">WhatsApp</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="outcome">Outcome</Label>
                  <Input id="outcome" value={followupForm.outcome} onChange={(e) => setFollowupForm((f) => ({ ...f, outcome: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="next">Next Step</Label>
                  <Input id="next" value={followupForm.next_step} onChange={(e) => setFollowupForm((f) => ({ ...f, next_step: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="next_date">Next Follow-up Date</Label>
                  <Input id="next_date" type="date" value={followupForm.next_followup_date} onChange={(e) => setFollowupForm((f) => ({ ...f, next_followup_date: e.target.value }))} />
                </div>
                <div className="flex gap-3 pt-2">
                  <Button type="submit">Log</Button>
                  <Button type="button" variant="outline" onClick={() => setFollowupOpen(null)}>Cancel</Button>
                </div>
              </form>
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>
      )}

      {convertOpen && (
        <Dialog.Root open={!!convertOpen} onOpenChange={(o) => !o && setConvertOpen(null)}>
          <Dialog.Portal>
            <Dialog.Overlay className="fixed inset-0 z-50 bg-foreground/40 backdrop-blur-sm" />
            <Dialog.Content className="fixed left-[50%] top-[50%] z-50 w-[calc(100vw-2rem)] max-w-md translate-x-[-50%] translate-y-[-50%] rounded-2xl border border-border-subtle bg-surface p-4 sm:p-6 shadow-soft-lg">
              <Dialog.Title className="font-display text-xl font-semibold">Convert to Member: {convertOpen.full_name}</Dialog.Title>
              <p className="mt-2 text-sm text-muted">Link this contact to an existing member record.</p>
              <div className="mt-6 space-y-4">
                <div className="space-y-2">
                  <Label>Member</Label>
                  <MemberSearchInput value={convertMember} onSelect={setConvertMember} placeholder="Search member..." />
                </div>
                <div className="flex gap-3 pt-2">
                  <Button onClick={handleConvert} disabled={!convertMember}>Convert</Button>
                  <Button variant="outline" onClick={() => setConvertOpen(null)}>Cancel</Button>
                </div>
              </div>
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>
      )}

      {loading ? (
        <div className="flex items-center gap-3 py-12">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-accent border-t-transparent" />
          <span className="text-muted">Loading...</span>
        </div>
      ) : contacts.length === 0 ? (
        <EmptyState icon={Heart} title="No contacts" description="Add evangelism contacts to track follow-up." action={<Button onClick={() => setFormOpen(true)}><Plus className="h-4 w-4" /> Add Contact</Button>} />
      ) : (
        <div className="flex gap-4 overflow-x-auto pb-4 -mx-3 px-3 sm:mx-0 sm:px-0">
          {byStage.map(({ stage, contacts: stageContacts }) => (
            <div key={stage} className="min-w-[260px] sm:min-w-[280px] flex-shrink-0 rounded-2xl border border-border-subtle bg-surface-secondary/50 p-4">
              <h4 className="font-semibold text-foreground mb-4">{stage}</h4>
              <div className="space-y-3">
                {stageContacts.map((c) => (
                  <ContactCard
                    key={c.id}
                    contact={c}
                    onEdit={() => { setEditing(c); setForm({ full_name: c.full_name, phone: c.phone ?? '', email: c.email ?? '', address: c.address ?? '', source: c.source ?? '', first_contact_date: c.first_contact_date ?? '', initial_outcome: c.initial_outcome ?? '', pipeline_stage: c.pipeline_stage, notes: c.notes ?? '' }); setFormOpen(true) }}
                    onStageChange={(s) => handleStageChange(c, s)}
                    onLogFollowup={() => setFollowupOpen(c)}
                    onConvert={() => setConvertOpen(c)}
                    stages={PIPELINE_STAGES}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function ContactCard({
  contact,
  onEdit,
  onStageChange,
  onLogFollowup,
  onConvert,
  stages,
}: {
  contact: EvangelismContact
  onEdit: () => void
  onStageChange: (stage: PipelineStage) => void
  onLogFollowup: () => void
  onConvert: () => void
  stages: PipelineStage[]
}) {
  const [menuOpen, setMenuOpen] = useState(false)
  const stageIdx = stages.indexOf(contact.pipeline_stage)

  return (
    <div className="rounded-xl border border-border-subtle bg-surface p-4 shadow-card">
      <div className="flex items-start justify-between gap-2">
        <h5 className="font-medium">{contact.full_name}</h5>
        <Dropdown.Root open={menuOpen} onOpenChange={setMenuOpen}>
          <Dropdown.Trigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </Dropdown.Trigger>
          <Dropdown.Portal>
            <Dropdown.Content className="rounded-xl border border-border-subtle bg-surface p-1 shadow-soft-lg" align="end">
              <Dropdown.Item className="rounded-lg px-3 py-2 text-sm cursor-pointer" onSelect={onEdit}>Edit</Dropdown.Item>
              <Dropdown.Item className="rounded-lg px-3 py-2 text-sm cursor-pointer" onSelect={onLogFollowup}>Log Follow-up</Dropdown.Item>
              <Dropdown.Item className="rounded-lg px-3 py-2 text-sm cursor-pointer" onSelect={onConvert}>Convert to Member</Dropdown.Item>
            </Dropdown.Content>
          </Dropdown.Portal>
        </Dropdown.Root>
      </div>
      {contact.phone && <p className="mt-1 flex items-center gap-1.5 text-sm text-muted"><Phone className="h-3.5 w-3.5" />{contact.phone}</p>}
      {contact.email && <p className="flex items-center gap-1.5 text-sm text-muted"><Mail className="h-3.5 w-3.5" />{contact.email}</p>}
      {contact.next_followup_date && <p className="mt-1 flex items-center gap-1.5 text-xs text-accent"><Calendar className="h-3.5 w-3.5" />Follow-up: {contact.next_followup_date}</p>}
      <div className="mt-3 flex gap-1">
        {stageIdx > 0 && (
          <Button variant="ghost" size="sm" className="text-xs" onClick={() => onStageChange(stages[stageIdx - 1])}>←</Button>
        )}
        {stageIdx < stages.length - 1 && (
          <Button variant="ghost" size="sm" className="text-xs" onClick={() => onStageChange(stages[stageIdx + 1])}>→</Button>
        )}
      </div>
    </div>
  )
}
