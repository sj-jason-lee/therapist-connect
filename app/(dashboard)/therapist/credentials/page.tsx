'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { DOCUMENT_TYPE_LABELS } from '@/lib/constants'
import {
  Upload,
  FileCheck,
  AlertCircle,
  CheckCircle,
  Clock,
  Loader2,
  Trash2,
  Eye,
} from 'lucide-react'

export default function TherapistCredentialsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState<string | null>(null)
  const [therapist, setTherapist] = useState<any>(null)
  const [documents, setDocuments] = useState<any[]>([])

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      router.push('/login')
      return
    }

    // Get therapist
    const { data: therapistData } = await supabase
      .from('therapists')
      .select('*')
      .eq('user_id', user.id)
      .single()

    setTherapist(therapistData)

    // Get documents
    const { data: documentsData } = await supabase
      .from('credential_documents')
      .select('*')
      .eq('therapist_id', therapistData?.id)
      .order('uploaded_at', { ascending: false })

    setDocuments(documentsData || [])
    setLoading(false)
  }

  const handleFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    documentType: string
  ) => {
    const file = e.target.files?.[0]
    if (!file || !therapist) return

    setUploading(documentType)
    const supabase = createClient()

    // Upload file to storage
    const fileExt = file.name.split('.').pop()
    const fileName = `${therapist.id}/${documentType}_${Date.now()}.${fileExt}`

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('credentials')
      .upload(fileName, file)

    if (uploadError) {
      console.error('Upload error:', uploadError)
      setUploading(null)
      return
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('credentials')
      .getPublicUrl(fileName)

    // Save document record
    const { error: insertError } = await supabase
      .from('credential_documents')
      .insert({
        therapist_id: therapist.id,
        document_type: documentType,
        file_url: urlData.publicUrl,
      })

    if (insertError) {
      console.error('Insert error:', insertError)
    }

    setUploading(null)
    loadData()
  }

  const handleDeleteDocument = async (documentId: string, fileUrl: string) => {
    const supabase = createClient()

    // Delete from database
    await supabase
      .from('credential_documents')
      .delete()
      .eq('id', documentId)

    // Extract file path and delete from storage
    const urlParts = fileUrl.split('/credentials/')
    if (urlParts[1]) {
      await supabase.storage.from('credentials').remove([urlParts[1]])
    }

    loadData()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    )
  }

  const documentTypes = ['cata_card', 'insurance_certificate', 'bls_certificate', 'profile_photo']

  const getDocumentForType = (type: string) => {
    return documents.find((d) => d.document_type === type)
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Credentials</h1>
        <p className="text-gray-500 mt-1">
          Upload your certifications and documents for verification.
        </p>
      </div>

      {/* Verification Status */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            {therapist?.credentials_verified ? (
              <>
                <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Credentials Verified</h3>
                  <p className="text-sm text-gray-600">
                    Your credentials have been verified. You can apply to shifts.
                  </p>
                </div>
              </>
            ) : (
              <>
                <div className="h-12 w-12 bg-yellow-100 rounded-full flex items-center justify-center">
                  <Clock className="h-6 w-6 text-yellow-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Verification Pending</h3>
                  <p className="text-sm text-gray-600">
                    Upload all required documents below. Our team will review them within 24-48 hours.
                  </p>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Document Upload Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {documentTypes.map((docType) => {
          const existingDoc = getDocumentForType(docType)
          const isUploading = uploading === docType
          const label = DOCUMENT_TYPE_LABELS[docType as keyof typeof DOCUMENT_TYPE_LABELS]

          return (
            <Card key={docType}>
              <CardHeader>
                <CardTitle className="text-base">{label}</CardTitle>
                <CardDescription>
                  {docType === 'cata_card' && 'Upload a photo of your CATA membership card'}
                  {docType === 'insurance_certificate' && 'Upload your liability insurance certificate'}
                  {docType === 'bls_certificate' && 'Upload your BLS/CPR certification'}
                  {docType === 'profile_photo' && 'Upload a professional photo for your profile'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {existingDoc ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <FileCheck className="h-5 w-5 text-green-600" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">Document uploaded</p>
                          <p className="text-xs text-gray-500">
                            {new Date(existingDoc.uploaded_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {existingDoc.verified_at ? (
                          <Badge variant="success">Verified</Badge>
                        ) : (
                          <Badge variant="warning">Pending</Badge>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <a
                        href={existingDoc.file_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1"
                      >
                        <Button variant="outline" size="sm" className="w-full">
                          <Eye className="h-4 w-4 mr-2" />
                          View
                        </Button>
                      </a>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteDocument(existingDoc.id, existingDoc.file_url)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <label className="block">
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-primary-500 transition-colors cursor-pointer">
                        {isUploading ? (
                          <Loader2 className="h-8 w-8 mx-auto animate-spin text-primary-600" />
                        ) : (
                          <>
                            <Upload className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                            <p className="text-sm text-gray-600">
                              Click to upload or drag and drop
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              PNG, JPG, or PDF up to 10MB
                            </p>
                          </>
                        )}
                      </div>
                      <input
                        type="file"
                        className="hidden"
                        accept="image/*,.pdf"
                        onChange={(e) => handleFileUpload(e, docType)}
                        disabled={isUploading}
                      />
                    </label>
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Info Box */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-medium text-blue-800">Required for Verification</h3>
              <ul className="mt-2 text-sm text-blue-700 space-y-1">
                <li>- Valid CATA membership card showing active status</li>
                <li>- Current liability insurance certificate (minimum $2M coverage)</li>
                <li>- Valid BLS/CPR certification</li>
                <li>- Professional profile photo</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
