'use client'

import { useState, useRef, useEffect } from 'react'
import { useAuth } from '@/lib/firebase/AuthContext'
import { getCredentialDocuments, createCredentialDocument, deleteCredentialDocument, CredentialDocument, DocumentType } from '@/lib/firebase/firestore'
import { uploadCredentialDocument } from '@/lib/firebase/storage'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { DOCUMENT_TYPE_LABELS } from '@/lib/constants'
import {
  Upload,
  AlertCircle,
  CheckCircle,
  Clock,
  Loader2,
  FileText,
  Trash2,
  Eye,
  ShieldCheck,
} from 'lucide-react'

export default function TherapistCredentialsPage() {
  const { user, therapist, loading: authLoading, refreshProfile } = useAuth()
  const [uploading, setUploading] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [documents, setDocuments] = useState<CredentialDocument[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({})

  useEffect(() => {
    if (!authLoading && user) {
      loadDocuments()
    }
  }, [authLoading, user])

  const loadDocuments = async () => {
    if (!user) return
    try {
      const docs = await getCredentialDocuments(user.uid)
      setDocuments(docs)
    } catch (err) {
      console.error('Error loading documents:', err)
      setError('Failed to load documents')
    }
    setLoading(false)
  }

  const handleFileUpload = async (docType: string, file: File) => {
    if (!user) return

    setUploading(docType)
    setError(null)

    try {
      // Upload file to Firebase Storage
      const fileUrl = await uploadCredentialDocument(user.uid, docType, file)

      // Check if there's an existing document of this type and delete it
      const existingDoc = documents.find(d => d.documentType === docType)
      if (existingDoc) {
        await deleteCredentialDocument(existingDoc.id)
      }

      // Create credential document record in Firestore
      await createCredentialDocument(user.uid, {
        documentType: docType as DocumentType,
        fileUrl,
      })

      // Reload documents
      await loadDocuments()
      await refreshProfile()
    } catch (err) {
      console.error('Error uploading document:', err)
      setError('Failed to upload document. Please try again.')
    }

    setUploading(null)
  }

  const handleDelete = async (documentId: string) => {
    setDeleting(documentId)
    setError(null)

    try {
      await deleteCredentialDocument(documentId)
      await loadDocuments()
      await refreshProfile()
    } catch (err) {
      console.error('Error deleting document:', err)
      setError('Failed to delete document')
    }

    setDeleting(null)
  }

  const handleFileChange = (docType: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleFileUpload(docType, file)
    }
  }

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    )
  }

  const documentTypes = ['cata_card', 'insurance_certificate', 'bls_certificate', 'profile_photo']

  const getDocumentForType = (docType: string) => {
    return documents.find(d => d.documentType === docType)
  }

  const uploadedCount = documentTypes.filter(dt => getDocumentForType(dt)).length
  const verifiedCount = documentTypes.filter(dt => {
    const doc = getDocumentForType(dt)
    return doc?.verifiedAt
  }).length

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Credentials</h1>
        <p className="text-gray-500 mt-1">
          Upload your certifications and documents for verification.
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* No Therapist Profile Warning */}
      {!therapist && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-yellow-700">
              Please complete your <a href="/therapist/profile" className="underline font-medium">profile</a> before uploading credentials.
            </p>
          </div>
        </div>
      )}

      {/* Verification Status */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            {therapist?.credentialsVerified ? (
              <>
                <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center">
                  <ShieldCheck className="h-6 w-6 text-green-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-green-800">Credentials Verified</h3>
                  <p className="text-sm text-green-700">
                    Your credentials have been verified. You can now apply to shifts.
                  </p>
                </div>
                <Badge variant="success" className="text-sm px-3 py-1">
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Verified
                </Badge>
              </>
            ) : (
              <>
                <div className="h-12 w-12 bg-yellow-100 rounded-full flex items-center justify-center">
                  <Clock className="h-6 w-6 text-yellow-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">Verification Pending</h3>
                  <p className="text-sm text-gray-600">
                    {uploadedCount < 4
                      ? `Upload all required documents below (${uploadedCount}/4 uploaded).`
                      : 'All documents uploaded. Our team will review them within 24-48 hours.'}
                  </p>
                </div>
                <Badge variant="warning" className="text-sm px-3 py-1">
                  <Clock className="h-4 w-4 mr-1" />
                  {uploadedCount}/4 Uploaded
                </Badge>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Document Upload Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {documentTypes.map((docType) => {
          const isUploading = uploading === docType
          const label = DOCUMENT_TYPE_LABELS[docType as keyof typeof DOCUMENT_TYPE_LABELS]
          const existingDoc = getDocumentForType(docType)
          const isVerified = !!existingDoc?.verifiedAt

          return (
            <Card key={docType} className={existingDoc ? (isVerified ? 'border-green-200 bg-green-50/30' : 'border-blue-200 bg-blue-50/30') : ''}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">{label}</CardTitle>
                  {existingDoc && (
                    <Badge variant={isVerified ? 'success' : 'info'} className="text-xs">
                      {isVerified ? (
                        <><CheckCircle className="h-3 w-3 mr-1" /> Verified</>
                      ) : (
                        <><Clock className="h-3 w-3 mr-1" /> Pending Review</>
                      )}
                    </Badge>
                  )}
                </div>
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
                    <div className="flex items-center gap-3 p-3 bg-white rounded-lg border">
                      <FileText className="h-8 w-8 text-primary-600" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {label}
                        </p>
                        <p className="text-xs text-gray-500">
                          Uploaded {existingDoc.uploadedAt?.toDate ? new Date(existingDoc.uploadedAt.toDate()).toLocaleDateString() : 'recently'}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <a
                        href={existingDoc.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1"
                      >
                        <Button variant="outline" size="sm" className="w-full">
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                      </a>
                      {!isVerified && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => fileInputRefs.current[docType]?.click()}
                            disabled={isUploading}
                          >
                            {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(existingDoc.id)}
                            disabled={deleting === existingDoc.id}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            {deleting === existingDoc.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                          </Button>
                        </>
                      )}
                    </div>
                    <input
                      type="file"
                      ref={(el) => { fileInputRefs.current[docType] = el }}
                      className="hidden"
                      accept="image/*,.pdf"
                      onChange={handleFileChange(docType)}
                      disabled={isUploading}
                    />
                  </div>
                ) : (
                  <div>
                    <input
                      type="file"
                      ref={(el) => { fileInputRefs.current[docType] = el }}
                      className="hidden"
                      accept="image/*,.pdf"
                      onChange={handleFileChange(docType)}
                      disabled={isUploading}
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRefs.current[docType]?.click()}
                      disabled={isUploading}
                      className="w-full border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-primary-500 transition-colors cursor-pointer disabled:cursor-not-allowed"
                    >
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
                    </button>
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Info Box */}
      {!therapist?.credentialsVerified && (
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
      )}
    </div>
  )
}
