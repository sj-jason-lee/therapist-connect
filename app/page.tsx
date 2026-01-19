import Link from 'next/link'
import {
  ArrowRight,
  Shield,
  Calendar,
  DollarSign,
  Users,
  MapPin,
  CheckCircle,
  Award,
  Heart,
  Lock,
  Clock,
  TrendingUp,
} from 'lucide-react'

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
                    <p className="text-gray-600">Earn 100% of the posted rate. No chasing payments.</p>
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
                    <p className="text-gray-600">All therapists are credential-verified. View profiles and experience.</p>
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

      {/* Trust & Verification Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900">Every Therapist is Verified</h2>
            <p className="mt-4 text-lg text-gray-600">We verify credentials so you don&apos;t have to</p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white rounded-2xl border border-gray-200 p-6 text-center hover:shadow-lg transition-shadow">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto">
                <Award className="h-8 w-8 text-primary-600" />
              </div>
              <h3 className="mt-4 font-semibold text-gray-900">CATA Certified</h3>
              <p className="mt-2 text-sm text-gray-600">
                Canadian Athletic Therapists Association certification verified
              </p>
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 p-6 text-center hover:shadow-lg transition-shadow">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <Shield className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="mt-4 font-semibold text-gray-900">Liability Insured</h3>
              <p className="mt-2 text-sm text-gray-600">
                Professional liability insurance coverage confirmed
              </p>
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 p-6 text-center hover:shadow-lg transition-shadow">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
                <Heart className="h-8 w-8 text-red-600" />
              </div>
              <h3 className="mt-4 font-semibold text-gray-900">BLS Certified</h3>
              <p className="mt-2 text-sm text-gray-600">
                Current CPR/AED certification on file
              </p>
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 p-6 text-center hover:shadow-lg transition-shadow">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto">
                <Lock className="h-8 w-8 text-purple-600" />
              </div>
              <h3 className="mt-4 font-semibold text-gray-900">Secure Platform</h3>
              <p className="mt-2 text-sm text-gray-600">
                Protected payments and encrypted data
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900">Transparent Pricing</h2>
            <p className="mt-4 text-lg text-gray-600">No hidden fees. Know exactly what you earn or pay.</p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Therapist Pricing */}
            <div className="bg-white rounded-2xl border-2 border-primary-200 p-8">
              <div className="text-center">
                <span className="inline-block px-4 py-1 bg-primary-100 text-primary-700 rounded-full text-sm font-medium">
                  For Therapists
                </span>
                <div className="mt-6">
                  <span className="text-5xl font-bold text-gray-900">100%</span>
                  <span className="text-gray-500 ml-2">of posted rate</span>
                </div>
                <p className="mt-4 text-gray-600">
                  You earn the full posted hourly rate. No fees deducted from your pay.
                </p>
                <div className="mt-6 p-4 bg-primary-50 rounded-lg">
                  <p className="text-sm text-primary-800">
                    <strong>Example:</strong> Work a $50/hr shift, you earn <strong>$50/hr</strong>
                  </p>
                </div>
                <ul className="mt-6 text-sm text-gray-600 space-y-2 text-left">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                    Free to join and create your profile
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                    No platform fees on your earnings
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                    Get paid directly after shifts
                  </li>
                </ul>
              </div>
            </div>

            {/* Organizer Pricing */}
            <div className="bg-white rounded-2xl border-2 border-secondary-200 p-8">
              <div className="text-center">
                <span className="inline-block px-4 py-1 bg-secondary-100 text-secondary-700 rounded-full text-sm font-medium">
                  For Organizers
                </span>
                <div className="mt-6">
                  <span className="text-5xl font-bold text-gray-900">20%</span>
                  <span className="text-gray-500 ml-2">service fee</span>
                </div>
                <p className="mt-4 text-gray-600">
                  Pay the posted rate plus a 20% service fee. Free to post shifts with no commitments.
                </p>
                <div className="mt-6 p-4 bg-secondary-50 rounded-lg">
                  <p className="text-sm text-secondary-800">
                    <strong>Example:</strong> $50/hr shift = <strong>$60/hr total</strong> ($50 + $10 fee)
                  </p>
                </div>
                <ul className="mt-6 text-sm text-gray-600 space-y-2 text-left">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                    Free to post shifts
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                    Only pay for completed shifts
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                    All therapists verified
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Founder Story Section */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-br from-primary-50 to-secondary-50 rounded-3xl p-8 md:p-12">
            <div className="text-center">
              <h2 className="text-3xl font-bold text-gray-900">Built for Athletic Therapists</h2>
              <div className="mt-8 text-lg text-gray-700 space-y-4">
                <p>
                  TherapistConnect was created to solve a real problem: connecting qualified athletic
                  therapists with the events and organizations that need them.
                </p>
                <p>
                  We understand the challenges of finding reliable shift work, verifying credentials,
                  and ensuring timely payments. That&apos;s why we built a platform that handles the
                  administrative burden so you can focus on what you do best — providing excellent care.
                </p>
                <p className="font-medium text-primary-700">
                  Our mission is to make it easier for certified athletic therapists across Canada
                  to find meaningful work and for organizers to access qualified professionals.
                </p>
              </div>
              <div className="mt-8 flex flex-wrap justify-center gap-6">
                <div className="flex items-center gap-2 text-gray-600">
                  <Clock className="h-5 w-5 text-primary-600" />
                  <span>Save time on admin</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <Shield className="h-5 w-5 text-primary-600" />
                  <span>Verified professionals</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <TrendingUp className="h-5 w-5 text-primary-600" />
                  <span>Grow your practice</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white">Ready to Get Started?</h2>
          <p className="mt-4 text-xl text-primary-100">Join the growing network of athletic therapy professionals.</p>
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
            <div className="mt-4 md:mt-0 flex items-center gap-6">
              <Link href="/terms" className="text-gray-400 hover:text-white text-sm">
                Terms of Service
              </Link>
              <Link href="/privacy" className="text-gray-400 hover:text-white text-sm">
                Privacy Policy
              </Link>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-gray-800 text-center text-gray-400 text-sm">
            &copy; {new Date().getFullYear()} TherapistConnect. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  )
}
