import { getServerSession } from 'next-auth'

import { DashboardTopNav } from '@/components/dashboard/TopNav'
import { Section } from '@/components/dashboard/PageLayout'
import { authOptions } from '@/lib/auth/nextAuth'
import { requireUser } from '@/lib/auth/guards'

export const dynamic = 'force-dynamic'

export default async function BillingPage() {
  const session = await getServerSession(authOptions)
  const user = requireUser(session)

  return (
    <div className="min-h-screen bg-[var(--color-warm-grey)]">
      <DashboardTopNav userName={user.name} userEmail={user.email} />
      <main className="mx-auto w-full max-w-6xl px-4 pb-16 pt-6 sm:px-6 lg:px-8">
        <Section
          title="Billing overview"
          description="Plan details, invoices, and payment methods will appear here soon."
        >
          <div className="space-y-3 text-sm text-slate-600">
            <p>• Current plan information is managed in NCDB and surfaced on the restaurant cards.</p>
            <p>• This page will expose downloadable invoices and upgrade/downgrade flows.</p>
            <p>• Until then, contact AllerQ support for billing updates.</p>
          </div>
        </Section>
      </main>
    </div>
  )
}
