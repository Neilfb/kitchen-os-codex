export default function Loading() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-orange-50 via-white to-slate-100">
      <div className="flex flex-col items-center gap-4">
        <span className="flex h-14 w-14 animate-spin items-center justify-center rounded-full border-4 border-[#F97316]/30 border-t-[#F97316]" />
        <p className="text-sm font-medium text-slate-600">Preparing your AllerQ experience…</p>
      </div>
    </div>
  )
}
