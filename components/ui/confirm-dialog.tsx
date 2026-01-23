'use client'

import { useEffect, useRef } from 'react'
import { AlertTriangle, X } from 'lucide-react'
import { Button } from './button'
import { cn } from '@/lib/utils'

interface ConfirmDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  variant?: 'danger' | 'warning' | 'default'
  loading?: boolean
}

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'default',
  loading = false,
}: ConfirmDialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null)
  const confirmButtonRef = useRef<HTMLButtonElement>(null)

  // Focus trap and escape key handling
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    confirmButtonRef.current?.focus()

    // Prevent body scroll
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  const variantStyles = {
    danger: {
      icon: 'bg-red-100 text-red-600',
      button: 'bg-red-600 hover:bg-red-700 focus-visible:ring-red-500',
    },
    warning: {
      icon: 'bg-yellow-100 text-yellow-600',
      button: 'bg-yellow-600 hover:bg-yellow-700 focus-visible:ring-yellow-500',
    },
    default: {
      icon: 'bg-blue-100 text-blue-600',
      button: 'bg-primary-600 hover:bg-primary-700 focus-visible:ring-primary-500',
    },
  }

  const styles = variantStyles[variant]

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
      aria-describedby="confirm-dialog-description"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Dialog */}
      <div
        ref={dialogRef}
        className="relative bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6 animate-scale-in"
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 rounded hover:bg-gray-100 transition-colors"
          aria-label="Close dialog"
        >
          <X className="h-5 w-5 text-gray-500" />
        </button>

        {/* Content */}
        <div className="flex gap-4">
          <div className={cn('flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center', styles.icon)}>
            <AlertTriangle className="h-5 w-5" aria-hidden="true" />
          </div>
          <div className="flex-1">
            <h3 id="confirm-dialog-title" className="text-lg font-semibold text-gray-900">
              {title}
            </h3>
            <p id="confirm-dialog-description" className="mt-2 text-sm text-gray-600">
              {message}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 mt-6">
          <Button variant="outline" onClick={onClose} disabled={loading}>
            {cancelText}
          </Button>
          <button
            ref={confirmButtonRef}
            onClick={onConfirm}
            disabled={loading}
            className={cn(
              'inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-white rounded-lg',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
              'disabled:opacity-50 disabled:cursor-not-allowed transition-colors',
              styles.button
            )}
          >
            {loading ? 'Please wait...' : confirmText}
          </button>
        </div>
      </div>
    </div>
  )
}
