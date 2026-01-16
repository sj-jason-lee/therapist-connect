import { createBrowserClient } from '@supabase/ssr'

// Use 'any' for now since types are generated after connecting to actual Supabase
// In production, replace with: import { Database } from '@/types/database'
// and use createBrowserClient<Database>()
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
