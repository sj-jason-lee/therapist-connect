import { NextRequest, NextResponse } from 'next/server';
import {
  sendApplicationSubmittedEmail,
  sendApplicationStatusEmail,
  sendNewApplicationEmail,
  sendBookingConfirmedEmail,
  sendShiftReminderEmail,
  sendCredentialsVerifiedEmail,
} from '@/lib/email/notifications';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, ...data } = body;

    let success = false;

    switch (type) {
      case 'application_submitted':
        success = await sendApplicationSubmittedEmail(data.to, data);
        break;

      case 'application_status':
        success = await sendApplicationStatusEmail(data.to, data);
        break;

      case 'new_application':
        success = await sendNewApplicationEmail(data.to, data);
        break;

      case 'booking_confirmed':
        success = await sendBookingConfirmedEmail(data.to, data);
        break;

      case 'shift_reminder':
        success = await sendShiftReminderEmail(data.to, data);
        break;

      case 'credentials_verified':
        success = await sendCredentialsVerifiedEmail(data.to, data);
        break;

      default:
        return NextResponse.json(
          { error: 'Invalid notification type' },
          { status: 400 }
        );
    }

    if (success) {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json(
        { error: 'Failed to send notification', sent: false },
        { status: 200 }
      );
    }
  } catch (error) {
    console.error('Notification API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
