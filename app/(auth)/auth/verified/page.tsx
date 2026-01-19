'use client'

import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { CheckCircle, Loader2, PartyPopper } from 'lucide-react'

function EmailVerifiedContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get('redirect') || '/therapist'
  const userType = searchParams.get('type') || 'therapist'
  const [countdown, setCountdown] = useState(5)

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          router.push(redirectTo)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [router, redirectTo])

  const typeLabel = userType === 'therapist' ? 'Athletic Therapist' : userType === 'organizer' ? 'Event Organizer' : 'User'

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 via-white to-secondary-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-xl p-8 text-center space-y-6">
          {/* Success Animation */}
          <div className="relative">
            <div className="w-20 h-20 mx-auto bg-green-100 rounded-full flex items-center justify-center animate-bounce">
              <CheckCircle className="h-10 w-10 text-green-600" />
            </div>
            <div className="absolute -top-2 -right-2 transform translate-x-1/2">
              <PartyPopper className="h-8 w-8 text-yellow-500" />
            </div>
          </div>

          {/* Welcome Message */}
          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-gray-900">
              Welcome to TherapistConnect!
            </h1>
            <p className="text-lg text-gray-600">
              Your email has been verified successfully.
            </p>
          </div>

          {/* User Type Badge */}
          <div className="inline-flex items-center px-4 py-2 bg-primary-50 text-primary-700 rounded-full text-sm font-medium">
            Registered as {typeLabel}
          </div>

          {/* What's Next */}
          <div className="bg-gray-50 rounded-lg p-4 text-left">
            <h3 className="font-semibold text-gray-900 mb-2">What&apos;s next?</h3>
            {userType === 'therapist' ? (
              <ul className="text-sm text-gray-600 space-y-1">
                <li>✓ Complete your profile</li>
                <li>✓ Upload your credentials (CATA card, insurance, BLS)</li>
                <li>✓ Start browsing available shifts</li>
              </ul>
            ) : (
              <ul className="text-sm text-gray-600 space-y-1">
                <li>✓ Set up your organization profile</li>
                <li>✓ Post your first shift</li>
                <li>✓ Connect with qualified therapists</li>
              </ul>
            )}
          </div>

          {/* Redirect Notice */}
          <div className="flex items-center justify-center gap-2 text-gray-500">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm">
              Redirecting to your dashboard in {countdown}s...
            </span>
          </div>

          {/* Manual Link */}
          <Link
            href={redirectTo}
            className="inline-block w-full py-3 px-4 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg transition-colors"
          >
            Go to Dashboard Now
          </Link>
        </div>

        {/* Footer */}
        <p className="text-center text-sm text-gray-500 mt-6">
          Need help?{' '}
          <a href="mailto:support@therapistconnect.ca" className="text-primary-600 hover:underline">
            Contact Support
          </a>
        </p>
      </div>
    </div>
  )
}

function LoadingFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 via-white to-secondary-50">
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600 mx-auto" />
        <p className="text-gray-500 mt-2">Loading...</p>
      </div>
    </div>
  )
}

export default function EmailVerifiedPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <EmailVerifiedContent />
    </Suspense>
  )
}
