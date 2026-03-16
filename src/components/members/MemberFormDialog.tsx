import * as Dialog from '@radix-ui/react-dialog'
import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import * as Select from '@radix-ui/react-select'
import type { Member, MemberStatus } from '@/types/database'
import { supabase } from '@/lib/supabase'
import { cn } from '@/lib/utils'

const STATUS_OPTIONS: MemberStatus[] = ['Visitor', 'Regular', 'Member', 'Inactive', 'Transferred']

interface MemberFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  member: Member | null
  onSave: () => void
}

export function MemberFormDialog({ open, onOpenChange, member, onSave }: MemberFormDialogProps) {
  const [form, setForm] = useState({
    full_name: '',
    preferred_name: '',
    member_id: '',
    status: 'Visitor' as MemberStatus,
    phone: '',
    email: '',
    address: '',
    cell_group: '',
    notes: '',
  })

  useEffect(() => {
    if (member) {
      setForm({
        full_name: member.full_name,
        preferred_name: member.preferred_name ?? '',
        member_id: member.member_id,
        status: member.status,
        phone: member.phone ?? '',
        email: member.email ?? '',
        address: member.address ?? '',
        cell_group: member.cell_group ?? '',
        notes: member.notes ?? '',
      })
    } else {
      setForm({
        full_name: '',
        preferred_name: '',
        member_id: '',
        status: 'Visitor',
        phone: '',
        email: '',
        address: '',
        cell_group: '',
        notes: '',
      })
    }
  }, [member, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const { data: { user } } = await supabase.auth.getUser()
    const payload = {
      ...form,
      preferred_name: form.preferred_name || null,
      phone: form.phone || null,
      email: form.email || null,
      address: form.address || null,
      cell_group: form.cell_group || null,
      notes: form.notes || null,
      member_id: form.member_id || undefined,
      created_by: user?.id,
    }
    if (member) {
      await supabase.from('members').update(payload).eq('id', member.id)
    } else {
      await supabase.from('members').insert(payload)
    }
    onSave()
    onOpenChange(false)
  }

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-foreground/40 backdrop-blur-sm" />
        <Dialog.Content className="fixed left-[50%] top-[50%] z-50 max-h-[90vh] w-full max-w-lg translate-x-[-50%] translate-y-[-50%] overflow-y-auto rounded-2xl border border-border-subtle bg-surface p-6 shadow-soft-lg animate-fade-in">
          <Dialog.Title className="font-display text-xl font-semibold text-foreground">
            {member ? 'Edit Member' : 'Add Member'}
          </Dialog.Title>
          <form onSubmit={handleSubmit} className="mt-6 space-y-5">
            <div className="grid gap-5 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="full_name" className="text-foreground-muted">Full Name *</Label>
                <Input
                  id="full_name"
                  value={form.full_name}
                  onChange={(e) => setForm((f) => ({ ...f, full_name: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="preferred_name" className="text-foreground-muted">Preferred Name</Label>
                <Input
                  id="preferred_name"
                  value={form.preferred_name}
                  onChange={(e) => setForm((f) => ({ ...f, preferred_name: e.target.value }))}
                />
              </div>
            </div>
            <div className="grid gap-5 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="member_id" className="text-foreground-muted">Member ID</Label>
                <Input
                  id="member_id"
                  value={form.member_id}
                  onChange={(e) => setForm((f) => ({ ...f, member_id: e.target.value }))}
                  placeholder="Auto-generated if empty"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-foreground-muted">Status</Label>
                <Select.Root
                  value={form.status}
                  onValueChange={(v) => setForm((f) => ({ ...f, status: v as MemberStatus }))}
                >
                  <Select.Trigger className="flex h-10 w-full items-center justify-between rounded-xl border border-border-subtle bg-surface px-4 py-2 text-sm">
                    <Select.Value />
                  </Select.Trigger>
                  <Select.Portal>
                    <Select.Content className="rounded-xl border border-border-subtle bg-surface p-1 shadow-soft-lg">
                      {STATUS_OPTIONS.map((s) => (
                        <Select.Item
                          key={s}
                          value={s}
                          className="cursor-pointer rounded-lg px-3 py-2 outline-none hover:bg-surface-secondary"
                        >
                          {s}
                        </Select.Item>
                      ))}
                    </Select.Content>
                  </Select.Portal>
                </Select.Root>
              </div>
            </div>
            <div className="grid gap-5 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="phone" className="text-foreground-muted">Phone</Label>
                <Input
                  id="phone"
                  value={form.phone}
                  onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email" className="text-foreground-muted">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="address" className="text-foreground-muted">Address</Label>
              <Input
                id="address"
                value={form.address}
                onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cell_group" className="text-foreground-muted">Cell Group</Label>
              <Input
                id="cell_group"
                value={form.cell_group}
                onChange={(e) => setForm((f) => ({ ...f, cell_group: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes" className="text-foreground-muted">Notes</Label>
              <textarea
                id="notes"
                rows={3}
                value={form.notes}
                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                className={cn(
                  'flex w-full rounded-xl border border-border-subtle bg-surface px-4 py-2.5 text-sm',
                  'placeholder:text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30 focus-visible:border-accent'
                )}
              />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit">Save</Button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
