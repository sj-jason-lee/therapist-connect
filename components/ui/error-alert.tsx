import { AlertCircle, X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ErrorAlertProps {
  message: string
  onDismiss?: () => void
  className?: string
}

export function ErrorAlert({ message, onDismiss, className }: ErrorAlertProps) {
  // Convert Firebase/technical errors to user-friendly messages
  const friendlyMessage = getFriendlyErrorMessage(message)

  return (
    <div
      className={cn(
        'bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3',
        className
      )}
      role="alert"
      aria-live="polite"
    >
      <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" aria-hidden="true" />
      <p className="text-sm text-red-700 flex-1">{friendlyMessage}</p>
      {onDismiss && (
        <button
          onClick={onDismiss}
          className="flex-shrink-0 p-1 rounded hover:bg-red-100 transition-colors"
          aria-label="Dismiss error"
        >
          <X className="h-4 w-4 text-red-500" />
        </button>
      )}
    </div>
  )
}

function getFriendlyErrorMessage(message: string): string {
  // Firebase Auth errors
  if (message.includes('auth/email-already-in-use')) {
    return 'This email is already registered. Please sign in or use a different email.'
  }
  if (message.includes('auth/invalid-email')) {
    return 'Please enter a valid email address.'
  }
  if (message.includes('auth/weak-password')) {
    return 'Password is too weak. Please use at least 8 characters with a mix of letters and numbers.'
  }
  if (message.includes('auth/user-not-found') || message.includes('auth/wrong-password')) {
    return 'Invalid email or password. Please check your credentials and try again.'
  }
  if (message.includes('auth/too-many-requests')) {
    return 'Too many failed attempts. Please wait a few minutes before trying again.'
  }
  if (message.includes('auth/network-request-failed')) {
    return 'Network error. Please check your internet connection and try again.'
  }

  // Firestore errors
  if (message.includes('permission-denied')) {
    return 'You don\'t have permission to perform this action. Please contact support if this persists.'
  }
  if (message.includes('not-found')) {
    return 'The requested item could not be found. It may have been deleted.'
  }

  // Generic network errors
  if (message.includes('NetworkError') || message.includes('Failed to fetch')) {
    return 'Unable to connect to the server. Please check your internet connection.'
  }

  // If no specific match, clean up the message
  if (message.startsWith('Firebase:')) {
    return 'An error occurred. Please try again or contact support.'
  }

  return message
}
