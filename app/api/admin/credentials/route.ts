import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

export async function PATCH(request: Request) {
  // First verify the user is an admin
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const userType = user.user_metadata?.user_type
  if (userType !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await request.json()
  const { documentId, action, therapistId } = body

  const adminClient = createAdminClient()

  if (action === 'approve') {
    const { error } = await adminClient
      .from('credential_documents')
      .update({
        verified_at: new Date().toISOString(),
        verified_by: user.id,
      })
      .eq('id', documentId)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Check if all documents are verified for this therapist
    if (therapistId) {
      await checkAndUpdateTherapistVerification(adminClient, therapistId)
    }
  } else if (action === 'reject') {
    const { error } = await adminClient
      .from('credential_documents')
      .update({
        verified_at: null,
        verified_by: null,
      })
      .eq('id', documentId)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Update therapist verification status
    if (therapistId) {
      await adminClient
        .from('therapists')
        .update({ credentials_verified: false })
        .eq('id', therapistId)
    }
  } else if (action === 'approve_all') {
    // Approve all pending documents for a therapist
    const { error } = await adminClient
      .from('credential_documents')
      .update({
        verified_at: new Date().toISOString(),
        verified_by: user.id,
      })
      .eq('therapist_id', therapistId)
      .is('verified_at', null)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    await checkAndUpdateTherapistVerification(adminClient, therapistId)
  }

  return NextResponse.json({ success: true })
}

async function checkAndUpdateTherapistVerification(adminClient: any, therapistId: string) {
  const { data: docs } = await adminClient
    .from('credential_documents')
    .select('document_type, verified_at')
    .eq('therapist_id', therapistId)

  const requiredTypes = ['cata_card', 'insurance_certificate', 'bls_certificate', 'profile_photo']
  const allVerified = requiredTypes.every(type => {
    const doc = docs?.find((d: any) => d.document_type === type)
    return doc && doc.verified_at
  })

  await adminClient
    .from('therapists')
    .update({ credentials_verified: allVerified })
    .eq('id', therapistId)
}
