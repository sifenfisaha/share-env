import Link from 'next/link'
import { Logo } from '@/components/logo'
import { GITHUB_URL, NPM_URL } from '@/lib/docs-index'

export function SiteNav() {
  return (
    <header className="mx-auto flex max-w-6xl items-center justify-between px-4 py-5 sm:px-6">
      <Link href="/" className="flex shrink-0 items-center gap-2 sm:gap-2.5">
        <Logo className="size-6" />
        <span className="hidden font-mono text-sm font-semibold tracking-tight text-white min-[400px]:block">
          share-env
        </span>
      </Link>
      <nav className="flex items-center gap-0.5 text-sm sm:gap-1">
        <Link
          href="/docs/what-is-share-env"
          className="rounded-full px-2.5 py-2 text-neutral-400 transition-colors hover:text-white sm:px-3.5"
        >
          Docs
        </Link>
        <a
          href={NPM_URL}
          className="hidden rounded-full px-3.5 py-2 text-neutral-400 transition-colors hover:text-white sm:block"
        >
          npm
        </a>
        <a
          href={GITHUB_URL}
          className="rounded-full px-2.5 py-2 text-neutral-400 transition-colors hover:text-white sm:px-3.5"
        >
          GitHub
        </a>
        <Link
          href="/docs/getting-started"
          className="ml-1 rounded-full bg-white px-3.5 py-2 font-medium text-black transition-opacity hover:opacity-85 sm:ml-2 sm:px-4"
        >
          Get started
        </Link>
      </nav>
    </header>
  )
}
