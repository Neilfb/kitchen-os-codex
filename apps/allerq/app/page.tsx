import Image from 'next/image'
import Link from 'next/link'

import { Button } from '@/components/ui/button'

const PRIMARY_BUTTON_CLASSES =
  'bg-[#F97316] hover:bg-[#ea6b0c] focus-visible:ring-[#F97316] transition-transform duration-200 hover:-translate-y-0.5 hover:shadow-lg'

export default function HomePage() {
  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-orange-50 via-white to-slate-100 px-6 py-16 text-center">
      <div className="absolute inset-x-0 top-0 h-64 bg-gradient-to-b from-[#F97316]/10 to-transparent" aria-hidden="true" />

      <div className="relative z-10 flex w-full max-w-lg flex-col items-center gap-8">
        <Image
          src="/logo.png"
          alt="AllerQ logo"
          width={96}
          height={96}
          className="h-20 w-20"
          priority
        />

        <div className="flex flex-col gap-3">
          <h1 className="text-4xl font-semibold text-slate-900 sm:text-5xl">Welcome to AllerQ</h1>
          <p className="text-lg text-slate-600 sm:text-xl">Smart, Safe Allergen QR Menus</p>
        </div>

        <div className="flex w-full flex-col gap-4 sm:flex-row sm:justify-center">
          <Button asChild className={PRIMARY_BUTTON_CLASSES + ' text-white'}>
            <Link href="/signup">Sign Up</Link>
          </Button>
          <Button asChild className="bg-white text-[#F97316] hover:bg-orange-50 focus-visible:ring-[#F97316] transition-transform duration-200 hover:-translate-y-0.5 hover:shadow-lg">
            <Link href="/sign-in">Sign In</Link>
          </Button>
        </div>
      </div>
    </main>
  )
}
