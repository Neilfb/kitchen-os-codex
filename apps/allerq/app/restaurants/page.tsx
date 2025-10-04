import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'

import { DashboardNavigation } from '@/components/dashboard/Navigation'
import { authOptions } from '@/lib/auth/nextAuth'
import { CreateRestaurantForm } from '@/components/dashboard/CreateRestaurantForm'
import { DeleteRestaurantForm } from '@/components/dashboard/DeleteRestaurantForm'
import { UpdateRestaurantForm } from '@/components/dashboard/UpdateRestaurantForm'
import { getRestaurants } from '@/lib/ncb/getRestaurants'

export default async function RestaurantsPage() {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    redirect('/sign-in')
  }

  if (session.user.role !== 'admin' && session.user.role !== 'superadmin') {
    redirect('/dashboard')
  }

  const restaurants = await getRestaurants()

  return (
    <div className="space-y-6 p-6">
      <header className="space-y-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Restaurants</h1>
          <p className="text-sm text-slate-600">Manage all venues connected to AllerQ.</p>
        </div>
        <DashboardNavigation />
      </header>

      <CreateRestaurantForm />
      <UpdateRestaurantForm restaurants={restaurants} />
      <DeleteRestaurantForm restaurants={restaurants} />

      <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-6 py-4">
          <h2 className="text-lg font-semibold text-slate-900">All restaurants</h2>
        </div>
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
              {restaurants.map((restaurant) => (
                <tr key={restaurant.id} className="hover:bg-orange-50/40">
                  <td className="px-6 py-3 font-medium text-slate-900">{restaurant.name}</td>
                  <td className="px-6 py-3 text-slate-600">{restaurant.owner_id}</td>
                  <td className="px-6 py-3 text-slate-600">{restaurant.email ?? '—'}</td>
                  <td className="px-6 py-3 text-slate-600">
                    {restaurant.created_at ? new Date(Number(restaurant.created_at)).toLocaleDateString() : '—'}
                  </td>
                </tr>
              ))}
              {restaurants.length === 0 && (
                <tr>
                  <td className="px-6 py-8 text-center text-slate-500" colSpan={4}>
                    No restaurants found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
