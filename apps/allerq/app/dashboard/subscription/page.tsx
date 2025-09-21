import Link from 'next/link'

const plans = [
  {
    name: 'Starter',
    price: '$29',
    cadence: 'per month',
    description: 'For pop-up concepts and small teams launching allergen-safe menus.',
    features: ['Up to 5 menus', 'QR customization presets', 'Basic analytics', 'Email support'],
    cta: 'Stay on Starter',
  },
  {
    name: 'Growth',
    price: '$79',
    cadence: 'per month',
    description: 'For multi-location teams that need deep allergen insights.',
    features: [
      'Unlimited menus & QR codes',
      'Advanced allergen analytics',
      'Team workflows',
      'Priority in-app chat support',
    ],
    highlight: true,
    cta: 'Upgrade to Growth',
  },
  {
    name: 'Enterprise',
    price: 'Let’s talk',
    cadence: '',
    description: 'For national brands requiring API access and compliance audits.',
    features: ['Dedicated success manager', 'Custom integrations', 'SLA-backed uptime', 'On-site training'],
    cta: 'Contact sales',
  },
]

export default function SubscriptionPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-slate-100 px-6 py-16">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-12">
        <header className="text-center">
          <p className="text-sm font-semibold uppercase tracking-wide text-[#F97316]">Subscription</p>
          <h1 className="mt-3 text-3xl font-semibold text-slate-900">Scale allergen confidence with AllerQ</h1>
          <p className="mt-2 text-base text-slate-600">
            Choose the plan that matches your dining experience. Upgrade anytime as your guest journey evolves.
          </p>
        </header>

        <section className="grid gap-6 lg:grid-cols-3">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`flex flex-col gap-6 rounded-3xl bg-white p-8 shadow-lg shadow-orange-100 ${
                plan.highlight ? 'border-2 border-[#F97316]' : ''
              }`}
            >
              <div>
                <h2 className="text-xl font-semibold text-slate-900">{plan.name}</h2>
                <p className="mt-2 text-sm text-slate-600">{plan.description}</p>
              </div>
              <div>
                <p className="text-4xl font-semibold text-slate-900">{plan.price}</p>
                {plan.cadence && <p className="text-sm text-slate-500">{plan.cadence}</p>}
              </div>
              <ul className="flex flex-1 list-disc flex-col gap-2 pl-5 text-sm text-slate-600">
                {plan.features.map((feature) => (
                  <li key={feature}>{feature}</li>
                ))}
              </ul>
              <Link
                href={plan.highlight ? '/dashboard/qr/create' : '/dashboard'}
                className={`inline-flex items-center justify-center rounded-lg px-5 py-2.5 font-semibold transition-transform duration-200 hover:-translate-y-0.5 hover:shadow-lg ${
                  plan.highlight
                    ? 'bg-[#F97316] text-white hover:bg-[#ea6b0c]'
                    : 'border border-[#F97316] text-[#F97316] hover:bg-orange-50 hover:text-[#ea6b0c]'
                }`}
              >
                {plan.cta}
              </Link>
            </div>
          ))}
        </section>

        <section className="rounded-3xl bg-white p-8 shadow-lg shadow-orange-100">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-slate-900">Need SOC2-ready compliance?</h2>
              <p className="mt-1 text-sm text-slate-600">
                AllerQ offers enterprise onboarding, custom training, and API integrations tailored to your IT stack.
              </p>
            </div>
            <Link
              href="mailto:hello@allerq.com?subject=AllerQ%20Enterprise"
              className="inline-flex items-center justify-center rounded-lg bg-[#F97316] px-5 py-2.5 font-semibold text-white transition-transform duration-200 hover:-translate-y-0.5 hover:bg-[#ea6b0c] hover:shadow-lg"
            >
              Schedule a call
            </Link>
          </div>
        </section>
      </div>
    </main>
  )
}
