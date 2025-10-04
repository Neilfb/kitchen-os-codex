import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'

import { SignOutButton } from '@/components/auth/SignOutButton'
import { DashboardNavigation } from '@/components/dashboard/Navigation'
import { CreateUserForm } from '@/components/dashboard/CreateUserForm'
import { CreateRestaurantForm } from '@/components/dashboard/CreateRestaurantForm'
import { authOptions } from '@/lib/auth/nextAuth'
import { getRestaurants } from '@/lib/ncb/getRestaurants'
import { getUsers } from '@/lib/ncb/getUsers'

const ROLE_LABEL: Record<string, string> = {
  superadmin: 'Superadmin',
  admin: 'Admin',
  manager: 'Manager',
}

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    redirect('/sign-in')
  }

  const user = session.user
  const userRoleLabel = user.role ? ROLE_LABEL[user.role] ?? user.role : 'Unknown'

  const [restaurants, users] = await Promise.all([
    getRestaurants().catch((error) => {
      console.error('[dashboard] failed to load restaurants', error)
      return []
    }),
    getUsers().catch((error) => {
      console.error('[dashboard] failed to load users', error)
      return []
    }),
  ])

  const isAdmin = user.role === 'admin' || user.role === 'superadmin'

  return (
    <div className="space-y-6 p-6">
      <header className="space-y-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold">Welcome, {user.name ?? user.email}</h1>
            <p className="text-sm text-slate-600">Role: {userRoleLabel}</p>
          </div>
          <SignOutButton className="self-start bg-orange-600 text-white sm:self-auto" />
        </div>
        <DashboardNavigation />
      </header>

      <section className="grid gap-4 md:grid-cols-2">
        <div className="space-y-4">
          {isAdmin && <CreateRestaurantForm />}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">Restaurants</h2>
            {restaurants.length === 0 ? (
              <p className="mt-4 text-sm text-slate-600">No restaurants found.</p>
            ) : (
              <ul className="mt-4 space-y-3">
                {restaurants.slice(0, 6).map((restaurant) => (
                  <li key={restaurant.id} className="rounded-lg border border-slate-200 p-3">
                    <p className="font-medium text-slate-900">{restaurant.name}</p>
                    <p className="text-sm text-slate-600">Owner: {restaurant.owner_id}</p>
                  </li>
                ))}
              </ul>
            )}
            {isAdmin && <p className="mt-4 text-sm text-slate-500">View full list in Restaurants tab.</p>}
          </div>
        </div>

        <div className="space-y-4">
          {isAdmin && <CreateUserForm />}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">Users</h2>
            {users.length === 0 ? (
              <p className="mt-4 text-sm text-slate-600">No users found.</p>
            ) : (
              <ul className="mt-4 space-y-3">
                {users.slice(0, 6).map((platformUser) => (
                  <li key={platformUser.id ?? platformUser.email} className="rounded-lg border border-slate-200 p-3">
                    <p className="font-medium text-slate-900">{platformUser.display_name ?? platformUser.email}</p>
                    <p className="text-sm text-slate-600">Role: {platformUser.role}</p>
                  </li>
                ))}
              </ul>
            )}
            {isAdmin && <p className="mt-4 text-sm text-slate-500">View full list in Users tab.</p>}
          </div>
        </div>
      </section>

      {user.role === 'manager' && (
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Manager quick actions</h2>
          <ul className="mt-4 space-y-2 text-sm text-slate-700">
            <li>Review menus assigned to you</li>
            <li>Ensure allergen tags are complete</li>
            <li>Coordinate with staff on upcoming menu changes</li>
          </ul>
        </section>
      )}
    </div>
  )
}
