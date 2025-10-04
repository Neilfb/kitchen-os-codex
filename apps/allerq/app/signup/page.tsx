'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { FormEvent, useState } from 'react'
import { signIn } from 'next-auth/react'

import { Button } from '@/components/ui/button'
import { getPasswordStrength, getPasswordStrengthLabel } from '@/components/auth/passwordStrength'
import { createUser } from '@/lib/ncb/createUser'

export default function SignupPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
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
      const normalizedEmail = email.trim().toLowerCase()

      await createUser({
        email: normalizedEmail,
        password,
        fullName: name.trim(),
      })

      const signInResult = await signIn('credentials', {
        redirect: false,
        email: normalizedEmail,
        password,
      })

      if (signInResult?.error) {
        setError(signInResult.error)
        return
      }

      router.push('/dashboard')
      router.refresh()
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
            <div className="relative">
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-slate-900 shadow-sm transition duration-150 focus:border-[#F97316] focus:outline-none focus:ring-2 focus:ring-[#F97316]/40"
                placeholder="Enter a secure password"
                minLength={8}
              />
              <button
                type="button"
                className="absolute inset-y-0 right-2 my-2 rounded px-2 text-xs font-semibold text-slate-600 hover:text-orange-600"
                onClick={() => setShowPassword((prev) => !prev)}
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
            <PasswordStrengthHint password={password} />
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
          <Link href="/sign-in" className="font-medium text-[#F97316] transition-colors hover:text-[#ea6b0c]">
            Sign in
          </Link>
        </p>
      </div>
    </main>
  )
}

function PasswordStrengthHint({ password }: { password: string }) {
  const strength = getPasswordStrength(password)
  const label = getPasswordStrengthLabel(strength)

  const colorClass = {
    weak: 'text-red-600',
    fair: 'text-orange-600',
    good: 'text-amber-600',
    strong: 'text-green-600',
  }[strength]

  const progress = {
    weak: 'w-1/4 bg-red-500',
    fair: 'w-1/2 bg-orange-500',
    good: 'w-3/4 bg-amber-500',
    strong: 'w-full bg-green-500',
  }[strength]

  return (
    <div className="space-y-1 text-sm">
      <div className="h-1 rounded-full bg-slate-200">
        <div className={`h-1 rounded-full transition-all duration-200 ${progress}`} />
      </div>
      <p className={colorClass}>{label}</p>
      <p className="text-xs text-slate-500">
        Use at least 12 characters with a mix of upper/lowercase letters, numbers, and symbols for a stronger password.
      </p>
    </div>
  )
}
