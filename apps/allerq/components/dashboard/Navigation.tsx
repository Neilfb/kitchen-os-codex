'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const links = [
  { href: '/dashboard', label: 'Overview' },
  { href: '/restaurants', label: 'Restaurants' },
  { href: '/users', label: 'Users' },
]

export function DashboardNavigation() {
  const pathname = usePathname()

  return (
    <nav className="flex gap-2 rounded-xl border border-slate-200 bg-white p-1 text-sm shadow-sm">
      {links.map((link) => {
        const isActive = pathname === link.href
        return (
          <Link
            key={link.href}
            href={link.href}
            className={`flex-1 rounded-lg px-3 py-2 text-center font-medium transition-colors ${
              isActive ? 'bg-orange-600 text-white' : 'text-slate-600 hover:bg-orange-50'
            }`}
          >
            {link.label}
          </Link>
        )
      })}
    </nav>
  )
}
