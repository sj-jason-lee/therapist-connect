# TherapistConnect

A two-sided marketplace connecting athletic therapists with event organizers in Canada.

## Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Database:** Supabase (PostgreSQL + Auth + Storage)
- **Payments:** Stripe Connect
- **Styling:** Tailwind CSS
- **Deployment:** Vercel

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Supabase account
- Stripe account

### Environment Setup

1. Copy the example environment file:
   ```bash
   cp .env.local.example .env.local
   ```

2. Fill in your environment variables:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
   STRIPE_SECRET_KEY=sk_test_xxx
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxx
   STRIPE_WEBHOOK_SECRET=whsec_xxx
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   ```

### Database Setup

1. Create a new Supabase project
2. Run the migration in `supabase/migrations/001_initial_schema.sql`
3. Enable Row Level Security (RLS) - included in migration
4. Create storage buckets:
   - `credentials` (private) - for credential documents
   - `profile-photos` (public) - for profile photos

### Installation

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

## Project Structure

```
therapist-connect/
├── app/
│   ├── (auth)/              # Authentication pages
│   ├── (dashboard)/         # Protected dashboard pages
│   │   ├── therapist/       # Therapist-specific pages
│   │   ├── organizer/       # Organizer-specific pages
│   │   └── admin/           # Admin pages
│   ├── api/                 # API routes
│   └── page.tsx             # Landing page
├── components/
│   ├── ui/                  # Reusable UI components
│   ├── layout/              # Layout components
│   └── forms/               # Form components
├── lib/
│   ├── supabase/            # Supabase client configuration
│   ├── utils.ts             # Utility functions
│   └── constants.ts         # App constants
├── types/                   # TypeScript types
└── supabase/
    └── migrations/          # Database migrations
```

## Features

### For Therapists
- Browse available shifts
- Apply to shifts with cover messages
- Check in/out of shifts
- Track earnings and payment history
- Upload and manage credentials

### For Organizers
- Post shift opportunities
- Review therapist applications
- Accept/reject applicants
- Track bookings and payments

### For Admins
- Verify therapist credentials
- Manage users
- View all transactions

## User Types

- **Therapist:** Athletic therapists looking for work
- **Organizer:** Event organizers posting shifts
- **Admin:** Platform administrators

## License

Private - All rights reserved
