'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { signIn } from 'next-auth/react'

import { Input } from '@components/ui/input'
import { Button } from '@components/ui/button'

export default function SignInPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const handleSignIn = async () => {
    setError('')

    const result = await signIn('credentials', {
      redirect: false,
      email,
      password,
    })

    if (result?.error) {
      setError(result.error)
      return
    }

    router.push('/dashboard')
    router.refresh()
  }

  return (
    <div className="mx-auto mt-24 w-full max-w-sm space-y-4 rounded-xl bg-white p-6 shadow-md">
      <h1 className="text-center text-2xl font-bold">Sign In</h1>
      <Input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
      />
      <div className="relative">
        <Input
          type={showPassword ? 'text' : 'password'}
          placeholder="Password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
        <button
          type="button"
          className="absolute inset-y-0 right-2 my-2 rounded px-2 text-xs font-semibold text-slate-600 hover:text-orange-600"
          onClick={() => setShowPassword((prev) => !prev)}
        >
          {showPassword ? 'Hide' : 'Show'}
        </button>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <Button onClick={handleSignIn} className="w-full">
        Sign In
      </Button>
      <div className="text-center text-sm text-slate-600">
        <Link href="/forgot-password" className="font-medium text-orange-600 hover:underline">
          Forgot password?
        </Link>
      </div>
    </div>
  )
}
