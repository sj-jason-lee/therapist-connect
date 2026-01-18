import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <Link href="/register" className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-8">
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to registration
        </Link>

        <h1 className="text-3xl font-bold text-gray-900 mb-8">Terms of Service</h1>

        <div className="prose prose-gray max-w-none">
          <p className="text-gray-600 mb-6">Last updated: January 2025</p>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">1. Acceptance of Terms</h2>
            <p className="text-gray-600">
              By accessing and using TherapistConnect, you agree to be bound by these Terms of Service.
              If you do not agree to these terms, please do not use our platform.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">2. Description of Service</h2>
            <p className="text-gray-600">
              TherapistConnect is a platform that connects certified athletic therapists with event
              organizers who require their services. We facilitate the connection but are not a party
              to any agreements between therapists and organizers.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">3. User Accounts</h2>
            <p className="text-gray-600">
              You are responsible for maintaining the confidentiality of your account credentials
              and for all activities that occur under your account. You must provide accurate and
              complete information when creating an account.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">4. Therapist Requirements</h2>
            <p className="text-gray-600">
              Athletic therapists using this platform must maintain valid CATA certification,
              professional liability insurance, and BLS certification. Credentials must be kept
              up to date and verified through our platform.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">5. Payment Terms</h2>
            <p className="text-gray-600">
              Payments are processed through our secure payment system. Organizers agree to pay
              the agreed-upon rate for completed shifts. Therapists will receive payment after
              shift completion and verification.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">6. Cancellation Policy</h2>
            <p className="text-gray-600">
              Shifts may be cancelled according to our cancellation policy. Late cancellations
              may result in fees or penalties as outlined in our cancellation guidelines.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">7. Limitation of Liability</h2>
            <p className="text-gray-600">
              TherapistConnect is not liable for any disputes between therapists and organizers,
              injuries occurring during shifts, or any indirect damages arising from use of the platform.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">8. Contact</h2>
            <p className="text-gray-600">
              For questions about these terms, please contact us at support@therapistconnect.com
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}
