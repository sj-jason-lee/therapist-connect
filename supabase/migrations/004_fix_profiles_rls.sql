-- Allow therapists to view profiles of organizers for shifts they've applied to
CREATE POLICY "Therapists can view organizer profiles for applied shifts"
ON profiles FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM applications a
        JOIN shifts s ON a.shift_id = s.id
        JOIN organizers o ON s.organizer_id = o.id
        JOIN therapists t ON a.therapist_id = t.id
        WHERE o.user_id = profiles.id
        AND t.user_id = auth.uid()
    )
);

-- Allow organizers to view profiles of therapists who applied to their shifts
CREATE POLICY "Organizers can view therapist profiles for their shifts"
ON profiles FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM applications a
        JOIN shifts s ON a.shift_id = s.id
        JOIN organizers o ON s.organizer_id = o.id
        JOIN therapists t ON a.therapist_id = t.id
        WHERE t.user_id = profiles.id
        AND o.user_id = auth.uid()
    )
);
