'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Filter, X } from 'lucide-react'

interface ShiftFiltersProps {
  provinces: { value: string; label: string }[]
  eventTypes: { value: string; label: string }[]
  sports: string[]
  currentFilters: {
    city?: string
    province?: string
    event_type?: string
    sport?: string
    min_rate?: string
  }
}

export function ShiftFilters({ provinces, eventTypes, sports, currentFilters }: ShiftFiltersProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isOpen, setIsOpen] = useState(false)

  const [filters, setFilters] = useState({
    city: currentFilters.city || '',
    province: currentFilters.province || '',
    event_type: currentFilters.event_type || '',
    sport: currentFilters.sport || '',
    min_rate: currentFilters.min_rate || '',
  })

  const hasActiveFilters = Object.values(currentFilters).some(v => v)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFilters(prev => ({ ...prev, [name]: value }))
  }

  const applyFilters = () => {
    const params = new URLSearchParams()
    Object.entries(filters).forEach(([key, value]) => {
      if (value) {
        params.set(key, value)
      }
    })
    router.push(`/therapist/shifts?${params.toString()}`)
    setIsOpen(false)
  }

  const clearFilters = () => {
    setFilters({
      city: '',
      province: '',
      event_type: '',
      sport: '',
      min_rate: '',
    })
    router.push('/therapist/shifts')
    setIsOpen(false)
  }

  const sportOptions = sports.map(s => ({ value: s, label: s }))

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          onClick={() => setIsOpen(!isOpen)}
          className={hasActiveFilters ? 'border-primary-500 text-primary-600' : ''}
        >
          <Filter className="h-4 w-4 mr-2" />
          Filters
          {hasActiveFilters && (
            <span className="ml-2 bg-primary-100 text-primary-700 px-2 py-0.5 rounded-full text-xs">
              Active
            </span>
          )}
        </Button>
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            <X className="h-4 w-4 mr-1" />
            Clear all
          </Button>
        )}
      </div>

      {isOpen && (
        <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Input
              label="City"
              name="city"
              value={filters.city}
              onChange={handleChange}
              placeholder="e.g., Toronto"
            />
            <Select
              label="Province"
              name="province"
              value={filters.province}
              onChange={handleChange}
              options={provinces}
              placeholder="All provinces"
            />
            <Select
              label="Event Type"
              name="event_type"
              value={filters.event_type}
              onChange={handleChange}
              options={eventTypes}
              placeholder="All event types"
            />
            <Select
              label="Sport"
              name="sport"
              value={filters.sport}
              onChange={handleChange}
              options={sportOptions}
              placeholder="All sports"
            />
            <Input
              label="Minimum Rate ($/hr)"
              name="min_rate"
              type="number"
              value={filters.min_rate}
              onChange={handleChange}
              placeholder="e.g., 50"
              min={0}
            />
          </div>
          <div className="flex items-center justify-end gap-3 mt-4 pt-4 border-t">
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button onClick={applyFilters}>
              Apply Filters
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
