'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import {
  Users,
  UserCircle,
  Building2,
  Shield,
  Search,
  Loader2,
  AlertCircle,
  CheckCircle,
  XCircle,
  Mail,
  Phone,
  MapPin,
  Calendar,
} from 'lucide-react'
import { formatDate } from '@/lib/utils'

interface User {
  id: string
  email: string
  full_name: string | null
  phone: string | null
  user_type: 'therapist' | 'organizer' | 'admin'
  created_at: string
  therapist?: {
    id: string
    credentials_verified: boolean
    city: string | null
    province: string | null
    cata_number: string | null
  } | null
  organizer?: {
    id: string
    organization_name: string | null
    city: string | null
    province: string | null
  } | null
}

interface Stats {
  total: number
  therapists: number
  organizers: number
  admins: number
}

export default function AdminUsersPage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [users, setUsers] = useState<User[]>([])
  const [stats, setStats] = useState<Stats>({ total: 0, therapists: 0, organizers: 0, admins: 0 })
  const [filters, setFilters] = useState({
    type: '',
    search: '',
    verified: '',
  })
  const [searchInput, setSearchInput] = useState('')

  useEffect(() => {
    loadUsers()
  }, [filters.type, filters.verified])

  const loadUsers = async () => {
    setLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams()
      if (filters.type) params.set('type', filters.type)
      if (filters.search) params.set('search', filters.search)
      if (filters.verified) params.set('verified', filters.verified)

      const response = await fetch(`/api/admin/users?${params.toString()}`)
      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Failed to load users')
        setLoading(false)
        return
      }

      setUsers(data.users)
      setStats(data.stats)
    } catch (err) {
      setError('An unexpected error occurred')
    }

    setLoading(false)
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setFilters(prev => ({ ...prev, search: searchInput }))
    loadUsers()
  }

  const clearFilters = () => {
    setFilters({ type: '', search: '', verified: '' })
    setSearchInput('')
  }

  const getUserTypeIcon = (type: string) => {
    switch (type) {
      case 'therapist':
        return <UserCircle className="h-5 w-5 text-primary-600" />
      case 'organizer':
        return <Building2 className="h-5 w-5 text-secondary-600" />
      case 'admin':
        return <Shield className="h-5 w-5 text-purple-600" />
      default:
        return <Users className="h-5 w-5 text-gray-600" />
    }
  }

  const getUserTypeBadge = (type: string) => {
    switch (type) {
      case 'therapist':
        return <Badge variant="info">Therapist</Badge>
      case 'organizer':
        return <Badge variant="success">Organizer</Badge>
      case 'admin':
        return <Badge className="bg-purple-100 text-purple-700">Admin</Badge>
      default:
        return <Badge variant="default">{type}</Badge>
    }
  }

  if (loading && users.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
        <p className="text-gray-500 mt-1">View and manage all platform users.</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card
          className={`cursor-pointer transition-all ${filters.type === '' ? 'ring-2 ring-purple-500' : ''}`}
          onClick={() => setFilters(prev => ({ ...prev, type: '' }))}
        >
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-purple-100 rounded-full flex items-center justify-center">
                <Users className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-sm text-gray-500">All Users</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card
          className={`cursor-pointer transition-all ${filters.type === 'therapist' ? 'ring-2 ring-primary-500' : ''}`}
          onClick={() => setFilters(prev => ({ ...prev, type: 'therapist' }))}
        >
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-primary-100 rounded-full flex items-center justify-center">
                <UserCircle className="h-5 w-5 text-primary-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.therapists}</p>
                <p className="text-sm text-gray-500">Therapists</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card
          className={`cursor-pointer transition-all ${filters.type === 'organizer' ? 'ring-2 ring-secondary-500' : ''}`}
          onClick={() => setFilters(prev => ({ ...prev, type: 'organizer' }))}
        >
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-secondary-100 rounded-full flex items-center justify-center">
                <Building2 className="h-5 w-5 text-secondary-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.organizers}</p>
                <p className="text-sm text-gray-500">Organizers</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card
          className={`cursor-pointer transition-all ${filters.type === 'admin' ? 'ring-2 ring-gray-500' : ''}`}
          onClick={() => setFilters(prev => ({ ...prev, type: 'admin' }))}
        >
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-gray-100 rounded-full flex items-center justify-center">
                <Shield className="h-5 w-5 text-gray-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.admins}</p>
                <p className="text-sm text-gray-500">Admins</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by name or email..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                />
              </div>
            </div>

            {filters.type === 'therapist' && (
              <Select
                name="verified"
                value={filters.verified}
                onChange={(e) => setFilters(prev => ({ ...prev, verified: e.target.value }))}
                options={[
                  { value: 'true', label: 'Verified Only' },
                  { value: 'false', label: 'Unverified Only' },
                ]}
                placeholder="All Verification Status"
              />
            )}

            <Button type="submit" variant="primary">
              <Search className="h-4 w-4 mr-2" />
              Search
            </Button>

            {(filters.search || filters.type || filters.verified) && (
              <Button type="button" variant="outline" onClick={clearFilters}>
                Clear
              </Button>
            )}
          </form>
        </CardContent>
      </Card>

      {/* Users List */}
      {loading ? (
        <div className="flex items-center justify-center h-32">
          <Loader2 className="h-6 w-6 animate-spin text-purple-600" />
        </div>
      ) : users.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Users className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900">No users found</h3>
            <p className="text-gray-500 mt-1">Try adjusting your filters.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {users.map((user) => (
            <Card key={user.id} className="overflow-hidden">
              <CardContent className="p-0">
                <div className="flex flex-col lg:flex-row">
                  {/* User Info */}
                  <div className="flex-1 p-6">
                    <div className="flex items-start gap-4">
                      <div className="h-12 w-12 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                        {getUserTypeIcon(user.user_type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold text-lg text-gray-900">
                            {user.full_name || 'Unnamed User'}
                          </h3>
                          {getUserTypeBadge(user.user_type)}
                          {user.user_type === 'therapist' && user.therapist && (
                            user.therapist.credentials_verified ? (
                              <Badge variant="success" className="text-xs">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Verified
                              </Badge>
                            ) : (
                              <Badge variant="warning" className="text-xs">
                                <XCircle className="h-3 w-3 mr-1" />
                                Unverified
                              </Badge>
                            )
                          )}
                        </div>

                        <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-gray-600">
                          <span className="flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {user.email}
                          </span>
                          {user.phone && (
                            <span className="flex items-center gap-1">
                              <Phone className="h-3 w-3" />
                              {user.phone}
                            </span>
                          )}
                          {(user.therapist?.city || user.organizer?.city) && (
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {user.therapist?.city || user.organizer?.city}, {user.therapist?.province || user.organizer?.province}
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            Joined {formatDate(user.created_at)}
                          </span>
                        </div>

                        {/* Role-specific info */}
                        {user.user_type === 'therapist' && user.therapist?.cata_number && (
                          <p className="mt-2 text-sm text-gray-500">
                            CATA #: {user.therapist.cata_number}
                          </p>
                        )}
                        {user.user_type === 'organizer' && user.organizer?.organization_name && (
                          <p className="mt-2 text-sm text-gray-500">
                            Organization: {user.organizer.organization_name}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 p-4 bg-gray-50 lg:w-48 lg:flex-col lg:justify-center">
                    <span className="text-xs text-gray-500 uppercase tracking-wide">User ID</span>
                    <code className="text-xs text-gray-600 bg-white px-2 py-1 rounded border truncate max-w-full">
                      {user.id.slice(0, 8)}...
                    </code>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Results count */}
      {!loading && users.length > 0 && (
        <p className="text-sm text-gray-500 text-center">
          Showing {users.length} user{users.length !== 1 ? 's' : ''}
        </p>
      )}
    </div>
  )
}
