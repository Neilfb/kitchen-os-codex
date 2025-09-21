import Link from 'next/link'

const metrics = [
  { label: 'Total scans this month', value: '1,284', trend: '+18%', tone: 'up' },
  { label: 'Safe menu saves', value: '642', trend: '+22%', tone: 'up' },
  { label: 'Alerts resolved', value: '57', trend: '-5%', tone: 'down' },
]

const popularAllergens = [
  { allergen: 'Gluten', count: 412 },
  { allergen: 'Dairy', count: 305 },
  { allergen: 'Peanuts', count: 198 },
  { allergen: 'Soy', count: 165 },
]

export default function AnalyticsPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-slate-100 px-6 py-16">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-12">
        <header className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-[#F97316]">Analytics</p>
            <h1 className="mt-3 text-3xl font-semibold text-slate-900">Dining insights at a glance</h1>
            <p className="mt-2 max-w-2xl text-base text-slate-600">
              Track guest engagement with AllerQ QR codes, see which allergen filters are most active, and identify
              opportunities to improve your menu experience.
            </p>
          </div>
          <Link
            href="/dashboard/qr/create"
            className="inline-flex items-center justify-center rounded-lg bg-[#F97316] px-5 py-2.5 font-semibold text-white transition-transform duration-200 hover:-translate-y-0.5 hover:bg-[#ea6b0c] hover:shadow-lg"
          >
            Create new QR campaign
          </Link>
        </header>

        <section className="grid gap-6 md:grid-cols-3">
          {metrics.map((metric) => (
            <div key={metric.label} className="rounded-3xl bg-white p-6 shadow-lg shadow-orange-100">
              <p className="text-sm font-medium text-slate-500">{metric.label}</p>
              <p className="mt-3 text-3xl font-semibold text-slate-900">{metric.value}</p>
              <p
                className={`mt-2 text-sm font-semibold ${metric.tone === 'up' ? 'text-green-600' : 'text-orange-600'}`}
              >
                {metric.trend} vs last month
              </p>
            </div>
          ))}
        </section>

        <section className="grid gap-6 lg:grid-cols-[2fr_3fr]">
          <div className="rounded-3xl bg-white p-6 shadow-lg shadow-orange-100">
            <h2 className="text-xl font-semibold text-slate-900">Most filtered allergens</h2>
            <p className="mt-2 text-sm text-slate-600">Top sensitivities detected by AllerQ scans.</p>
            <ul className="mt-6 space-y-4">
              {popularAllergens.map((item) => (
                <li key={item.allergen} className="flex items-center justify-between">
                  <span className="font-medium text-slate-700">{item.allergen}</span>
                  <span className="rounded-full bg-orange-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-[#F97316]">
                    {item.count} scans
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-3xl bg-white p-6 shadow-lg shadow-orange-100">
            <h2 className="text-xl font-semibold text-slate-900">Engagement timeline</h2>
            <p className="mt-2 text-sm text-slate-600">Weekly QR scans and allergen filter usage.</p>
            <div className="mt-6 h-64 rounded-2xl bg-gradient-to-r from-orange-100 via-white to-slate-100" aria-hidden="true">
              <div className="flex h-full items-end justify-between gap-2 px-6 pb-6">
                {[35, 60, 48, 72, 64, 90, 77].map((value, index) => (
                  <div key={value} className="flex w-full flex-col items-center">
                    <div className="flex h-48 w-6 items-end rounded-full bg-orange-100">
                      <div
                        className="w-6 rounded-full bg-[#F97316]"
                        style={{ height: `${value}%` }}
                        aria-hidden="true"
                      />
                    </div>
                    <span className="mt-3 text-xs font-medium text-slate-500">Week {index + 1}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-3xl bg-white p-6 shadow-lg shadow-orange-100">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-slate-900">Suggested improvements</h2>
              <p className="mt-1 text-sm text-slate-600">
                AllerQ detects opportunities to delight high-sensitivity guests.
              </p>
            </div>
            <Link
              href="/dashboard/menus/add"
              className="inline-flex items-center justify-center rounded-lg border border-[#F97316] px-5 py-2.5 font-semibold text-[#F97316] transition-transform duration-200 hover:-translate-y-0.5 hover:bg-orange-50 hover:text-[#ea6b0c]"
            >
              Update menus
            </Link>
          </div>

          <ul className="mt-6 grid gap-4 md:grid-cols-2">
            {[
              'Add more dairy-free dessert options.',
              'Highlight gluten-safe preparation steps for pizza menu.',
              'Enable soy-free filter on lunch bowls.',
              'Promote nut-free kid-friendly meals.',
            ].map((suggestion) => (
              <li key={suggestion} className="rounded-2xl bg-orange-50/60 px-4 py-4 text-sm font-medium text-slate-700">
                {suggestion}
              </li>
            ))}
          </ul>
        </section>
      </div>
    </main>
  )
}
