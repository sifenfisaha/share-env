'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { PanelLeft, X } from 'lucide-react'
import { docs } from '@/lib/docs-index'

function NavList({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname()
  return (
    <ul className="flex flex-col gap-1">
      {docs.map((d) => {
        const href = `/docs/${d.slug}`
        const activePage = pathname === href
        return (
          <li key={d.slug}>
            <Link
              href={href}
              onClick={onNavigate}
              aria-current={activePage ? 'page' : undefined}
              className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors ${
                activePage
                  ? 'bg-white font-medium text-black'
                  : 'text-neutral-400 hover:bg-white/5 hover:text-white'
              }`}
            >
              <d.icon className="size-4 shrink-0" strokeWidth={1.75} />
              {d.title}
            </Link>
          </li>
        )
      })}
    </ul>
  )
}

/** Desktop sidebar (lg and up). */
export function DocsSidebar() {
  return (
    <nav aria-label="Docs">
      <p className="mb-3 px-3 font-mono text-[11px] uppercase tracking-[0.2em] text-neutral-500">
        Documentation
      </p>
      <NavList />
    </nav>
  )
}

/** Mobile: a trigger button that slides in a sidebar drawer from the left. */
export function MobileDocsNav() {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()
  const current = docs.find((d) => pathname === `/docs/${d.slug}`)

  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prev
      window.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex w-full items-center gap-2.5 rounded-xl border border-white/10 bg-neutral-900 px-4 py-2.5 text-sm text-neutral-300 transition-colors hover:border-white/25"
        aria-label="Open docs navigation"
      >
        <PanelLeft className="size-4 shrink-0 text-neutral-400" strokeWidth={1.75} />
        <span className="truncate">{current ? current.title : 'Documentation'}</span>
      </button>

      {open && (
        <div
          className="modal-overlay fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setOpen(false)
          }}
        >
          <aside
            role="dialog"
            aria-modal="true"
            aria-label="Docs navigation"
            className="drawer-panel drawer-nav fixed inset-y-0 left-0 flex w-72 max-w-[85vw] flex-col overflow-y-auto border-r border-white/10 bg-neutral-950 p-4"
          >
            <div className="mb-4 flex items-center justify-between px-1">
              <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-neutral-500">
                Documentation
              </p>
              <button
                onClick={() => setOpen(false)}
                aria-label="Close navigation"
                className="grid size-8 place-items-center rounded-full border border-white/15 text-neutral-400 transition-colors hover:bg-white hover:text-black"
              >
                <X className="size-3.5" strokeWidth={2} />
              </button>
            </div>
            <NavList onNavigate={() => setOpen(false)} />
          </aside>
        </div>
      )}
    </>
  )
}
