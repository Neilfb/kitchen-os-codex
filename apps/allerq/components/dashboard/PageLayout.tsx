import { ReactNode } from 'react'

type PageLayoutProps = {
  title: string
  description?: string
  navigation?: ReactNode
  headerActions?: ReactNode
  children: ReactNode
}

export function PageLayout({ title, description, navigation, headerActions, children }: PageLayoutProps) {
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-6 lg:flex-row">
          {navigation ? (
            <aside className="lg:w-64">
              <div className="sticky top-6 space-y-4">
                {navigation}
              </div>
            </aside>
          ) : null}

          <div className="flex-1 space-y-6">
            <header className="rounded-2xl border border-slate-200 bg-white px-6 py-5 shadow-sm">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h1 className="text-3xl font-semibold text-slate-900">{title}</h1>
                  {description ? <p className="text-sm text-slate-600">{description}</p> : null}
                </div>
                {headerActions ? <div className="flex flex-wrap gap-3">{headerActions}</div> : null}
              </div>
            </header>

            <main className="space-y-6 pb-10">{children}</main>
          </div>
        </div>
      </div>
    </div>
  )
}

type SectionProps = {
  id?: string
  title: string
  description?: string
  children: ReactNode
}

export function Section({ id, title, description, children }: SectionProps) {
  return (
    <section id={id} className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 px-6 py-4">
        <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
        {description ? <p className="text-sm text-slate-600">{description}</p> : null}
      </div>
      <div className="px-6 py-5">{children}</div>
    </section>
  )
}

export function CardGrid({ children }: { children: ReactNode }) {
  return <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{children}</div>
}
