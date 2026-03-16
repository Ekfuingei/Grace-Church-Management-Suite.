import { useState, useEffect, useRef } from 'react'
import * as Dropdown from '@radix-ui/react-dropdown-menu'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import type { Member } from '@/types/database'
import { supabase } from '@/lib/supabase'
import { Search, Loader2 } from 'lucide-react'

interface MemberSearchInputProps {
  value: Member | null
  onSelect: (member: Member) => void
  placeholder?: string
  className?: string
  disabled?: boolean
}

export function MemberSearchInput({
  value,
  onSelect,
  placeholder = 'Search member by name or ID...',
  className,
  disabled,
}: MemberSearchInputProps) {
  const [query, setQuery] = useState(value?.full_name ?? '')
  const [results, setResults] = useState<Member[]>([])
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  useEffect(() => {
    if (value) setQuery(value.full_name)
  }, [value])

  useEffect(() => {
    if (query.length < 2) {
      setResults([])
      return
    }

    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      setLoading(true)
      const { data, error } = await supabase
        .from('members')
        .select('*')
        .or(`full_name.ilike.%${query}%,member_id.ilike.%${query}%,preferred_name.ilike.%${query}%`)
        .limit(10)
      setLoading(false)
      if (!error) setResults(data ?? [])
      else setResults([])
    }, 200)

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [query])

  return (
    <Dropdown.Root open={open} onOpenChange={setOpen}>
      <div className={cn('relative', className)}>
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => query.length >= 2 && setOpen(true)}
          placeholder={placeholder}
          disabled={disabled}
          className="pl-9 pr-9"
        />
        {loading && (
          <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted" />
        )}
      </div>
      <Dropdown.Portal>
        <Dropdown.Content
          className="z-50 min-w-[var(--radix-dropdown-menu-trigger-width)] rounded-xl border border-border-subtle bg-surface p-1 shadow-soft-lg"
          align="start"
          sideOffset={4}
          onCloseAutoFocus={(e) => e.preventDefault()}
        >
          {results.length === 0 && query.length >= 2 && !loading && (
            <div className="px-3 py-6 text-center text-sm text-muted">No members found</div>
          )}
          {results.map((member) => (
            <Dropdown.Item
              key={member.id}
              className="flex cursor-pointer flex-col gap-0.5 rounded-lg px-3 py-2.5 text-sm outline-none hover:bg-surface-secondary focus:bg-surface-secondary"
              onSelect={() => {
                onSelect(member)
                setQuery(member.full_name)
                setOpen(false)
              }}
            >
              <span className="font-medium">{member.full_name}</span>
              <span className="text-xs text-muted">{member.member_id}</span>
            </Dropdown.Item>
          ))}
        </Dropdown.Content>
      </Dropdown.Portal>
    </Dropdown.Root>
  )
}
