export const USER_TYPES = {
  THERAPIST: 'therapist',
  ORGANIZER: 'organizer',
  ADMIN: 'admin',
} as const

export type UserType = (typeof USER_TYPES)[keyof typeof USER_TYPES]

export const ORGANIZATION_TYPES = {
  YOUTH_LEAGUE: 'youth_league',
  SCHOOL: 'school',
  TOURNAMENT: 'tournament',
  CORPORATE: 'corporate',
  OTHER: 'other',
} as const

export type OrganizationType = (typeof ORGANIZATION_TYPES)[keyof typeof ORGANIZATION_TYPES]

export const ORGANIZATION_TYPE_LABELS: Record<OrganizationType, string> = {
  youth_league: 'Youth League',
  school: 'School',
  tournament: 'Tournament',
  corporate: 'Corporate',
  other: 'Other',
}

export const EVENT_TYPES = {
  TOURNAMENT: 'tournament',
  GAME: 'game',
  PRACTICE: 'practice',
  CORPORATE: 'corporate',
  OTHER: 'other',
} as const

export type EventType = (typeof EVENT_TYPES)[keyof typeof EVENT_TYPES]

export const EVENT_TYPE_LABELS: Record<EventType, string> = {
  tournament: 'Tournament',
  game: 'Game',
  practice: 'Practice',
  corporate: 'Corporate Event',
  other: 'Other',
}

export const SHIFT_STATUS = {
  OPEN: 'open',
  FILLED: 'filled',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
} as const

export type ShiftStatus = (typeof SHIFT_STATUS)[keyof typeof SHIFT_STATUS]

export const APPLICATION_STATUS = {
  PENDING: 'pending',
  ACCEPTED: 'accepted',
  REJECTED: 'rejected',
  WITHDRAWN: 'withdrawn',
} as const

export type ApplicationStatus = (typeof APPLICATION_STATUS)[keyof typeof APPLICATION_STATUS]

export const BOOKING_STATUS = {
  CONFIRMED: 'confirmed',
  CHECKED_IN: 'checked_in',
  CHECKED_OUT: 'checked_out',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  DISPUTED: 'disputed',
} as const

export type BookingStatus = (typeof BOOKING_STATUS)[keyof typeof BOOKING_STATUS]

export const DOCUMENT_TYPES = {
  CATA_CARD: 'cata_card',
  INSURANCE_CERTIFICATE: 'insurance_certificate',
  BLS_CERTIFICATE: 'bls_certificate',
  PROFILE_PHOTO: 'profile_photo',
} as const

export type DocumentType = (typeof DOCUMENT_TYPES)[keyof typeof DOCUMENT_TYPES]

export const DOCUMENT_TYPE_LABELS: Record<DocumentType, string> = {
  cata_card: 'CATA Membership Card',
  insurance_certificate: 'Insurance Certificate',
  bls_certificate: 'BLS Certificate',
  profile_photo: 'Profile Photo',
}

export const CANADIAN_PROVINCES = [
  { value: 'ON', label: 'Ontario' },
  { value: 'QC', label: 'Quebec' },
  { value: 'BC', label: 'British Columbia' },
  { value: 'AB', label: 'Alberta' },
  { value: 'MB', label: 'Manitoba' },
  { value: 'SK', label: 'Saskatchewan' },
  { value: 'NS', label: 'Nova Scotia' },
  { value: 'NB', label: 'New Brunswick' },
  { value: 'NL', label: 'Newfoundland and Labrador' },
  { value: 'PE', label: 'Prince Edward Island' },
  { value: 'NT', label: 'Northwest Territories' },
  { value: 'YT', label: 'Yukon' },
  { value: 'NU', label: 'Nunavut' },
] as const

export const COMMON_SPORTS = [
  'Hockey',
  'Soccer',
  'Football',
  'Basketball',
  'Baseball',
  'Volleyball',
  'Tennis',
  'Swimming',
  'Track and Field',
  'Gymnastics',
  'Wrestling',
  'Martial Arts',
  'Rugby',
  'Lacrosse',
  'Golf',
  'Cycling',
  'Skiing',
  'Snowboarding',
  'Figure Skating',
  'Other',
] as const
