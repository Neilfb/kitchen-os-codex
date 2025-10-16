import { getServerSession } from 'next-auth'

import { SignOutButton } from '@/components/auth/SignOutButton'
import { DashboardNavigation } from '@/components/dashboard/Navigation'
import { PageLayout, Section, CardGrid } from '@/components/dashboard/PageLayout'
import { ActionCard } from '@/components/dashboard/ActionCard'
import { CreateRestaurantForm } from '@/components/dashboard/CreateRestaurantForm'
import { DeleteRestaurantForm } from '@/components/dashboard/DeleteRestaurantForm'
import { UpdateRestaurantForm } from '@/components/dashboard/UpdateRestaurantForm'
import { authOptions } from '@/lib/auth/nextAuth'
import { getRestaurants } from '@/lib/ncb/getRestaurants'
import { requireAnyCapability } from '@/lib/auth/guards'

export const dynamic = 'force-dynamic'

function filterRestaurantsForActor(restaurants: Awaited<ReturnType<typeof getRestaurants>>, actor: ReturnType<typeof requireAnyCapability>) {
  if (actor.role === 'superadmin') {
    return restaurants
  }

  const assignedIds = new Set(
    actor.assignedRestaurants
      .map((value) => String(value))
      .filter((value) => value && value !== 'null' && value !== 'undefined')
  )
  const normalizedActorId = actor.id.toString()
  const normalizedActorEmail = actor.email.toLowerCase()
  const normalizedActorNcdbId = Number.isFinite(actor.ncdbUserId) && actor.ncdbUserId > 0 ? actor.ncdbUserId.toString() : null

  return restaurants.filter((restaurant) => {
    const restaurantId = String(restaurant.id)
    if (assignedIds.has(restaurantId)) {
      return true
    }

    if (typeof restaurant.owner_id === 'string' && restaurant.owner_id.trim()) {
      const owner = restaurant.owner_id.trim().toLowerCase()
      if (normalizedActorNcdbId && owner === normalizedActorNcdbId) {
        return true
      }
      if (owner === normalizedActorId || owner === normalizedActorEmail) {
        return true
      }
    }

    return false
  })
}

export default async function RestaurantsPage() {
  const session = await getServerSession(authOptions)
  const actor = requireAnyCapability(session, ['restaurant.manage:any', 'restaurant.create'])

  const restaurants = await getRestaurants()
  const scopedRestaurants = filterRestaurantsForActor(restaurants, actor)

  return (
    <PageLayout
      title="Restaurants"
      description="Manage every venue connected to AllerQ."
      navigation={<DashboardNavigation />}
      headerActions={<SignOutButton className="bg-orange-600 text-white" />}
    >
      <Section
        id="restaurant-actions"
        title="Quick actions"
        description="Pick the workflow you need, or jump straight to the full table."
      >
        <CardGrid>
          <ActionCard
            title="Create a restaurant"
            description="Set up a new venue and keep details current."
            href="#create-restaurant"
            cta="Open form"
          />
          <ActionCard
            title="Update details"
            description="Edit restaurant names, owners, and contact info."
            href="#update-restaurant"
            cta="Open form"
          />
          <ActionCard
            title="Remove a restaurant"
            description="Retire venues that no longer need access to AllerQ."
            href="#delete-restaurant"
            cta="Open form"
          />
          <ActionCard
            title="View the full list"
            description="Scan every venue at a glance with owners and created dates."
            href="#restaurant-table"
            cta="Scroll to table"
          />
        </CardGrid>
      </Section>

      <Section
        id="create-restaurant"
        title="Create a restaurant"
        description="Capture the essentials to get a venue online fast."
      >
        <CreateRestaurantForm />
      </Section>

      <Section
        id="update-restaurant"
        title="Update a restaurant"
        description="Choose an existing venue to edit its details."
      >
        <UpdateRestaurantForm restaurants={scopedRestaurants} />
      </Section>

      <Section
        id="delete-restaurant"
        title="Delete a restaurant"
        description="Remove a venue when access is no longer required."
      >
        <DeleteRestaurantForm restaurants={scopedRestaurants} />
      </Section>

      <Section
        id="restaurant-table"
        title="All restaurants"
        description="A complete view of every venue in AllerQ."
      >
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-3 font-semibold text-slate-700">Name</th>
                <th className="px-6 py-3 font-semibold text-slate-700">Owner</th>
                <th className="px-6 py-3 font-semibold text-slate-700">Email</th>
                <th className="px-6 py-3 font-semibold text-slate-700">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {scopedRestaurants.map((restaurant) => (
                <tr key={restaurant.id} className="hover:bg-orange-50/40">
                  <td className="px-6 py-3 font-medium text-slate-900">{restaurant.name}</td>
                  <td className="px-6 py-3 text-slate-600">{restaurant.owner_id}</td>
                  <td className="px-6 py-3 text-slate-600">{restaurant.email ?? '—'}</td>
                  <td className="px-6 py-3 text-slate-600">
                    {restaurant.created_at ? new Date(Number(restaurant.created_at)).toLocaleDateString() : '—'}
                  </td>
                </tr>
              ))}
              {scopedRestaurants.length === 0 && (
                <tr>
                  <td className="px-6 py-8 text-center text-slate-500" colSpan={4}>
                    {actor.role === 'superadmin'
                      ? 'No restaurants found.'
                      : 'No restaurants have been assigned to your account yet.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Section>
    </PageLayout>
  )
}
