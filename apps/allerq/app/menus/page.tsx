import { getServerSession } from 'next-auth'

import { MenusWorkspace } from '@/components/menus/MenusWorkspace'
import { MenuEditor } from '@/components/menus/MenuEditor'
import { DashboardTopNav } from '@/components/dashboard/TopNav'
import { Section } from '@/components/dashboard/PageLayout'
import { authOptions } from '@/lib/auth/nextAuth'
import { requireUser } from '@/lib/auth/guards'
import { getRestaurants } from '@/lib/ncb/getRestaurants'
import { scopeRestaurantsForUser } from '@/lib/menus/restaurants'
import { userHasCapability } from '@/lib/auth/permissions'

interface MenusPageProps {
  searchParams?: Record<string, string | string[] | undefined>
}

export default async function MenusPage({ searchParams }: MenusPageProps) {
  const session = await getServerSession(authOptions)
  const user = requireUser(session)
  const canManageMenus = userHasCapability(user, 'menu.manage')

  let initialRestaurantId: number | undefined
  const restaurantParam = searchParams?.restaurant
  if (typeof restaurantParam === 'string' && restaurantParam.trim()) {
    const parsed = Number(restaurantParam)
    if (Number.isFinite(parsed) && parsed > 0) {
      initialRestaurantId = parsed
    }
  }

  const restaurantRecords = canManageMenus
    ? await getRestaurants().catch((error) => {
        console.error('[menus] failed to load restaurants', error)
        return []
      })
    : []

  const availableRestaurants = scopeRestaurantsForUser(restaurantRecords, user).map((record) => ({
    id: Number(record.id),
    name: record.name,
  }))

  const resolvedInitialRestaurantId =
    initialRestaurantId && availableRestaurants.some((restaurant) => restaurant.id === initialRestaurantId)
      ? initialRestaurantId
      : undefined

  return (
    <div className="min-h-screen bg-[var(--color-warm-grey)]">
      <DashboardTopNav userName={user.name} userEmail={user.email} />
      <main className="mx-auto w-full max-w-6xl px-4 pb-16 pt-6 sm:px-6 lg:px-8">
        <Section title="Menus workspace" description="Upload menus, monitor AI parsing, and review results per venue.">
          {canManageMenus ? (
            <div className="space-y-8">
              <MenuEditor restaurants={availableRestaurants} canCreateMenus={canManageMenus} />
              <MenusWorkspace
                restaurants={availableRestaurants}
                canUpload={canManageMenus}
                initialRestaurantId={resolvedInitialRestaurantId}
              />
            </div>
          ) : (
            <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center text-slate-600">
              <p className="text-lg font-semibold text-slate-800">Menu tools are restricted</p>
              <p className="mt-2 text-sm text-slate-500">
                Your account does not currently have access to manage menus. Contact an AllerQ admin if you need to
                collaborate on menu uploads or AI reviews.
              </p>
            </div>
          )}
        </Section>
      </main>
    </div>
  )
}
