import { useEffect } from 'react'
import { useStore } from '../../store/store'
import type { Toast, ToastType } from '../../store/toastSlice'

const AUTO_DISMISS_MS = 4000

const toastClasses: Record<ToastType, string> = {
  success: 'border-emerald-200 bg-emerald-50 text-emerald-800',
  error: 'border-red-200 bg-red-50 text-red-800',
  info: 'border-slate-200 bg-white text-slate-800',
}

interface ToastItemProps {
  toast: Toast
  onDismiss: (id: string) => void
}

function ToastItem({ toast, onDismiss }: ToastItemProps) {
  useEffect(() => {
    const timer = setTimeout(() => onDismiss(toast.id), AUTO_DISMISS_MS)
    return () => clearTimeout(timer)
  }, [toast.id, onDismiss])

  return (
    <div
      className={`flex items-start gap-3 rounded-xl border px-4 py-3 text-sm shadow-lg ${toastClasses[toast.type]}`}
    >
      <p className="flex-1">{toast.message}</p>
      <button
        type="button"
        onClick={() => onDismiss(toast.id)}
        aria-label="Dismiss notification"
        className="-mr-1 rounded p-0.5 opacity-60 hover:opacity-100 focus-visible:outline-2 focus-visible:outline-brand-600"
      >
        ✕
      </button>
    </div>
  )
}

function ToastContainer() {
  const toasts = useStore((state) => state.toasts)
  const dismissToast = useStore((state) => state.dismissToast)

  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed inset-x-4 bottom-4 z-50 flex flex-col items-end gap-2 sm:left-auto sm:w-96"
    >
      {toasts.map((toast) => (
        <div key={toast.id} className="pointer-events-auto w-full">
          <ToastItem toast={toast} onDismiss={dismissToast} />
        </div>
      ))}
    </div>
  )
}

export default ToastContainer
