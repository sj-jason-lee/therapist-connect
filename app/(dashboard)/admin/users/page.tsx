'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/firebase/AuthContext'
import { getAllUsers, setUserAdmin, UserWithType } from '@/lib/firebase/firestore'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Users,
  Search,
  Shield,
  ShieldOff,
  Loader2,
  User,
  AlertCircle,
  ShieldAlert,
} from 'lucide-react'

export default function AdminUsersPage() {
  const router = useRouter()
  const { profile, loading: authLoading } = useAuth()
  const [loading, setLoading] = useState(true)
  const [users, setUsers] = useState<UserWithType[]>([])
  const [processing, setProcessing] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<'all' | 'therapist' | 'organizer' | 'admin'>('all')

  useEffect(() => {
    if (!authLoading) {
      if (!profile?.isAdmin) {
        router.push('/')
        return
      }
      loadData()
    }
  }, [authLoading, profile])

  const loadData = async () => {
    setLoading(true)
    setError(null)

    try {
      const data = await getAllUsers()
      setUsers(data)
    } catch (err) {
      console.error('Error loading users:', err)
      setError('Failed to load users')
    }

    setLoading(false)
  }

  const handleToggleAdmin = async (userId: string, currentIsAdmin: boolean) => {
    setProcessing(userId)
    setError(null)

    try {
      await setUserAdmin(userId, !currentIsAdmin)
      await loadData()
    } catch (err) {
      console.error('Error updating user:', err)
      setError('Failed to update user')
    }

    setProcessing(null)
  }

  const filteredUsers = users.filter(user => {
    const matchesSearch =
      user.fullName?.toLowerCase().includes(search.toLowerCase()) ||
      user.email?.toLowerCase().includes(search.toLowerCase())

    const matchesFilter =
      filter === 'all' ||
      (filter === 'admin' && user.isAdmin) ||
      (filter !== 'admin' && user.userType === filter)

    return matchesSearch && matchesFilter
  })

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

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Users</h1>
        <p className="text-gray-500 mt-1">
          Manage all users on the platform.
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            type="text"
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          <Button
            variant={filter === 'all' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setFilter('all')}
          >
            All
          </Button>
          <Button
            variant={filter === 'therapist' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setFilter('therapist')}
          >
            Therapists
          </Button>
          <Button
            variant={filter === 'organizer' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setFilter('organizer')}
          >
            Organizers
          </Button>
          <Button
            variant={filter === 'admin' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setFilter('admin')}
          >
            Admins
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-purple-100 rounded-full flex items-center justify-center">
                <Users className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{users.length}</p>
                <p className="text-sm text-gray-500">Total Users</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                <User className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{users.filter(u => u.userType === 'therapist').length}</p>
                <p className="text-sm text-gray-500">Therapists</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-green-100 rounded-full flex items-center justify-center">
                <User className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{users.filter(u => u.userType === 'organizer').length}</p>
                <p className="text-sm text-gray-500">Organizers</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-yellow-100 rounded-full flex items-center justify-center">
                <Shield className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{users.filter(u => u.isAdmin).length}</p>
                <p className="text-sm text-gray-500">Admins</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Users ({filteredUsers.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredUsers.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Users className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <p>No users found.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-medium text-gray-600">User</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Type</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Status</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Joined</th>
                    <th className="text-right py-3 px-4 font-medium text-gray-600">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user) => (
                    <tr key={user.uid} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 bg-purple-100 rounded-full flex items-center justify-center">
                            <User className="h-4 w-4 text-purple-600" />
                          </div>
                          <div>
                            <p className="font-medium">{user.fullName || 'Unknown'}</p>
                            <p className="text-sm text-gray-500">{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant={user.userType === 'therapist' ? 'info' : 'default'}>
                          {user.userType}
                        </Badge>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex gap-1">
                          {user.isAdmin && (
                            <Badge variant="warning">Admin</Badge>
                          )}
                          {user.onboardingComplete ? (
                            <Badge variant="success">Active</Badge>
                          ) : (
                            <Badge variant="default">Pending</Badge>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-500">
                        {user.createdAt?.toDate ? new Date(user.createdAt.toDate()).toLocaleDateString() : 'Unknown'}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleToggleAdmin(user.uid, user.isAdmin)}
                          disabled={processing === user.uid}
                        >
                          {processing === user.uid ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : user.isAdmin ? (
                            <>
                              <ShieldOff className="h-4 w-4 mr-1" />
                              Remove Admin
                            </>
                          ) : (
                            <>
                              <Shield className="h-4 w-4 mr-1" />
                              Make Admin
                            </>
                          )}
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
