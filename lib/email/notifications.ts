import { resend, FROM_EMAIL } from './resend';
import {
  applicationSubmittedTemplate,
  applicationStatusTemplate,
  newApplicationTemplate,
  bookingConfirmedTemplate,
  shiftReminderTemplate,
  credentialsVerifiedTemplate,
  ApplicationSubmittedData,
  ApplicationStatusData,
  NewApplicationData,
  BookingConfirmedData,
  ShiftReminderData,
  CredentialsVerifiedData,
} from './templates';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

export async function sendApplicationSubmittedEmail(
  to: string,
  data: Omit<ApplicationSubmittedData, 'dashboardUrl'>
): Promise<boolean> {
  if (!resend) {
    console.log('Email not sent (Resend not configured):', { type: 'application_submitted', to });
    return false;
  }

  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject: `Application Submitted - ${data.shiftTitle}`,
      html: applicationSubmittedTemplate({
        ...data,
        dashboardUrl: `${APP_URL}/therapist/applications`,
      }),
    });
    return true;
  } catch (error) {
    console.error('Failed to send application submitted email:', error);
    return false;
  }
}

export async function sendApplicationStatusEmail(
  to: string,
  data: Omit<ApplicationStatusData, 'dashboardUrl'>
): Promise<boolean> {
  if (!resend) {
    console.log('Email not sent (Resend not configured):', { type: 'application_status', to });
    return false;
  }

  const statusText = data.status === 'accepted' ? 'Accepted' : 'Update';

  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject: `Application ${statusText} - ${data.shiftTitle}`,
      html: applicationStatusTemplate({
        ...data,
        dashboardUrl: data.status === 'accepted'
          ? `${APP_URL}/therapist/bookings`
          : `${APP_URL}/therapist/shifts`,
      }),
    });
    return true;
  } catch (error) {
    console.error('Failed to send application status email:', error);
    return false;
  }
}

export async function sendNewApplicationEmail(
  to: string,
  data: Omit<NewApplicationData, 'reviewUrl'>
): Promise<boolean> {
  if (!resend) {
    console.log('Email not sent (Resend not configured):', { type: 'new_application', to });
    return false;
  }

  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject: `New Application - ${data.shiftTitle}`,
      html: newApplicationTemplate({
        ...data,
        reviewUrl: `${APP_URL}/organizer/applications`,
      }),
    });
    return true;
  } catch (error) {
    console.error('Failed to send new application email:', error);
    return false;
  }
}

export async function sendBookingConfirmedEmail(
  to: string,
  data: Omit<BookingConfirmedData, 'dashboardUrl'>
): Promise<boolean> {
  if (!resend) {
    console.log('Email not sent (Resend not configured):', { type: 'booking_confirmed', to });
    return false;
  }

  const dashboardPath = data.recipientType === 'therapist'
    ? '/therapist/bookings'
    : '/organizer/bookings';

  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject: `Booking Confirmed - ${data.shiftTitle}`,
      html: bookingConfirmedTemplate({
        ...data,
        dashboardUrl: `${APP_URL}${dashboardPath}`,
      }),
    });
    return true;
  } catch (error) {
    console.error('Failed to send booking confirmed email:', error);
    return false;
  }
}

export async function sendShiftReminderEmail(
  to: string,
  data: Omit<ShiftReminderData, 'dashboardUrl'>
): Promise<boolean> {
  if (!resend) {
    console.log('Email not sent (Resend not configured):', { type: 'shift_reminder', to });
    return false;
  }

  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject: `Reminder: Shift in ${data.hoursUntil} hours - ${data.shiftTitle}`,
      html: shiftReminderTemplate({
        ...data,
        dashboardUrl: `${APP_URL}/therapist/bookings`,
      }),
    });
    return true;
  } catch (error) {
    console.error('Failed to send shift reminder email:', error);
    return false;
  }
}

export async function sendCredentialsVerifiedEmail(
  to: string,
  data: Omit<CredentialsVerifiedData, 'dashboardUrl'>
): Promise<boolean> {
  if (!resend) {
    console.log('Email not sent (Resend not configured):', { type: 'credentials_verified', to });
    return false;
  }

  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject: 'Your Credentials Have Been Verified - TherapistConnect',
      html: credentialsVerifiedTemplate({
        ...data,
        dashboardUrl: `${APP_URL}/therapist/shifts`,
      }),
    });
    return true;
  } catch (error) {
    console.error('Failed to send credentials verified email:', error);
    return false;
  }
}
