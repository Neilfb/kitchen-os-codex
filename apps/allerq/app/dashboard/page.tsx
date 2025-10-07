import Link from 'next/link'
import { getServerSession } from 'next-auth'

import { SignOutButton } from '@/components/auth/SignOutButton'
import { DashboardNavigation } from '@/components/dashboard/Navigation'
import { PageLayout, Section, CardGrid } from '@/components/dashboard/PageLayout'
import { ActionCard } from '@/components/dashboard/ActionCard'
import { CreateUserForm } from '@/components/dashboard/CreateUserForm'
import { CreateRestaurantForm } from '@/components/dashboard/CreateRestaurantForm'
import { authOptions } from '@/lib/auth/nextAuth'
import { getRestaurants } from '@/lib/ncb/getRestaurants'
import { getUsers } from '@/lib/ncb/getUsers'
import { requireUser } from '@/lib/auth/guards'
import { userHasCapability } from '@/lib/auth/permissions'
import { getUserRestaurantAssignments } from '@/lib/ncb/userRestaurantAssignments'
import type { Capability } from '@/types/user'

const ROLE_LABEL: Record<string, string> = {
  superadmin: 'Superadmin',
  admin: 'Admin',
  manager: 'Manager',
}

const ADMIN_CAPABILITIES: Capability[] = [
  'restaurant.create',
  'restaurant.manage:any',
  'user.manage:any',
  'user.manage:own',
]

function scopeRestaurants(
  restaurants: Awaited<ReturnType<typeof getRestaurants>>,
  user: ReturnType<typeof requireUser>
) {
  if (user.role === 'superadmin') {
    return restaurants
  }

  const assignedIds = new Set(user.assignedRestaurants.map((value) => String(value)))
  const normalizedId = user.id.toString()
  const normalizedEmail = user.email.toLowerCase()
  const normalizedNcdbId = user.ncdbUserId > 0 ? user.ncdbUserId.toString() : ''

  return restaurants.filter((restaurant) => {
    const restaurantId = String(restaurant.id)
    if (assignedIds.has(restaurantId)) {
      return true
    }

    if (typeof restaurant.owner_id === 'string') {
      const owner = restaurant.owner_id.trim().toLowerCase()
      if (
        owner &&
        (owner === normalizedId || owner === normalizedEmail || (normalizedNcdbId && owner === normalizedNcdbId))
      ) {
        return true
      }
    }

    return false
  })
}

function scopeUsers(
  users: Awaited<ReturnType<typeof getUsers>>,
  user: ReturnType<typeof requireUser>,
  allowedUserIds: Set<number>
) {
  if (user.role === 'superadmin') {
    return users
  }

  return users.filter((platformUser) => {
    const platformUserId = platformUser.id !== undefined && platformUser.id !== null ? Number(platformUser.id) : NaN
    if (platformUser.role !== 'manager' && platformUserId !== user.ncdbUserId) {
      return false
    }

    if (Number.isFinite(platformUserId) && allowedUserIds.has(platformUserId)) {
      return true
    }

    return false
  })
}

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)
  const user = requireUser(session)
  const userRoleLabel = ROLE_LABEL[user.role] ?? user.role

  const [restaurantRecords, userRecords] = await Promise.all([
    getRestaurants().catch((error) => {
      console.error('[dashboard] failed to load restaurants', error)
      return []
    }),
    getUsers().catch((error) => {
      console.error('[dashboard] failed to load users', error)
      return []
    }),
  ])

  const isAdmin = ADMIN_CAPABILITIES.some((capability) => userHasCapability(user, capability))
  const isSuperadmin = user.role === 'superadmin'
  const restaurants = scopeRestaurants(restaurantRecords, user)

  const actorRestaurantIds = Array.from(new Set(user.assignedRestaurants.map((value) => value.toString()))).filter(
    (value) => value.length > 0
  )

  const assignmentGroups = await Promise.all(
    actorRestaurantIds.map((restaurantId) =>
      getUserRestaurantAssignments({ restaurantId, role: 'manager' })
    )
  )

  const allowedUserIds = new Set<number>()
  if (!isSuperadmin && user.ncdbUserId > 0) {
    allowedUserIds.add(user.ncdbUserId)
  }

  assignmentGroups.forEach((group) => {
    group.forEach((assignment) => {
      if (Number.isFinite(assignment.user_id)) {
        allowedUserIds.add(assignment.user_id)
      }
    })
  })

  const users = scopeUsers(userRecords, user, allowedUserIds)

  return (
    <PageLayout
      title={`Welcome, ${user.name ?? user.email}`}
      description={`Role: ${userRoleLabel}`}
      navigation={<DashboardNavigation />}
      headerActions={<SignOutButton className="bg-orange-600 text-white" />}
    >
      {isAdmin ? (
        <Section
          id="quick-actions"
          title="Quick actions"
          description="Jump straight to the admin tools you need."
        >
          <CardGrid>
            <ActionCard
              title="Add a restaurant"
              description="Create a new venue record and assign an owner."
              href="#create-restaurant"
              cta="Open form"
            />
            <ActionCard
              title="Add a user"
              description="Invite a teammate and set their role."
              href="#create-user"
              cta="Open form"
            />
            <ActionCard
              title="Manage restaurants"
              description="Review every venue, edit details, or remove records."
              href="/restaurants"
              cta="Go to page"
            />
            <ActionCard
              title="Manage users"
              description="Update roles and clean up unused accounts."
              href="/users"
              cta="Go to page"
            />
          </CardGrid>
        </Section>
      ) : null}

      {isAdmin ? (
        <Section
          id="create-restaurant"
          title="Create a restaurant"
          description="Capture the basics now and refine details later."
        >
          <CreateRestaurantForm />
        </Section>
      ) : null}

      {isAdmin ? (
        <Section
          id="create-user"
          title="Create a user"
          description="Set a temporary password and share it securely."
        >
          <CreateUserForm />
        </Section>
      ) : null}

      <Section
        id="recent-data"
        title={isSuperadmin ? 'Latest activity' : 'Your recent activity'}
        description={
          isSuperadmin
            ? 'A snapshot of the most recent restaurants and users.'
            : 'Only the data assigned to your account is shown here.'
        }
      >
        <div className="grid gap-6 lg:grid-cols-2">
          <DataList
            title={isSuperadmin ? 'Restaurants' : 'Your restaurants'}
            emptyState={
              isSuperadmin
                ? 'No restaurants yet.'
                : 'No restaurants assigned to your account yet.'
            }
            footerLink={isAdmin ? { href: '/restaurants', label: 'Open restaurants' } : undefined}
            items={restaurants.slice(0, 6).map((restaurant) => ({
              id: restaurant.id,
              primary: restaurant.name,
              secondary: restaurant.owner_id ? `Owner: ${restaurant.owner_id}` : undefined,
            }))}
          />

          {isSuperadmin || userHasCapability(user, 'user.manage:any') || userHasCapability(user, 'user.manage:own') ? (
            <DataList
              title={isSuperadmin ? 'Users' : 'Managers'}
              emptyState={
                isSuperadmin
                  ? 'No users yet.'
                  : 'No managers have been invited yet.'
              }
              footerLink={isAdmin ? { href: '/users', label: 'Open users' } : undefined}
              items={users.slice(0, 6).map((platformUser) => ({
                id: platformUser.id ?? platformUser.email,
                primary: platformUser.display_name ?? platformUser.email,
                secondary: platformUser.role ? `Role: ${platformUser.role}` : undefined,
              }))}
            />
          ) : null}
        </div>
      </Section>

      {user.role === 'manager' ? (
        <Section
          id="manager-tips"
          title="Manager quick actions"
          description="Keep menus sharp and allergen data trusted."
        >
          <ul className="space-y-2 text-sm text-slate-700">
            <li>Review the menus assigned to you and flag gaps.</li>
            <li>Ensure allergen tags stay accurate with every change.</li>
            <li>Coordinate with staff on upcoming menu updates.</li>
          </ul>
        </Section>
      ) : null}
    </PageLayout>
  )
}

type DataListProps = {
  title: string
  emptyState: string
  items: Array<{ id: string | number | null | undefined; primary: string | null | undefined; secondary?: string | null }>
  footerLink?: { href: string; label: string }
}

function DataList({ title, emptyState, items, footerLink }: DataListProps) {
  return (
    <article className="flex h-full flex-col rounded-xl border border-slate-200 bg-slate-50/60">
      <div className="border-b border-slate-200 px-4 py-3">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-600">{title}</h3>
      </div>
      <div className="flex-1 px-4 py-4">
        {items.length === 0 ? (
          <p className="text-sm text-slate-600">{emptyState}</p>
        ) : (
          <ul className="space-y-3">
            {items.map((item) => (
              <li key={item.id ?? item.primary} className="rounded-lg border border-slate-200 bg-white px-3 py-2">
                <p className="text-sm font-medium text-slate-900">{item.primary ?? 'Unknown'}</p>
                {item.secondary ? <p className="text-xs text-slate-600">{item.secondary}</p> : null}
              </li>
            ))}
          </ul>
        )}
      </div>
      {footerLink ? (
        <div className="border-t border-slate-200 px-4 py-3">
          <Link
            href={footerLink.href}
            className="text-sm font-semibold text-orange-600 hover:text-orange-700"
          >
            <span>{footerLink.label}</span>
            <span aria-hidden="true" className="ml-1">
              &gt;
            </span>
          </Link>
        </div>
      ) : null}
    </article>
  )
}
