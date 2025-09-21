'use client'

import Link from 'next/link'
import { FormEvent, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'

import { Button } from '@/components/ui/button'

const inputClassName =
  'w-full rounded-lg border border-slate-200 px-3 py-2 text-slate-900 shadow-sm transition duration-150 focus:outline-none focus:ring-2 focus:ring-[#F97316]/40'

const errorInputClassName = 'border-red-400 focus:border-red-500 focus:ring-red-300'

export default function CreateQrPage() {
  const router = useRouter()
  const [design, setDesign] = useState('classic')
  const [accentColor, setAccentColor] = useState('#F97316')
  const [label, setLabel] = useState('Scan for allergen-friendly menu')
  const [tableNumber, setTableNumber] = useState('')
  const [message, setMessage] = useState('')
  const [generating, setGenerating] = useState(false)
  const [errors, setErrors] = useState<{ label?: string; tableNumber?: string }>({})

  const previewAccent = useMemo(() => accentColor || '#F97316', [accentColor])

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setGenerating(true)
    setMessage('')

    const nextErrors: { label?: string; tableNumber?: string } = {}

    if (!label.trim()) {
      nextErrors.label = 'Add a call-to-action label so guests know what to expect.'
    }

    if (tableNumber && !/^[0-9A-Za-z-]+$/.test(tableNumber.trim())) {
      nextErrors.tableNumber = 'Use numbers or simple table identifiers (letters, numbers, or hyphen).'
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors)
      setGenerating(false)
      return
    }

    setErrors({})

    try {
      await new Promise((resolve) => setTimeout(resolve, 800))
      setMessage('QR created! Save and print for your tables.')
      router.push('/qr/demo')
    } finally {
      setGenerating(false)
    }
  }

  return (
    <main className="flex min-h-screen flex-col bg-gradient-to-br from-orange-50 via-white to-slate-100 px-6 py-16">
      <div className="mx-auto w-full max-w-3xl rounded-3xl bg-white p-10 shadow-xl shadow-orange-100">
        <nav aria-label="Breadcrumb" className="mb-6 text-sm text-slate-500">
          <ol className="flex flex-wrap items-center gap-2">
            <li>
              <Link className="transition-colors hover:text-[#F97316]" href="/dashboard">
                Dashboard
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li>
              <Link className="transition-colors hover:text-[#F97316]" href="/dashboard/menus/add">
                Menu builder
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li className="font-medium text-slate-700">QR experience</li>
          </ol>
        </nav>

        <header className="mb-10">
          <p className="text-sm font-semibold uppercase tracking-wide text-[#F97316]">Step 3</p>
          <h1 className="mt-2 text-3xl font-semibold text-slate-900">Create a branded QR experience</h1>
          <p className="mt-3 text-base text-slate-600">
            Personalize your QR code with AllerQ styling so guests trust the allergen information instantly.
          </p>
        </header>

        <div className="mb-6 rounded-2xl border border-orange-100 bg-orange-50/60 px-4 py-3 text-sm text-slate-600">
          QR previews update live. Leaving before generating will reset your selections for now.
        </div>

        <div className="mb-8 flex flex-wrap gap-3">
          <Button
            asChild
            className="border border-[#F97316] px-4 py-2.5 text-sm font-semibold text-[#F97316] hover:-translate-y-0.5 hover:bg-orange-50 hover:text-[#ea6b0c]"
          >
            <Link href="/qr/demo">View sample QR</Link>
          </Button>
          <Button
            asChild
            className="bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm hover:-translate-y-0.5 hover:bg-slate-50 hover:shadow-md"
          >
            <Link href="/dashboard/menus/add">Back to menu builder</Link>
          </Button>
        </div>

        <form className="space-y-8" onSubmit={handleSubmit}>
          <section className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <label htmlFor="design" className="text-sm font-medium text-slate-700">
                  QR design template
                </label>
                <select
                  id="design"
                  value={design}
                  onChange={(event) => setDesign(event.target.value)}
                  className={inputClassName}
                >
                  <option value="classic">Classic AllerQ</option>
                  <option value="minimal">Minimal monochrome</option>
                  <option value="bold">Bold accent</option>
                </select>
              </div>

              <div className="space-y-2">
                <label htmlFor="color" className="text-sm font-medium text-slate-700">
                  Accent color
                </label>
                <input
                  id="color"
                  type="color"
                  value={accentColor}
                  onChange={(event) => setAccentColor(event.target.value)}
                  className="h-11 w-full rounded-lg border border-slate-200 bg-white"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="label" className="text-sm font-medium text-slate-700">
                Call-to-action label
              </label>
              <input
                id="label"
                value={label}
                onChange={(event) => setLabel(event.target.value)}
                aria-invalid={Boolean(errors.label)}
                className={`${inputClassName} ${errors.label ? errorInputClassName : ''}`.trim()}
              />
              {errors.label && <p className="text-xs text-red-500">{errors.label}</p>}
            </div>

            <div className="space-y-2">
              <label htmlFor="tableNumber" className="text-sm font-medium text-slate-700">
                Table number (optional)
              </label>
              <input
                id="tableNumber"
                value={tableNumber}
                onChange={(event) => setTableNumber(event.target.value)}
                placeholder="12"
                aria-invalid={Boolean(errors.tableNumber)}
                className={`${inputClassName} ${errors.tableNumber ? errorInputClassName : ''}`.trim()}
              />
              {errors.tableNumber && <p className="text-xs text-red-500">{errors.tableNumber}</p>}
            </div>
          </section>

          <section className="rounded-2xl border border-dashed border-slate-200 p-6 text-center">
            <p className="text-sm font-semibold uppercase tracking-wide text-[#F97316]">Live preview</p>
            <div className="mt-6 flex flex-col items-center gap-5 sm:flex-row sm:justify-center">
              <div
                className="flex h-32 w-32 items-center justify-center rounded-xl border-8 border-slate-200 bg-slate-50 text-slate-500"
                style={{ borderColor: previewAccent }}
              >
                QR {design === 'bold' ? '⚡️' : design === 'minimal' ? '◻️' : '◎'}
              </div>
              <div className="text-left text-slate-600">
                <p className="text-lg font-semibold text-slate-900">{label || 'Scan for allergen-friendly menu'}</p>
                <p className="text-sm">
                  Accent color:{' '}
                  <span className="font-medium" style={{ color: previewAccent }}>
                    {previewAccent.toUpperCase()}
                  </span>
                </p>
                {tableNumber && <p className="text-sm">Table {tableNumber}</p>}
                <p className="mt-3 text-xs text-slate-500">
                  Download-ready PNG & SVG files will be available after you generate this QR code.
                </p>
              </div>
            </div>
          </section>

          {message && (
            <div className="space-y-3">
              <p className="rounded-lg bg-green-50 px-4 py-3 text-sm text-green-700">{message}</p>
              <div className="flex flex-wrap gap-3">
                <Button
                  asChild
                  className="bg-[#F97316] px-4 py-2.5 text-white hover:-translate-y-0.5 hover:bg-[#ea6b0c] hover:shadow-lg"
                >
                  <Link href="/qr/demo">Preview live QR</Link>
                </Button>
                <Button
                  asChild
                  className="border border-[#F97316] px-4 py-2.5 text-[#F97316] hover:-translate-y-0.5 hover:bg-orange-50 hover:text-[#ea6b0c]"
                >
                  <Link href="/dashboard/analytics">Track engagement</Link>
                </Button>
              </div>
            </div>
          )}

          <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
            <Button
              type="button"
              className="w-full bg-white px-4 py-2.5 text-slate-700 shadow-sm hover:-translate-y-0.5 hover:bg-slate-50 hover:shadow-md sm:w-auto"
              onClick={() => router.push('/dashboard/menus/add')}
            >
              Back
            </Button>
            <Button
              type="submit"
              disabled={generating}
              className="w-full bg-[#F97316] px-4 py-2.5 font-semibold text-white hover:-translate-y-0.5 hover:bg-[#ea6b0c] hover:shadow-lg sm:w-auto"
            >
              {generating ? 'Generating QR…' : 'Generate QR code'}
            </Button>
          </div>
        </form>
      </div>
    </main>
  )
}
