'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Search, X, ArrowUpRight } from 'lucide-react'
import { docs } from '@/lib/docs-index'

const POPULAR = [
  'keygen',
  'team setup',
  'offboarding',
  'CI',
  'conflicts',
  'security',
  'install',
  'passphrase',
]

export function DocSearch() {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const typing =
        document.activeElement?.tagName === 'INPUT' ||
        document.activeElement?.tagName === 'TEXTAREA'
      if ((e.key === '/' && !typing) || ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k')) {
        e.preventDefault()
        setOpen(true)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  return (
    <>
      {/* trigger: styled like an input, opens the modal */}
      <button
        onClick={() => setOpen(true)}
        className="mx-auto flex w-full max-w-md items-center gap-2.5 rounded-full border border-white/25 bg-white/10 px-5 py-3 text-left backdrop-blur-sm transition-colors hover:border-white/50 focus-visible:border-white/60 focus-visible:outline-none"
      >
        <Search className="size-4 shrink-0 text-neutral-400" strokeWidth={2} />
        <span className="flex-1 text-sm text-neutral-400">Search the docs</span>
        <kbd className="hidden shrink-0 rounded border border-white/20 px-1.5 py-0.5 font-mono text-[10px] text-neutral-400 sm:block">
          /
        </kbd>
      </button>

      {open && <SearchModal onClose={() => setOpen(false)} />}
    </>
  )
}

function SearchModal({ onClose }: { onClose: () => void }) {
  const [query, setQuery] = useState('')
  const [active, setActive] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  const q = query.trim().toLowerCase()
  const results = q
    ? docs.filter((d) => `${d.title} ${d.description} ${d.keywords}`.toLowerCase().includes(q))
    : []

  // lock page scroll while open
  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    inputRef.current?.focus()
    return () => {
      document.body.style.overflow = prev
    }
  }, [])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const go = useCallback(
    (slug: string) => {
      onClose()
      router.push(`/docs/${slug}`)
    },
    [onClose, router]
  )

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Search the docs"
      className="modal-overlay fixed inset-0 z-50 bg-black/60 backdrop-blur-md"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="modal-panel mx-auto mt-[8vh] w-full max-w-2xl px-4 sm:mt-[12vh]">
        {/* header */}
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-xl font-semibold tracking-tight text-white">Search</h2>
          <button
            onClick={onClose}
            aria-label="Close search"
            className="grid size-10 place-items-center rounded-full border border-white/15 bg-neutral-900 text-neutral-300 transition-colors hover:bg-white hover:text-black"
          >
            <X className="size-4" strokeWidth={2} />
          </button>
        </div>

        {/* input */}
        <div className="flex items-center gap-3 rounded-full border border-white/15 bg-neutral-900 px-5 py-4 transition-colors focus-within:border-white/40">
          <Search className="size-4 shrink-0 text-neutral-400" strokeWidth={2} />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setActive(0)
            }}
            onKeyDown={(e) => {
              if (e.key === 'ArrowDown') {
                e.preventDefault()
                setActive((a) => Math.min(a + 1, results.length - 1))
              } else if (e.key === 'ArrowUp') {
                e.preventDefault()
                setActive((a) => Math.max(a - 1, 0))
              } else if (e.key === 'Enter' && results[active]) {
                go(results[active].slug)
              }
            }}
            placeholder="Search the docs"
            className="w-full bg-transparent font-mono text-sm text-white placeholder:text-neutral-500 focus:outline-none"
          />
          {query && (
            <button
              onClick={() => {
                setQuery('')
                inputRef.current?.focus()
              }}
              aria-label="Clear search"
              className="shrink-0 font-mono text-[11px] text-neutral-500 transition-colors hover:text-white"
            >
              clear
            </button>
          )}
        </div>

        {/* panel */}
        <div className="mt-4 rounded-3xl border border-white/10 bg-neutral-900 p-6">
          {q === '' ? (
            <>
              <p className="mb-4 text-sm text-neutral-400">Popular topics</p>
              <div className="flex flex-wrap gap-2.5">
                {POPULAR.map((topic) => (
                  <button
                    key={topic}
                    onClick={() => {
                      setQuery(topic)
                      inputRef.current?.focus()
                    }}
                    className="rounded-full bg-white/10 px-4 py-2 font-mono text-sm text-neutral-200 transition-colors hover:bg-white hover:text-black"
                  >
                    {topic}
                  </button>
                ))}
              </div>
            </>
          ) : results.length === 0 ? (
            <p className="py-2 text-sm text-neutral-400">
              No results for <span className="text-white">“{query.trim()}”</span>. Try one of:{' '}
              {POPULAR.slice(0, 3).map((t, i) => (
                <button
                  key={t}
                  onClick={() => setQuery(t)}
                  className="font-mono text-white underline decoration-neutral-600 underline-offset-4 hover:decoration-white"
                >
                  {t}
                  {i < 2 ? ', ' : ''}
                </button>
              ))}
            </p>
          ) : (
            <ul className="-m-2">
              {results.map((d, i) => (
                <li key={d.slug}>
                  <button
                    onMouseEnter={() => setActive(i)}
                    onClick={() => go(d.slug)}
                    className={`group flex w-full items-center gap-4 rounded-2xl p-4 text-left transition-colors ${
                      i === active ? 'bg-white/10' : ''
                    }`}
                  >
                    <span
                      className={`grid size-9 shrink-0 place-items-center rounded-xl border transition-colors ${
                        i === active ? 'border-white bg-white' : 'border-white/15'
                      }`}
                    >
                      <d.icon
                        className={`size-4 ${i === active ? 'text-black' : 'text-neutral-300'}`}
                        strokeWidth={1.75}
                      />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-white">
                        {d.title}
                      </span>
                      <span className="block truncate text-xs text-neutral-400">
                        {d.description}
                      </span>
                    </span>
                    <ArrowUpRight
                      className={`size-4 shrink-0 transition-opacity ${
                        i === active ? 'text-white opacity-100' : 'opacity-0'
                      }`}
                      strokeWidth={2}
                    />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <p className="mt-4 text-center font-mono text-[11px] text-neutral-500">
          ↑↓ navigate · enter open · esc close
        </p>
      </div>
    </div>
  )
}
