import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'

import { DashboardNavigation } from '@/components/dashboard/Navigation'
import { CreateUserForm } from '@/components/dashboard/CreateUserForm'
import { UpdateUserForm } from '@/components/dashboard/UpdateUserForm'
import { DeleteUserForm } from '@/components/dashboard/DeleteUserForm'
import { authOptions } from '@/lib/auth/nextAuth'
import { getUsers } from '@/lib/ncb/getUsers'

export default async function UsersPage() {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    redirect('/sign-in')
  }

  if (session.user.role !== 'admin' && session.user.role !== 'superadmin') {
    redirect('/dashboard')
  }

  const users = await getUsers()

  return (
    <div className="space-y-6 p-6">
      <header className="space-y-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Users</h1>
          <p className="text-sm text-slate-600">View and manage all user accounts.</p>
        </div>
        <DashboardNavigation />
      </header>

      <CreateUserForm />
      <UpdateUserForm users={users} />
      <DeleteUserForm users={users} />

      <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-6 py-4">
          <h2 className="text-lg font-semibold text-slate-900">All users</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-3 font-semibold text-slate-700">Name</th>
                <th className="px-6 py-3 font-semibold text-slate-700">Email</th>
                <th className="px-6 py-3 font-semibold text-slate-700">Role</th>
                <th className="px-6 py-3 font-semibold text-slate-700">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {users.map((platformUser) => (
                <tr key={platformUser.id ?? platformUser.email} className="hover:bg-orange-50/40">
                  <td className="px-6 py-3 font-medium text-slate-900">
                    {platformUser.display_name ?? platformUser.email}
                  </td>
                  <td className="px-6 py-3 text-slate-600">{platformUser.email}</td>
                  <td className="px-6 py-3 text-slate-600">
                    <RoleBadge role={platformUser.role} />
                  </td>
                  <td className="px-6 py-3 text-slate-600">
                    {platformUser.created_at
                      ? new Date(Number(platformUser.created_at)).toLocaleDateString()
                      : '—'}
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td className="px-6 py-8 text-center text-slate-500" colSpan={4}>
                    No users found.
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

function RoleBadge({ role }: { role: string | undefined }) {
  if (!role) {
    return <span className="rounded bg-slate-200 px-2 py-1 text-xs text-slate-700">unknown</span>
  }

  const tone =
    role === 'superadmin'
      ? 'bg-purple-100 text-purple-700'
      : role === 'admin'
      ? 'bg-orange-100 text-orange-700'
      : role === 'manager'
      ? 'bg-emerald-100 text-emerald-700'
      : 'bg-slate-200 text-slate-700'

  return <span className={`rounded px-2 py-1 text-xs font-medium ${tone}`}>{role}</span>
}
