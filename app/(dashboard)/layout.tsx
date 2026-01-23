'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuth } from '@/lib/firebase/AuthContext'
import { getTherapistProfile, getOrganizerProfile, TherapistProfile, OrganizerProfile } from '@/lib/firebase/firestore'
import { DashboardShell } from '@/components/layout/dashboard-shell'
import { Loader2 } from 'lucide-react'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname()
  const { user, profile, loading: authLoading } = useAuth()
  const [roleData, setRoleData] = useState<TherapistProfile | OrganizerProfile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadRoleData = async () => {
      if (authLoading) return

      if (!user || !profile) {
        router.push('/login')
        return
      }

      try {
        if (profile.userType === 'therapist') {
          const therapist = await getTherapistProfile(user.uid)
          setRoleData(therapist)

          // Check if therapist needs to complete onboarding
          if (therapist) {
            const needsOnboarding = !therapist.onboardingComplete &&
              (!therapist.cataNumber || !therapist.city || !therapist.province)

            if (needsOnboarding && !pathname.includes('/therapist/onboarding')) {
              router.push('/therapist/onboarding')
              return
            }
          } else if (!pathname.includes('/therapist/onboarding')) {
            // No therapist profile exists, redirect to onboarding
            router.push('/therapist/onboarding')
            return
          }
        } else if (profile.userType === 'organizer') {
          const organizer = await getOrganizerProfile(user.uid)
          setRoleData(organizer)

          // Check if organizer needs to complete onboarding
          if (!organizer && !pathname.includes('/organizer/onboarding')) {
            router.push('/organizer/onboarding')
            return
          }
        }
      } catch (error) {
        console.error('Error loading role data:', error)
      }

      setLoading(false)
    }

    loadRoleData()
  }, [user, profile, authLoading, router, pathname])

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    )
  }

  if (!user || !profile) {
    return null
  }

  const userData = {
    id: user.uid,
    email: profile.email,
    full_name: profile.fullName,
    user_type: profile.userType,
    phone: profile.phone || null,
    roleData,
  }

  return (
    <DashboardShell userType={profile.userType} isAdmin={profile.isAdmin} user={userData}>
      {children}
    </DashboardShell>
  )
}
