'use client'

import { useRef, useState } from 'react'
import { Check, Copy } from 'lucide-react'

/** <pre> wrapper for MDX code blocks: hover-revealed copy button. */
export function CopyPre(props: React.ComponentProps<'pre'>) {
  const preRef = useRef<HTMLPreElement>(null)
  const [copied, setCopied] = useState(false)

  const copy = async () => {
    const text = preRef.current?.innerText ?? ''
    await navigator.clipboard.writeText(text.trimEnd())
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="group relative">
      <pre ref={preRef} {...props} />
      <button
        onClick={copy}
        aria-label={copied ? 'Copied' : 'Copy code'}
        className="absolute right-2.5 top-2.5 rounded-lg border border-neutral-700 bg-black/60 p-1.5 text-neutral-400 opacity-0 backdrop-blur transition-opacity hover:text-white focus-visible:opacity-100 group-hover:opacity-100"
      >
        {copied ? (
          <Check className="size-3.5" strokeWidth={2} />
        ) : (
          <Copy className="size-3.5" strokeWidth={2} />
        )}
      </button>
    </div>
  )
}
