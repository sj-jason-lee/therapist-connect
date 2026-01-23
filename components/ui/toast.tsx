'use client'

import { createContext, useContext, useState, useCallback, ReactNode } from 'react'
import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react'
import { cn } from '@/lib/utils'

type ToastType = 'success' | 'error' | 'warning' | 'info'

interface Toast {
  id: string
  type: ToastType
  title: string
  message?: string
  duration?: number
}

interface ToastContextType {
  toasts: Toast[]
  addToast: (toast: Omit<Toast, 'id'>) => void
  removeToast: (id: string) => void
  success: (title: string, message?: string) => void
  error: (title: string, message?: string) => void
  warning: (title: string, message?: string) => void
  info: (title: string, message?: string) => void
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
}

const toastStyles: Record<ToastType, { bg: string; icon: typeof CheckCircle; iconColor: string }> = {
  success: { bg: 'bg-green-50 border-green-200', icon: CheckCircle, iconColor: 'text-green-600' },
  error: { bg: 'bg-red-50 border-red-200', icon: XCircle, iconColor: 'text-red-600' },
  warning: { bg: 'bg-yellow-50 border-yellow-200', icon: AlertCircle, iconColor: 'text-yellow-600' },
  info: { bg: 'bg-blue-50 border-blue-200', icon: Info, iconColor: 'text-blue-600' },
}

function ToastItem({ toast, onRemove }: { toast: Toast; onRemove: () => void }) {
  const style = toastStyles[toast.type]
  const Icon = style.icon

  return (
    <div
      className={cn(
        'flex items-start gap-3 p-4 rounded-lg border shadow-lg animate-slide-in',
        style.bg
      )}
      role="alert"
      aria-live="polite"
    >
      <Icon className={cn('h-5 w-5 flex-shrink-0 mt-0.5', style.iconColor)} aria-hidden="true" />
      <div className="flex-1 min-w-0">
        <p className="font-medium text-gray-900">{toast.title}</p>
        {toast.message && <p className="text-sm text-gray-600 mt-1">{toast.message}</p>}
      </div>
      <button
        onClick={onRemove}
        className="flex-shrink-0 p-1 rounded hover:bg-black/5 transition-colors"
        aria-label="Dismiss notification"
      >
        <X className="h-4 w-4 text-gray-500" />
      </button>
    </div>
  )
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const addToast = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).substring(2, 9)
    const duration = toast.duration ?? 5000

    setToasts((prev) => [...prev, { ...toast, id }])

    if (duration > 0) {
      setTimeout(() => removeToast(id), duration)
    }
  }, [removeToast])

  const success = useCallback((title: string, message?: string) => {
    addToast({ type: 'success', title, message })
  }, [addToast])

  const error = useCallback((title: string, message?: string) => {
    addToast({ type: 'error', title, message })
  }, [addToast])

  const warning = useCallback((title: string, message?: string) => {
    addToast({ type: 'warning', title, message })
  }, [addToast])

  const info = useCallback((title: string, message?: string) => {
    addToast({ type: 'info', title, message })
  }, [addToast])

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast, success, error, warning, info }}>
      {children}
      {/* Toast Container */}
      <div
        className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none"
        aria-label="Notifications"
      >
        {toasts.map((toast) => (
          <div key={toast.id} className="pointer-events-auto">
            <ToastItem toast={toast} onRemove={() => removeToast(toast.id)} />
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}
