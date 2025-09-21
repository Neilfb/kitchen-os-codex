'use client'

import { useEffect } from 'react'

import { Button } from '@/components/ui/button'

type ErrorPageProps = {
  error: Error & { digest?: string }
  reset: () => void
}

export default function GlobalError({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    console.error('AllerQ app error boundary', error)
  }, [error])

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-orange-50 via-white to-slate-100 px-6 py-16">
      <div className="w-full max-w-lg rounded-3xl bg-white p-10 text-center shadow-xl shadow-orange-100">
        <p className="text-sm font-semibold uppercase tracking-wide text-[#F97316]">Something went wrong</p>
        <h1 className="mt-4 text-3xl font-semibold text-slate-900">We lost the allergen trail.</h1>
        <p className="mt-3 text-base text-slate-600">
          Our team has been notified. Try refreshing the page or return to the dashboard to continue serving safe dining
          experiences.
        </p>
        {error?.message && <p className="mt-4 text-sm text-slate-400">{error.message}</p>}

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Button
            onClick={() => reset()}
            className="w-full bg-[#F97316] px-4 py-2.5 font-semibold text-white hover:-translate-y-0.5 hover:bg-[#ea6b0c] hover:shadow-lg sm:w-auto"
          >
            Try again
          </Button>
          <Button
            asChild
            className="w-full border border-[#F97316] px-4 py-2.5 font-semibold text-[#F97316] hover:-translate-y-0.5 hover:bg-orange-50 hover:text-[#ea6b0c] sm:w-auto"
          >
            <a href="/dashboard">Go to dashboard</a>
          </Button>
        </div>
      </div>
    </div>
  )
}
