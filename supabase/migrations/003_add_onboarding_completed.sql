-- Add onboarding_completed column to therapists table
ALTER TABLE therapists ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT FALSE;

-- Create index for faster queries on onboarding status
CREATE INDEX IF NOT EXISTS idx_therapists_onboarding ON therapists(onboarding_completed);
