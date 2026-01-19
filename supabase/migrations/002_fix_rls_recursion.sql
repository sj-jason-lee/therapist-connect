-- Migration: Fix RLS Infinite Recursion
-- This migration removes circular dependencies in RLS policies
-- by using JWT metadata checks instead of cross-table queries

-- =============================================
-- STEP 1: Drop all policies that cause recursion
-- =============================================

-- Drop therapist policies
DROP POLICY IF EXISTS "Therapists can view their own record" ON therapists;
DROP POLICY IF EXISTS "Organizers can view therapists who applied to their shifts" ON therapists;
DROP POLICY IF EXISTS "Therapists can update their own record" ON therapists;
DROP POLICY IF EXISTS "Therapists can insert their own record" ON therapists;
DROP POLICY IF EXISTS "Admins can view all therapists" ON therapists;
DROP POLICY IF EXISTS "Admins can update all therapists" ON therapists;

-- Drop organizer policies
DROP POLICY IF EXISTS "Organizers can view their own record" ON organizers;
DROP POLICY IF EXISTS "Therapists can view organizers of shifts they applied to" ON organizers;
DROP POLICY IF EXISTS "Organizers can update their own record" ON organizers;
DROP POLICY IF EXISTS "Organizers can insert their own record" ON organizers;
DROP POLICY IF EXISTS "Admins can view all organizers" ON organizers;

-- Drop profile policies
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;

-- Drop shift policies
DROP POLICY IF EXISTS "Anyone can view open shifts" ON shifts;
DROP POLICY IF EXISTS "Organizers can view their own shifts" ON shifts;
DROP POLICY IF EXISTS "Therapists can view shifts they applied to" ON shifts;
DROP POLICY IF EXISTS "Organizers can insert shifts" ON shifts;
DROP POLICY IF EXISTS "Organizers can update their own shifts" ON shifts;
DROP POLICY IF EXISTS "Admins can view all shifts" ON shifts;

-- Drop application policies
DROP POLICY IF EXISTS "Therapists can view their own applications" ON applications;
DROP POLICY IF EXISTS "Organizers can view applications to their shifts" ON applications;
DROP POLICY IF EXISTS "Therapists can create applications" ON applications;
DROP POLICY IF EXISTS "Therapists can update their own applications" ON applications;
DROP POLICY IF EXISTS "Organizers can update applications to their shifts" ON applications;
DROP POLICY IF EXISTS "Admins can view all applications" ON applications;

-- Drop booking policies
DROP POLICY IF EXISTS "Therapists can view their own bookings" ON bookings;
DROP POLICY IF EXISTS "Organizers can view bookings for their shifts" ON bookings;
DROP POLICY IF EXISTS "System can create bookings" ON bookings;
DROP POLICY IF EXISTS "Therapists can update their own bookings" ON bookings;
DROP POLICY IF EXISTS "Organizers can update bookings for their shifts" ON bookings;
DROP POLICY IF EXISTS "Admins can view all bookings" ON bookings;

-- Drop review policies
DROP POLICY IF EXISTS "Anyone can view reviews" ON reviews;
DROP POLICY IF EXISTS "Organizers can create reviews for their bookings" ON reviews;

-- Drop credential document policies
DROP POLICY IF EXISTS "Therapists can view their own documents" ON credential_documents;
DROP POLICY IF EXISTS "Therapists can upload their own documents" ON credential_documents;
DROP POLICY IF EXISTS "Therapists can delete their own documents" ON credential_documents;
DROP POLICY IF EXISTS "Admins can view all credential documents" ON credential_documents;
DROP POLICY IF EXISTS "Admins can update credential documents" ON credential_documents;

-- Drop any remaining admin function
DROP FUNCTION IF EXISTS is_admin() CASCADE;

-- =============================================
-- STEP 2: Create helper function for user type check
-- Uses JWT metadata to avoid database lookups
-- =============================================

CREATE OR REPLACE FUNCTION public.get_user_type()
RETURNS TEXT AS $$
  SELECT COALESCE(
    auth.jwt() -> 'user_metadata' ->> 'user_type',
    'unknown'
  );
$$ LANGUAGE SQL STABLE SECURITY DEFINER;

-- =============================================
-- STEP 3: Recreate PROFILES policies
-- =============================================

CREATE POLICY "Users can view their own profile"
ON profiles FOR SELECT
USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
ON profiles FOR UPDATE
USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
ON profiles FOR INSERT
WITH CHECK (auth.uid() = id);

CREATE POLICY "Admins can view all profiles"
ON profiles FOR SELECT
USING (public.get_user_type() = 'admin');

-- =============================================
-- STEP 4: Recreate THERAPISTS policies
-- No cross-table joins to avoid recursion
-- =============================================

CREATE POLICY "Therapists can view their own record"
ON therapists FOR SELECT
USING (user_id = auth.uid());

-- Simplified: organizers can view any therapist (they need this for applications)
CREATE POLICY "Organizers can view therapists"
ON therapists FOR SELECT
USING (public.get_user_type() = 'organizer');

CREATE POLICY "Therapists can update their own record"
ON therapists FOR UPDATE
USING (user_id = auth.uid());

CREATE POLICY "Therapists can insert their own record"
ON therapists FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can view all therapists"
ON therapists FOR SELECT
USING (public.get_user_type() = 'admin');

CREATE POLICY "Admins can update all therapists"
ON therapists FOR UPDATE
USING (public.get_user_type() = 'admin');

-- =============================================
-- STEP 5: Recreate ORGANIZERS policies
-- No cross-table joins to avoid recursion
-- =============================================

CREATE POLICY "Organizers can view their own record"
ON organizers FOR SELECT
USING (user_id = auth.uid());

-- Simplified: therapists can view any organizer (they need this for shifts)
CREATE POLICY "Therapists can view organizers"
ON organizers FOR SELECT
USING (public.get_user_type() = 'therapist');

CREATE POLICY "Organizers can update their own record"
ON organizers FOR UPDATE
USING (user_id = auth.uid());

CREATE POLICY "Organizers can insert their own record"
ON organizers FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can view all organizers"
ON organizers FOR SELECT
USING (public.get_user_type() = 'admin');

-- =============================================
-- STEP 6: Recreate SHIFTS policies
-- =============================================

CREATE POLICY "Anyone can view open shifts"
ON shifts FOR SELECT
USING (status = 'open');

CREATE POLICY "Organizers can view their own shifts"
ON shifts FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM organizers o
    WHERE o.id = shifts.organizer_id
    AND o.user_id = auth.uid()
  )
);

CREATE POLICY "Therapists can view shifts they applied to"
ON shifts FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM applications a
    WHERE a.shift_id = shifts.id
    AND a.therapist_id IN (
      SELECT t.id FROM therapists t WHERE t.user_id = auth.uid()
    )
  )
);

CREATE POLICY "Organizers can insert shifts"
ON shifts FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM organizers o
    WHERE o.id = organizer_id
    AND o.user_id = auth.uid()
  )
);

CREATE POLICY "Organizers can update their own shifts"
ON shifts FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM organizers o
    WHERE o.id = shifts.organizer_id
    AND o.user_id = auth.uid()
  )
);

CREATE POLICY "Admins can view all shifts"
ON shifts FOR SELECT
USING (public.get_user_type() = 'admin');

-- =============================================
-- STEP 7: Recreate APPLICATIONS policies
-- =============================================

CREATE POLICY "Therapists can view their own applications"
ON applications FOR SELECT
USING (
  therapist_id IN (
    SELECT t.id FROM therapists t WHERE t.user_id = auth.uid()
  )
);

CREATE POLICY "Organizers can view applications to their shifts"
ON applications FOR SELECT
USING (
  shift_id IN (
    SELECT s.id FROM shifts s
    JOIN organizers o ON s.organizer_id = o.id
    WHERE o.user_id = auth.uid()
  )
);

CREATE POLICY "Therapists can create applications"
ON applications FOR INSERT
WITH CHECK (
  therapist_id IN (
    SELECT t.id FROM therapists t WHERE t.user_id = auth.uid()
  )
);

CREATE POLICY "Therapists can update their own applications"
ON applications FOR UPDATE
USING (
  therapist_id IN (
    SELECT t.id FROM therapists t WHERE t.user_id = auth.uid()
  )
);

CREATE POLICY "Organizers can update applications to their shifts"
ON applications FOR UPDATE
USING (
  shift_id IN (
    SELECT s.id FROM shifts s
    JOIN organizers o ON s.organizer_id = o.id
    WHERE o.user_id = auth.uid()
  )
);

CREATE POLICY "Admins can view all applications"
ON applications FOR SELECT
USING (public.get_user_type() = 'admin');

-- =============================================
-- STEP 8: Recreate BOOKINGS policies
-- =============================================

CREATE POLICY "Therapists can view their own bookings"
ON bookings FOR SELECT
USING (
  therapist_id IN (
    SELECT t.id FROM therapists t WHERE t.user_id = auth.uid()
  )
);

CREATE POLICY "Organizers can view bookings for their shifts"
ON bookings FOR SELECT
USING (
  shift_id IN (
    SELECT s.id FROM shifts s
    JOIN organizers o ON s.organizer_id = o.id
    WHERE o.user_id = auth.uid()
  )
);

CREATE POLICY "System can create bookings"
ON bookings FOR INSERT
WITH CHECK (true);

CREATE POLICY "Therapists can update their own bookings"
ON bookings FOR UPDATE
USING (
  therapist_id IN (
    SELECT t.id FROM therapists t WHERE t.user_id = auth.uid()
  )
);

CREATE POLICY "Organizers can update bookings for their shifts"
ON bookings FOR UPDATE
USING (
  shift_id IN (
    SELECT s.id FROM shifts s
    JOIN organizers o ON s.organizer_id = o.id
    WHERE o.user_id = auth.uid()
  )
);

CREATE POLICY "Admins can view all bookings"
ON bookings FOR SELECT
USING (public.get_user_type() = 'admin');

-- =============================================
-- STEP 9: Recreate REVIEWS policies
-- =============================================

CREATE POLICY "Anyone can view reviews"
ON reviews FOR SELECT
USING (true);

CREATE POLICY "Organizers can create reviews for their bookings"
ON reviews FOR INSERT
WITH CHECK (
  organizer_id IN (
    SELECT o.id FROM organizers o WHERE o.user_id = auth.uid()
  )
);

-- =============================================
-- STEP 10: Recreate CREDENTIAL_DOCUMENTS policies
-- =============================================

CREATE POLICY "Therapists can view their own documents"
ON credential_documents FOR SELECT
USING (
  therapist_id IN (
    SELECT t.id FROM therapists t WHERE t.user_id = auth.uid()
  )
);

CREATE POLICY "Therapists can upload their own documents"
ON credential_documents FOR INSERT
WITH CHECK (
  therapist_id IN (
    SELECT t.id FROM therapists t WHERE t.user_id = auth.uid()
  )
);

CREATE POLICY "Therapists can delete their own documents"
ON credential_documents FOR DELETE
USING (
  therapist_id IN (
    SELECT t.id FROM therapists t WHERE t.user_id = auth.uid()
  )
);

CREATE POLICY "Admins can view all credential documents"
ON credential_documents FOR SELECT
USING (public.get_user_type() = 'admin');

CREATE POLICY "Admins can update credential documents"
ON credential_documents FOR UPDATE
USING (public.get_user_type() = 'admin');

-- =============================================
-- STEP 11: Storage policies for credentials bucket
-- (Only run these if the bucket exists)
-- =============================================

-- Drop existing storage policies
DROP POLICY IF EXISTS "Therapists can upload credentials" ON storage.objects;
DROP POLICY IF EXISTS "Therapists can view own credentials" ON storage.objects;
DROP POLICY IF EXISTS "Therapists can delete own credentials" ON storage.objects;
DROP POLICY IF EXISTS "Admins can view all credentials" ON storage.objects;

-- Recreate storage policies
CREATE POLICY "Therapists can upload credentials"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'credentials' AND
  auth.uid() IS NOT NULL AND
  public.get_user_type() = 'therapist'
);

CREATE POLICY "Therapists can view own credentials"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'credentials' AND
  auth.uid() IS NOT NULL
);

CREATE POLICY "Therapists can delete own credentials"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'credentials' AND
  public.get_user_type() = 'therapist'
);

CREATE POLICY "Admins can view all credentials"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'credentials' AND
  public.get_user_type() = 'admin'
);
