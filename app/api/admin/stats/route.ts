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

  const [
    { count: totalTherapists },
    { count: verifiedTherapists },
    { count: totalOrganizers },
  ] = await Promise.all([
    adminClient.from('therapists').select('*', { count: 'exact', head: true }),
    adminClient.from('therapists').select('*', { count: 'exact', head: true }).eq('credentials_verified', true),
    adminClient.from('organizers').select('*', { count: 'exact', head: true }),
  ])

  // Get therapists with pending documents
  const { data: therapistsWithDocs } = await adminClient
    .from('therapists')
    .select(`
      id,
      credentials_verified,
      credential_documents (id)
    `)
    .eq('credentials_verified', false)

  const pendingVerifications = therapistsWithDocs?.filter(
    t => t.credential_documents && t.credential_documents.length > 0
  ).length || 0

  return NextResponse.json({
    totalTherapists: totalTherapists || 0,
    verifiedTherapists: verifiedTherapists || 0,
    pendingVerifications,
    totalOrganizers: totalOrganizers || 0,
  })
}
