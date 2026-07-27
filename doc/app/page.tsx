import Link from 'next/link'
import { DocSearch } from '@/components/doc-search'
import { Faq } from '@/components/faq'
import { HeroArt } from '@/components/hero-art'
import { InstallCommand } from '@/components/install-command'
import { SiteNav } from '@/components/site-nav'
import { docs, GITHUB_URL, NPM_URL } from '@/lib/docs-index'

export default function Home() {
  return (
    <div>
      <SiteNav />

      <main className="mx-auto max-w-6xl px-4 sm:px-6">
        {/* hero */}
        <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-black">
          <HeroArt />
          <div className="relative z-10 px-5 py-16 text-center sm:px-6 sm:py-24">
            <h1 className="mx-auto max-w-2xl text-3xl font-semibold tracking-tight text-white sm:text-4xl md:text-5xl">
              Your .env files, encrypted in git
            </h1>
            <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-neutral-300 sm:text-[15px]">
              One command packs every env file in your repo into an encrypted vault. Your team
              pulls it with their own key. No server, no shared passphrase.
            </p>
            <div className="mt-8">
              <DocSearch />
            </div>
            <div className="mt-6">
              <InstallCommand />
            </div>
          </div>
        </section>

        {/* quickfind */}
        <section className="py-16 sm:py-20">
          <h2 className="mb-8 text-2xl font-semibold tracking-tight">Quickfind answers</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {docs.map((d) => (
              <Link
                key={d.slug}
                href={`/docs/${d.slug}`}
                className="group flex flex-col items-center rounded-2xl border border-neutral-800 px-6 py-8 text-center transition-all duration-200 hover:-translate-y-0.5 hover:border-neutral-500 hover:bg-white/[0.03] focus-visible:outline focus-visible:outline-2 focus-visible:outline-white"
              >
                <span className="mb-4 grid size-11 place-items-center rounded-xl border border-neutral-800 transition-colors group-hover:border-white group-hover:bg-white">
                  <d.icon
                    className="size-5 text-white transition-colors group-hover:text-black"
                    strokeWidth={1.75}
                  />
                </span>
                <span className="text-[15px] font-semibold text-white">{d.title}</span>
                <span className="mt-1.5 text-[13px] leading-relaxed text-neutral-400">
                  {d.description}
                </span>
              </Link>
            ))}
          </div>
        </section>

        {/* faq */}
        <section className="pb-20">
          <h2 className="mb-8 text-2xl font-semibold tracking-tight">General FAQs</h2>
          <Faq />
          <p className="mt-8 text-sm text-neutral-400">
            Still stuck? Open an issue on{' '}
            <a href={`${GITHUB_URL}/issues`} className="text-white underline underline-offset-4">
              GitHub
            </a>
            .
          </p>
        </section>
      </main>

      <footer className="border-t border-neutral-800">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-8 font-mono text-xs text-neutral-500 sm:px-6">
          <span>share-env · MIT license</span>
          <span className="flex gap-5">
            <a href={GITHUB_URL} className="transition-colors hover:text-white">
              github
            </a>
            <a href={NPM_URL} className="transition-colors hover:text-white">
              npm
            </a>
          </span>
        </div>
      </footer>
    </div>
  )
}
