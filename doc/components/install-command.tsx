'use client'

import { useState } from 'react'
import { Check, Copy } from 'lucide-react'

const MANAGERS = {
  npm: 'npm install -g @sifenfisaha/share-env',
  pnpm: 'pnpm add -g @sifenfisaha/share-env',
  bun: 'bun add -g @sifenfisaha/share-env',
} as const

type Manager = keyof typeof MANAGERS

function useCopy() {
  const [copied, setCopied] = useState(false)
  const copy = async (text: string) => {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  return { copied, copy }
}

/** Compact hero version: manager toggle + click-to-copy command line. */
export function InstallCommand() {
  const [pm, setPm] = useState<Manager>('npm')
  const { copied, copy } = useCopy()

  return (
    <div className="mx-auto flex max-w-full flex-col items-center gap-2.5">
      <div
        role="tablist"
        aria-label="Package manager"
        className="flex rounded-full border border-white/15 bg-white/5 p-0.5"
      >
        {(Object.keys(MANAGERS) as Manager[]).map((m) => (
          <button
            key={m}
            role="tab"
            aria-selected={pm === m}
            onClick={() => setPm(m)}
            className={`rounded-full px-3 py-1 font-mono text-[10px] transition-colors ${
              pm === m ? 'bg-white text-black' : 'text-neutral-400 hover:text-white'
            }`}
          >
            {m}
          </button>
        ))}
      </div>
      <button
        onClick={() => copy(MANAGERS[pm])}
        aria-label={copied ? 'Copied' : 'Copy install command'}
        className="group inline-flex max-w-full items-center gap-2 rounded-full px-3 py-1 font-mono text-[11px] text-neutral-500 transition-colors hover:text-neutral-300 sm:text-xs"
      >
        <span className="truncate">{MANAGERS[pm]}</span>
        {copied ? (
          <Check className="size-3.5 shrink-0 text-white" strokeWidth={2} />
        ) : (
          <Copy
            className="size-3.5 shrink-0 opacity-50 transition-opacity group-hover:opacity-100"
            strokeWidth={2}
          />
        )}
      </button>
    </div>
  )
}

/** Docs version: a code-block style panel with manager tabs and a copy button. */
export function InstallTabs() {
  const [pm, setPm] = useState<Manager>('npm')
  const { copied, copy } = useCopy()

  return (
    <div className="not-prose overflow-hidden rounded-xl border border-neutral-800 bg-black">
      <div className="flex items-center justify-between border-b border-neutral-800 px-2 py-1.5">
        <div role="tablist" aria-label="Package manager" className="flex gap-1">
          {(Object.keys(MANAGERS) as Manager[]).map((m) => (
            <button
              key={m}
              role="tab"
              aria-selected={pm === m}
              onClick={() => setPm(m)}
              className={`rounded-lg px-3 py-1.5 font-mono text-xs transition-colors ${
                pm === m
                  ? 'bg-white/10 text-white'
                  : 'text-neutral-500 hover:text-white'
              }`}
            >
              {m}
            </button>
          ))}
        </div>
        <button
          onClick={() => copy(MANAGERS[pm])}
          aria-label={copied ? 'Copied' : 'Copy command'}
          className="rounded-lg p-2 text-neutral-500 transition-colors hover:text-white"
        >
          {copied ? (
            <Check className="size-3.5" strokeWidth={2} />
          ) : (
            <Copy className="size-3.5" strokeWidth={2} />
          )}
        </button>
      </div>
      <pre className="overflow-x-auto p-4 text-[13px] leading-relaxed text-neutral-100">
        {MANAGERS[pm]}
      </pre>
    </div>
  )
}
