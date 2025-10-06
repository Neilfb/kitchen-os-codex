'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'

type ToastPayload = {
  title: string
  description?: string
  variant?: 'success' | 'error' | 'info'
  duration?: number
}

type ToastInternal = ToastPayload & { id: string }

type ToastContextValue = {
  toast: (payload: ToastPayload) => void
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined)

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastInternal[]>([])
  const [isMounted, setIsMounted] = useState(false)

  const dismiss = useCallback((id: string) => {
    setToasts((current) => current.filter((toast) => toast.id !== id))
  }, [])

  const toast = useCallback(
    ({ title, description, variant = 'info', duration = 5000 }: ToastPayload) => {
      const id =
        typeof crypto !== 'undefined' && 'randomUUID' in crypto
          ? crypto.randomUUID()
          : Math.random().toString(36).slice(2)

      setToasts((current) => [...current, { id, title, description, variant }])

      if (duration !== Infinity && typeof window !== 'undefined') {
        window.setTimeout(() => dismiss(id), duration)
      }
    },
    [dismiss]
  )

  useEffect(() => {
    setIsMounted(true)
  }, [])

  const value = useMemo(() => ({ toast }), [toast])

  return (
    <ToastContext.Provider value={value}>
      {children}
      {isMounted
        ? createPortal(
            <ToastViewport toasts={toasts} onDismiss={dismiss} />,
            document.body
          )
        : null}
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
}

type ToastViewportProps = {
  toasts: ToastInternal[]
  onDismiss: (id: string) => void
}

function ToastViewport({ toasts, onDismiss }: ToastViewportProps) {
  if (toasts.length === 0) {
    return null
  }

  return (
    <div className="fixed inset-x-0 top-4 z-50 flex justify-center px-4 sm:justify-end sm:px-6">
      <div className="flex w-full max-w-sm flex-col gap-3">
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onDismiss={onDismiss} />
        ))}
      </div>
    </div>
  )
}

type ToastItemProps = {
  toast: ToastInternal
  onDismiss: (id: string) => void
}

function ToastItem({ toast, onDismiss }: ToastItemProps) {
  const tone = toast.variant === 'error' ? 'border-red-500 text-red-700' : toast.variant === 'success' ? 'border-emerald-500 text-emerald-700' : 'border-slate-500 text-slate-700'
  const accent = toast.variant === 'error' ? 'bg-red-500' : toast.variant === 'success' ? 'bg-emerald-500' : 'bg-slate-500'

  return (
    <div className={`relative overflow-hidden rounded-xl border-l-4 bg-white px-4 py-3 shadow-lg ${tone}`}>
      <span className={`absolute left-0 top-0 h-full w-1 ${accent}`} aria-hidden />
      <div className="flex items-start gap-3">
        <div className="flex-1 space-y-1">
          <p className="text-sm font-semibold">{toast.title}</p>
          {toast.description ? <p className="text-sm text-slate-600">{toast.description}</p> : null}
        </div>
        <button
          type="button"
          onClick={() => onDismiss(toast.id)}
          className="text-sm font-medium text-slate-500 transition hover:text-slate-700"
          aria-label="Dismiss notification"
        >
          ×
        </button>
      </div>
    </div>
  )
}
