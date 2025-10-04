'use client'

import { signOut } from 'next-auth/react'

import { Button } from '@components/ui/button'

export function SignOutButton({ className }: { className?: string }) {
  return (
    <Button
      type="button"
      className={className}
      onClick={() => signOut({ callbackUrl: '/sign-in' })}
    >
      Sign out
    </Button>
  )
}
