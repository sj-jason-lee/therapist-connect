'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/firebase/AuthContext'
import { updateUserProfile, updateTherapistProfile } from '@/lib/firebase/firestore'
import { Timestamp } from 'firebase/firestore'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { CANADIAN_PROVINCES } from '@/lib/constants'
import { Loader2, Save, CheckCircle, AlertCircle } from 'lucide-react'

export default function TherapistProfilePage() {
  const { user, profile, therapist, loading } = useAuth()
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    cata_number: '',
    cata_expiry: '',
    insurance_provider: '',
    insurance_policy_number: '',
    insurance_expiry: '',
    bls_expiry: '',
    bio: '',
    city: '',
    province: '',
    postal_code: '',
    travel_radius_km: 50,
    hourly_rate_min: 0,
    hourly_rate_max: 0,
  })

  // Helper to convert Timestamp to date string
  const timestampToDateString = (timestamp: any): string => {
    if (!timestamp) return ''
    if (timestamp.toDate) {
      return timestamp.toDate().toISOString().split('T')[0]
    }
    return ''
  }

  useEffect(() => {
    if (profile && therapist) {
      setFormData({
        full_name: profile.fullName || '',
        phone: profile.phone || '',
        cata_number: therapist.cataNumber || '',
        cata_expiry: timestampToDateString(therapist.cataExpiry),
        insurance_provider: therapist.insuranceProvider || '',
        insurance_policy_number: therapist.insurancePolicyNumber || '',
        insurance_expiry: timestampToDateString(therapist.insuranceExpiry),
        bls_expiry: timestampToDateString(therapist.blsExpiry),
        bio: therapist.bio || '',
        city: therapist.city || '',
        province: therapist.province || '',
        postal_code: therapist.postalCode || '',
        travel_radius_km: therapist.travelRadiusKm || 50,
        hourly_rate_min: therapist.hourlyRateMin || 0,
        hourly_rate_max: therapist.hourlyRateMax || 0,
      })
    }
  }, [profile, therapist])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
    setSaved(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    setSaving(true)
    setError(null)
    setSaved(false)

    try {
      // Update user profile
      await updateUserProfile(user.uid, {
        fullName: formData.full_name,
        phone: formData.phone || undefined,
      })

      // Build therapist profile update
      const therapistUpdate: Record<string, any> = {
        bio: formData.bio || undefined,
        city: formData.city,
        province: formData.province,
        postalCode: formData.postal_code || undefined,
        travelRadiusKm: Number(formData.travel_radius_km) || 50,
        hourlyRateMin: Number(formData.hourly_rate_min) || 0,
        hourlyRateMax: Number(formData.hourly_rate_max) || undefined,
        cataNumber: formData.cata_number || undefined,
        insuranceProvider: formData.insurance_provider || undefined,
        insurancePolicyNumber: formData.insurance_policy_number || undefined,
      }

      // Add date fields if provided
      if (formData.cata_expiry) {
        therapistUpdate.cataExpiry = Timestamp.fromDate(new Date(formData.cata_expiry))
      }
      if (formData.insurance_expiry) {
        therapistUpdate.insuranceExpiry = Timestamp.fromDate(new Date(formData.insurance_expiry))
      }
      if (formData.bls_expiry) {
        therapistUpdate.blsExpiry = Timestamp.fromDate(new Date(formData.bls_expiry))
      }

      // Filter out undefined values
      const cleanUpdate = Object.fromEntries(
        Object.entries(therapistUpdate).filter(([_, v]) => v !== undefined)
      )

      await updateTherapistProfile(user.uid, cleanUpdate)

      setSaved(true)
    } catch (err) {
      console.error('Error saving profile:', err)
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      setError(`Failed to save profile: ${errorMessage}`)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    )
  }

  const provinceOptions = CANADIAN_PROVINCES.map((p) => ({
    value: p.value,
    label: p.label,
  }))

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
        <p className="text-gray-500 mt-1">Update your personal information and credentials.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Personal Information */}
        <Card>
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
            <CardDescription>Basic contact information for your profile.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Full Name"
                name="full_name"
                value={formData.full_name}
                onChange={handleChange}
                placeholder="John Smith"
                required
              />
              <Input
                label="Phone Number"
                name="phone"
                type="tel"
                value={formData.phone}
                onChange={handleChange}
                placeholder="(416) 555-0123"
              />
            </div>
            <Textarea
              label="Bio"
              name="bio"
              value={formData.bio}
              onChange={handleChange}
              placeholder="Tell organizers about your experience and specialties..."
              rows={4}
            />
          </CardContent>
        </Card>

        {/* Credentials */}
        <Card>
          <CardHeader>
            <CardTitle>Credentials</CardTitle>
            <CardDescription>Your professional certifications and insurance information.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="CATA Membership Number"
                name="cata_number"
                value={formData.cata_number}
                onChange={handleChange}
                placeholder="12345"
              />
              <Input
                label="CATA Expiry Date"
                name="cata_expiry"
                type="date"
                value={formData.cata_expiry}
                onChange={handleChange}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Insurance Provider"
                name="insurance_provider"
                value={formData.insurance_provider}
                onChange={handleChange}
                placeholder="e.g., Marsh Insurance"
              />
              <Input
                label="Insurance Policy Number"
                name="insurance_policy_number"
                value={formData.insurance_policy_number}
                onChange={handleChange}
                placeholder="POL-123456"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Insurance Expiry Date"
                name="insurance_expiry"
                type="date"
                value={formData.insurance_expiry}
                onChange={handleChange}
              />
              <Input
                label="BLS Certification Expiry"
                name="bls_expiry"
                type="date"
                value={formData.bls_expiry}
                onChange={handleChange}
              />
            </div>
          </CardContent>
        </Card>

        {/* Location */}
        <Card>
          <CardHeader>
            <CardTitle>Location</CardTitle>
            <CardDescription>Your location helps match you with nearby shifts.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input
                label="City"
                name="city"
                value={formData.city}
                onChange={handleChange}
                placeholder="Toronto"
              />
              <Select
                label="Province"
                name="province"
                value={formData.province}
                onChange={handleChange}
                options={provinceOptions}
                placeholder="Select province"
              />
              <Input
                label="Postal Code"
                name="postal_code"
                value={formData.postal_code}
                onChange={handleChange}
                placeholder="M5V 1A1"
              />
            </div>
            <Input
              label="Travel Radius (km)"
              name="travel_radius_km"
              type="number"
              value={formData.travel_radius_km}
              onChange={handleChange}
              min={5}
              max={500}
            />
          </CardContent>
        </Card>

        {/* Rates */}
        <Card>
          <CardHeader>
            <CardTitle>Hourly Rates</CardTitle>
            <CardDescription>Set your preferred hourly rate range (CAD).</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Minimum Rate ($/hr)"
                name="hourly_rate_min"
                type="number"
                value={formData.hourly_rate_min}
                onChange={handleChange}
                min={0}
                step={5}
                placeholder="40"
              />
              <Input
                label="Maximum Rate ($/hr)"
                name="hourly_rate_max"
                type="number"
                value={formData.hourly_rate_max}
                onChange={handleChange}
                min={0}
                step={5}
                placeholder="75"
              />
            </div>
          </CardContent>
        </Card>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* Submit Button */}
        <div className="flex items-center justify-end gap-4">
          {saved && (
            <span className="flex items-center text-green-600 text-sm">
              <CheckCircle className="h-4 w-4 mr-1" />
              Saved successfully
            </span>
          )}
          <Button type="submit" disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}
