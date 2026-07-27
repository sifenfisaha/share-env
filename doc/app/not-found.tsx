import Link from 'next/link'
import { DocSearch } from '@/components/doc-search'
import { HeroArt } from '@/components/hero-art'
import { SiteNav } from '@/components/site-nav'

export default function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col">
      <SiteNav />
      <main className="mx-auto flex w-full max-w-6xl flex-1 px-4 pb-10 sm:px-6">
        <section className="relative flex flex-1 items-center justify-center overflow-hidden rounded-3xl border border-white/10 bg-black">
          <HeroArt />
          <div className="relative z-10 px-5 py-20 text-center sm:px-6">
            <p className="mb-4 font-mono text-[11px] uppercase tracking-[0.25em] text-neutral-500">
              error 404
            </p>
            <h1 className="mx-auto max-w-xl text-3xl font-semibold tracking-tight text-white sm:text-4xl md:text-5xl">
              Nothing decrypts at this path
            </h1>
            <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-neutral-300 sm:text-[15px]">
              The page you're looking for isn't in the vault. It may have moved, or the link was
              never a recipient.
            </p>
            <div className="mt-8">
              <DocSearch />
            </div>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/"
                className="rounded-full bg-white px-5 py-2.5 text-sm font-medium text-black transition-opacity hover:opacity-85"
              >
                Back home
              </Link>
              <Link
                href="/docs/what-is-share-env"
                className="rounded-full border border-white/25 px-5 py-2.5 text-sm text-neutral-200 transition-colors hover:border-white/60 hover:text-white"
              >
                Browse the docs
              </Link>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
