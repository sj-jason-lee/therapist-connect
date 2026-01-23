import * as React from 'react'
import { cn } from '@/lib/utils'

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  icon?: React.ReactNode
  hint?: string
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, label, error, icon, hint, id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-')
    const errorId = error ? `${inputId}-error` : undefined
    const hintId = hint ? `${inputId}-hint` : undefined
    const describedBy = [errorId, hintId].filter(Boolean).join(' ') || undefined

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={inputId} className="block text-sm font-medium text-gray-700 mb-1">
            {label}
          </label>
        )}
        <div className="relative">
          {icon && (
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              {icon}
            </div>
          )}
          <input
            type={type}
            id={inputId}
            className={cn(
              'block w-full rounded-lg border bg-white py-2.5 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 sm:text-sm transition-colors',
              icon ? 'pl-10 pr-3' : 'px-3',
              error
                ? 'border-red-500 focus:ring-red-500 focus:border-red-500'
                : 'border-gray-300 focus:ring-primary-500 focus:border-primary-500',
              className
            )}
            ref={ref}
            aria-invalid={error ? 'true' : undefined}
            aria-describedby={describedBy}
            {...props}
          />
        </div>
        {hint && !error && (
          <p id={hintId} className="mt-1 text-sm text-gray-500">
            {hint}
          </p>
        )}
        {error && (
          <p id={errorId} className="mt-1 text-sm text-red-600" role="alert">
            {error}
          </p>
        )}
      </div>
    )
  }
)
Input.displayName = 'Input'

export { Input }
