-- First, drop the problematic policy if it exists
DROP POLICY IF EXISTS "Therapists can view shifts they are booked for" ON shifts;

-- Create a security definer function to check if user has a booking for a shift
-- This bypasses RLS to avoid infinite recursion
CREATE OR REPLACE FUNCTION public.user_has_booking_for_shift(shift_uuid UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM bookings b
    JOIN therapists t ON b.therapist_id = t.id
    WHERE b.shift_id = shift_uuid
    AND t.user_id = auth.uid()
  );
$$ LANGUAGE SQL STABLE SECURITY DEFINER;

-- Now create the policy using the function
CREATE POLICY "Therapists can view shifts they are booked for"
ON shifts FOR SELECT
USING (public.user_has_booking_for_shift(id));
