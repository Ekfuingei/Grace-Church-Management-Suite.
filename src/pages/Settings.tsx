import { useState, useEffect } from 'react'
import { PageHeader } from '@/components/shared/PageHeader'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { supabase } from '@/lib/supabase'
import type { ChurchSettings } from '@/types/database'

export function Settings() {
  const [settings, setSettings] = useState<ChurchSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    church_name: '',
    address: '',
    phone: '',
    email: '',
    currency: 'XAF',
  })

  useEffect(() => {
    async function load() {
      const { data } = await supabase.from('church_settings').select('*').single()
      if (data) {
        setSettings(data)
        setForm({
          church_name: data.church_name ?? '',
          address: data.address ?? '',
          phone: data.phone ?? '',
          email: data.email ?? '',
          currency: data.currency ?? 'XAF',
        })
      }
      setLoading(false)
    }
    load()
  }, [])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    if (settings) {
      await supabase.from('church_settings').update(form).eq('id', settings.id)
    } else {
      const { data } = await supabase.from('church_settings').insert(form).select().single()
      if (data) setSettings(data)
    }
    setSaving(false)
  }

  if (loading) {
    return (
      <div className="flex items-center gap-3 py-12">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-accent border-t-transparent" />
        <span className="text-muted">Loading settings...</span>
      </div>
    )
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <PageHeader
        title="Church Settings"
        subtitle="Configure church name, currency, and contact details"
      />
      <Card>
        <CardHeader>
          <CardTitle>General</CardTitle>
          <CardDescription>Church information displayed across the app</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSave} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="church_name" className="text-foreground-muted">Church Name</Label>
              <Input
                id="church_name"
                value={form.church_name}
                onChange={(e) => setForm((f) => ({ ...f, church_name: e.target.value }))}
                placeholder="Grace Church"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="address" className="text-foreground-muted">Address</Label>
              <Input
                id="address"
                value={form.address}
                onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
                placeholder="123 Church Street"
              />
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
              <Label htmlFor="currency" className="text-foreground-muted">Currency</Label>
              <Input
                id="currency"
                value={form.currency}
                onChange={(e) => setForm((f) => ({ ...f, currency: e.target.value }))}
                placeholder="XAF"
              />
            </div>
            <Button type="submit" disabled={saving} className="mt-2">
              {saving ? 'Saving...' : 'Save Settings'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
