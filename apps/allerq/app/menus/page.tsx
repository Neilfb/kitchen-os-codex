import { getServerSession } from 'next-auth'

import { DashboardTopNav } from '@/components/dashboard/TopNav'
import { Section } from '@/components/dashboard/PageLayout'
import { authOptions } from '@/lib/auth/nextAuth'
import { requireUser } from '@/lib/auth/guards'

export default async function MenusPage() {
  const session = await getServerSession(authOptions)
  const user = requireUser(session)

  return (
    <div className="min-h-screen bg-[var(--color-warm-grey)]">
      <DashboardTopNav userName={user.name} userEmail={user.email} />
      <main className="mx-auto w-full max-w-6xl px-4 pb-16 pt-6 sm:px-6 lg:px-8">
        <Section
          title="Menus workspace"
          description="This area will let you view and edit menus for each venue. For now, everything routes back to the legacy forms."
        >
          <div className="space-y-3 text-sm text-slate-600">
            <p>• Use the restaurant cards on the dashboard to jump into a venue&apos;s menus for now.</p>
            <p>• Upcoming: dedicated list, search, and quick edit flows for menu items and allergen tags.</p>
          </div>
        </Section>
      </main>
    </div>
  )
}
