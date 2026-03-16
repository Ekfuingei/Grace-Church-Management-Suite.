import { useState, useEffect } from 'react'
import { Plus } from 'lucide-react'
import { PageHeader } from '@/components/shared/PageHeader'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/shared/EmptyState'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { supabase } from '@/lib/supabase'
import type { Member } from '@/types/database'
import { MemberFormDialog } from '@/components/members/MemberFormDialog'
import { Users } from 'lucide-react'

export function Members() {
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)
  const [formOpen, setFormOpen] = useState(false)
  const [editingMember, setEditingMember] = useState<Member | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Member | null>(null)

  async function load() {
    const { data } = await supabase.from('members').select('*').order('full_name')
    setMembers(data ?? [])
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [])

  const handleSave = () => {
    setFormOpen(false)
    setEditingMember(null)
    load()
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    await supabase.from('members').delete().eq('id', deleteTarget.id)
    setDeleteTarget(null)
    load()
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <PageHeader
        title="Members"
        subtitle="Church members — shared across all modules"
        actions={
          <Button onClick={() => { setEditingMember(null); setFormOpen(true) }}>
            <Plus className="h-4 w-4" />
            Add Member
          </Button>
        }
      />
      {loading ? (
        <div className="flex items-center gap-3 py-12">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-accent border-t-transparent" />
          <span className="text-muted">Loading members...</span>
        </div>
      ) : members.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No members yet"
          description="Add your first church member to get started. Members are shared across tithe, attendance, and all other modules."
          action={
            <Button onClick={() => setFormOpen(true)}>
              <Plus className="h-4 w-4" />
              Add Member
            </Button>
          }
        />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border-subtle bg-surface shadow-card">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border-subtle bg-surface-secondary/50">
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-muted">
                  Name
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-muted">
                  Member ID
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-muted">
                  Status
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-muted">
                  Phone
                </th>
                <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider text-muted">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {members.map((m) => (
                <tr
                  key={m.id}
                  className="transition-colors hover:bg-surface-secondary/30"
                >
                  <td className="px-6 py-4 font-medium text-foreground">{m.full_name}</td>
                  <td className="px-6 py-4 text-muted">{m.member_id}</td>
                  <td className="px-6 py-4">
                    <StatusBadge status={m.status} />
                  </td>
                  <td className="px-6 py-4 text-muted">{m.phone ?? '—'}</td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => { setEditingMember(m); setFormOpen(true) }}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-danger hover:bg-danger-muted hover:text-danger"
                        onClick={() => setDeleteTarget(m)}
                      >
                        Delete
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <MemberFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        member={editingMember}
        onSave={handleSave}
      />
      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Delete member?"
        description="This will remove the member from the system. This action cannot be undone."
        confirmLabel="Delete"
        variant="danger"
        onConfirm={handleDelete}
      />
    </div>
  )
}
