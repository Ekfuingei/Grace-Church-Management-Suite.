import { useState, useEffect } from 'react'
import { Plus, Calendar, Users, AlertTriangle, Trash2, Pencil } from 'lucide-react'
import { PageHeader } from '@/components/shared/PageHeader'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { EmptyState } from '@/components/shared/EmptyState'
import { MemberSearchInput } from '@/components/shared/MemberSearchInput'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { supabase } from '@/lib/supabase'
import type { Department, Service, Member, RotaAssignment } from '@/types/database'
import * as Dialog from '@radix-ui/react-dialog'
import { cn } from '@/lib/utils'

export function Rota() {
  const [departments, setDepartments] = useState<Department[]>([])
  const [services, setServices] = useState<Service[]>([])
  const [assignments, setAssignments] = useState<(RotaAssignment & { members?: { full_name?: string }; departments?: { name?: string; color?: string } })[]>([])
  const [members, setMembers] = useState<Member[]>([])
  const [, setLoading] = useState(true)
  const [deptFormOpen, setDeptFormOpen] = useState(false)
  const [editingDept, setEditingDept] = useState<Department | null>(null)
  const [assignOpen, setAssignOpen] = useState(false)
  const [selectedService, setSelectedService] = useState<Service | null>(null)
  const [selectedDept, setSelectedDept] = useState<Department | null>(null)
  const [deleteDept, setDeleteDept] = useState<Department | null>(null)
  const [deptForm, setDeptForm] = useState({ name: '', color: '#A67C52', max_volunteers: 5 })
  const [assignMember, setAssignMember] = useState<Member | null>(null)
  const [assignRole, setAssignRole] = useState('')

  async function loadDepartments() {
    const { data } = await supabase.from('departments').select('*').order('name')
    setDepartments(data ?? [])
  }

  async function loadServices() {
    const { data } = await supabase.from('services').select('*').order('date', { ascending: false }).limit(30)
    setServices(data ?? [])
  }

  async function loadAssignments(serviceId?: string) {
    let q = supabase.from('rota_assignments').select('*, members(full_name), departments(name, color)')
    if (serviceId) q = q.eq('service_id', serviceId)
    const { data } = await q.order('department_id')
    setAssignments((data ?? []) as (RotaAssignment & { members?: { full_name?: string }; departments?: { name?: string; color?: string } })[])
  }

  async function loadMembers() {
    const { data } = await supabase.from('members').select('*').order('full_name')
    setMembers(data ?? [])
  }

  useEffect(() => {
    loadDepartments()
    loadServices()
    loadMembers()
    setLoading(false)
  }, [])

  useEffect(() => {
    loadAssignments(selectedService?.id)
  }, [selectedService])

  const handleSaveDept = async (e: React.FormEvent) => {
    e.preventDefault()
    if (editingDept) {
      await supabase.from('departments').update(deptForm).eq('id', editingDept.id)
    } else {
      await supabase.from('departments').insert(deptForm)
    }
    setDeptFormOpen(false)
    setEditingDept(null)
    setDeptForm({ name: '', color: '#A67C52', max_volunteers: 5 })
    loadDepartments()
  }

  const handleDeleteDept = async () => {
    if (!deleteDept) return
    await supabase.from('departments').delete().eq('id', deleteDept.id)
    setDeleteDept(null)
    loadDepartments()
    loadAssignments(selectedService?.id)
  }

  const handleAddAssignment = async () => {
    if (!selectedService || !selectedDept || !assignMember) return
    await supabase.from('rota_assignments').insert({
      service_id: selectedService.id,
      member_id: assignMember.id,
      department_id: selectedDept.id,
      role: assignRole || null,
      status: 'Pending',
    })
    setAssignMember(null)
    setAssignRole('')
    setAssignOpen(false)
    loadAssignments(selectedService.id)
  }

  const handleRemoveAssignment = async (id: string) => {
    await supabase.from('rota_assignments').delete().eq('id', id)
    loadAssignments(selectedService?.id)
  }

  const serviceAssignments = selectedService
    ? assignments.filter((a) => a.service_id === selectedService.id)
    : []
  const byDept = departments.map((d) => ({
    dept: d,
    items: serviceAssignments.filter((a) => a.department_id === d.id),
  }))

  const conflicts = serviceAssignments.reduce<Map<string, string[]>>((acc, a) => {
    const key = a.member_id
    if (!acc.has(key)) acc.set(key, [])
    const deptName = (a as { departments?: { name?: string } }).departments?.name ?? 'Unknown'
    if (!acc.get(key)!.includes(deptName)) acc.get(key)!.push(deptName)
    return acc
  }, new Map())
  const conflictMembers = Array.from(conflicts.entries()).filter(([, depts]) => depts.length > 1)

  return (
    <div className="space-y-8 animate-fade-in">
      <PageHeader
        title="Volunteer Rota Manager"
        subtitle="Schedule volunteers across departments"
        actions={
          <Button onClick={() => { setEditingDept(null); setDeptForm({ name: '', color: '#A67C52', max_volunteers: 5 }); setDeptFormOpen(true) }}>
            <Plus className="h-4 w-4" />
            Add Department
          </Button>
        }
      />

      {deptFormOpen && (
        <Dialog.Root open={deptFormOpen} onOpenChange={setDeptFormOpen}>
          <Dialog.Portal>
            <Dialog.Overlay className="fixed inset-0 z-50 bg-foreground/40 backdrop-blur-sm" />
            <Dialog.Content className="fixed left-[50%] top-[50%] z-50 w-full max-w-md translate-x-[-50%] translate-y-[-50%] rounded-2xl border border-border-subtle bg-surface p-6 shadow-soft-lg">
              <Dialog.Title className="font-display text-xl font-semibold">{editingDept ? 'Edit Department' : 'Add Department'}</Dialog.Title>
              <form onSubmit={handleSaveDept} className="mt-6 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="dept_name">Name</Label>
                  <Input id="dept_name" value={deptForm.name} onChange={(e) => setDeptForm((f) => ({ ...f, name: e.target.value }))} required />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="dept_color">Color</Label>
                    <div className="flex gap-2">
                      <Input id="dept_color" type="color" value={deptForm.color} onChange={(e) => setDeptForm((f) => ({ ...f, color: e.target.value }))} className="h-10 w-14 p-1 cursor-pointer" />
                      <Input value={deptForm.color} onChange={(e) => setDeptForm((f) => ({ ...f, color: e.target.value }))} className="flex-1" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="dept_max">Max Volunteers</Label>
                    <Input id="dept_max" type="number" min="1" value={deptForm.max_volunteers} onChange={(e) => setDeptForm((f) => ({ ...f, max_volunteers: parseInt(e.target.value) || 5 }))} />
                  </div>
                </div>
                <div className="flex gap-3 pt-2">
                  <Button type="submit">Save</Button>
                  <Button type="button" variant="outline" onClick={() => setDeptFormOpen(false)}>Cancel</Button>
                </div>
              </form>
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>
      )}

      <ConfirmDialog
        open={!!deleteDept}
        onOpenChange={(o) => !o && setDeleteDept(null)}
        title="Delete department?"
        description="This will remove the department and all its rota assignments."
        confirmLabel="Delete"
        variant="danger"
        onConfirm={handleDeleteDept}
      />

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="space-y-6">
          <div>
            <h3 className="mb-4 font-display text-lg font-semibold">Departments</h3>
            {departments.length === 0 ? (
              <EmptyState icon={Users} title="No departments" description="Add departments for your volunteer teams." />
            ) : (
              <ul className="space-y-1 rounded-2xl border border-border-subtle bg-surface p-2">
                {departments.map((d) => (
                  <li key={d.id} className="flex items-center justify-between rounded-xl px-4 py-3 hover:bg-surface-secondary">
                    <div className="flex items-center gap-2">
                      <span className="h-3 w-3 rounded-full" style={{ backgroundColor: d.color }} />
                      <span className="font-medium">{d.name}</span>
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => { setEditingDept(d); setDeptForm({ name: d.name, color: d.color, max_volunteers: d.max_volunteers }); setDeptFormOpen(true) }}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="text-danger" onClick={() => setDeleteDept(d)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div>
            <h3 className="mb-4 font-display text-lg font-semibold">Services</h3>
            {services.length === 0 ? (
              <EmptyState icon={Calendar} title="No services" description="Create services in the Attendance module first." />
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
                      {s.date} — {s.service_type}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="lg:col-span-2 space-y-6">
          {selectedService && (
            <>
              <div className="flex items-center justify-between">
                <h3 className="font-display text-lg font-semibold">Rota: {selectedService.date}</h3>
                <Button onClick={() => setAssignOpen(true)}>
                  <Plus className="h-4 w-4" />
                  Assign Volunteer
                </Button>
              </div>

              {conflictMembers.length > 0 && (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 shrink-0 text-amber-600" />
                  <div>
                    <p className="font-medium text-amber-800">Conflict detected</p>
                    <p className="text-sm text-amber-700 mt-1">Same person assigned to multiple departments:</p>
                    <ul className="mt-2 space-y-1 text-sm">
                      {conflictMembers.map(([memberId, depts]) => {
                        const m = members.find((x) => x.id === memberId)
                        return (
                          <li key={memberId}>
                            {m?.full_name ?? 'Unknown'} → {depts.join(', ')}
                          </li>
                        )
                      })}
                    </ul>
                  </div>
                </div>
              )}

              <div className="space-y-4">
                {byDept.map(({ dept, items }) => (
                  <div key={dept.id} className="rounded-2xl border border-border-subtle bg-surface overflow-hidden">
                    <div className="flex items-center justify-between border-b border-border-subtle px-6 py-3" style={{ borderLeftWidth: 4, borderLeftColor: dept.color }}>
                      <h4 className="font-semibold">{dept.name}</h4>
                      <span className="text-sm text-muted">{items.length} / {dept.max_volunteers}</span>
                    </div>
                    <ul className="divide-y divide-border-subtle">
                      {items.map((a) => (
                        <li key={a.id} className="flex items-center justify-between px-6 py-3 hover:bg-surface-secondary/50">
                          <span className="font-medium">{(a as { members?: { full_name?: string } }).members?.full_name ?? '—'}</span>
                          <div className="flex items-center gap-2">
                            {a.role && <span className="text-sm text-muted">{a.role}</span>}
                            <Button variant="ghost" size="sm" className="text-danger" onClick={() => handleRemoveAssignment(a.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </li>
                      ))}
                      {items.length === 0 && <li className="px-6 py-4 text-sm text-muted">No volunteers assigned</li>}
                    </ul>
                  </div>
                ))}
              </div>
            </>
          )}

          {!selectedService && (
            <EmptyState icon={Calendar} title="Select a service" description="Choose a service to build the volunteer rota." />
          )}
        </div>
      </div>

      {assignOpen && selectedService && (
        <Dialog.Root open={assignOpen} onOpenChange={setAssignOpen}>
          <Dialog.Portal>
            <Dialog.Overlay className="fixed inset-0 z-50 bg-foreground/40 backdrop-blur-sm" />
            <Dialog.Content className="fixed left-[50%] top-[50%] z-50 w-full max-w-md translate-x-[-50%] translate-y-[-50%] rounded-2xl border border-border-subtle bg-surface p-6 shadow-soft-lg">
              <Dialog.Title className="font-display text-xl font-semibold">Assign Volunteer</Dialog.Title>
              <div className="mt-6 space-y-4">
                <div className="space-y-2">
                  <Label>Department</Label>
                  <select
                    value={selectedDept?.id ?? ''}
                    onChange={(e) => setSelectedDept(departments.find((d) => d.id === e.target.value) ?? null)}
                    className="flex h-10 w-full rounded-xl border border-border-subtle bg-surface px-4 py-2.5 text-sm"
                  >
                    <option value="">Select...</option>
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Member</Label>
                  <MemberSearchInput value={assignMember} onSelect={setAssignMember} placeholder="Search member..." />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role">Role (optional)</Label>
                  <Input id="role" value={assignRole} onChange={(e) => setAssignRole(e.target.value)} placeholder="e.g. Lead" />
                </div>
                <div className="flex gap-3 pt-2">
                  <Button onClick={handleAddAssignment} disabled={!selectedDept || !assignMember}>Add</Button>
                  <Button variant="outline" onClick={() => setAssignOpen(false)}>Cancel</Button>
                </div>
              </div>
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>
      )}
    </div>
  )
}
