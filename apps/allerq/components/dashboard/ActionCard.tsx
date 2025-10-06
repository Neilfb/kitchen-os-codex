import Link from 'next/link'

type ActionCardProps = {
  title: string
  description: string
  cta: string
  href: string
}

export function ActionCard({ title, description, cta, href }: ActionCardProps) {
  return (
    <article className="flex h-full flex-col justify-between rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="space-y-2">
        <h3 className="text-base font-semibold text-slate-900">{title}</h3>
        <p className="text-sm text-slate-600">{description}</p>
      </div>
      <Link
        href={href}
        className="mt-4 inline-flex items-center text-sm font-semibold text-orange-600 hover:text-orange-700"
      >
        <span>{cta}</span>
        <span aria-hidden="true" className="ml-1">
          &gt;
        </span>
      </Link>
    </article>
  )
}
