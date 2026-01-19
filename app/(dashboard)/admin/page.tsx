'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Users,
  CheckSquare,
  Clock,
  FileCheck,
  Loader2,
  ArrowRight,
} from 'lucide-react'

interface Stats {
  totalTherapists: number
  verifiedTherapists: number
  pendingVerifications: number
  totalOrganizers: number
}

export default function AdminDashboardPage() {
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<Stats>({
    totalTherapists: 0,
    verifiedTherapists: 0,
    pendingVerifications: 0,
    totalOrganizers: 0,
  })

  useEffect(() => {
    loadStats()
  }, [])

  const loadStats = async () => {
    const supabase = createClient()

    const [
      { count: totalTherapists },
      { count: verifiedTherapists },
      { count: totalOrganizers },
    ] = await Promise.all([
      supabase.from('therapists').select('*', { count: 'exact', head: true }),
      supabase.from('therapists').select('*', { count: 'exact', head: true }).eq('credentials_verified', true),
      supabase.from('organizers').select('*', { count: 'exact', head: true }),
    ])

    // Get therapists with pending documents
    const { data: therapistsWithDocs } = await supabase
      .from('therapists')
      .select(`
        id,
        credentials_verified,
        credential_documents (id)
      `)
      .eq('credentials_verified', false)

    const pendingVerifications = therapistsWithDocs?.filter(
      t => t.credential_documents && t.credential_documents.length > 0
    ).length || 0

    setStats({
      totalTherapists: totalTherapists || 0,
      verifiedTherapists: verifiedTherapists || 0,
      pendingVerifications,
      totalOrganizers: totalOrganizers || 0,
    })

    setLoading(false)
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
        <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-gray-500 mt-1">
          Overview of the platform.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 bg-purple-100 rounded-full flex items-center justify-center">
                <Users className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-3xl font-bold">{stats.totalTherapists}</p>
                <p className="text-sm text-gray-500">Total Therapists</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center">
                <CheckSquare className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-3xl font-bold">{stats.verifiedTherapists}</p>
                <p className="text-sm text-gray-500">Verified Therapists</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 bg-yellow-100 rounded-full flex items-center justify-center">
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-3xl font-bold">{stats.pendingVerifications}</p>
                <p className="text-sm text-gray-500">Pending Verifications</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-3xl font-bold">{stats.totalOrganizers}</p>
                <p className="text-sm text-gray-500">Total Organizers</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Link
              href="/admin/verifications"
              className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <FileCheck className="h-5 w-5 text-purple-600" />
                <div>
                  <p className="font-medium">Review Credentials</p>
                  <p className="text-sm text-gray-500">
                    {stats.pendingVerifications} pending verifications
                  </p>
                </div>
              </div>
              <ArrowRight className="h-5 w-5 text-gray-400" />
            </Link>

            <Link
              href="/admin/users"
              className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Users className="h-5 w-5 text-purple-600" />
                <div>
                  <p className="font-medium">Manage Users</p>
                  <p className="text-sm text-gray-500">
                    View and manage all users
                  </p>
                </div>
              </div>
              <ArrowRight className="h-5 w-5 text-gray-400" />
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
