import { getServerSession } from 'next-auth'

import { DashboardTopNav } from '@/components/dashboard/TopNav'
import { Section } from '@/components/dashboard/PageLayout'
import { authOptions } from '@/lib/auth/nextAuth'
import { requireUser } from '@/lib/auth/guards'

export default async function SettingsPage() {
  const session = await getServerSession(authOptions)
  const user = requireUser(session)

  return (
    <div className="min-h-screen bg-[var(--color-warm-grey)]">
      <DashboardTopNav userName={user.name} userEmail={user.email} />
      <main className="mx-auto w-full max-w-6xl px-4 pb-16 pt-6 sm:px-6 lg:px-8">
        <Section
          title="Account settings"
          description="Profile, notifications, and integration preferences will live here."
        >
          <div className="space-y-3 text-sm text-slate-600">
            <p>• Today, settings are managed manually. This placeholder keeps navigation consistent.</p>
            <p>• Upcoming tabs: Profile, Team, Notifications, Integrations.</p>
            <p>• Reach out to AllerQ support if you need a change before this page ships.</p>
          </div>
        </Section>
      </main>
    </div>
  )
}
