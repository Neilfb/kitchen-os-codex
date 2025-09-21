'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { FormEvent, useState } from 'react'

import { Button } from '@/components/ui/button'
import { createUser } from '@/lib/users'

export default function SignupPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')

    if (!name.trim() || !email.trim() || !password.trim()) {
      setError('Please fill in all fields before continuing.')
      return
    }

    setLoading(true)

    try {
      await createUser({
        email: email.trim().toLowerCase(),
        password,
        displayName: name.trim()
      })

      router.push('/dashboard')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to complete signup right now.'
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
          <h1 className="mt-6 text-3xl font-semibold text-slate-900">Create your AllerQ account</h1>
          <p className="mt-2 text-base text-slate-600">
            Smart allergen management starts here. Sign up to create or manage your restaurant menus.
          </p>
        </div>

        <form className="space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <label htmlFor="name" className="text-sm font-medium text-slate-700">
              Full name
            </label>
            <input
              id="name"
              name="name"
              type="text"
              autoComplete="name"
              required
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-slate-900 shadow-sm transition duration-150 focus:border-[#F97316] focus:outline-none focus:ring-2 focus:ring-[#F97316]/40"
              placeholder="Taylor Lee"
            />
          </div>

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
              autoComplete="new-password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-slate-900 shadow-sm transition duration-150 focus:border-[#F97316] focus:outline-none focus:ring-2 focus:ring-[#F97316]/40"
              placeholder="Enter a secure password"
              minLength={8}
            />
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <Button
            type="submit"
            disabled={loading}
            className="mt-4 w-full bg-[#F97316] px-4 py-2.5 font-semibold text-white hover:-translate-y-0.5 hover:bg-[#ea6b0c] hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-90"
          >
            {loading ? 'Creating account…' : 'Create account'}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-600">
          Already have an account?{' '}
          <Link href="/login" className="font-medium text-[#F97316] transition-colors hover:text-[#ea6b0c]">
            Sign in
          </Link>
        </p>
      </div>
    </main>
  )
}
