'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/firebase/AuthContext'
import {
  getOrganizerProfile,
  createOrganizerProfile,
  markOnboardingComplete,
} from '@/lib/firebase/firestore'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import {
  Loader2,
  Building,
  CheckCircle,
} from 'lucide-react'
import { CANADIAN_PROVINCES, ORGANIZATION_TYPE_LABELS } from '@/lib/constants'

interface FormData {
  organizationName: string
  organizationType: string
  address: string
  city: string
  province: string
  postalCode: string
}

export default function OrganizerOnboardingPage() {
  const router = useRouter()
  const { user, profile, loading: authLoading } = useAuth()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [formData, setFormData] = useState<FormData>({
    organizationName: '',
    organizationType: '',
    address: '',
    city: '',
    province: '',
    postalCode: '',
  })

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push('/login')
        return
      }
      loadExistingData()
    }
  }, [user, authLoading, router])

  const loadExistingData = async () => {
    if (!user) return

    try {
      const existingProfile = await getOrganizerProfile(user.uid)
      if (existingProfile) {
        // Already has profile, redirect to dashboard
        router.push('/organizer')
        return
      }

      // Pre-fill from user profile
      if (profile) {
        setFormData(prev => ({
          ...prev,
          organizationName: profile.fullName || '',
        }))
      }
    } catch (err) {
      console.error('Error loading data:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    setError(null)
  }

  const validateForm = (): boolean => {
    if (!formData.organizationName.trim()) {
      setError('Organization name is required')
      return false
    }
    if (!formData.organizationType) {
      setError('Please select an organization type')
      return false
    }
    if (!formData.city.trim()) {
      setError('City is required')
      return false
    }
    if (!formData.province) {
      setError('Province is required')
      return false
    }
    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !validateForm()) return

    setSaving(true)
    setError(null)

    try {
      // Create organizer profile
      await createOrganizerProfile(user.uid, {
        organizationName: formData.organizationName,
        organizationType: formData.organizationType as any,
        address: formData.address || undefined,
        city: formData.city,
        province: formData.province,
        postalCode: formData.postalCode,
      })

      // Mark onboarding complete
      await markOnboardingComplete(user.uid)

      // Redirect to dashboard
      router.push('/organizer')
    } catch (err: any) {
      console.error('Error saving profile:', err)
      setError(err.message || 'Failed to save profile. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    )
  }

  const organizationTypeOptions = Object.entries(ORGANIZATION_TYPE_LABELS).map(([value, label]) => ({
    value,
    label,
  }))

  const provinceOptions = CANADIAN_PROVINCES.map(p => ({ value: p.value, label: p.label }))

  return (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <div className="h-16 w-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Building className="h-8 w-8 text-primary-600" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Welcome to TherapistConnect</h1>
        <p className="text-gray-500 mt-2">Let&apos;s set up your organization profile to get started.</p>
      </div>

      <Card>
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-700">
                {error}
              </div>
            )}

            <div className="space-y-4">
              <Input
                label="Organization Name *"
                name="organizationName"
                value={formData.organizationName}
                onChange={handleChange}
                placeholder="e.g., Toronto Youth Hockey League"
              />

              <Select
                label="Organization Type *"
                name="organizationType"
                value={formData.organizationType}
                onChange={handleChange}
                options={organizationTypeOptions}
                placeholder="Select type..."
              />

              <Textarea
                label="Address"
                name="address"
                value={formData.address}
                onChange={handleChange}
                placeholder="Street address (optional)"
                rows={2}
              />

              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="City *"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  placeholder="e.g., Toronto"
                />

                <Select
                  label="Province *"
                  name="province"
                  value={formData.province}
                  onChange={handleChange}
                  options={provinceOptions}
                  placeholder="Select..."
                />
              </div>

              <Input
                label="Postal Code"
                name="postalCode"
                value={formData.postalCode}
                onChange={handleChange}
                placeholder="e.g., M5V 1A1"
              />
            </div>

            <div className="pt-4 border-t">
              <Button type="submit" className="w-full" disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Setting up...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Complete Setup
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <p className="text-center text-sm text-gray-500 mt-6">
        By completing setup, you agree to our Terms of Service and Privacy Policy.
        <br />
        A 20% service fee applies to all bookings.
      </p>
    </div>
  )
}
