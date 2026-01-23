import { NextRequest, NextResponse } from 'next/server';
import { sendShiftReminderEmail } from '@/lib/email/notifications';

// This endpoint sends a reminder email for a specific booking
// Called from the client when a therapist wants a reminder or organizer sends one

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      therapistEmail,
      therapistName,
      shiftTitle,
      shiftDate,
      shiftTime,
      location,
      address,
      organizerName,
      hoursUntil,
    } = body;

    if (!therapistEmail || !therapistName || !shiftTitle || !shiftDate) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const success = await sendShiftReminderEmail(therapistEmail, {
      therapistName,
      shiftTitle,
      shiftDate,
      shiftTime: shiftTime || 'TBD',
      location: location || 'TBD',
      address: address || '',
      organizerName: organizerName || 'Organizer',
      hoursUntil: hoursUntil || 24,
    });

    if (success) {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json(
        { error: 'Failed to send reminder email', sent: false },
        { status: 200 }
      );
    }
  } catch (error) {
    console.error('Reminders API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
