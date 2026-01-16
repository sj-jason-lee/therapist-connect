import { Tables } from './database'

export type Profile = Tables<'profiles'>
export type Therapist = Tables<'therapists'>
export type Organizer = Tables<'organizers'>
export type Shift = Tables<'shifts'>
export type Application = Tables<'applications'>
export type Booking = Tables<'bookings'>
export type Review = Tables<'reviews'>
export type CredentialDocument = Tables<'credential_documents'>

// Extended types with relations
export type TherapistWithProfile = Therapist & {
  profile: Profile
}

export type OrganizerWithProfile = Organizer & {
  profile: Profile
}

export type ShiftWithOrganizer = Shift & {
  organizer: OrganizerWithProfile
}

export type ApplicationWithTherapist = Application & {
  therapist: TherapistWithProfile
}

export type ApplicationWithShift = Application & {
  shift: ShiftWithOrganizer
}

export type BookingWithDetails = Booking & {
  shift: ShiftWithOrganizer
  therapist: TherapistWithProfile
}

// Form types
export type TherapistProfileFormData = {
  full_name: string
  phone: string
  cata_number: string
  cata_expiry: string
  insurance_provider: string
  insurance_policy_number: string
  insurance_expiry: string
  bls_expiry: string
  bio: string
  city: string
  province: string
  postal_code: string
  travel_radius_km: number
  hourly_rate_min: number
  hourly_rate_max: number
}

export type OrganizerProfileFormData = {
  full_name: string
  phone: string
  organization_name: string
  organization_type: string
  address: string
  city: string
  province: string
  postal_code: string
}

export type ShiftFormData = {
  title: string
  description: string
  event_type: string
  sport: string
  venue_name: string
  address: string
  city: string
  province: string
  postal_code: string
  date: string
  start_time: string
  end_time: string
  hourly_rate: number
  therapists_needed: number
  equipment_provided: string
  special_requirements: string
}

// Auth types
export type UserWithRole = {
  id: string
  email: string
  user_type: 'therapist' | 'organizer' | 'admin'
  profile: Profile
  therapist?: Therapist
  organizer?: Organizer
}
