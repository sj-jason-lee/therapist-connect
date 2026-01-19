'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { DOCUMENT_TYPE_LABELS } from '@/lib/constants'
import {
  CheckCircle,
  XCircle,
  Clock,
  Loader2,
  Eye,
  User,
  FileCheck,
  AlertCircle,
} from 'lucide-react'

interface CredentialDocument {
  id: string
  therapist_id: string
  document_type: string
  file_url: string
  uploaded_at: string
  verified_at: string | null
  verified_by: string | null
}

interface Therapist {
  id: string
  user_id: string
  credentials_verified: boolean
  profiles: {
    full_name: string
    email: string
  }
  credential_documents: CredentialDocument[]
}

export default function AdminVerificationsPage() {
  const [loading, setLoading] = useState(true)
  const [therapists, setTherapists] = useState<Therapist[]>([])
  const [processing, setProcessing] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<'pending' | 'verified' | 'all'>('pending')

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/admin/therapists')
      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Failed to load therapists')
        setLoading(false)
        return
      }

      setTherapists(data)
    } catch (err) {
      console.error('Unexpected error:', err)
      setError('An unexpected error occurred')
    }

    setLoading(false)
  }

  const handleApproveDocument = async (documentId: string, therapistId: string) => {
    setProcessing(documentId)
    setError(null)

    try {
      const response = await fetch('/api/admin/credentials', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documentId, therapistId, action: 'approve' })
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Failed to approve document')
      } else {
        await loadData()
      }
    } catch (err) {
      setError('Failed to approve document')
    }

    setProcessing(null)
  }

  const handleRejectDocument = async (documentId: string, therapistId: string) => {
    setProcessing(documentId)
    setError(null)

    try {
      const response = await fetch('/api/admin/credentials', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documentId, therapistId, action: 'reject' })
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Failed to reject document')
      } else {
        await loadData()
      }
    } catch (err) {
      setError('Failed to reject document')
    }

    setProcessing(null)
  }

  const handleApproveAll = async (therapist: Therapist) => {
    setProcessing(`all-${therapist.id}`)
    setError(null)

    try {
      const response = await fetch('/api/admin/credentials', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ therapistId: therapist.id, action: 'approve_all' })
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Failed to approve documents')
      } else {
        await loadData()
      }
    } catch (err) {
      setError('Failed to approve documents')
    }

    setProcessing(null)
  }

  const filteredTherapists = therapists.filter(t => {
    if (filter === 'pending') {
      return !t.credentials_verified && t.credential_documents.length > 0
    }
    if (filter === 'verified') {
      return t.credentials_verified
    }
    return t.credential_documents.length > 0
  })

  const getPendingCount = (therapist: Therapist) => {
    return therapist.credential_documents.filter(d => !d.verified_at).length
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Credential Verifications</h1>
        <p className="text-gray-500 mt-1">
          Review and approve therapist credentials.
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex gap-2">
        <Button
          variant={filter === 'pending' ? 'primary' : 'outline'}
          size="sm"
          onClick={() => setFilter('pending')}
        >
          <Clock className="h-4 w-4 mr-2" />
          Pending
        </Button>
        <Button
          variant={filter === 'verified' ? 'primary' : 'outline'}
          size="sm"
          onClick={() => setFilter('verified')}
        >
          <CheckCircle className="h-4 w-4 mr-2" />
          Verified
        </Button>
        <Button
          variant={filter === 'all' ? 'primary' : 'outline'}
          size="sm"
          onClick={() => setFilter('all')}
        >
          All
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-yellow-100 rounded-full flex items-center justify-center">
                <Clock className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {therapists.filter(t => !t.credentials_verified && t.credential_documents.length > 0).length}
                </p>
                <p className="text-sm text-gray-500">Pending Review</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {therapists.filter(t => t.credentials_verified).length}
                </p>
                <p className="text-sm text-gray-500">Verified</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-gray-100 rounded-full flex items-center justify-center">
                <User className="h-5 w-5 text-gray-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{therapists.length}</p>
                <p className="text-sm text-gray-500">Total Therapists</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Therapist List */}
      {filteredTherapists.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <FileCheck className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-500">No therapists found with the selected filter.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {filteredTherapists.map((therapist) => (
            <Card key={therapist.id}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 bg-purple-100 rounded-full flex items-center justify-center">
                      <User className="h-5 w-5 text-purple-600" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">
                        {therapist.profiles?.full_name || 'Unknown'}
                      </CardTitle>
                      <p className="text-sm text-gray-500">{therapist.profiles?.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {therapist.credentials_verified ? (
                      <Badge variant="success">Verified</Badge>
                    ) : (
                      <Badge variant="warning">
                        {getPendingCount(therapist)} pending
                      </Badge>
                    )}
                    {!therapist.credentials_verified && getPendingCount(therapist) > 0 && (
                      <Button
                        size="sm"
                        onClick={() => handleApproveAll(therapist)}
                        disabled={processing === `all-${therapist.id}`}
                      >
                        {processing === `all-${therapist.id}` ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : (
                          <CheckCircle className="h-4 w-4 mr-2" />
                        )}
                        Approve All
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {therapist.credential_documents.map((doc) => (
                    <div
                      key={doc.id}
                      className="border rounded-lg p-4 space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">
                          {DOCUMENT_TYPE_LABELS[doc.document_type as keyof typeof DOCUMENT_TYPE_LABELS] || doc.document_type}
                        </span>
                        {doc.verified_at ? (
                          <Badge variant="success" className="text-xs">Verified</Badge>
                        ) : (
                          <Badge variant="warning" className="text-xs">Pending</Badge>
                        )}
                      </div>
                      <p className="text-xs text-gray-500">
                        Uploaded: {new Date(doc.uploaded_at).toLocaleDateString()}
                      </p>
                      <div className="flex items-center gap-2">
                        <a
                          href={doc.file_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1"
                        >
                          <Button variant="outline" size="sm" className="w-full">
                            <Eye className="h-3 w-3 mr-1" />
                            View
                          </Button>
                        </a>
                        {!doc.verified_at ? (
                          <Button
                            size="sm"
                            onClick={() => handleApproveDocument(doc.id, therapist.id)}
                            disabled={processing === doc.id}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            {processing === doc.id ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <CheckCircle className="h-3 w-3" />
                            )}
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleRejectDocument(doc.id, therapist.id)}
                            disabled={processing === doc.id}
                            className="text-red-600 hover:text-red-700"
                          >
                            {processing === doc.id ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <XCircle className="h-3 w-3" />
                            )}
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                {therapist.credential_documents.length === 0 && (
                  <p className="text-sm text-gray-500 text-center py-4">
                    No documents uploaded yet.
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
