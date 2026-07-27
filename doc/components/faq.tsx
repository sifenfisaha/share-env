import { ChevronDown } from 'lucide-react'
import { faqs } from '@/lib/docs-index'

export function Faq() {
  return (
    <div className="border-t border-neutral-800">
      {faqs.map((item) => (
        <details key={item.q} className="group border-b border-neutral-800">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-5 text-[15px] font-medium text-white [&::-webkit-details-marker]:hidden">
            {item.q}
            <ChevronDown
              className="size-4 shrink-0 text-neutral-500 transition-transform duration-200 group-open:rotate-180"
              strokeWidth={2}
            />
          </summary>
          <p className="max-w-3xl pb-6 text-[15px] leading-relaxed text-neutral-400">{item.a}</p>
        </details>
      ))}
    </div>
  )
}
