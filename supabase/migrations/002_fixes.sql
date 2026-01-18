-- Migration 002: Security and policy fixes

-- 1. Fix booking creation RLS policy (was allowing anyone to create bookings)
DROP POLICY IF EXISTS "System can create bookings" ON bookings;

-- Only allow booking creation when:
-- - The user is the organizer of the shift, OR
-- - The booking is created through a server-side function (service role)
CREATE POLICY "Organizers can create bookings for their shifts"
    ON bookings FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM shifts s
            JOIN organizers o ON s.organizer_id = o.id
            WHERE s.id = shift_id
            AND o.user_id = auth.uid()
        )
    );

-- 2. Add DELETE policy for applications (allow therapists to withdraw)
CREATE POLICY "Therapists can withdraw their pending applications"
    ON applications FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM therapists t
            WHERE t.id = applications.therapist_id
            AND t.user_id = auth.uid()
        )
        AND status = 'pending'
    );

-- 3. Add index on profiles email for faster login lookups
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);

-- 4. Add check constraint for shift times (end_time > start_time handled in app)
-- Note: PostgreSQL TIME comparison works correctly for same-day shifts

-- 5. Add check constraint for therapist rates
ALTER TABLE therapists
    ADD CONSTRAINT check_rate_range
    CHECK (hourly_rate_min IS NULL OR hourly_rate_max IS NULL OR hourly_rate_min <= hourly_rate_max);

-- 6. Add check constraint for positive hourly rate on shifts
ALTER TABLE shifts
    ADD CONSTRAINT check_positive_rate
    CHECK (hourly_rate > 0);

-- 7. Add check constraint for future shift dates (optional - can be enforced in app)
-- ALTER TABLE shifts ADD CONSTRAINT check_future_date CHECK (date >= CURRENT_DATE);
