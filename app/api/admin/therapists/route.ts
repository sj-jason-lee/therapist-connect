import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

export async function GET() {
  // First verify the user is an admin
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Check if user is admin from JWT metadata
  const userType = user.user_metadata?.user_type
  if (userType !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Use admin client to bypass RLS
  const adminClient = createAdminClient()

  const { data: therapists, error: therapistsError } = await adminClient
    .from('therapists')
    .select('id, user_id, credentials_verified')
    .order('credentials_verified', { ascending: true })

  if (therapistsError) {
    return NextResponse.json({ error: therapistsError.message }, { status: 500 })
  }

  const userIds = therapists?.map(t => t.user_id) || []
  const therapistIds = therapists?.map(t => t.id) || []

  const [profilesResult, docsResult] = await Promise.all([
    adminClient
      .from('profiles')
      .select('id, full_name, email')
      .in('id', userIds),
    adminClient
      .from('credential_documents')
      .select('id, therapist_id, document_type, file_url, uploaded_at, verified_at, verified_by')
      .in('therapist_id', therapistIds)
  ])

  if (profilesResult.error) {
    return NextResponse.json({ error: profilesResult.error.message }, { status: 500 })
  }

  if (docsResult.error) {
    return NextResponse.json({ error: docsResult.error.message }, { status: 500 })
  }

  // Combine the data
  const combined = therapists?.map(therapist => ({
    ...therapist,
    profiles: profilesResult.data?.find(p => p.id === therapist.user_id) || { full_name: 'Unknown', email: '' },
    credential_documents: docsResult.data?.filter(d => d.therapist_id === therapist.id) || []
  })) || []

  return NextResponse.json(combined)
}
