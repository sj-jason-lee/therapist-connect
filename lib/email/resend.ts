import { Resend } from 'resend';

const resendApiKey = process.env.RESEND_API_KEY;

if (!resendApiKey) {
  console.warn('RESEND_API_KEY is not set. Email functionality will be disabled.');
}

export const resend = resendApiKey ? new Resend(resendApiKey) : null;

// For development, use Resend's test domain.
// For production, verify your domain and change to: 'TherapistConnect <noreply@yourdomain.com>'
export const FROM_EMAIL = process.env.NODE_ENV === 'production'
  ? 'TherapistConnect <noreply@therapistconnect.ca>'
  : 'TherapistConnect <onboarding@resend.dev>';
