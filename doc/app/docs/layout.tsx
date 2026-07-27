import { DocsSidebar, MobileDocsNav } from '@/components/docs-sidebar'
import { SiteNav } from '@/components/site-nav'

export default function DocsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <SiteNav />
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 pb-24 pt-4 sm:px-6 lg:flex-row lg:gap-12">
        <aside className="hidden lg:block lg:w-56 lg:shrink-0">
          <div className="lg:sticky lg:top-8">
            <DocsSidebar />
          </div>
        </aside>
        <div className="sticky top-0 z-40 -mx-4 bg-neutral-950/85 px-4 py-3 backdrop-blur-md sm:-mx-6 sm:px-6 lg:hidden">
          <MobileDocsNav />
        </div>
        <article className="prose min-w-0 max-w-3xl flex-1">{children}</article>
      </div>
    </div>
  )
}
