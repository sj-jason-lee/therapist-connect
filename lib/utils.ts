import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-CA', {
    style: 'currency',
    currency: 'CAD',
  }).format(amount)
}

export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return 'N/A'
  const d = new Date(date)
  if (isNaN(d.getTime())) return 'N/A'
  return new Intl.DateTimeFormat('en-CA', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(d)
}

export function formatTime(time: string | null | undefined): string {
  if (!time) return 'N/A'
  const parts = time.split(':')
  if (parts.length < 2) return 'N/A'
  const [hours, minutes] = parts
  const date = new Date()
  date.setHours(parseInt(hours), parseInt(minutes))
  if (isNaN(date.getTime())) return 'N/A'
  return new Intl.DateTimeFormat('en-CA', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(date)
}

export function formatRelativeTime(dateString: string | null | undefined): string {
  if (!dateString) return 'N/A'
  const date = new Date(dateString)
  if (isNaN(date.getTime())) return 'N/A'
  const now = new Date()
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

  if (diffInSeconds < 60) {
    return 'just now'
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60)
  if (diffInMinutes < 60) {
    return `${diffInMinutes} minute${diffInMinutes === 1 ? '' : 's'} ago`
  }

  const diffInHours = Math.floor(diffInMinutes / 60)
  if (diffInHours < 24) {
    return `${diffInHours} hour${diffInHours === 1 ? '' : 's'} ago`
  }

  const diffInDays = Math.floor(diffInHours / 24)
  if (diffInDays < 7) {
    return `${diffInDays} day${diffInDays === 1 ? '' : 's'} ago`
  }

  const diffInWeeks = Math.floor(diffInDays / 7)
  if (diffInWeeks < 4) {
    return `${diffInWeeks} week${diffInWeeks === 1 ? '' : 's'} ago`
  }

  return formatDate(date)
}

export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371 // Earth's radius in km
  const dLat = toRad(lat2 - lat1)
  const dLon = toRad(lon2 - lon1)
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

function toRad(deg: number): number {
  return deg * (Math.PI / 180)
}

export const PLATFORM_FEE_PERCENTAGE = 0.20 // 20% service fee charged to organizers

// Go4-style pricing model:
// - Therapist earns 100% of the posted hourly rate
// - Organizer pays the posted rate + 20% service fee
// - Platform fee is charged ON TOP of the therapist rate (to organizer)

export function calculatePlatformFee(therapistRate: number): number {
  // Fee is 20% of the therapist rate, charged to organizer
  return therapistRate * PLATFORM_FEE_PERCENTAGE
}

export function calculateTherapistPayout(therapistRate: number): number {
  // Therapist gets 100% of the posted rate
  return therapistRate
}

export function calculateOrganizerTotal(therapistRate: number): number {
  // Organizer pays therapist rate + platform fee
  return therapistRate * (1 + PLATFORM_FEE_PERCENTAGE)
}
