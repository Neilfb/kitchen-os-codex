import Image from 'next/image'
import Link from 'next/link'

const sampleMenu = [
  {
    section: 'Starters',
    items: [
      {
        name: 'Citrus Herb Salad',
        description: 'Seasonal greens, toasted seeds, citrus vinaigrette',
        allergens: 'Contains seeds | Nut-free | Gluten-free',
      },
      {
        name: 'Roasted Cauliflower Soup',
        description: 'Charred cauliflower, coconut cream, chili oil',
        allergens: 'Contains coconut | Dairy-free | Vegan',
      },
    ],
  },
  {
    section: 'Mains',
    items: [
      {
        name: 'Lemon Dill Salmon',
        description: 'Grilled salmon, charred lemon, fennel salad',
        allergens: 'Contains fish | Gluten-free',
      },
      {
        name: 'Harissa Chickpea Bowl',
        description: 'Quinoa, roasted vegetables, mint yogurt, pickled onions',
        allergens: 'Contains dairy | Vegetarian',
      },
    ],
  },
]

interface PageProps {
  params: { id: string }
}

export default function QrMenuPage({ params }: PageProps) {
  const qrId = params.id

  return (
    <main className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-slate-100 px-6 py-12">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-10">
        <nav aria-label="Breadcrumb" className="flex justify-center text-sm text-slate-500">
          <ol className="flex flex-wrap items-center gap-2">
            <li>
              <Link className="transition-colors hover:text-[#F97316]" href="/dashboard">
                Dashboard
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li>
              <Link className="transition-colors hover:text-[#F97316]" href="/dashboard/qr/create">
                QR builder
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li className="font-medium text-slate-700">Table {qrId}</li>
          </ol>
        </nav>

        <header className="flex flex-col items-center text-center">
          <Image src="/logo.png" alt="AllerQ logo" width={80} height={80} className="h-16 w-16" />
          <p className="mt-6 text-sm uppercase tracking-[0.35em] text-[#F97316]">AllerQ Menu QR</p>
          <h1 className="mt-3 text-3xl font-semibold text-slate-900">Table {qrId}</h1>
          <p className="mt-2 max-w-xl text-base text-slate-600">
            Explore safe, delicious options curated for guests with allergens in mind. Toggle allergen filters to
            quickly see what works for you.
          </p>
        </header>

        <div className="flex flex-col items-center gap-4">
          <div className="flex h-40 w-40 items-center justify-center rounded-3xl border-4 border-dashed border-[#F97316]/40 bg-white text-sm font-semibold uppercase tracking-wide text-[#F97316]/70">
            QR preview placeholder
          </div>
          <p className="text-xs text-slate-500">
            QR codes are generated per menu in the dashboard. This demo view shows static sample data.
          </p>
        </div>

        <nav className="flex flex-wrap justify-center gap-3">
          {['Gluten-free', 'Dairy-free', 'Nut-free', 'Vegan', 'Vegetarian'].map((filter) => (
            <button
              key={filter}
              className="rounded-full border border-[#F97316] bg-white px-4 py-2 text-sm font-medium text-[#F97316] transition-transform duration-200 hover:-translate-y-0.5 hover:bg-[#F97316] hover:text-white"
              type="button"
            >
              {filter}
            </button>
          ))}
        </nav>

        <section className="space-y-8">
          {sampleMenu.map((section) => (
            <div key={section.section} className="rounded-3xl bg-white p-6 shadow-lg shadow-orange-100">
              <header className="mb-4 flex items-center justify-between">
                <h2 className="text-xl font-semibold text-slate-900">{section.section}</h2>
                <span className="text-sm font-medium text-slate-400">Allergen intel verified</span>
              </header>

              <ul className="space-y-6">
                {section.items.map((item) => (
                  <li key={item.name} className="border-b border-slate-100 pb-6 last:border-0 last:pb-0">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <h3 className="text-lg font-semibold text-slate-900">{item.name}</h3>
                        <p className="text-sm text-slate-600">{item.description}</p>
                      </div>
                      <span className="rounded-full bg-orange-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-[#F97316]">
                        Safe choice
                      </span>
                    </div>
                    <p className="mt-3 text-sm font-medium text-slate-500">{item.allergens}</p>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </section>

        <footer className="rounded-3xl bg-white p-6 text-center text-sm text-slate-500 shadow-inner shadow-orange-100">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-center">
            <p>
              Menu synced via AllerQ. Need an alternate view?{' '}
              <Link href="/dashboard/menus/add" className="font-semibold text-[#F97316] hover:text-[#ea6b0c]">
                Request adjustments
              </Link>
            </p>
            <Link
              href="/dashboard/analytics"
              className="inline-flex items-center justify-center rounded-full border border-[#F97316] px-4 py-1.5 text-xs font-semibold uppercase tracking-wide text-[#F97316] transition-transform duration-200 hover:-translate-y-0.5 hover:bg-orange-50 hover:text-[#ea6b0c]"
            >
              View analytics
            </Link>
          </div>
        </footer>
      </div>
    </main>
  )
}
