import { getServerSession } from 'next-auth'

import { DashboardTopNav } from '@/components/dashboard/TopNav'
import { Section } from '@/components/dashboard/PageLayout'
import { authOptions } from '@/lib/auth/nextAuth'
import { requireUser } from '@/lib/auth/guards'
import { userHasCapability } from '@/lib/auth/permissions'
import { getMenuById } from '@/lib/ncb/getMenuById'
import { getMenuItems } from '@/lib/ncb/menuItem'
import { getRestaurantById } from '@/lib/ncb/getRestaurantById'
import { getMenuUploadItems } from '@/lib/ncb/menuUploads'
import { actorHasRestaurantAccess, buildActorFromSession } from '@/lib/menus/access'
import { MenuDetailClient } from '@/components/menus/MenuDetailClient'

interface MenuDetailPageProps {
  params: { id: string }
}

export default async function MenuDetailPage({ params }: MenuDetailPageProps) {
  const menuId = Number(params.id)
  if (!Number.isFinite(menuId) || menuId <= 0) {
    return null
  }

  const session = await getServerSession(authOptions)
  const user = requireUser(session)

  if (!userHasCapability(user, 'menu.manage')) {
    return null
  }

  const menuRecord = await getMenuById({ id: menuId })

  if (!menuRecord) {
    return null
  }

  const actor = buildActorFromSession(session)
  const restaurantId = Number(menuRecord.restaurant_id)

  const restaurantRecord = await getRestaurantById({ id: restaurantId }).catch((error) => {
    console.error('[menus/[id]] failed to load restaurant', error)
    return null
  })

  if (!restaurantRecord || !actorHasRestaurantAccess(actor, restaurantId, { ownerId: restaurantRecord.owner_id })) {
    return null
  }

  const [menuItems, pendingUploadItems] = await Promise.all([
    getMenuItems({ menuId }),
    getMenuUploadItems({ menuId, status: ['pending', 'needs_review'] }),
  ])

  return (
    <div className="min-h-screen bg-[var(--color-warm-grey)]">
      <DashboardTopNav userName={user.name} userEmail={user.email} />
      <main className="mx-auto w-full max-w-5xl px-4 pb-16 pt-6 sm:px-6 lg:px-8">
        <Section title={menuRecord.name} description="Manage menu metadata and dishes.">
          <MenuDetailClient
            menu={menuRecord}
            items={menuItems}
            restaurantName={restaurantRecord.name}
            pendingUploadItems={pendingUploadItems}
          />
        </Section>
      </main>
    </div>
  )
}
