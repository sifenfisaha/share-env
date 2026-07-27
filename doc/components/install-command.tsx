'use client'

import { useState } from 'react'
import { Check, Copy } from 'lucide-react'

const COMMAND = 'npm install -g @sifenfisaha/share-env'

export function InstallCommand() {
  const [copied, setCopied] = useState(false)

  const copy = async () => {
    await navigator.clipboard.writeText(COMMAND)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <button
      onClick={copy}
      aria-label={copied ? 'Copied' : 'Copy install command'}
      className="group mx-auto inline-flex max-w-full items-center gap-2 rounded-full px-3 py-1.5 font-mono text-[11px] text-neutral-500 transition-colors hover:text-neutral-300 sm:text-xs"
    >
      <span className="truncate">{COMMAND}</span>
      {copied ? (
        <Check className="size-3.5 shrink-0 text-white" strokeWidth={2} />
      ) : (
        <Copy
          className="size-3.5 shrink-0 opacity-50 transition-opacity group-hover:opacity-100"
          strokeWidth={2}
        />
      )}
    </button>
  )
}
