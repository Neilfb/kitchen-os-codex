import { getServerSession } from 'next-auth'

import { SignOutButton } from '@/components/auth/SignOutButton'
import { DashboardNavigation } from '@/components/dashboard/Navigation'
import { PageLayout, Section, CardGrid } from '@/components/dashboard/PageLayout'
import { ActionCard } from '@/components/dashboard/ActionCard'
import { CreateUserForm } from '@/components/dashboard/CreateUserForm'
import { UpdateUserForm } from '@/components/dashboard/UpdateUserForm'
import { DeleteUserForm } from '@/components/dashboard/DeleteUserForm'
import { authOptions } from '@/lib/auth/nextAuth'
import { getUsers } from '@/lib/ncb/getUsers'
import { requireAnyCapability } from '@/lib/auth/guards'

export default async function UsersPage() {
  const session = await getServerSession(authOptions)
  requireAnyCapability(session, ['user.manage:any', 'user.manage:own'])

  const users = await getUsers()

  return (
    <PageLayout
      title="Users"
      description="Invite, update, and remove kitchen staff."
      navigation={<DashboardNavigation />}
      headerActions={<SignOutButton className="bg-orange-600 text-white" />}
    >
      <Section
        id="user-actions"
        title="Quick actions"
        description="Pick a workflow or jump to the full directory."
      >
        <CardGrid>
          <ActionCard
            title="Create a user"
            description="Invite a teammate with the right role from the start."
            href="#create-user"
            cta="Open form"
          />
          <ActionCard
            title="Update a user"
            description="Change email, name, or role assignments."
            href="#update-user"
            cta="Open form"
          />
          <ActionCard
            title="Remove a user"
            description="Clean up accounts that should no longer access AllerQ."
            href="#delete-user"
            cta="Open form"
          />
          <ActionCard
            title="View the directory"
            description="Scan every user with their email, role, and created date."
            href="#user-table"
            cta="Scroll to table"
          />
        </CardGrid>
      </Section>

      <Section
        id="create-user"
        title="Create a user"
        description="Set up a temporary password and confirm their role."
      >
        <CreateUserForm />
      </Section>

      <Section
        id="update-user"
        title="Update a user"
        description="Select an existing account to edit."
      >
        <UpdateUserForm users={users} />
      </Section>

      <Section
        id="delete-user"
        title="Delete a user"
        description="Remove access when a teammate leaves the business."
      >
        <DeleteUserForm users={users} />
      </Section>

      <Section
        id="user-table"
        title="All users"
        description="A complete view of everyone in AllerQ."
      >
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
      </Section>
    </PageLayout>
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
