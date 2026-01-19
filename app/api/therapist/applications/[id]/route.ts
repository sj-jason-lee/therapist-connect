import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// DELETE - Withdraw an application
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Get therapist
  const { data: therapist } = await supabase
    .from('therapists')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (!therapist) {
    return NextResponse.json({ error: 'Therapist profile not found' }, { status: 404 })
  }

  // Get the application and verify it belongs to this therapist
  const { data: application } = await supabase
    .from('applications')
    .select('id, status, therapist_id, shift_id')
    .eq('shift_id', params.id)
    .single()

  if (!application) {
    return NextResponse.json({ error: 'Application not found' }, { status: 404 })
  }

  if (application.therapist_id !== therapist.id) {
    return NextResponse.json({ error: 'Not authorized to withdraw this application' }, { status: 403 })
  }

  // Can only withdraw pending applications
  if (application.status !== 'pending') {
    return NextResponse.json({
      error: 'Can only withdraw pending applications'
    }, { status: 400 })
  }

  // Update the application status to withdrawn
  const { error } = await supabase
    .from('applications')
    .update({ status: 'withdrawn' })
    .eq('id', params.id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
