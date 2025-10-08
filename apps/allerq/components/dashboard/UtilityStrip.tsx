import { ReactNode } from 'react'

type UtilityItem = {
  id: string
  label: string
  value: ReactNode
  onClick?: () => void
  href?: string
  intent?: 'primary' | 'default'
}

interface UtilityStripProps {
  items: UtilityItem[]
}

export function UtilityStrip({ items }: UtilityStripProps) {
  return (
    <div className="mt-6 grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:grid-cols-2 lg:grid-cols-5">
      {items.map((item) => {
        const content = (
          <div className="flex h-full flex-col justify-between rounded-xl border border-transparent bg-white px-4 py-3 transition hover:border-slate-200 hover:bg-slate-50">
            <span className="text-xs uppercase tracking-wide text-slate-500">{item.label}</span>
            <span className="text-lg font-semibold text-slate-900">{item.value}</span>
          </div>
        )

        if (item.href) {
          return (
            <a key={item.id} href={item.href} className="block">
              {content}
            </a>
          )
        }

        if (item.intent === 'primary') {
          const className =
            'flex h-full items-center justify-center rounded-xl border border-transparent bg-[var(--color-allerq-orange)] px-4 py-3 text-base font-semibold text-white shadow-sm transition hover:bg-[var(--color-allerq-orange-strong)]'

          if (item.href) {
            return (
              <a key={item.id} href={item.href} className={className}>
                {item.value}
              </a>
            )
          }

          return (
            <button
              key={item.id}
              type="button"
              onClick={item.onClick}
              className={className}
            >
              {item.value}
            </button>
          )
        }

        if (item.onClick) {
          return (
            <button
              key={item.id}
              type="button"
              onClick={item.onClick}
              className="w-full"
            >
              {content}
            </button>
          )
        }

        return (
          <div key={item.id}>
            {content}
          </div>
        )
      })}
    </div>
  )
}
