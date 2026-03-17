import { useState, useEffect } from 'react'
import { Plus, Megaphone, Maximize2, Minimize2, ChevronLeft, ChevronRight, Pencil, Trash2 } from 'lucide-react'
import { PageHeader } from '@/components/shared/PageHeader'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { EmptyState } from '@/components/shared/EmptyState'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { supabase } from '@/lib/supabase'
import type { Announcement, Department } from '@/types/database'
import * as Dialog from '@radix-ui/react-dialog'
import { cn } from '@/lib/utils'

const CATEGORIES = ['General', 'Events', 'Ministry', 'Youth', 'Children', 'Women', 'Men', 'Outreach', 'Other']

export function Announcements() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [departments, setDepartments] = useState<Department[]>([])
  const [loading, setLoading] = useState(true)
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Announcement | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Announcement | null>(null)
  const [fullscreen, setFullscreen] = useState(false)
  const [slideIndex, setSlideIndex] = useState(0)
  const [form, setForm] = useState({
    title: '',
    body: '',
    category: 'General',
    department_id: '' as string,
    is_urgent: false,
    start_date: '',
    expiry_date: '',
    image_url: '',
  })

  async function load() {
    const { data } = await supabase.from('announcements').select('*').order('created_at', { ascending: false })
    setAnnouncements(data ?? [])
    const { data: depts } = await supabase.from('departments').select('*')
    setDepartments(depts ?? [])
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [])

  const activeAnnouncements = announcements.filter((a) => {
    const today = new Date().toISOString().slice(0, 10)
    if (a.start_date && a.start_date > today) return false
    if (a.expiry_date && a.expiry_date < today) return false
    return true
  })

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    const { data: { user } } = await supabase.auth.getUser()
    const payload = {
      title: form.title,
      body: form.body || null,
      category: form.category,
      department_id: form.department_id || null,
      is_urgent: form.is_urgent,
      start_date: form.start_date || null,
      expiry_date: form.expiry_date || null,
      image_url: form.image_url || null,
      created_by: user?.id,
    }
    if (editing) {
      await supabase.from('announcements').update(payload).eq('id', editing.id)
    } else {
      await supabase.from('announcements').insert(payload)
    }
    setFormOpen(false)
    setEditing(null)
    setForm({ title: '', body: '', category: 'General', department_id: '', is_urgent: false, start_date: '', expiry_date: '', image_url: '' })
    load()
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    await supabase.from('announcements').delete().eq('id', deleteTarget.id)
    setDeleteTarget(null)
    load()
  }

  if (fullscreen && activeAnnouncements.length > 0) {
    const slide = activeAnnouncements[slideIndex]
    return (
      <div className="fixed inset-0 z-[100] flex flex-col bg-[#0f0f0f]">
        <div className="flex items-center justify-between border-b border-white/10 px-4 sm:px-6 py-3 gap-2">
          <Button variant="ghost" size="icon" className="text-accent-gold" onClick={() => setSlideIndex((i) => Math.max(0, i - 1))} disabled={slideIndex === 0}>
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <span className="text-sm text-white/70">{slideIndex + 1} / {activeAnnouncements.length}</span>
          <Button variant="ghost" size="icon" className="text-accent-gold" onClick={() => setSlideIndex((i) => Math.min(activeAnnouncements.length - 1, i + 1))} disabled={slideIndex >= activeAnnouncements.length - 1}>
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>
        <div className="flex flex-1 items-center justify-center p-4 sm:p-8 lg:p-12">
          <div className="max-w-4xl w-full text-center px-4">
            <h2 className="font-display text-2xl sm:text-4xl font-bold text-accent-gold mb-4 sm:mb-6">{slide.title}</h2>
            {slide.image_url && (
              <img src={slide.image_url} alt="" className="mx-auto max-h-96 rounded-xl mb-6" />
            )}
            {slide.body && <p className="text-xl text-white/90 leading-relaxed whitespace-pre-wrap">{slide.body}</p>}
            {slide.is_urgent && <p className="mt-6 text-lg text-amber-400 font-semibold">⚠ Urgent</p>}
          </div>
        </div>
        <div className="absolute right-4 top-4">
          <Button variant="ghost" size="icon" className="text-accent-gold" onClick={() => setFullscreen(false)}>
            <Minimize2 className="h-5 w-5" />
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <PageHeader
        title="Church Announcement Board"
        subtitle="Manage and display announcements"
        actions={
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => setFullscreen(true)} disabled={activeAnnouncements.length === 0}>
              <Maximize2 className="h-4 w-4" />
              Fullscreen
            </Button>
            <Button onClick={() => { setEditing(null); setForm({ title: '', body: '', category: 'General', department_id: '', is_urgent: false, start_date: '', expiry_date: '', image_url: '' }); setFormOpen(true) }}>
              <Plus className="h-4 w-4" />
              Add
            </Button>
          </div>
        }
      />

      {formOpen && (
        <Dialog.Root open={formOpen} onOpenChange={setFormOpen}>
          <Dialog.Portal>
            <Dialog.Overlay className="fixed inset-0 z-50 bg-foreground/40 backdrop-blur-sm" />
            <Dialog.Content className="fixed left-[50%] top-[50%] z-50 max-h-[90vh] w-[calc(100vw-2rem)] max-w-lg translate-x-[-50%] translate-y-[-50%] overflow-y-auto rounded-2xl border border-border-subtle bg-surface p-4 sm:p-6 shadow-soft-lg">
              <Dialog.Title className="font-display text-xl font-semibold">{editing ? 'Edit Announcement' : 'Add Announcement'}</Dialog.Title>
              <form onSubmit={handleSave} className="mt-6 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Title *</Label>
                  <Input id="title" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="body">Body</Label>
                  <textarea
                    id="body"
                    rows={4}
                    value={form.body}
                    onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))}
                    className="flex w-full rounded-xl border border-border-subtle bg-surface px-4 py-2.5 text-sm"
                  />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Category</Label>
                    <select value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))} className="flex h-10 w-full rounded-xl border border-border-subtle bg-surface px-4 py-2.5 text-sm">
                      {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label>Department</Label>
                    <select value={form.department_id} onChange={(e) => setForm((f) => ({ ...f, department_id: e.target.value }))} className="flex h-10 w-full rounded-xl border border-border-subtle bg-surface px-4 py-2.5 text-sm">
                      <option value="">—</option>
                      {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                    </select>
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="start">Start Date</Label>
                    <Input id="start" type="date" value={form.start_date} onChange={(e) => setForm((f) => ({ ...f, start_date: e.target.value }))} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="expiry">Expiry Date</Label>
                    <Input id="expiry" type="date" value={form.expiry_date} onChange={(e) => setForm((f) => ({ ...f, expiry_date: e.target.value }))} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="image">Image URL</Label>
                  <Input id="image" value={form.image_url} onChange={(e) => setForm((f) => ({ ...f, image_url: e.target.value }))} placeholder="https://..." />
                </div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.is_urgent} onChange={(e) => setForm((f) => ({ ...f, is_urgent: e.target.checked }))} className="rounded border-border" />
                  <span className="text-sm">Urgent</span>
                </label>
                <div className="flex gap-3 pt-2">
                  <Button type="submit">Save</Button>
                  <Button type="button" variant="outline" onClick={() => setFormOpen(false)}>Cancel</Button>
                </div>
              </form>
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>
      )}

      <ConfirmDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)} title="Delete announcement?" description="This cannot be undone." confirmLabel="Delete" variant="danger" onConfirm={handleDelete} />

      {loading ? (
        <div className="flex items-center gap-3 py-12">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-accent border-t-transparent" />
          <span className="text-muted">Loading...</span>
        </div>
      ) : announcements.length === 0 ? (
        <EmptyState icon={Megaphone} title="No announcements" description="Add your first announcement." action={<Button onClick={() => setFormOpen(true)}><Plus className="h-4 w-4" /> Add</Button>} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 min-w-0">
          {announcements.map((a) => (
            <div key={a.id} className={cn('rounded-2xl border bg-surface p-6 shadow-card', a.is_urgent && 'border-amber-300 bg-amber-50/50')}>
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-display text-lg font-semibold">{a.title}</h3>
                <div className="flex gap-1 shrink-0">
                  <Button variant="ghost" size="icon" onClick={() => { setEditing(a); setForm({ title: a.title, body: a.body ?? '', category: a.category ?? 'General', department_id: a.department_id ?? '', is_urgent: a.is_urgent, start_date: a.start_date ?? '', expiry_date: a.expiry_date ?? '', image_url: a.image_url ?? '' }); setFormOpen(true) }}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="text-danger" onClick={() => setDeleteTarget(a)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              {a.body && <p className="mt-2 text-sm text-muted line-clamp-3">{a.body}</p>}
              <div className="mt-4 flex flex-wrap gap-2">
                {a.category && <span className="rounded-full bg-surface-secondary px-2.5 py-0.5 text-xs">{a.category}</span>}
                {a.is_urgent && <span className="rounded-full bg-amber-200 px-2.5 py-0.5 text-xs font-medium">Urgent</span>}
                {a.start_date && <span className="text-xs text-muted">From {a.start_date}</span>}
                {a.expiry_date && <span className="text-xs text-muted">Until {a.expiry_date}</span>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
