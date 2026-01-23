'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/lib/firebase/AuthContext'
import { getAdminStats, AdminStats } from '@/lib/firebase/firestore'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Users,
  CheckSquare,
  Clock,
  FileCheck,
  Loader2,
  ArrowRight,
  AlertCircle,
  ShieldAlert,
} from 'lucide-react'

export default function AdminDashboardPage() {
  const router = useRouter()
  const { profile, loading: authLoading } = useAuth()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [stats, setStats] = useState<AdminStats>({
    totalTherapists: 0,
    verifiedTherapists: 0,
    pendingVerifications: 0,
    totalOrganizers: 0,
  })

  useEffect(() => {
    if (!authLoading) {
      if (!profile?.isAdmin) {
        router.push('/')
        return
      }
      loadStats()
    }
  }, [authLoading, profile])

  const loadStats = async () => {
    try {
      const data = await getAdminStats()
      setStats(data)
    } catch (err) {
      console.error('Error loading stats:', err)
      setError('Failed to load stats')
    }
    setLoading(false)
  }

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
      </div>
    )
  }

  if (!profile?.isAdmin) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
          <ShieldAlert className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-sm font-medium text-red-800">Access Denied</h3>
            <p className="text-sm text-red-700 mt-1">You don't have permission to access this page.</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-sm font-medium text-red-800">Error loading dashboard</h3>
            <p className="text-sm text-red-700 mt-1">{error}</p>
          </div>
        </div>
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
