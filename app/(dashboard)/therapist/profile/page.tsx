'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { CANADIAN_PROVINCES } from '@/lib/constants'
import { Loader2, Save, CheckCircle } from 'lucide-react'

export default function TherapistProfilePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
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

  useEffect(() => {
    const loadProfile = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.push('/login')
        return
      }

      // Get profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      // Get therapist data
      const { data: therapist } = await supabase
        .from('therapists')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (profile && therapist) {
        setFormData({
          full_name: profile.full_name || '',
          phone: profile.phone || '',
          cata_number: therapist.cata_number || '',
          cata_expiry: therapist.cata_expiry || '',
          insurance_provider: therapist.insurance_provider || '',
          insurance_policy_number: therapist.insurance_policy_number || '',
          insurance_expiry: therapist.insurance_expiry || '',
          bls_expiry: therapist.bls_expiry || '',
          bio: therapist.bio || '',
          city: therapist.city || '',
          province: therapist.province || '',
          postal_code: therapist.postal_code || '',
          travel_radius_km: therapist.travel_radius_km || 50,
          hourly_rate_min: therapist.hourly_rate_min || 0,
          hourly_rate_max: therapist.hourly_rate_max || 0,
        })
      }

      setLoading(false)
    }

    loadProfile()
  }, [router])

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
    setSaving(true)
    setError(null)

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      setError('Not authenticated')
      setSaving(false)
      return
    }

    // Update profile
    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        full_name: formData.full_name,
        phone: formData.phone,
      })
      .eq('id', user.id)

    if (profileError) {
      setError(profileError.message)
      setSaving(false)
      return
    }

    // Update therapist
    const { error: therapistError } = await supabase
      .from('therapists')
      .update({
        cata_number: formData.cata_number || null,
        cata_expiry: formData.cata_expiry || null,
        insurance_provider: formData.insurance_provider || null,
        insurance_policy_number: formData.insurance_policy_number || null,
        insurance_expiry: formData.insurance_expiry || null,
        bls_expiry: formData.bls_expiry || null,
        bio: formData.bio || null,
        city: formData.city || null,
        province: formData.province || null,
        postal_code: formData.postal_code || null,
        travel_radius_km: formData.travel_radius_km,
        hourly_rate_min: formData.hourly_rate_min || null,
        hourly_rate_max: formData.hourly_rate_max || null,
      })
      .eq('user_id', user.id)

    if (therapistError) {
      setError(therapistError.message)
      setSaving(false)
      return
    }

    setSaved(true)
    setSaving(false)
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
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-600">
            {error}
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
          <Button type="submit" loading={saving}>
            <Save className="h-4 w-4 mr-2" />
            Save Changes
          </Button>
        </div>
      </form>
    </div>
  )
}
