export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          phone: string | null
          user_type: 'therapist' | 'organizer' | 'admin'
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          phone?: string | null
          user_type: 'therapist' | 'organizer' | 'admin'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          phone?: string | null
          user_type?: 'therapist' | 'organizer' | 'admin'
          created_at?: string
          updated_at?: string
        }
      }
      therapists: {
        Row: {
          id: string
          user_id: string
          cata_number: string | null
          cata_expiry: string | null
          insurance_provider: string | null
          insurance_policy_number: string | null
          insurance_expiry: string | null
          bls_expiry: string | null
          bio: string | null
          city: string | null
          province: string | null
          postal_code: string | null
          travel_radius_km: number | null
          hourly_rate_min: number | null
          hourly_rate_max: number | null
          profile_photo_url: string | null
          credentials_verified: boolean
          stripe_account_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          cata_number?: string | null
          cata_expiry?: string | null
          insurance_provider?: string | null
          insurance_policy_number?: string | null
          insurance_expiry?: string | null
          bls_expiry?: string | null
          bio?: string | null
          city?: string | null
          province?: string | null
          postal_code?: string | null
          travel_radius_km?: number | null
          hourly_rate_min?: number | null
          hourly_rate_max?: number | null
          profile_photo_url?: string | null
          credentials_verified?: boolean
          stripe_account_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          cata_number?: string | null
          cata_expiry?: string | null
          insurance_provider?: string | null
          insurance_policy_number?: string | null
          insurance_expiry?: string | null
          bls_expiry?: string | null
          bio?: string | null
          city?: string | null
          province?: string | null
          postal_code?: string | null
          travel_radius_km?: number | null
          hourly_rate_min?: number | null
          hourly_rate_max?: number | null
          profile_photo_url?: string | null
          credentials_verified?: boolean
          stripe_account_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      organizers: {
        Row: {
          id: string
          user_id: string
          organization_name: string | null
          organization_type: 'youth_league' | 'school' | 'tournament' | 'corporate' | 'other' | null
          address: string | null
          city: string | null
          province: string | null
          postal_code: string | null
          stripe_customer_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          organization_name?: string | null
          organization_type?: 'youth_league' | 'school' | 'tournament' | 'corporate' | 'other' | null
          address?: string | null
          city?: string | null
          province?: string | null
          postal_code?: string | null
          stripe_customer_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          organization_name?: string | null
          organization_type?: 'youth_league' | 'school' | 'tournament' | 'corporate' | 'other' | null
          address?: string | null
          city?: string | null
          province?: string | null
          postal_code?: string | null
          stripe_customer_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      shifts: {
        Row: {
          id: string
          organizer_id: string
          title: string
          description: string | null
          event_type: 'tournament' | 'game' | 'practice' | 'corporate' | 'other'
          sport: string | null
          venue_name: string | null
          address: string | null
          city: string
          province: string
          postal_code: string | null
          latitude: number | null
          longitude: number | null
          date: string
          start_time: string
          end_time: string
          hourly_rate: number
          therapists_needed: number
          equipment_provided: string | null
          special_requirements: string | null
          status: 'open' | 'filled' | 'completed' | 'cancelled'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organizer_id: string
          title: string
          description?: string | null
          event_type: 'tournament' | 'game' | 'practice' | 'corporate' | 'other'
          sport?: string | null
          venue_name?: string | null
          address?: string | null
          city: string
          province: string
          postal_code?: string | null
          latitude?: number | null
          longitude?: number | null
          date: string
          start_time: string
          end_time: string
          hourly_rate: number
          therapists_needed?: number
          equipment_provided?: string | null
          special_requirements?: string | null
          status?: 'open' | 'filled' | 'completed' | 'cancelled'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organizer_id?: string
          title?: string
          description?: string | null
          event_type?: 'tournament' | 'game' | 'practice' | 'corporate' | 'other'
          sport?: string | null
          venue_name?: string | null
          address?: string | null
          city?: string
          province?: string
          postal_code?: string | null
          latitude?: number | null
          longitude?: number | null
          date?: string
          start_time?: string
          end_time?: string
          hourly_rate?: number
          therapists_needed?: number
          equipment_provided?: string | null
          special_requirements?: string | null
          status?: 'open' | 'filled' | 'completed' | 'cancelled'
          created_at?: string
          updated_at?: string
        }
      }
      applications: {
        Row: {
          id: string
          shift_id: string
          therapist_id: string
          status: 'pending' | 'accepted' | 'rejected' | 'withdrawn'
          message: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          shift_id: string
          therapist_id: string
          status?: 'pending' | 'accepted' | 'rejected' | 'withdrawn'
          message?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          shift_id?: string
          therapist_id?: string
          status?: 'pending' | 'accepted' | 'rejected' | 'withdrawn'
          message?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      bookings: {
        Row: {
          id: string
          shift_id: string
          therapist_id: string
          application_id: string
          status: 'confirmed' | 'checked_in' | 'checked_out' | 'completed' | 'cancelled' | 'disputed'
          check_in_time: string | null
          check_out_time: string | null
          hours_worked: number | null
          amount_due: number | null
          platform_fee: number | null
          therapist_payout: number | null
          stripe_payment_intent_id: string | null
          stripe_transfer_id: string | null
          paid_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          shift_id: string
          therapist_id: string
          application_id: string
          status?: 'confirmed' | 'checked_in' | 'checked_out' | 'completed' | 'cancelled' | 'disputed'
          check_in_time?: string | null
          check_out_time?: string | null
          hours_worked?: number | null
          amount_due?: number | null
          platform_fee?: number | null
          therapist_payout?: number | null
          stripe_payment_intent_id?: string | null
          stripe_transfer_id?: string | null
          paid_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          shift_id?: string
          therapist_id?: string
          application_id?: string
          status?: 'confirmed' | 'checked_in' | 'checked_out' | 'completed' | 'cancelled' | 'disputed'
          check_in_time?: string | null
          check_out_time?: string | null
          hours_worked?: number | null
          amount_due?: number | null
          platform_fee?: number | null
          therapist_payout?: number | null
          stripe_payment_intent_id?: string | null
          stripe_transfer_id?: string | null
          paid_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      reviews: {
        Row: {
          id: string
          booking_id: string
          organizer_id: string
          therapist_id: string
          rating: number
          comment: string | null
          created_at: string
        }
        Insert: {
          id?: string
          booking_id: string
          organizer_id: string
          therapist_id: string
          rating: number
          comment?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          booking_id?: string
          organizer_id?: string
          therapist_id?: string
          rating?: number
          comment?: string | null
          created_at?: string
        }
      }
      credential_documents: {
        Row: {
          id: string
          therapist_id: string
          document_type: 'cata_card' | 'insurance_certificate' | 'bls_certificate' | 'profile_photo'
          file_url: string
          uploaded_at: string
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          id?: string
          therapist_id: string
          document_type: 'cata_card' | 'insurance_certificate' | 'bls_certificate' | 'profile_photo'
          file_url: string
          uploaded_at?: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          id?: string
          therapist_id?: string
          document_type?: 'cata_card' | 'insurance_certificate' | 'bls_certificate' | 'profile_photo'
          file_url?: string
          uploaded_at?: string
          verified_at?: string | null
          verified_by?: string | null
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      user_type: 'therapist' | 'organizer' | 'admin'
      organization_type: 'youth_league' | 'school' | 'tournament' | 'corporate' | 'other'
      event_type: 'tournament' | 'game' | 'practice' | 'corporate' | 'other'
      shift_status: 'open' | 'filled' | 'completed' | 'cancelled'
      application_status: 'pending' | 'accepted' | 'rejected' | 'withdrawn'
      booking_status: 'confirmed' | 'checked_in' | 'checked_out' | 'completed' | 'cancelled' | 'disputed'
      document_type: 'cata_card' | 'insurance_certificate' | 'bls_certificate' | 'profile_photo'
    }
  }
}

export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type InsertTables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert']
export type UpdateTables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update']
export type Enums<T extends keyof Database['public']['Enums']> = Database['public']['Enums'][T]
