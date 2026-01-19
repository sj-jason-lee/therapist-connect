'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import {
  Loader2,
  User,
  Award,
  FileCheck,
  CheckCircle,
  ChevronRight,
  ChevronLeft,
  Upload,
  X,
  AlertCircle,
} from 'lucide-react'
import { CANADIAN_PROVINCES, DOCUMENT_TYPE_LABELS, DOCUMENT_TYPES } from '@/lib/constants'

type Step = 'basic' | 'professional' | 'documents' | 'review'

interface FormData {
  // Basic Info
  full_name: string
  phone: string
  city: string
  province: string
  postal_code: string
  // Professional Details
  cata_number: string
  cata_expiry: string
  insurance_provider: string
  insurance_policy_number: string
  insurance_expiry: string
  bls_expiry: string
  hourly_rate_min: number
  hourly_rate_max: number
  travel_radius_km: number
}

interface UploadedDocument {
  type: string
  url: string
  name: string
}

const STEPS: { id: Step; title: string; icon: React.ReactNode }[] = [
  { id: 'basic', title: 'Basic Info', icon: <User className="h-5 w-5" /> },
  { id: 'professional', title: 'Credentials', icon: <Award className="h-5 w-5" /> },
  { id: 'documents', title: 'Documents', icon: <FileCheck className="h-5 w-5" /> },
  { id: 'review', title: 'Review', icon: <CheckCircle className="h-5 w-5" /> },
]

export default function TherapistOnboardingPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [currentStep, setCurrentStep] = useState<Step>('basic')
  const [therapistId, setTherapistId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [uploadingDoc, setUploadingDoc] = useState<string | null>(null)
  const [uploadedDocs, setUploadedDocs] = useState<UploadedDocument[]>([])

  const [formData, setFormData] = useState<FormData>({
    full_name: '',
    phone: '',
    city: '',
    province: '',
    postal_code: '',
    cata_number: '',
    cata_expiry: '',
    insurance_provider: '',
    insurance_policy_number: '',
    insurance_expiry: '',
    bls_expiry: '',
    hourly_rate_min: 50,
    hourly_rate_max: 75,
    travel_radius_km: 50,
  })

  useEffect(() => {
    loadExistingData()
  }, [])

  const loadExistingData = async () => {
    const supabase = createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/login')
      return
    }

    // Get profile data
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name, phone')
      .eq('id', user.id)
      .single()

    // Get therapist data
    const { data: therapist } = await supabase
      .from('therapists')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (therapist) {
      setTherapistId(therapist.id)

      // Check if already completed onboarding
      if (therapist.onboarding_completed) {
        router.push('/therapist')
        return
      }

      setFormData({
        full_name: profile?.full_name || '',
        phone: profile?.phone || '',
        city: therapist.city || '',
        province: therapist.province || '',
        postal_code: therapist.postal_code || '',
        cata_number: therapist.cata_number || '',
        cata_expiry: therapist.cata_expiry || '',
        insurance_provider: therapist.insurance_provider || '',
        insurance_policy_number: therapist.insurance_policy_number || '',
        insurance_expiry: therapist.insurance_expiry || '',
        bls_expiry: therapist.bls_expiry || '',
        hourly_rate_min: therapist.hourly_rate_min || 50,
        hourly_rate_max: therapist.hourly_rate_max || 75,
        travel_radius_km: therapist.travel_radius_km || 50,
      })

      // Load existing documents
      const { data: credentials } = await supabase
        .from('credential_documents')
        .select('document_type, file_url')
        .eq('therapist_id', therapist.id)

      if (credentials) {
        setUploadedDocs(credentials.map(c => ({
          type: c.document_type,
          url: c.file_url,
          name: c.document_type,
        })))
      }
    } else {
      setFormData(prev => ({
        ...prev,
        full_name: profile?.full_name || '',
        phone: profile?.phone || '',
      }))
    }

    setLoading(false)
  }

  const handleInputChange = (field: keyof FormData, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    setError(null)
  }

  const validateStep = (step: Step): boolean => {
    setError(null)

    switch (step) {
      case 'basic':
        if (!formData.full_name.trim()) {
          setError('Full name is required')
          return false
        }
        if (!formData.phone.trim()) {
          setError('Phone number is required')
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
        if (!formData.postal_code.trim()) {
          setError('Postal code is required')
          return false
        }
        return true

      case 'professional':
        if (!formData.cata_number.trim()) {
          setError('CATA membership number is required')
          return false
        }
        if (!formData.cata_expiry) {
          setError('CATA expiry date is required')
          return false
        }
        if (!formData.insurance_provider.trim()) {
          setError('Insurance provider is required')
          return false
        }
        if (!formData.insurance_expiry) {
          setError('Insurance expiry date is required')
          return false
        }
        if (!formData.bls_expiry) {
          setError('BLS certification expiry date is required')
          return false
        }
        if (formData.hourly_rate_min < 1 || formData.hourly_rate_max < formData.hourly_rate_min) {
          setError('Please enter valid hourly rates')
          return false
        }
        return true

      case 'documents':
        const requiredDocs = ['cata_card', 'insurance_certificate', 'bls_certificate', 'profile_photo']
        const uploadedTypes = uploadedDocs.map(d => d.type)
        const missingDocs = requiredDocs.filter(d => !uploadedTypes.includes(d))
        if (missingDocs.length > 0) {
          const missingLabels = missingDocs.map(d => DOCUMENT_TYPE_LABELS[d as keyof typeof DOCUMENT_TYPE_LABELS])
          setError(`Please upload: ${missingLabels.join(', ')}`)
          return false
        }
        return true

      case 'review':
        return true

      default:
        return true
    }
  }

  const saveProgress = async () => {
    setSaving(true)
    const supabase = createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    // Update profile
    await supabase
      .from('profiles')
      .update({
        full_name: formData.full_name,
        phone: formData.phone,
      })
      .eq('id', user.id)

    // Update therapist
    if (therapistId) {
      await supabase
        .from('therapists')
        .update({
          city: formData.city,
          province: formData.province,
          postal_code: formData.postal_code,
          cata_number: formData.cata_number,
          cata_expiry: formData.cata_expiry || null,
          insurance_provider: formData.insurance_provider,
          insurance_policy_number: formData.insurance_policy_number,
          insurance_expiry: formData.insurance_expiry || null,
          bls_expiry: formData.bls_expiry || null,
          hourly_rate_min: formData.hourly_rate_min,
          hourly_rate_max: formData.hourly_rate_max,
          travel_radius_km: formData.travel_radius_km,
        })
        .eq('id', therapistId)
    }

    setSaving(false)
  }

  const handleNext = async () => {
    if (!validateStep(currentStep)) return

    await saveProgress()

    const currentIndex = STEPS.findIndex(s => s.id === currentStep)
    if (currentIndex < STEPS.length - 1) {
      setCurrentStep(STEPS[currentIndex + 1].id)
    }
  }

  const handleBack = () => {
    const currentIndex = STEPS.findIndex(s => s.id === currentStep)
    if (currentIndex > 0) {
      setCurrentStep(STEPS[currentIndex - 1].id)
    }
  }

  const handleFileUpload = async (docType: string, file: File) => {
    if (!therapistId) return

    setUploadingDoc(docType)
    setError(null)

    const supabase = createClient()

    // Upload file
    const fileExt = file.name.split('.').pop()
    const fileName = `${therapistId}/${docType}_${Date.now()}.${fileExt}`

    const { error: uploadError } = await supabase.storage
      .from('credentials')
      .upload(fileName, file)

    if (uploadError) {
      setError('Failed to upload file: ' + uploadError.message)
      setUploadingDoc(null)
      return
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('credentials')
      .getPublicUrl(fileName)

    // Delete existing credential of same type
    await supabase
      .from('credential_documents')
      .delete()
      .eq('therapist_id', therapistId)
      .eq('document_type', docType)

    // Save credential record
    const { error: dbError } = await supabase
      .from('credential_documents')
      .insert({
        therapist_id: therapistId,
        document_type: docType,
        file_url: publicUrl,
      })

    if (dbError) {
      setError('Failed to save credential: ' + dbError.message)
      setUploadingDoc(null)
      return
    }

    // Update local state
    setUploadedDocs(prev => {
      const filtered = prev.filter(d => d.type !== docType)
      return [...filtered, { type: docType, url: publicUrl, name: file.name }]
    })

    setUploadingDoc(null)
  }

  const handleComplete = async () => {
    if (!validateStep('documents')) return

    setSaving(true)
    const supabase = createClient()

    if (therapistId) {
      await supabase
        .from('therapists')
        .update({ onboarding_completed: true })
        .eq('id', therapistId)
    }

    router.push('/therapist')
  }

  const currentStepIndex = STEPS.findIndex(s => s.id === currentStep)

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900">Complete Your Profile</h1>
        <p className="text-gray-500 mt-1">Let's get you set up to start accepting shifts</p>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center justify-center gap-2 py-4">
        {STEPS.map((step, index) => (
          <div key={step.id} className="flex items-center">
            <button
              onClick={() => {
                if (index < currentStepIndex) setCurrentStep(step.id)
              }}
              disabled={index > currentStepIndex}
              className={`
                flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors
                ${currentStep === step.id
                  ? 'bg-primary-600 text-white'
                  : index < currentStepIndex
                    ? 'bg-green-100 text-green-700 hover:bg-green-200 cursor-pointer'
                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                }
              `}
            >
              {index < currentStepIndex ? (
                <CheckCircle className="h-4 w-4" />
              ) : (
                step.icon
              )}
              <span className="hidden sm:inline">{step.title}</span>
            </button>
            {index < STEPS.length - 1 && (
              <ChevronRight className="h-5 w-5 text-gray-300 mx-2" />
            )}
          </div>
        ))}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      <Card>
        <CardContent className="p-6">
          {/* Step 1: Basic Info */}
          {currentStep === 'basic' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Basic Information</h2>
                <p className="text-sm text-gray-500 mt-1">Tell us about yourself and where you're located.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="text"
                    value={formData.full_name}
                    onChange={(e) => handleInputChange('full_name', e.target.value)}
                    placeholder="Your full name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone Number <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    placeholder="(555) 123-4567"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    City <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="text"
                    value={formData.city}
                    onChange={(e) => handleInputChange('city', e.target.value)}
                    placeholder="Toronto"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Province <span className="text-red-500">*</span>
                  </label>
                  <Select
                    value={formData.province}
                    onChange={(e) => handleInputChange('province', e.target.value)}
                    options={CANADIAN_PROVINCES.map(p => ({ value: p.value, label: p.label }))}
                    placeholder="Select province"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Postal Code <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="text"
                    value={formData.postal_code}
                    onChange={(e) => handleInputChange('postal_code', e.target.value.toUpperCase())}
                    placeholder="M5V 1A1"
                    maxLength={7}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Professional Details */}
          {currentStep === 'professional' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Professional Details</h2>
                <p className="text-sm text-gray-500 mt-1">Enter your credentials and rate preferences.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    CATA Membership # <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="text"
                    value={formData.cata_number}
                    onChange={(e) => handleInputChange('cata_number', e.target.value)}
                    placeholder="Enter CATA number"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    CATA Expiry Date <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="date"
                    value={formData.cata_expiry}
                    onChange={(e) => handleInputChange('cata_expiry', e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Insurance Provider <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="text"
                    value={formData.insurance_provider}
                    onChange={(e) => handleInputChange('insurance_provider', e.target.value)}
                    placeholder="e.g., Intact, Desjardins"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Insurance Policy #
                  </label>
                  <Input
                    type="text"
                    value={formData.insurance_policy_number}
                    onChange={(e) => handleInputChange('insurance_policy_number', e.target.value)}
                    placeholder="Policy number"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Insurance Expiry <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="date"
                    value={formData.insurance_expiry}
                    onChange={(e) => handleInputChange('insurance_expiry', e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    BLS Expiry Date <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="date"
                    value={formData.bls_expiry}
                    onChange={(e) => handleInputChange('bls_expiry', e.target.value)}
                  />
                </div>

                <div className="md:col-span-2 pt-4 border-t">
                  <h3 className="text-sm font-medium text-gray-700 mb-3">Rate Preferences</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">
                        Minimum Rate ($/hr)
                      </label>
                      <Input
                        type="number"
                        min={1}
                        value={formData.hourly_rate_min}
                        onChange={(e) => handleInputChange('hourly_rate_min', parseInt(e.target.value) || 0)}
                      />
                    </div>

                    <div>
                      <label className="block text-sm text-gray-600 mb-1">
                        Maximum Rate ($/hr)
                      </label>
                      <Input
                        type="number"
                        min={1}
                        value={formData.hourly_rate_max}
                        onChange={(e) => handleInputChange('hourly_rate_max', parseInt(e.target.value) || 0)}
                      />
                    </div>

                    <div>
                      <label className="block text-sm text-gray-600 mb-1">
                        Travel Radius (km)
                      </label>
                      <Input
                        type="number"
                        min={1}
                        value={formData.travel_radius_km}
                        onChange={(e) => handleInputChange('travel_radius_km', parseInt(e.target.value) || 0)}
                      />
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    You'll earn 100% of the posted rate. Organizers pay a separate 20% service fee.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Documents */}
          {currentStep === 'documents' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Upload Documents</h2>
                <p className="text-sm text-gray-500 mt-1">Upload your credentials for verification. All 4 documents are required.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(DOCUMENT_TYPES).map(([key, docType]) => {
                  const uploaded = uploadedDocs.find(d => d.type === docType)
                  const isUploading = uploadingDoc === docType
                  const label = DOCUMENT_TYPE_LABELS[docType as keyof typeof DOCUMENT_TYPE_LABELS]

                  return (
                    <div
                      key={docType}
                      className={`
                        border-2 border-dashed rounded-lg p-4 text-center transition-colors
                        ${uploaded ? 'border-green-300 bg-green-50' : 'border-gray-300 hover:border-primary-400'}
                      `}
                    >
                      {uploaded ? (
                        <div className="space-y-2">
                          <CheckCircle className="h-8 w-8 mx-auto text-green-500" />
                          <p className="text-sm font-medium text-gray-900">{label}</p>
                          <p className="text-xs text-gray-500 truncate">{uploaded.name}</p>
                          <label className="inline-block">
                            <span className="text-xs text-primary-600 hover:underline cursor-pointer">
                              Replace
                            </span>
                            <input
                              type="file"
                              className="hidden"
                              accept="image/*,.pdf"
                              onChange={(e) => {
                                const file = e.target.files?.[0]
                                if (file) handleFileUpload(docType, file)
                              }}
                            />
                          </label>
                        </div>
                      ) : isUploading ? (
                        <div className="space-y-2">
                          <Loader2 className="h-8 w-8 mx-auto text-primary-600 animate-spin" />
                          <p className="text-sm text-gray-500">Uploading...</p>
                        </div>
                      ) : (
                        <label className="cursor-pointer block">
                          <Upload className="h-8 w-8 mx-auto text-gray-400" />
                          <p className="text-sm font-medium text-gray-900 mt-2">{label}</p>
                          <p className="text-xs text-gray-500 mt-1">Click to upload</p>
                          <input
                            type="file"
                            className="hidden"
                            accept="image/*,.pdf"
                            onChange={(e) => {
                              const file = e.target.files?.[0]
                              if (file) handleFileUpload(docType, file)
                            }}
                          />
                        </label>
                      )}
                    </div>
                  )
                })}
              </div>

              <p className="text-xs text-gray-500">
                Accepted formats: JPG, PNG, PDF. Max file size: 5MB.
              </p>
            </div>
          )}

          {/* Step 4: Review */}
          {currentStep === 'review' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Review Your Profile</h2>
                <p className="text-sm text-gray-500 mt-1">Make sure everything looks correct before submitting.</p>
              </div>

              <div className="space-y-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Basic Information</h3>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div><span className="text-gray-500">Name:</span> {formData.full_name}</div>
                    <div><span className="text-gray-500">Phone:</span> {formData.phone}</div>
                    <div><span className="text-gray-500">City:</span> {formData.city}</div>
                    <div><span className="text-gray-500">Province:</span> {formData.province}</div>
                    <div><span className="text-gray-500">Postal Code:</span> {formData.postal_code}</div>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Professional Details</h3>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div><span className="text-gray-500">CATA #:</span> {formData.cata_number}</div>
                    <div><span className="text-gray-500">CATA Expiry:</span> {formData.cata_expiry}</div>
                    <div><span className="text-gray-500">Insurance:</span> {formData.insurance_provider}</div>
                    <div><span className="text-gray-500">Ins. Expiry:</span> {formData.insurance_expiry}</div>
                    <div><span className="text-gray-500">BLS Expiry:</span> {formData.bls_expiry}</div>
                    <div><span className="text-gray-500">Rate Range:</span> ${formData.hourly_rate_min} - ${formData.hourly_rate_max}/hr</div>
                    <div><span className="text-gray-500">Travel Radius:</span> {formData.travel_radius_km} km</div>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Uploaded Documents</h3>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    {uploadedDocs.map((doc) => (
                      <div key={doc.type} className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span>{DOCUMENT_TYPE_LABELS[doc.type as keyof typeof DOCUMENT_TYPE_LABELS]}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-700">
                    <strong>What happens next?</strong> Your credentials will be reviewed by our team.
                    Once verified, you'll be able to apply for shifts. Most verifications are completed within 24-48 hours.
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Navigation Buttons */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={handleBack}
          disabled={currentStepIndex === 0 || saving}
        >
          <ChevronLeft className="h-4 w-4 mr-2" />
          Back
        </Button>

        {currentStep === 'review' ? (
          <Button onClick={handleComplete} disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                Complete Setup
                <CheckCircle className="h-4 w-4 ml-2" />
              </>
            )}
          </Button>
        ) : (
          <Button onClick={handleNext} disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                Next
                <ChevronRight className="h-4 w-4 ml-2" />
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  )
}
