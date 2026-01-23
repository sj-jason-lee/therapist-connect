# TherapistConnect Setup Guide

This guide walks you through setting up all the external services required for the app.

## Table of Contents
1. [Firebase Setup](#1-firebase-setup)
2. [Resend Setup (Email)](#2-resend-setup-email)
3. [Stripe Setup (Payments)](#3-stripe-setup-payments)
4. [Environment Variables](#4-environment-variables)

---

## 1. Firebase Setup

You already have Firebase configured. Here's what you need:

### Firebase Console
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: `therapist-connect-c1ff8`

### Firestore Rules
Make sure your Firestore rules allow the necessary operations. Go to **Firestore Database > Rules** and ensure you have appropriate rules for:
- `users`, `therapists`, `organizers` collections
- `shifts`, `applications`, `bookings` collections
- `conversations`, `messages` collections (for messaging)
- `reviews` collection (for reviews)

### Firebase Authentication
Ensure Email/Password authentication is enabled:
1. Go to **Authentication > Sign-in method**
2. Enable **Email/Password**

---

## 2. Resend Setup (Email)

Resend is used for sending transactional emails (notifications).

### Create Account
1. Go to [resend.com](https://resend.com)
2. Sign up for a free account
3. Verify your email

### Get API Key
1. Go to **API Keys** in the dashboard
2. Click **Create API Key**
3. Name it (e.g., "TherapistConnect Production")
4. Copy the key (starts with `re_`)

### Add Domain (Production)
For production, you need to verify your domain:
1. Go to **Domains** in the dashboard
2. Click **Add Domain**
3. Enter your domain (e.g., `therapistconnect.ca`)
4. Add the DNS records shown to your domain registrar
5. Wait for verification (usually a few minutes)

### Update From Email
Once your domain is verified, update `lib/email/resend.ts`:
```typescript
export const FROM_EMAIL = 'TherapistConnect <noreply@yourdomain.com>';
```

### Free Tier Limits
- 100 emails/day
- 3,000 emails/month
- Perfect for development and early-stage

---

## 3. Stripe Setup (Payments)

Stripe handles payments from organizers to therapists with a 15% platform fee.

### Create Account
1. Go to [stripe.com](https://stripe.com)
2. Click **Start now** and create an account
3. Verify your email and complete business profile

### Get API Keys (Test Mode)
1. In the Stripe Dashboard, ensure **Test mode** is toggled ON (top right)
2. Go to **Developers > API keys**
3. Copy your keys:
   - **Publishable key**: `pk_test_...`
   - **Secret key**: `sk_test_...`

### Set Up Stripe Connect
This allows therapists to receive payouts:
1. Go to **Settings > Connect**
2. Click **Get started with Connect**
3. Choose **Platform or marketplace**
4. For **Connect onboarding**, select **Stripe-hosted onboarding**
5. Configure your platform details

### Set Up Webhooks
Webhooks notify your app when payments complete:

1. Go to **Developers > Webhooks**
2. Click **Add endpoint**
3. Enter your webhook URL:
   - Development: Use [ngrok](https://ngrok.com) to create a tunnel
     ```bash
     ngrok http 3000
     # Use the HTTPS URL: https://abc123.ngrok.io/api/stripe/webhooks
     ```
   - Production: `https://yourdomain.com/api/stripe/webhooks`
4. Select events to listen for:
   - `checkout.session.completed`
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `account.updated`
   - `transfer.created`
   - `payout.paid`
5. Click **Add endpoint**
6. Copy the **Signing secret** (starts with `whsec_`)

### Testing Payments
Use these test card numbers:
- **Successful payment**: `4242 4242 4242 4242`
- **Declined**: `4000 0000 0000 0002`
- **Requires authentication**: `4000 0025 0000 3155`

Use any future expiry date, any 3-digit CVC, and any postal code.

### Going Live
When ready for production:
1. Complete your Stripe account verification
2. Toggle off **Test mode** in the dashboard
3. Get your live API keys
4. Update your environment variables
5. Set up a live webhook endpoint

---

## 4. Environment Variables

Create/update your `.env` file with all the required values:

```bash
# Firebase
NEXT_PUBLIC_FIREBASE_API_KEY=your-firebase-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-messaging-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Email (Resend)
RESEND_API_KEY=re_xxxxxxxxxxxx

# Stripe
STRIPE_SECRET_KEY=sk_test_xxxxxxxxxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxx
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxxxxxxxxxxx
```

### Important Notes
- Never commit `.env` to git (it's in `.gitignore`)
- Use `.env.local.example` as a template for others
- For production, set these as environment variables in your hosting platform (Vercel, etc.)

---

## Quick Checklist

- [ ] Firebase project created and configured
- [ ] Firestore rules set up
- [ ] Firebase Auth enabled
- [ ] Resend account created
- [ ] Resend API key added to `.env`
- [ ] Domain verified in Resend (for production)
- [ ] Stripe account created
- [ ] Stripe Connect enabled
- [ ] Stripe API keys added to `.env`
- [ ] Stripe webhook endpoint configured
- [ ] Webhook signing secret added to `.env`

---

## Troubleshooting

### Emails not sending
1. Check `RESEND_API_KEY` is set correctly
2. Check Resend dashboard for errors
3. In development, emails may go to spam

### Stripe Connect not working
1. Ensure Connect is enabled in your Stripe account
2. Check that `STRIPE_SECRET_KEY` is correct
3. For testing, use test mode keys

### Webhooks not receiving events
1. Make sure your endpoint is publicly accessible
2. Check the webhook signing secret matches
3. View webhook attempts in Stripe Dashboard > Developers > Webhooks

### Firebase permission errors
1. Check your Firestore rules
2. Ensure the user is authenticated
3. Check the Firebase Console for error details
