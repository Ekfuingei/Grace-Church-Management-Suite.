import { useState, useEffect } from 'react'
import { Plus, Download, Banknote } from 'lucide-react'
import { PageHeader } from '@/components/shared/PageHeader'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { EmptyState } from '@/components/shared/EmptyState'
import { MemberSearchInput } from '@/components/shared/MemberSearchInput'
import { supabase } from '@/lib/supabase'
import type { Member, GivingRecord, GivingType, PaymentMethod } from '@/types/database'
import { jsPDF } from 'jspdf'
import { cn } from '@/lib/utils'

const GIVING_TYPES: GivingType[] = [
  'Tithe',
  'First Fruit',
  'Offering',
  'Special Seed',
  'Building Fund',
  'Mission Fund',
  'Other',
]
const PAYMENT_METHODS: PaymentMethod[] = ['Cash', 'Mobile Money', 'Bank Transfer', 'Cheque', 'Card']

export function Tithe() {
  const [records, setRecords] = useState<(GivingRecord & { members?: { full_name?: string; member_id?: string } })[]>([])
  const [loading, setLoading] = useState(true)
  const [formOpen, setFormOpen] = useState(false)
  const [selectedMember, setSelectedMember] = useState<Member | null>(null)
  const [churchCurrency, setChurchCurrency] = useState('XAF')
  const [form, setForm] = useState({
    amount: '',
    currency: 'XAF',
    giving_type: 'Tithe' as GivingType,
    payment_method: 'Cash' as PaymentMethod,
    date: new Date().toISOString().slice(0, 10),
    service_type: '' as '' | 'Sunday Morning' | 'Sunday Evening' | 'Midweek' | 'Special' | 'Other',
    notes: '',
  })

  async function loadRecords() {
    const { data } = await supabase
      .from('giving_records')
      .select(`
        *,
        members (id, full_name, member_id)
      `)
      .order('date', { ascending: false })
      .limit(100)
    setRecords((data ?? []) as (GivingRecord & { members?: { full_name?: string; member_id?: string } })[])
    setLoading(false)
  }

  async function loadCurrency() {
    const { data } = await supabase.from('church_settings').select('currency').single()
    if (data?.currency) setChurchCurrency(data.currency)
  }

  useEffect(() => {
    loadRecords()
    loadCurrency()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedMember) return
    const { data: { user } } = await supabase.auth.getUser()
    await supabase.from('giving_records').insert({
      member_id: selectedMember.id,
      amount: parseFloat(form.amount),
      currency: form.currency || churchCurrency,
      giving_type: form.giving_type,
      payment_method: form.payment_method,
      date: form.date,
      service_type: form.service_type || null,
      notes: form.notes || null,
      recorded_by: user?.id,
      receipt_number: `R-${Date.now()}`,
    })
    setFormOpen(false)
    setSelectedMember(null)
    setForm({ amount: '', currency: churchCurrency, giving_type: 'Tithe', payment_method: 'Cash', date: new Date().toISOString().slice(0, 10), service_type: '', notes: '' })
    loadRecords()
  }

  const handleDownloadPDF = (record: GivingRecord & { members?: { full_name?: string; member_id?: string } }) => {
    const doc = new jsPDF()
    const member = record.members
    doc.setFontSize(18)
    doc.text('Grace Church - Giving Receipt', 14, 20)
    doc.setFontSize(10)
    doc.text(`Date: ${record.date}`, 14, 30)
    doc.text(`Member: ${member?.full_name ?? '—'} (${member?.member_id ?? '—'})`, 14, 36)
    doc.text(`Amount: ${record.amount} ${record.currency}`, 14, 42)
    doc.text(`Type: ${record.giving_type}`, 14, 48)
    doc.text(`Payment: ${record.payment_method}`, 14, 54)
    doc.text(`Receipt: ${record.receipt_number ?? '—'}`, 14, 60)
    if (record.notes) doc.text(`Notes: ${record.notes}`, 14, 66)
    doc.save(`receipt-${record.receipt_number ?? record.id}.pdf`)
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <PageHeader
        title="Tithe & Offering Recorder"
        subtitle="Record giving and generate PDF statements"
        actions={
          <Button onClick={() => setFormOpen(true)}>
            <Plus className="h-4 w-4" />
            Record Giving
          </Button>
        }
      />

      {formOpen && (
        <div className="rounded-2xl border border-border-subtle bg-surface p-6 shadow-card">
          <h3 className="mb-4 font-display text-lg font-semibold">Record Giving</h3>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label>Member *</Label>
              <MemberSearchInput
                value={selectedMember}
                onSelect={setSelectedMember}
                placeholder="Search member..."
              />
            </div>
            <div className="grid gap-5 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="amount">Amount *</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.amount}
                  onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="currency">Currency</Label>
                <Input
                  id="currency"
                  value={form.currency}
                  onChange={(e) => setForm((f) => ({ ...f, currency: e.target.value }))}
                />
              </div>
            </div>
            <div className="grid gap-5 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Giving Type</Label>
                <select
                  value={form.giving_type}
                  onChange={(e) => setForm((f) => ({ ...f, giving_type: e.target.value as GivingType }))}
                  className="flex h-10 w-full rounded-xl border border-border-subtle bg-surface px-4 py-2.5 text-sm"
                >
                  {GIVING_TYPES.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label>Payment Method</Label>
                <select
                  value={form.payment_method}
                  onChange={(e) => setForm((f) => ({ ...f, payment_method: e.target.value as PaymentMethod }))}
                  className="flex h-10 w-full rounded-xl border border-border-subtle bg-surface px-4 py-2.5 text-sm"
                >
                  {PAYMENT_METHODS.map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="grid gap-5 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="date">Date</Label>
                <Input
                  id="date"
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Service Type</Label>
                <select
                  value={form.service_type}
                  onChange={(e) => setForm((f) => ({ ...f, service_type: e.target.value as typeof form.service_type }))}
                  className="flex h-10 w-full rounded-xl border border-border-subtle bg-surface px-4 py-2.5 text-sm"
                >
                  <option value="">—</option>
                  <option value="Sunday Morning">Sunday Morning</option>
                  <option value="Sunday Evening">Sunday Evening</option>
                  <option value="Midweek">Midweek</option>
                  <option value="Special">Special</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <textarea
                id="notes"
                rows={2}
                value={form.notes}
                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                className={cn(
                  'flex w-full rounded-xl border border-border-subtle bg-surface px-4 py-2.5 text-sm',
                  'placeholder:text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30'
                )}
              />
            </div>
            <div className="flex gap-3">
              <Button type="submit" disabled={!selectedMember || !form.amount}>Save</Button>
              <Button type="button" variant="outline" onClick={() => { setFormOpen(false); setSelectedMember(null) }}>
                Cancel
              </Button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="flex items-center gap-3 py-12">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-accent border-t-transparent" />
          <span className="text-muted">Loading...</span>
        </div>
      ) : records.length === 0 ? (
        <EmptyState
          icon={Banknote}
          title="No giving records yet"
          description="Record your first tithe or offering to get started."
          action={
            <Button onClick={() => setFormOpen(true)}>
              <Plus className="h-4 w-4" />
              Record Giving
            </Button>
          }
        />
      ) : (
        <div className="rounded-2xl border border-border-subtle bg-surface shadow-card overflow-hidden">
          <div className="border-b border-border-subtle bg-surface-secondary/50 px-6 py-4">
            <h3 className="font-display text-lg font-semibold">Giving History</h3>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border-subtle bg-surface-secondary/50">
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-muted">Member</th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-muted">Date</th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-muted">Type</th>
                <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider text-muted">Amount</th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-muted">Payment</th>
                <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider text-muted">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {records.map((r) => (
                <tr key={r.id} className="hover:bg-surface-secondary/30">
                  <td className="px-6 py-4 font-medium">
                    {(r as { members?: { full_name?: string } }).members?.full_name ?? '—'}
                  </td>
                  <td className="px-6 py-4 text-muted">{r.date}</td>
                  <td className="px-6 py-4">{r.giving_type}</td>
                  <td className="px-6 py-4 text-right font-medium">{r.amount} {r.currency}</td>
                  <td className="px-6 py-4 text-muted">{r.payment_method}</td>
                  <td className="px-6 py-4 text-right">
                    <Button variant="ghost" size="sm" onClick={() => handleDownloadPDF(r)}>
                      <Download className="h-4 w-4" />
                      PDF
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
