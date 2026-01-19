import Link from 'next/link'
import { UserCircle, Building2, ArrowRight } from 'lucide-react'

export default function RegisterPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl w-full space-y-8">
        <div>
          <Link href="/" className="block text-center">
            <span className="text-2xl font-bold text-primary-600">TherapistConnect</span>
          </Link>
          <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900">
            Create your account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Already have an account?{' '}
            <Link href="/login" className="font-medium text-primary-600 hover:text-primary-500">
              Sign in
            </Link>
          </p>
        </div>

        <div className="mt-10">
          <p className="text-center text-gray-600 mb-8">
            Choose how you want to use TherapistConnect
          </p>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Therapist Option */}
            <Link
              href="/register/therapist"
              className="group relative bg-white p-8 rounded-2xl border-2 border-gray-200 hover:border-primary-500 transition-all hover:shadow-lg"
            >
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center group-hover:bg-primary-200 transition-colors">
                  <UserCircle className="h-8 w-8 text-primary-600" />
                </div>
                <h3 className="mt-4 text-xl font-semibold text-gray-900">
                  I&apos;m an Athletic Therapist
                </h3>
                <p className="mt-2 text-gray-600">
                  Find shifts, build your client base, and get paid for your expertise
                </p>
                <ul className="mt-4 text-sm text-gray-500 space-y-2">
                  <li>Browse available shifts</li>
                  <li>Set your own availability</li>
                  <li>Secure direct payments</li>
                </ul>
                <div className="mt-4 px-3 py-2 bg-primary-50 rounded-lg">
                  <p className="text-xs text-primary-700">
                    Earn <strong>100%</strong> of the posted rate &mdash; no fees deducted
                  </p>
                </div>
                <div className="mt-6 inline-flex items-center text-primary-600 font-medium group-hover:gap-2 transition-all">
                  Get started
                  <ArrowRight className="h-4 w-4 ml-1 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </Link>

            {/* Organizer Option */}
            <Link
              href="/register/organizer"
              className="group relative bg-white p-8 rounded-2xl border-2 border-gray-200 hover:border-secondary-500 transition-all hover:shadow-lg"
            >
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-secondary-100 rounded-full flex items-center justify-center group-hover:bg-secondary-200 transition-colors">
                  <Building2 className="h-8 w-8 text-secondary-600" />
                </div>
                <h3 className="mt-4 text-xl font-semibold text-gray-900">
                  I&apos;m an Event Organizer
                </h3>
                <p className="mt-2 text-gray-600">
                  Find qualified athletic therapists for your events and tournaments
                </p>
                <ul className="mt-4 text-sm text-gray-500 space-y-2">
                  <li>Post shift opportunities</li>
                  <li>Verified therapists only</li>
                  <li>Simple billing</li>
                </ul>
                <div className="mt-4 px-3 py-2 bg-secondary-50 rounded-lg">
                  <p className="text-xs text-secondary-700">
                    <strong>20% service fee</strong> on completed shifts
                  </p>
                </div>
                <div className="mt-6 inline-flex items-center text-secondary-600 font-medium group-hover:gap-2 transition-all">
                  Get started
                  <ArrowRight className="h-4 w-4 ml-1 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
