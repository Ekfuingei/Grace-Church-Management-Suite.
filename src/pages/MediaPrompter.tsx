import { useState, useEffect, useRef, useCallback } from 'react'
import { PageHeader } from '@/components/shared/PageHeader'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Mic,
  MicOff,
  Search,
  Star,
  StarOff,
  Maximize2,
  Minimize2,
  ChevronLeft,
  ChevronRight,
  Plus,
  Trash2,
} from 'lucide-react'
import {
  MOCK_SCRIPTURES,
  HYMNS,
  getRecentItems,
  addToRecent,
  toggleFavourite,
  isFavourite,
  type PrompterItem,
} from '@/lib/media-prompter-data'
import { cn } from '@/lib/utils'

export function MediaPrompter() {
  const [scriptureQuery, setScriptureQuery] = useState('')
  const [scriptureResults, setScriptureResults] = useState<{ ref: string; text: string }[]>([])
  const [hymnQuery, setHymnQuery] = useState('')
  const [hymnResults, setHymnResults] = useState<typeof HYMNS>([])
  const [recent, setRecent] = useState<PrompterItem[]>([])
  const [setlist, setSetlist] = useState<PrompterItem[]>([])
  const [setlistIndex, setSetlistIndex] = useState(0)
  const [fullscreen, setFullscreen] = useState(false)
  const [fontSize, setFontSize] = useState(3) // 1-5 scale
  const [displayContent, setDisplayContent] = useState<PrompterItem | null>(null)
  const [listening, setListening] = useState(false)
  const recognitionRef = useRef<{ start: () => void; stop: () => void } | null>(null)

  const refreshRecentAndFavs = useCallback(() => {
    setRecent(getRecentItems())
  }, [])

  useEffect(() => {
    refreshRecentAndFavs()
  }, [refreshRecentAndFavs])

  // Scripture search
  useEffect(() => {
    if (scriptureQuery.length < 2) {
      setScriptureResults([])
      return
    }
    const q = scriptureQuery.toLowerCase()
    const matches = Object.entries(MOCK_SCRIPTURES).filter(
      ([ref, text]) =>
        ref.toLowerCase().includes(q) || text.toLowerCase().includes(q)
    )
    setScriptureResults(matches.map(([ref, text]) => ({ ref, text })).slice(0, 10))
  }, [scriptureQuery])

  // Hymn search
  useEffect(() => {
    if (hymnQuery.length < 1) {
      setHymnResults(HYMNS)
      return
    }
    const q = hymnQuery.toLowerCase()
    setHymnResults(
      HYMNS.filter(
        (h) =>
          h.title.toLowerCase().includes(q) || h.firstLine.toLowerCase().includes(q)
      )
    )
  }, [hymnQuery])

  // Voice recognition
  useEffect(() => {
    const SpeechRecognitionClass =
      (window as Window).SpeechRecognition ?? (window as Window).webkitSpeechRecognition
    if (!SpeechRecognitionClass) return
    const rec = new SpeechRecognitionClass()
    rec.continuous = true
    rec.interimResults = true
    rec.lang = 'en-US'
    rec.onresult = (e: Event) => {
      const ev = e as unknown as { results: Iterable<{ [i: number]: { transcript: string } }> }
      const transcript = Array.from(ev.results)
        .map((r) => r[0]?.transcript ?? '')
        .join('')
      if (transcript.trim()) setScriptureQuery((prev) => prev + (prev ? ' ' : '') + transcript)
    }
    rec.onend = () => setListening(false)
    rec.onerror = () => setListening(false)
    recognitionRef.current = rec
    return () => {
      if (recognitionRef.current) recognitionRef.current = null
    }
  }, [])

  const handleScriptureSelect = (ref: string, text: string) => {
    const item: PrompterItem = { type: 'scripture', ref, text }
    addToRecent(item)
    refreshRecentAndFavs()
    setDisplayContent(item)
    setScriptureQuery('')
    setScriptureResults([])
  }

  const handleHymnSelect = (hymn: (typeof HYMNS)[0]) => {
    const item: PrompterItem = { type: 'hymn', id: hymn.id, title: hymn.title, firstLine: hymn.firstLine }
    addToRecent(item)
    refreshRecentAndFavs()
    setDisplayContent(item)
  }

  const handleAddToSetlist = (item: PrompterItem) => {
    setSetlist((prev) => [...prev, item])
  }

  const handleRemoveFromSetlist = (idx: number) => {
    setSetlist((prev) => prev.filter((_, i) => i !== idx))
    if (setlistIndex >= idx && setlistIndex > 0) setSetlistIndex((i) => i - 1)
  }

  const handleFavourite = (id: string) => {
    toggleFavourite(id)
    refreshRecentAndFavs()
  }

  const setlistItem = setlist[setlistIndex]
  const fontSizes = ['text-2xl', 'text-4xl', 'text-5xl', 'text-6xl', 'text-7xl']

  if (fullscreen) {
    return (
      <div className="fixed inset-0 z-[100] flex flex-col bg-[#0f0f0f]">
        <div className="flex items-center justify-between border-b border-white/10 px-6 py-3">
          <div className="flex items-center gap-4">
            {setlist.length > 0 ? (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-accent-gold hover:bg-white/10"
                  onClick={() => setSetlistIndex((i) => Math.max(0, i - 1))}
                  disabled={setlistIndex === 0}
                >
                  <ChevronLeft className="h-5 w-5" />
                </Button>
                <span className="text-sm text-white/70">
                  {setlistIndex + 1} / {setlist.length}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-accent-gold hover:bg-white/10"
                  onClick={() => setSetlistIndex((i) => Math.min(setlist.length - 1, i + 1))}
                  disabled={setlistIndex >= setlist.length - 1}
                >
                  <ChevronRight className="h-5 w-5" />
                </Button>
              </>
            ) : null}
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  onClick={() => setFontSize(n)}
                  className={cn(
                    'rounded-lg px-2 py-1 text-xs font-medium transition-colors',
                    fontSize === n ? 'bg-accent-gold text-black' : 'bg-white/10 text-white/70 hover:bg-white/20'
                  )}
                >
                  A{n}
                </button>
              ))}
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="text-accent-gold hover:bg-white/10"
            onClick={() => setFullscreen(false)}
          >
            <Minimize2 className="h-5 w-5" />
          </Button>
        </div>
        <div className="flex flex-1 items-center justify-center p-12">
          <div
            className={cn(
              'max-w-4xl text-center font-display font-semibold text-accent-gold',
              fontSizes[fontSize - 1]
            )}
          >
            {setlistItem ? (
              setlistItem.type === 'scripture' ? (
                <div className="space-y-4">
                  <p className="opacity-90">{setlistItem.ref}</p>
                  <p className="leading-relaxed">{setlistItem.text}</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="opacity-90">{setlistItem.title}</p>
                  <p className="leading-relaxed">{setlistItem.firstLine}</p>
                </div>
              )
            ) : displayContent ? (
              displayContent.type === 'scripture' ? (
                <div className="space-y-4">
                  <p className="opacity-90">{displayContent.ref}</p>
                  <p className="leading-relaxed">{displayContent.text}</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="opacity-90">{displayContent.title}</p>
                  <p className="leading-relaxed">{displayContent.firstLine}</p>
                </div>
              )
            ) : (
              <p className="text-white/40">Select scripture or hymn to display</p>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <PageHeader
        title="Media Prompter"
        subtitle="Voice scripture & hymns for projection"
        actions={
          <Button
            onClick={() => setFullscreen(true)}
            disabled={!displayContent && setlist.length === 0}
          >
            <Maximize2 className="h-4 w-4" />
            Fullscreen
          </Button>
        }
      />

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Scripture search */}
        <div className="rounded-2xl border border-border-subtle bg-surface p-6 shadow-card">
          <h3 className="mb-4 font-display text-lg font-semibold text-foreground">Scripture Search</h3>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <Input
              value={scriptureQuery}
              onChange={(e) => setScriptureQuery(e.target.value)}
              placeholder="Type reference (e.g. John 3:16)..."
              className="pl-9 pr-20"
            />
            <Button
              variant={listening ? 'default' : 'outline'}
              size="icon"
              className="absolute right-2 top-1/2 -translate-y-1/2"
              onClick={() => {
                if (listening) {
                  recognitionRef.current?.stop()
                  setListening(false)
                } else {
                  recognitionRef.current?.start()
                  setListening(true)
                }
              }}
              title={listening ? 'Stop voice input' : 'Start voice input'}
            >
              {listening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
            </Button>
          </div>
          {scriptureResults.length > 0 && (
            <ul className="mt-3 max-h-48 space-y-1 overflow-y-auto rounded-xl border border-border-subtle bg-surface-secondary/50 p-2">
              {scriptureResults.map(({ ref, text }) => (
                <li key={ref}>
                  <button
                    type="button"
                    onClick={() => handleScriptureSelect(ref, text)}
                    className="flex w-full items-start justify-between gap-2 rounded-lg px-3 py-2 text-left text-sm hover:bg-surface-secondary"
                  >
                    <div className="min-w-0 flex-1">
                      <span className="font-medium text-foreground">{ref}</span>
                      <p className="truncate text-muted">{text}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="shrink-0"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleAddToSetlist({ type: 'scripture', ref, text })
                      }}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Hymn search */}
        <div className="rounded-2xl border border-border-subtle bg-surface p-6 shadow-card">
          <h3 className="mb-4 font-display text-lg font-semibold text-foreground">Hymn Search</h3>
          <Input
            value={hymnQuery}
            onChange={(e) => setHymnQuery(e.target.value)}
            placeholder="Search hymns..."
            className="mb-3"
          />
          <ul className="max-h-64 space-y-1 overflow-y-auto rounded-xl border border-border-subtle bg-surface-secondary/50 p-2">
            {hymnResults.map((hymn) => (
              <li key={hymn.id}>
                <button
                  type="button"
                  onClick={() => handleHymnSelect(hymn)}
                  className="flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-left text-sm hover:bg-surface-secondary"
                >
                  <div className="min-w-0 flex-1">
                    <span className="font-medium text-foreground">{hymn.title}</span>
                    <p className="truncate text-muted">{hymn.firstLine}</p>
                  </div>
                  <div className="flex shrink-0 gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleFavourite(`h:${hymn.id}`)
                      }}
                    >
                      {isFavourite(`h:${hymn.id}`) ? (
                        <Star className="h-4 w-4 fill-accent-gold text-accent-gold" />
                      ) : (
                        <StarOff className="h-4 w-4 text-muted" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleAddToSetlist({ type: 'hymn', id: hymn.id, title: hymn.title, firstLine: hymn.firstLine })
                      }}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Recently used & Favourites */}
      <div className="grid gap-8 lg:grid-cols-2">
        <div className="rounded-2xl border border-border-subtle bg-surface p-6 shadow-card">
          <h3 className="mb-4 font-display text-lg font-semibold text-foreground">Recently Used</h3>
          {recent.length === 0 ? (
            <p className="text-sm text-muted">No recent items</p>
          ) : (
            <ul className="space-y-1">
              {recent.map((item, i) => (
                <li key={i}>
                  <button
                    type="button"
                    onClick={() => setDisplayContent(item)}
                    className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm hover:bg-surface-secondary"
                  >
                    <span className="font-medium">
                      {item.type === 'scripture' ? item.ref : item.title}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleAddToSetlist(item)
                      }}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-2xl border border-border-subtle bg-surface p-6 shadow-card">
          <h3 className="mb-4 font-display text-lg font-semibold text-foreground">Service Setlist</h3>
          {setlist.length === 0 ? (
            <p className="text-sm text-muted">Add scriptures or hymns to build your setlist</p>
          ) : (
            <ul className="space-y-1">
              {setlist.map((item, i) => (
                <li
                  key={i}
                  className={cn(
                    'flex items-center justify-between rounded-lg px-3 py-2',
                    setlistIndex === i && 'bg-accent/10'
                  )}
                >
                  <button
                    type="button"
                    onClick={() => {
                      setSetlistIndex(i)
                      setDisplayContent(item)
                    }}
                    className="flex-1 text-left text-sm font-medium"
                  >
                    {item.type === 'scripture' ? item.ref : item.title}
                  </button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemoveFromSetlist(i)}
                  >
                    <Trash2 className="h-4 w-4 text-muted" />
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}
