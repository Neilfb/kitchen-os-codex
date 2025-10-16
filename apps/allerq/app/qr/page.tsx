import { getServerSession } from 'next-auth'

import { DashboardTopNav } from '@/components/dashboard/TopNav'
import { Section } from '@/components/dashboard/PageLayout'
import { authOptions } from '@/lib/auth/nextAuth'
import { requireUser } from '@/lib/auth/guards'

export const dynamic = 'force-dynamic'

export default async function QrCodesPage() {
  const session = await getServerSession(authOptions)
  const user = requireUser(session)

  return (
    <div className="min-h-screen bg-[var(--color-warm-grey)]">
      <DashboardTopNav userName={user.name} userEmail={user.email} />
      <main className="mx-auto w-full max-w-6xl px-4 pb-16 pt-6 sm:px-6 lg:px-8">
        <Section
          title="QR code library"
          description="Download, regenerate, or create new QR assets per venue. This page currently hosts placeholder content."
        >
          <div className="space-y-3 text-sm text-slate-600">
            <p>• Soon you&apos;ll see every QR code generated for menus, including scan counts.</p>
            <p>• For now, use the existing restaurant management flow to access QR codes.</p>
            <p>• The dashboard cards already link here with the appropriate context query string.</p>
          </div>
        </Section>
      </main>
    </div>
  )
}
