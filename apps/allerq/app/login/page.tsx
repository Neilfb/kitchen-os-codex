'use client'

import Image from 'next/image'
import Link from 'next/link'
import { FormEvent, useState } from 'react'

import { Button } from '@/components/ui/button'
import { loginWithNoCodeBackend } from '@/lib/auth'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')
    setLoading(true)

    try {
      await loginWithNoCodeBackend(email.trim().toLowerCase(), password)
      window.location.href = '/dashboard'
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Login failed. Please try again.'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-orange-50 via-white to-slate-100 px-6 py-16">
      <div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-xl shadow-orange-100">
        <div className="mb-8 flex flex-col items-center text-center">
          <Image
            src="/logo.png"
            alt="AllerQ logo"
            width={72}
            height={72}
            className="h-16 w-16"
            priority
          />
          <h1 className="mt-6 text-3xl font-semibold text-slate-900">Welcome back</h1>
          <p className="mt-2 text-base text-slate-600">
            Sign in to manage your allergen-safe menus and QR experiences.
          </p>
        </div>

        <form className="space-y-6" onSubmit={handleLogin}>
          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium text-slate-700">
              Email address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-slate-900 shadow-sm transition duration-150 focus:border-[#F97316] focus:outline-none focus:ring-2 focus:ring-[#F97316]/40"
              placeholder="you@allerq.com"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="password" className="text-sm font-medium text-slate-700">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-slate-900 shadow-sm transition duration-150 focus:border-[#F97316] focus:outline-none focus:ring-2 focus:ring-[#F97316]/40"
              placeholder="Enter your password"
            />
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <Button
            type="submit"
            disabled={loading}
            className="mt-4 w-full bg-[#F97316] px-4 py-2.5 font-semibold text-white hover:-translate-y-0.5 hover:bg-[#ea6b0c] hover:shadow-lg"
          >
            {loading ? 'Signing in…' : 'Sign in'}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-600">
          New to AllerQ?{' '}
          <Button asChild className="inline-flex items-center px-0 py-0 font-medium text-[#F97316] hover:text-[#ea6b0c]">
            <Link href="/signup">Create an account</Link>
          </Button>
        </p>
      </div>
    </main>
  )
}
