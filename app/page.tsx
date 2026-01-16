import Link from 'next/link'
import { ArrowRight, Shield, Calendar, DollarSign, Users, MapPin, CheckCircle } from 'lucide-react'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="border-b bg-white/80 backdrop-blur-sm fixed top-0 left-0 right-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <span className="text-xl font-bold text-primary-600">TherapistConnect</span>
            </div>
            <div className="flex items-center gap-4">
              <Link
                href="/login"
                className="text-gray-600 hover:text-gray-900 font-medium"
              >
                Log in
              </Link>
              <Link
                href="/register"
                className="bg-primary-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-primary-700 transition-colors"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 tracking-tight">
              Connect Athletic Therapists
              <span className="block text-primary-600">with Events Across Canada</span>
            </h1>
            <p className="mt-6 text-xl text-gray-600 max-w-3xl mx-auto">
              The premier marketplace for certified athletic therapists and event organizers.
              Find qualified coverage for your next tournament, game, or corporate event.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/register/therapist"
                className="inline-flex items-center justify-center px-8 py-4 text-lg font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors"
              >
                Join as Therapist
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
              <Link
                href="/register/organizer"
                className="inline-flex items-center justify-center px-8 py-4 text-lg font-medium text-primary-600 bg-primary-50 rounded-lg hover:bg-primary-100 transition-colors"
              >
                Post a Shift
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900">How It Works</h2>
            <p className="mt-4 text-lg text-gray-600">Simple, secure, and efficient</p>
          </div>

          <div className="grid md:grid-cols-2 gap-16">
            {/* For Therapists */}
            <div>
              <h3 className="text-2xl font-bold text-gray-900 mb-8">For Therapists</h3>
              <div className="space-y-6">
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                    <Shield className="h-6 w-6 text-primary-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">Verify Your Credentials</h4>
                    <p className="text-gray-600">Upload your CATA certification, insurance, and BLS certification for verification.</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                    <MapPin className="h-6 w-6 text-primary-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">Find Local Shifts</h4>
                    <p className="text-gray-600">Browse available shifts in your area filtered by distance, sport, and rate.</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                    <DollarSign className="h-6 w-6 text-primary-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">Get Paid Securely</h4>
                    <p className="text-gray-600">Receive direct deposits after completing your shifts. No chasing payments.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* For Organizers */}
            <div>
              <h3 className="text-2xl font-bold text-gray-900 mb-8">For Organizers</h3>
              <div className="space-y-6">
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-secondary-100 rounded-lg flex items-center justify-center">
                    <Calendar className="h-6 w-6 text-secondary-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">Post Your Shifts</h4>
                    <p className="text-gray-600">Create detailed shift listings with location, time, and requirements.</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-secondary-100 rounded-lg flex items-center justify-center">
                    <Users className="h-6 w-6 text-secondary-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">Review Qualified Applicants</h4>
                    <p className="text-gray-600">All therapists are credential-verified. View profiles, ratings, and experience.</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-secondary-100 rounded-lg flex items-center justify-center">
                    <CheckCircle className="h-6 w-6 text-secondary-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">Simple Payments</h4>
                    <p className="text-gray-600">Pay only after the shift is completed. All billing handled through the platform.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900">Trusted by Athletic Therapists Across Canada</h2>
            <p className="mt-4 text-lg text-gray-600">All therapists are CATA-certified with verified credentials</p>
          </div>

          <div className="grid sm:grid-cols-3 gap-8 text-center">
            <div className="p-8 rounded-2xl bg-gray-50">
              <div className="text-4xl font-bold text-primary-600">CATA</div>
              <div className="mt-2 text-gray-600">Certified Athletic Therapists</div>
            </div>
            <div className="p-8 rounded-2xl bg-gray-50">
              <div className="text-4xl font-bold text-primary-600">Insured</div>
              <div className="mt-2 text-gray-600">Liability Coverage Verified</div>
            </div>
            <div className="p-8 rounded-2xl bg-gray-50">
              <div className="text-4xl font-bold text-primary-600">BLS</div>
              <div className="mt-2 text-gray-600">CPR/AED Certified</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white">Ready to Get Started?</h2>
          <p className="mt-4 text-xl text-primary-100">Join the network of athletic therapy professionals today.</p>
          <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/register/therapist"
              className="inline-flex items-center justify-center px-8 py-4 text-lg font-medium text-primary-600 bg-white rounded-lg hover:bg-gray-100 transition-colors"
            >
              Register as Therapist
            </Link>
            <Link
              href="/register/organizer"
              className="inline-flex items-center justify-center px-8 py-4 text-lg font-medium text-white border-2 border-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              Register as Organizer
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="text-white font-bold text-xl">TherapistConnect</div>
            <div className="mt-4 md:mt-0 text-gray-400">
              &copy; {new Date().getFullYear()} TherapistConnect. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
