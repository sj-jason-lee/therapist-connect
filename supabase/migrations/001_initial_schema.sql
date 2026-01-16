-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enum types
CREATE TYPE user_type AS ENUM ('therapist', 'organizer', 'admin');
CREATE TYPE organization_type AS ENUM ('youth_league', 'school', 'tournament', 'corporate', 'other');
CREATE TYPE event_type AS ENUM ('tournament', 'game', 'practice', 'corporate', 'other');
CREATE TYPE shift_status AS ENUM ('open', 'filled', 'completed', 'cancelled');
CREATE TYPE application_status AS ENUM ('pending', 'accepted', 'rejected', 'withdrawn');
CREATE TYPE booking_status AS ENUM ('confirmed', 'checked_in', 'checked_out', 'completed', 'cancelled', 'disputed');
CREATE TYPE document_type AS ENUM ('cata_card', 'insurance_certificate', 'bls_certificate', 'profile_photo');

-- Profiles table (extends Supabase auth.users)
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    full_name TEXT,
    phone TEXT,
    user_type user_type NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Therapists table
CREATE TABLE therapists (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
    cata_number TEXT,
    cata_expiry DATE,
    insurance_provider TEXT,
    insurance_policy_number TEXT,
    insurance_expiry DATE,
    bls_expiry DATE,
    bio TEXT,
    city TEXT,
    province TEXT,
    postal_code TEXT,
    travel_radius_km INTEGER DEFAULT 50,
    hourly_rate_min DECIMAL(10, 2),
    hourly_rate_max DECIMAL(10, 2),
    profile_photo_url TEXT,
    credentials_verified BOOLEAN DEFAULT FALSE,
    stripe_account_id TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Organizers table
CREATE TABLE organizers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
    organization_name TEXT,
    organization_type organization_type,
    address TEXT,
    city TEXT,
    province TEXT,
    postal_code TEXT,
    stripe_customer_id TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Shifts table
CREATE TABLE shifts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organizer_id UUID NOT NULL REFERENCES organizers(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    event_type event_type NOT NULL,
    sport TEXT,
    venue_name TEXT,
    address TEXT,
    city TEXT NOT NULL,
    province TEXT NOT NULL,
    postal_code TEXT,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    hourly_rate DECIMAL(10, 2) NOT NULL,
    therapists_needed INTEGER DEFAULT 1,
    equipment_provided TEXT,
    special_requirements TEXT,
    status shift_status DEFAULT 'open',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Applications table
CREATE TABLE applications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shift_id UUID NOT NULL REFERENCES shifts(id) ON DELETE CASCADE,
    therapist_id UUID NOT NULL REFERENCES therapists(id) ON DELETE CASCADE,
    status application_status DEFAULT 'pending',
    message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(shift_id, therapist_id)
);

-- Bookings table
CREATE TABLE bookings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shift_id UUID NOT NULL REFERENCES shifts(id) ON DELETE CASCADE,
    therapist_id UUID NOT NULL REFERENCES therapists(id) ON DELETE CASCADE,
    application_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
    status booking_status DEFAULT 'confirmed',
    check_in_time TIMESTAMPTZ,
    check_out_time TIMESTAMPTZ,
    hours_worked DECIMAL(5, 2),
    amount_due DECIMAL(10, 2),
    platform_fee DECIMAL(10, 2),
    therapist_payout DECIMAL(10, 2),
    stripe_payment_intent_id TEXT,
    stripe_transfer_id TEXT,
    paid_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Reviews table
CREATE TABLE reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_id UUID NOT NULL UNIQUE REFERENCES bookings(id) ON DELETE CASCADE,
    organizer_id UUID NOT NULL REFERENCES organizers(id) ON DELETE CASCADE,
    therapist_id UUID NOT NULL REFERENCES therapists(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Credential documents table
CREATE TABLE credential_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    therapist_id UUID NOT NULL REFERENCES therapists(id) ON DELETE CASCADE,
    document_type document_type NOT NULL,
    file_url TEXT NOT NULL,
    uploaded_at TIMESTAMPTZ DEFAULT NOW(),
    verified_at TIMESTAMPTZ,
    verified_by UUID REFERENCES profiles(id)
);

-- Create indexes for better query performance
CREATE INDEX idx_therapists_user_id ON therapists(user_id);
CREATE INDEX idx_therapists_city_province ON therapists(city, province);
CREATE INDEX idx_therapists_verified ON therapists(credentials_verified);

CREATE INDEX idx_organizers_user_id ON organizers(user_id);

CREATE INDEX idx_shifts_organizer_id ON shifts(organizer_id);
CREATE INDEX idx_shifts_date ON shifts(date);
CREATE INDEX idx_shifts_status ON shifts(status);
CREATE INDEX idx_shifts_city_province ON shifts(city, province);
CREATE INDEX idx_shifts_location ON shifts(latitude, longitude);

CREATE INDEX idx_applications_shift_id ON applications(shift_id);
CREATE INDEX idx_applications_therapist_id ON applications(therapist_id);
CREATE INDEX idx_applications_status ON applications(status);

CREATE INDEX idx_bookings_shift_id ON bookings(shift_id);
CREATE INDEX idx_bookings_therapist_id ON bookings(therapist_id);
CREATE INDEX idx_bookings_status ON bookings(status);

CREATE INDEX idx_reviews_therapist_id ON reviews(therapist_id);

CREATE INDEX idx_credential_documents_therapist_id ON credential_documents(therapist_id);
CREATE INDEX idx_credential_documents_verified ON credential_documents(verified_at);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_therapists_updated_at
    BEFORE UPDATE ON therapists
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_organizers_updated_at
    BEFORE UPDATE ON organizers
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_shifts_updated_at
    BEFORE UPDATE ON shifts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_applications_updated_at
    BEFORE UPDATE ON applications
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bookings_updated_at
    BEFORE UPDATE ON bookings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) Policies

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE therapists ENABLE ROW LEVEL SECURITY;
ALTER TABLE organizers ENABLE ROW LEVEL SECURITY;
ALTER TABLE shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE credential_documents ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view their own profile"
    ON profiles FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
    ON profiles FOR UPDATE
    USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
    ON profiles FOR INSERT
    WITH CHECK (auth.uid() = id);

-- Therapists policies
CREATE POLICY "Therapists can view their own record"
    ON therapists FOR SELECT
    USING (user_id = auth.uid());

CREATE POLICY "Organizers can view therapists who applied to their shifts"
    ON therapists FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM applications a
            JOIN shifts s ON a.shift_id = s.id
            JOIN organizers o ON s.organizer_id = o.id
            WHERE a.therapist_id = therapists.id
            AND o.user_id = auth.uid()
        )
    );

CREATE POLICY "Therapists can update their own record"
    ON therapists FOR UPDATE
    USING (user_id = auth.uid());

CREATE POLICY "Therapists can insert their own record"
    ON therapists FOR INSERT
    WITH CHECK (user_id = auth.uid());

-- Organizers policies
CREATE POLICY "Organizers can view their own record"
    ON organizers FOR SELECT
    USING (user_id = auth.uid());

CREATE POLICY "Therapists can view organizers of shifts they applied to"
    ON organizers FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM applications a
            JOIN shifts s ON a.shift_id = s.id
            JOIN therapists t ON a.therapist_id = t.id
            WHERE s.organizer_id = organizers.id
            AND t.user_id = auth.uid()
        )
    );

CREATE POLICY "Organizers can update their own record"
    ON organizers FOR UPDATE
    USING (user_id = auth.uid());

CREATE POLICY "Organizers can insert their own record"
    ON organizers FOR INSERT
    WITH CHECK (user_id = auth.uid());

-- Shifts policies
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
            JOIN therapists t ON a.therapist_id = t.id
            WHERE a.shift_id = shifts.id
            AND t.user_id = auth.uid()
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

-- Applications policies
CREATE POLICY "Therapists can view their own applications"
    ON applications FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM therapists t
            WHERE t.id = applications.therapist_id
            AND t.user_id = auth.uid()
        )
    );

CREATE POLICY "Organizers can view applications to their shifts"
    ON applications FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM shifts s
            JOIN organizers o ON s.organizer_id = o.id
            WHERE s.id = applications.shift_id
            AND o.user_id = auth.uid()
        )
    );

CREATE POLICY "Therapists can create applications"
    ON applications FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM therapists t
            WHERE t.id = therapist_id
            AND t.user_id = auth.uid()
        )
    );

CREATE POLICY "Therapists can update their own applications"
    ON applications FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM therapists t
            WHERE t.id = applications.therapist_id
            AND t.user_id = auth.uid()
        )
    );

CREATE POLICY "Organizers can update applications to their shifts"
    ON applications FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM shifts s
            JOIN organizers o ON s.organizer_id = o.id
            WHERE s.id = applications.shift_id
            AND o.user_id = auth.uid()
        )
    );

-- Bookings policies
CREATE POLICY "Therapists can view their own bookings"
    ON bookings FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM therapists t
            WHERE t.id = bookings.therapist_id
            AND t.user_id = auth.uid()
        )
    );

CREATE POLICY "Organizers can view bookings for their shifts"
    ON bookings FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM shifts s
            JOIN organizers o ON s.organizer_id = o.id
            WHERE s.id = bookings.shift_id
            AND o.user_id = auth.uid()
        )
    );

CREATE POLICY "System can create bookings"
    ON bookings FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Therapists can update their own bookings"
    ON bookings FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM therapists t
            WHERE t.id = bookings.therapist_id
            AND t.user_id = auth.uid()
        )
    );

CREATE POLICY "Organizers can update bookings for their shifts"
    ON bookings FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM shifts s
            JOIN organizers o ON s.organizer_id = o.id
            WHERE s.id = bookings.shift_id
            AND o.user_id = auth.uid()
        )
    );

-- Reviews policies
CREATE POLICY "Anyone can view reviews"
    ON reviews FOR SELECT
    USING (true);

CREATE POLICY "Organizers can create reviews for their bookings"
    ON reviews FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM organizers o
            WHERE o.id = organizer_id
            AND o.user_id = auth.uid()
        )
    );

-- Credential documents policies
CREATE POLICY "Therapists can view their own documents"
    ON credential_documents FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM therapists t
            WHERE t.id = credential_documents.therapist_id
            AND t.user_id = auth.uid()
        )
    );

CREATE POLICY "Therapists can upload their own documents"
    ON credential_documents FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM therapists t
            WHERE t.id = therapist_id
            AND t.user_id = auth.uid()
        )
    );

CREATE POLICY "Therapists can delete their own documents"
    ON credential_documents FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM therapists t
            WHERE t.id = credential_documents.therapist_id
            AND t.user_id = auth.uid()
        )
    );

-- Admin policies (admins can see and do everything)
CREATE POLICY "Admins can view all profiles"
    ON profiles FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.id = auth.uid()
            AND p.user_type = 'admin'
        )
    );

CREATE POLICY "Admins can view all therapists"
    ON therapists FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.id = auth.uid()
            AND p.user_type = 'admin'
        )
    );

CREATE POLICY "Admins can update all therapists"
    ON therapists FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.id = auth.uid()
            AND p.user_type = 'admin'
        )
    );

CREATE POLICY "Admins can view all organizers"
    ON organizers FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.id = auth.uid()
            AND p.user_type = 'admin'
        )
    );

CREATE POLICY "Admins can view all shifts"
    ON shifts FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.id = auth.uid()
            AND p.user_type = 'admin'
        )
    );

CREATE POLICY "Admins can view all applications"
    ON applications FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.id = auth.uid()
            AND p.user_type = 'admin'
        )
    );

CREATE POLICY "Admins can view all bookings"
    ON bookings FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.id = auth.uid()
            AND p.user_type = 'admin'
        )
    );

CREATE POLICY "Admins can view all credential documents"
    ON credential_documents FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.id = auth.uid()
            AND p.user_type = 'admin'
        )
    );

CREATE POLICY "Admins can update credential documents"
    ON credential_documents FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.id = auth.uid()
            AND p.user_type = 'admin'
        )
    );

-- Function to handle new user creation
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO profiles (id, email, user_type)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'user_type', 'therapist')::user_type
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on user signup
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Function to create therapist/organizer record based on user type
CREATE OR REPLACE FUNCTION create_user_type_record()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.user_type = 'therapist' THEN
        INSERT INTO therapists (user_id)
        VALUES (NEW.id)
        ON CONFLICT (user_id) DO NOTHING;
    ELSIF NEW.user_type = 'organizer' THEN
        INSERT INTO organizers (user_id)
        VALUES (NEW.id)
        ON CONFLICT (user_id) DO NOTHING;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create therapist/organizer record
CREATE TRIGGER on_profile_created
    AFTER INSERT ON profiles
    FOR EACH ROW EXECUTE FUNCTION create_user_type_record();

-- Storage bucket for credentials (run in Supabase dashboard or via API)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('credentials', 'credentials', false);
-- INSERT INTO storage.buckets (id, name, public) VALUES ('profile-photos', 'profile-photos', true);
