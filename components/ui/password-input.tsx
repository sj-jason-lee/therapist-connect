'use client'

import { useState, forwardRef } from 'react'
import { Eye, EyeOff, Lock, Check, X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface PasswordInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string
  error?: string
  showStrength?: boolean
}

interface StrengthCheck {
  label: string
  test: (password: string) => boolean
}

const strengthChecks: StrengthCheck[] = [
  { label: 'At least 8 characters', test: (p) => p.length >= 8 },
  { label: 'Contains uppercase letter', test: (p) => /[A-Z]/.test(p) },
  { label: 'Contains lowercase letter', test: (p) => /[a-z]/.test(p) },
  { label: 'Contains number', test: (p) => /\d/.test(p) },
]

export const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ label, error, showStrength = false, className, id, ...props }, ref) => {
    const [showPassword, setShowPassword] = useState(false)
    const [isFocused, setIsFocused] = useState(false)
    const inputId = id || 'password'
    const errorId = `${inputId}-error`
    const value = (props.value as string) || ''

    const passedChecks = strengthChecks.filter((check) => check.test(value)).length
    const strengthPercentage = (passedChecks / strengthChecks.length) * 100

    const getStrengthColor = () => {
      if (strengthPercentage <= 25) return 'bg-red-500'
      if (strengthPercentage <= 50) return 'bg-yellow-500'
      if (strengthPercentage <= 75) return 'bg-blue-500'
      return 'bg-green-500'
    }

    const getStrengthLabel = () => {
      if (strengthPercentage <= 25) return 'Weak'
      if (strengthPercentage <= 50) return 'Fair'
      if (strengthPercentage <= 75) return 'Good'
      return 'Strong'
    }

    return (
      <div className="space-y-1">
        {label && (
          <label htmlFor={inputId} className="block text-sm font-medium text-gray-700">
            {label}
          </label>
        )}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Lock className="h-5 w-5 text-gray-400" aria-hidden="true" />
          </div>
          <input
            ref={ref}
            type={showPassword ? 'text' : 'password'}
            id={inputId}
            className={cn(
              'block w-full pl-10 pr-10 py-2 border rounded-lg',
              'text-gray-900 placeholder:text-gray-400',
              'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500',
              'disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed',
              error
                ? 'border-red-500 focus:ring-red-500 focus:border-red-500'
                : 'border-gray-300',
              className
            )}
            aria-invalid={error ? 'true' : 'false'}
            aria-describedby={error ? errorId : undefined}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            {...props}
          />
          <button
            type="button"
            className="absolute inset-y-0 right-0 pr-3 flex items-center"
            onClick={() => setShowPassword(!showPassword)}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? (
              <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
            ) : (
              <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
            )}
          </button>
        </div>

        {/* Password Strength Indicator */}
        {showStrength && value && (
          <div className="space-y-2 pt-2">
            {/* Strength Bar */}
            <div className="flex items-center gap-2">
              <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className={cn('h-full transition-all duration-300', getStrengthColor())}
                  style={{ width: `${strengthPercentage}%` }}
                />
              </div>
              <span className={cn('text-xs font-medium', {
                'text-red-600': strengthPercentage <= 25,
                'text-yellow-600': strengthPercentage > 25 && strengthPercentage <= 50,
                'text-blue-600': strengthPercentage > 50 && strengthPercentage <= 75,
                'text-green-600': strengthPercentage > 75,
              })}>
                {getStrengthLabel()}
              </span>
            </div>

            {/* Requirements Checklist */}
            {isFocused && (
              <ul className="space-y-1" aria-label="Password requirements">
                {strengthChecks.map((check, index) => {
                  const passed = check.test(value)
                  return (
                    <li
                      key={index}
                      className={cn(
                        'flex items-center gap-2 text-xs',
                        passed ? 'text-green-600' : 'text-gray-500'
                      )}
                    >
                      {passed ? (
                        <Check className="h-3 w-3" aria-hidden="true" />
                      ) : (
                        <X className="h-3 w-3" aria-hidden="true" />
                      )}
                      {check.label}
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        )}

        {error && (
          <p id={errorId} className="text-sm text-red-600" role="alert">
            {error}
          </p>
        )}
      </div>
    )
  }
)

PasswordInput.displayName = 'PasswordInput'
