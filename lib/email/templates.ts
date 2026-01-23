const baseStyles = `
  body { margin: 0; padding: 0; background-color: #f4f4f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; }
  .container { width: 100%; max-width: 600px; margin: 0 auto; }
  .header { padding: 32px 40px; background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); border-radius: 16px 16px 0 0; text-align: center; }
  .header h1 { margin: 0; color: #ffffff; font-size: 28px; font-weight: 700; }
  .header p { margin: 8px 0 0; color: #bfdbfe; font-size: 14px; }
  .body { padding: 40px; background-color: #ffffff; }
  .body h2 { margin: 0 0 16px; color: #18181b; font-size: 24px; font-weight: 600; }
  .body p { margin: 0 0 16px; color: #52525b; font-size: 16px; line-height: 24px; }
  .button { display: inline-block; padding: 16px 32px; background-color: #2563eb; color: #ffffff; text-decoration: none; font-size: 16px; font-weight: 600; border-radius: 8px; }
  .footer { padding: 24px 40px; background-color: #fafafa; border-radius: 0 0 16px 16px; text-align: center; }
  .footer p { margin: 0 0 8px; color: #71717a; font-size: 14px; }
  .detail-box { padding: 20px; background-color: #f8fafc; border-radius: 8px; margin: 24px 0; }
  .detail-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e4e4e7; }
  .detail-label { color: #71717a; font-size: 14px; }
  .detail-value { color: #18181b; font-size: 14px; font-weight: 500; }
`;

function wrapTemplate(content: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>${baseStyles}</style>
</head>
<body style="margin: 0; padding: 0; background-color: #f4f4f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" style="width: 100%; max-width: 600px; border-collapse: collapse;">
          <tr>
            <td style="padding: 32px 40px; background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); border-radius: 16px 16px 0 0; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">TherapistConnect</h1>
              <p style="margin: 8px 0 0; color: #bfdbfe; font-size: 14px;">Connecting Athletic Therapists with Events</p>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px; background-color: #ffffff;">
              ${content}
            </td>
          </tr>
          <tr>
            <td style="padding: 24px 40px; background-color: #fafafa; border-radius: 0 0 16px 16px; text-align: center;">
              <p style="margin: 0 0 8px; color: #71717a; font-size: 14px;">TherapistConnect Inc.</p>
              <p style="margin: 0; color: #a1a1aa; font-size: 12px;">&copy; ${new Date().getFullYear()} TherapistConnect. All rights reserved.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export interface ApplicationSubmittedData {
  therapistName: string;
  shiftTitle: string;
  shiftDate: string;
  shiftTime: string;
  location: string;
  organizerName: string;
  dashboardUrl: string;
}

export function applicationSubmittedTemplate(data: ApplicationSubmittedData): string {
  return wrapTemplate(`
    <h2 style="margin: 0 0 16px; color: #18181b; font-size: 24px; font-weight: 600;">Application Submitted!</h2>
    <p style="margin: 0 0 24px; color: #52525b; font-size: 16px; line-height: 24px;">
      Hi ${data.therapistName}, your application has been submitted successfully.
    </p>

    <div style="padding: 20px; background-color: #f8fafc; border-radius: 8px; margin: 24px 0;">
      <p style="margin: 0 0 12px; color: #18181b; font-size: 16px; font-weight: 600;">${data.shiftTitle}</p>
      <p style="margin: 0 0 8px; color: #52525b; font-size: 14px;"><strong>Date:</strong> ${data.shiftDate}</p>
      <p style="margin: 0 0 8px; color: #52525b; font-size: 14px;"><strong>Time:</strong> ${data.shiftTime}</p>
      <p style="margin: 0 0 8px; color: #52525b; font-size: 14px;"><strong>Location:</strong> ${data.location}</p>
      <p style="margin: 0; color: #52525b; font-size: 14px;"><strong>Organizer:</strong> ${data.organizerName}</p>
    </div>

    <p style="margin: 0 0 24px; color: #52525b; font-size: 16px; line-height: 24px;">
      The event organizer will review your application and you'll receive an email when they make a decision.
    </p>

    <table role="presentation" style="width: 100%; border-collapse: collapse;">
      <tr>
        <td align="center" style="padding: 8px 0 32px;">
          <a href="${data.dashboardUrl}" style="display: inline-block; padding: 16px 32px; background-color: #2563eb; color: #ffffff; text-decoration: none; font-size: 16px; font-weight: 600; border-radius: 8px;">
            View Your Applications
          </a>
        </td>
      </tr>
    </table>
  `);
}

export interface ApplicationStatusData {
  therapistName: string;
  shiftTitle: string;
  shiftDate: string;
  shiftTime: string;
  location: string;
  status: 'accepted' | 'rejected';
  dashboardUrl: string;
}

export function applicationStatusTemplate(data: ApplicationStatusData): string {
  const isAccepted = data.status === 'accepted';
  const statusColor = isAccepted ? '#16a34a' : '#dc2626';
  const statusText = isAccepted ? 'Accepted' : 'Not Selected';
  const message = isAccepted
    ? "Congratulations! The event organizer has accepted your application. You're now booked for this shift."
    : "Unfortunately, the event organizer has selected another therapist for this shift. Don't worry - keep applying and you'll find the right match!";

  return wrapTemplate(`
    <h2 style="margin: 0 0 16px; color: #18181b; font-size: 24px; font-weight: 600;">Application Update</h2>
    <p style="margin: 0 0 24px; color: #52525b; font-size: 16px; line-height: 24px;">
      Hi ${data.therapistName}, your application status has been updated.
    </p>

    <div style="padding: 16px; background-color: ${isAccepted ? '#f0fdf4' : '#fef2f2'}; border-radius: 8px; margin: 24px 0; text-align: center;">
      <p style="margin: 0; color: ${statusColor}; font-size: 18px; font-weight: 600;">${statusText}</p>
    </div>

    <div style="padding: 20px; background-color: #f8fafc; border-radius: 8px; margin: 24px 0;">
      <p style="margin: 0 0 12px; color: #18181b; font-size: 16px; font-weight: 600;">${data.shiftTitle}</p>
      <p style="margin: 0 0 8px; color: #52525b; font-size: 14px;"><strong>Date:</strong> ${data.shiftDate}</p>
      <p style="margin: 0 0 8px; color: #52525b; font-size: 14px;"><strong>Time:</strong> ${data.shiftTime}</p>
      <p style="margin: 0; color: #52525b; font-size: 14px;"><strong>Location:</strong> ${data.location}</p>
    </div>

    <p style="margin: 0 0 24px; color: #52525b; font-size: 16px; line-height: 24px;">
      ${message}
    </p>

    <table role="presentation" style="width: 100%; border-collapse: collapse;">
      <tr>
        <td align="center" style="padding: 8px 0 32px;">
          <a href="${data.dashboardUrl}" style="display: inline-block; padding: 16px 32px; background-color: #2563eb; color: #ffffff; text-decoration: none; font-size: 16px; font-weight: 600; border-radius: 8px;">
            ${isAccepted ? 'View Your Bookings' : 'Find More Shifts'}
          </a>
        </td>
      </tr>
    </table>
  `);
}

export interface NewApplicationData {
  organizerName: string;
  therapistName: string;
  shiftTitle: string;
  shiftDate: string;
  message?: string;
  reviewUrl: string;
}

export function newApplicationTemplate(data: NewApplicationData): string {
  return wrapTemplate(`
    <h2 style="margin: 0 0 16px; color: #18181b; font-size: 24px; font-weight: 600;">New Application Received!</h2>
    <p style="margin: 0 0 24px; color: #52525b; font-size: 16px; line-height: 24px;">
      Hi ${data.organizerName}, you have a new application for your shift.
    </p>

    <div style="padding: 20px; background-color: #f8fafc; border-radius: 8px; margin: 24px 0;">
      <p style="margin: 0 0 12px; color: #18181b; font-size: 16px; font-weight: 600;">${data.shiftTitle}</p>
      <p style="margin: 0 0 8px; color: #52525b; font-size: 14px;"><strong>Date:</strong> ${data.shiftDate}</p>
      <p style="margin: 0 0 8px; color: #52525b; font-size: 14px;"><strong>Applicant:</strong> ${data.therapistName}</p>
      ${data.message ? `<p style="margin: 0; color: #52525b; font-size: 14px;"><strong>Message:</strong> ${data.message}</p>` : ''}
    </div>

    <p style="margin: 0 0 24px; color: #52525b; font-size: 16px; line-height: 24px;">
      Review their profile and credentials to decide if they're a good fit for your event.
    </p>

    <table role="presentation" style="width: 100%; border-collapse: collapse;">
      <tr>
        <td align="center" style="padding: 8px 0 32px;">
          <a href="${data.reviewUrl}" style="display: inline-block; padding: 16px 32px; background-color: #2563eb; color: #ffffff; text-decoration: none; font-size: 16px; font-weight: 600; border-radius: 8px;">
            Review Application
          </a>
        </td>
      </tr>
    </table>
  `);
}

export interface BookingConfirmedData {
  recipientName: string;
  recipientType: 'therapist' | 'organizer';
  shiftTitle: string;
  shiftDate: string;
  shiftTime: string;
  location: string;
  address: string;
  hourlyRate: number;
  otherPartyName: string;
  dashboardUrl: string;
}

export function bookingConfirmedTemplate(data: BookingConfirmedData): string {
  const isTherapist = data.recipientType === 'therapist';
  const otherPartyLabel = isTherapist ? 'Event Organizer' : 'Therapist';

  return wrapTemplate(`
    <h2 style="margin: 0 0 16px; color: #18181b; font-size: 24px; font-weight: 600;">Booking Confirmed!</h2>
    <p style="margin: 0 0 24px; color: #52525b; font-size: 16px; line-height: 24px;">
      Hi ${data.recipientName}, your booking has been confirmed.
    </p>

    <div style="padding: 16px; background-color: #f0fdf4; border-radius: 8px; margin: 24px 0; text-align: center;">
      <p style="margin: 0; color: #16a34a; font-size: 18px; font-weight: 600;">Confirmed</p>
    </div>

    <div style="padding: 20px; background-color: #f8fafc; border-radius: 8px; margin: 24px 0;">
      <p style="margin: 0 0 12px; color: #18181b; font-size: 16px; font-weight: 600;">${data.shiftTitle}</p>
      <p style="margin: 0 0 8px; color: #52525b; font-size: 14px;"><strong>Date:</strong> ${data.shiftDate}</p>
      <p style="margin: 0 0 8px; color: #52525b; font-size: 14px;"><strong>Time:</strong> ${data.shiftTime}</p>
      <p style="margin: 0 0 8px; color: #52525b; font-size: 14px;"><strong>Location:</strong> ${data.location}</p>
      <p style="margin: 0 0 8px; color: #52525b; font-size: 14px;"><strong>Address:</strong> ${data.address}</p>
      <p style="margin: 0 0 8px; color: #52525b; font-size: 14px;"><strong>Rate:</strong> $${data.hourlyRate}/hour</p>
      <p style="margin: 0; color: #52525b; font-size: 14px;"><strong>${otherPartyLabel}:</strong> ${data.otherPartyName}</p>
    </div>

    <p style="margin: 0 0 24px; color: #52525b; font-size: 16px; line-height: 24px;">
      ${isTherapist
        ? "Please arrive 15 minutes before the shift starts. Make sure to check in when you arrive!"
        : "Your therapist has been notified and will arrive ready to provide coverage for your event."
      }
    </p>

    <table role="presentation" style="width: 100%; border-collapse: collapse;">
      <tr>
        <td align="center" style="padding: 8px 0 32px;">
          <a href="${data.dashboardUrl}" style="display: inline-block; padding: 16px 32px; background-color: #2563eb; color: #ffffff; text-decoration: none; font-size: 16px; font-weight: 600; border-radius: 8px;">
            View Booking Details
          </a>
        </td>
      </tr>
    </table>
  `);
}

export interface ShiftReminderData {
  therapistName: string;
  shiftTitle: string;
  shiftDate: string;
  shiftTime: string;
  location: string;
  address: string;
  organizerName: string;
  hoursUntil: number;
  dashboardUrl: string;
}

export function shiftReminderTemplate(data: ShiftReminderData): string {
  return wrapTemplate(`
    <h2 style="margin: 0 0 16px; color: #18181b; font-size: 24px; font-weight: 600;">Shift Reminder</h2>
    <p style="margin: 0 0 24px; color: #52525b; font-size: 16px; line-height: 24px;">
      Hi ${data.therapistName}, you have a shift coming up in ${data.hoursUntil} hours!
    </p>

    <div style="padding: 16px; background-color: #fef3c7; border-radius: 8px; margin: 24px 0; text-align: center;">
      <p style="margin: 0; color: #92400e; font-size: 18px; font-weight: 600;">${data.hoursUntil} Hours Away</p>
    </div>

    <div style="padding: 20px; background-color: #f8fafc; border-radius: 8px; margin: 24px 0;">
      <p style="margin: 0 0 12px; color: #18181b; font-size: 16px; font-weight: 600;">${data.shiftTitle}</p>
      <p style="margin: 0 0 8px; color: #52525b; font-size: 14px;"><strong>Date:</strong> ${data.shiftDate}</p>
      <p style="margin: 0 0 8px; color: #52525b; font-size: 14px;"><strong>Time:</strong> ${data.shiftTime}</p>
      <p style="margin: 0 0 8px; color: #52525b; font-size: 14px;"><strong>Location:</strong> ${data.location}</p>
      <p style="margin: 0 0 8px; color: #52525b; font-size: 14px;"><strong>Address:</strong> ${data.address}</p>
      <p style="margin: 0; color: #52525b; font-size: 14px;"><strong>Organizer:</strong> ${data.organizerName}</p>
    </div>

    <p style="margin: 0 0 24px; color: #52525b; font-size: 16px; line-height: 24px;">
      Please arrive 15 minutes early and remember to check in when you arrive. If you need to cancel, please contact the organizer as soon as possible.
    </p>

    <table role="presentation" style="width: 100%; border-collapse: collapse;">
      <tr>
        <td align="center" style="padding: 8px 0 32px;">
          <a href="${data.dashboardUrl}" style="display: inline-block; padding: 16px 32px; background-color: #2563eb; color: #ffffff; text-decoration: none; font-size: 16px; font-weight: 600; border-radius: 8px;">
            View Booking Details
          </a>
        </td>
      </tr>
    </table>
  `);
}

export interface CredentialsVerifiedData {
  therapistName: string;
  dashboardUrl: string;
}

export function credentialsVerifiedTemplate(data: CredentialsVerifiedData): string {
  return wrapTemplate(`
    <h2 style="margin: 0 0 16px; color: #18181b; font-size: 24px; font-weight: 600;">Credentials Verified!</h2>
    <p style="margin: 0 0 24px; color: #52525b; font-size: 16px; line-height: 24px;">
      Hi ${data.therapistName}, great news! Your credentials have been reviewed and verified.
    </p>

    <div style="padding: 16px; background-color: #f0fdf4; border-radius: 8px; margin: 24px 0; text-align: center;">
      <p style="margin: 0; color: #16a34a; font-size: 18px; font-weight: 600;">Verified</p>
    </div>

    <p style="margin: 0 0 24px; color: #52525b; font-size: 16px; line-height: 24px;">
      You can now apply for shifts and start getting booked for events. Event organizers will be able to see your verified status, which helps build trust.
    </p>

    <table role="presentation" style="width: 100%; border-collapse: collapse;">
      <tr>
        <td align="center" style="padding: 8px 0 32px;">
          <a href="${data.dashboardUrl}" style="display: inline-block; padding: 16px 32px; background-color: #2563eb; color: #ffffff; text-decoration: none; font-size: 16px; font-weight: 600; border-radius: 8px;">
            Browse Available Shifts
          </a>
        </td>
      </tr>
    </table>
  `);
}
