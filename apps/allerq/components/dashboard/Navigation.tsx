'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSession } from 'next-auth/react'

import type { Capability } from '@/types/user'

const links: Array<{
  href: string
  label: string
  capabilities?: Capability[]
}> = [
  { href: '/dashboard', label: 'Overview' },
  {
    href: '/restaurants',
    label: 'Restaurants',
    capabilities: ['restaurant.manage:any', 'restaurant.manage:own', 'restaurant.manage:assigned'],
  },
  {
    href: '/users',
    label: 'Users',
    capabilities: ['user.manage:any', 'user.manage:own'],
  },
]

export function DashboardNavigation() {
  const pathname = usePathname()
  const { data } = useSession()

  const role = data?.user?.role ?? 'manager'
  const capabilitySet = new Set<Capability>(
    Array.isArray(data?.user?.capabilities) ? (data?.user?.capabilities as Capability[]) : []
  )

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">AllerQ admin</p>
      <nav className="mt-4 flex flex-col gap-1">
        {links
          .filter((link) => {
            if (!link.capabilities) {
              return true
            }

            if (role === 'superadmin') {
              return true
            }

            return link.capabilities.some((capability) => capabilitySet.has(capability))
          })
          .map((link) => {
            const isActive = pathname === link.href
            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={isActive ? 'page' : undefined}
                className={`flex items-center justify-between rounded-lg px-3 py-2 text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-orange-600 text-white shadow-sm'
                    : 'text-slate-600 hover:-translate-y-0.5 hover:bg-orange-50 hover:text-slate-900'
                }`}
              >
                <span>{link.label}</span>
                {isActive ? <span className="text-xs uppercase tracking-wide">Active</span> : null}
              </Link>
            )
          })}
      </nav>
    </div>
  )
}
