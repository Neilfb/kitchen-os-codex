'use client'

import { useState } from 'react'
import Link from 'next/link'

import { Button } from '@components/ui/button'
import { Input } from '@components/ui/input'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'sent' | 'error'>('idle')
  const [message, setMessage] = useState('')

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setStatus('loading')
    setMessage('')

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const data = await response.json()
      if (!response.ok) {
        throw new Error(data?.message || 'Unable to process request')
      }
      setStatus('sent')
      setMessage(data.message)
    } catch (error) {
      setStatus('error')
      setMessage(error instanceof Error ? error.message : 'Something went wrong')
    }
  }

  return (
    <div className="mx-auto mt-24 w-full max-w-md space-y-6 rounded-3xl bg-white p-8 shadow-xl shadow-orange-100">
      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-semibold text-slate-900">Forgot password</h1>
        <p className="text-sm text-slate-600">
          Enter the email address associated with your account and we&apos;ll send instructions to reset your password.
        </p>
      </div>

      <form className="space-y-4" onSubmit={handleSubmit}>
        <Input
          type="email"
          placeholder="you@allerq.com"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
        />
        <Button type="submit" className="w-full" disabled={status === 'loading'}>
          {status === 'loading' ? 'Sending…' : 'Send reset link'}
        </Button>
      </form>

      {message && (
        <p className={`text-sm ${status === 'error' ? 'text-red-600' : 'text-green-600'}`}>{message}</p>
      )}

      <p className="text-center text-sm text-slate-600">
        Remember your password?{' '}
        <Link href="/sign-in" className="font-medium text-orange-600 hover:underline">
          Back to sign in
        </Link>
      </p>
    </div>
  )
}
