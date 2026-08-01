-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL CHECK (role IN ('admin', 'hospital', 'donor', 'patient')),
  full_name TEXT NOT NULL,
  phone TEXT,
  blood_type TEXT CHECK (blood_type IN ('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-')),
  location TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- Extra profile fields collected through the dashboard.  The ALTER statements
-- make this safe to apply to projects created with an earlier schema version.
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS date_of_birth DATE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS gender TEXT CHECK (gender IN ('Male', 'Female', 'Other', 'Prefer not to say'));
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS emergency_contact TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS medical_notes TEXT;

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc', NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for profiles table
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create a function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role, full_name, phone, blood_type, location)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'role', 'donor'),
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'User'),
    NEW.raw_user_meta_data->>'phone',
    NEW.raw_user_meta_data->>'blood_type',
    NEW.raw_user_meta_data->>'location'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Row Level Security (RLS) Policies
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own profile
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

-- Policy: Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Policy: Service role can do anything (for backend operations)
CREATE POLICY "Service role can do anything"
  ON profiles
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS profiles_email_idx ON profiles(email);
CREATE INDEX IF NOT EXISTS profiles_role_idx ON profiles(role);
CREATE INDEX IF NOT EXISTS profiles_blood_type_idx ON profiles(blood_type);
CREATE INDEX IF NOT EXISTS profiles_location_idx ON profiles(location);

-- Emergency requests table
CREATE TABLE IF NOT EXISTS emergency_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  blood_type TEXT NOT NULL CHECK (blood_type IN ('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-')),
  units_needed INTEGER NOT NULL CHECK (units_needed > 0),
  hospital_name TEXT NOT NULL,
  hospital_location TEXT NOT NULL,
  urgency TEXT NOT NULL CHECK (urgency IN ('critical', 'urgent', 'standard')),
  patient_name TEXT,
  surgery_type TEXT,
  required_by TIMESTAMP WITH TIME ZONE,
  requesting_user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'matching', 'fulfilled', 'cancelled')),
  matched_donor_ids UUID[] DEFAULT ARRAY[]::UUID[],
  ai_analysis JSONB,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- Donor availability table
CREATE TABLE IF NOT EXISTS donor_availability (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  donor_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  is_available BOOLEAN DEFAULT true,
  current_location TEXT,
  last_known_location TEXT,
  can_travel_distance_km INTEGER DEFAULT 50,
  response_time_minutes INTEGER DEFAULT 30,
  preferred_donation_time TEXT, -- 'morning', 'afternoon', 'evening', 'any'
  last_donation_date DATE,
  next_eligible_date DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  UNIQUE(donor_id)
);

-- Emergency responses table
CREATE TABLE IF NOT EXISTS emergency_responses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  emergency_request_id UUID NOT NULL REFERENCES emergency_requests(id) ON DELETE CASCADE,
  donor_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  response_status TEXT NOT NULL DEFAULT 'pending' CHECK (response_status IN ('pending', 'accepted', 'declined', 'completed')),
  response_time_minutes INTEGER,
  estimated_arrival_minutes INTEGER,
  actual_arrival_minutes INTEGER,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- Create triggers for emergency_requests
CREATE TRIGGER update_emergency_requests_updated_at
  BEFORE UPDATE ON emergency_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create triggers for donor_availability
CREATE TRIGGER update_donor_availability_updated_at
  BEFORE UPDATE ON donor_availability
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create triggers for emergency_responses
CREATE TRIGGER update_emergency_responses_updated_at
  BEFORE UPDATE ON emergency_responses
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security for emergency_requests
ALTER TABLE emergency_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own emergency requests"
  ON emergency_requests FOR SELECT
  USING (requesting_user_id = auth.uid());

CREATE POLICY "Users can create emergency requests"
  ON emergency_requests FOR INSERT
  WITH CHECK (requesting_user_id = auth.uid());

CREATE POLICY "Users can update own emergency requests"
  ON emergency_requests FOR UPDATE
  USING (requesting_user_id = auth.uid())
  WITH CHECK (requesting_user_id = auth.uid());

CREATE POLICY "Service role can do anything on emergency_requests"
  ON emergency_requests
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Row Level Security for donor_availability
ALTER TABLE donor_availability ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Donors can view own availability"
  ON donor_availability FOR SELECT
  USING (donor_id = auth.uid());

CREATE POLICY "Donors can create own availability"
  ON donor_availability FOR INSERT
  WITH CHECK (donor_id = auth.uid());

CREATE POLICY "Donors can update own availability"
  ON donor_availability FOR UPDATE
  USING (donor_id = auth.uid())
  WITH CHECK (donor_id = auth.uid());

CREATE POLICY "Hospitals can view donor availability"
  ON donor_availability FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'hospital'
    )
  );

CREATE POLICY "Service role can do anything on donor_availability"
  ON donor_availability
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Row Level Security for emergency_responses
ALTER TABLE emergency_responses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Donors can view own responses"
  ON emergency_responses FOR SELECT
  USING (donor_id = auth.uid());

CREATE POLICY "Request creators can view responses to their requests"
  ON emergency_responses FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM emergency_requests
      WHERE emergency_requests.id = emergency_responses.emergency_request_id
      AND emergency_requests.requesting_user_id = auth.uid()
    )
  );

CREATE POLICY "Donors can create responses"
  ON emergency_responses FOR INSERT
  WITH CHECK (donor_id = auth.uid());

CREATE POLICY "Donors can update own responses"
  ON emergency_responses FOR UPDATE
  USING (donor_id = auth.uid())
  WITH CHECK (donor_id = auth.uid());

CREATE POLICY "Service role can do anything on emergency_responses"
  ON emergency_responses
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Create indexes for emergency tables
CREATE INDEX IF NOT EXISTS emergency_requests_blood_type_idx ON emergency_requests(blood_type);
CREATE INDEX IF NOT EXISTS emergency_requests_status_idx ON emergency_requests(status);
CREATE INDEX IF NOT EXISTS emergency_requests_urgency_idx ON emergency_requests(urgency);
CREATE INDEX IF NOT EXISTS emergency_requests_location_idx ON emergency_requests(hospital_location);
CREATE INDEX IF NOT EXISTS emergency_requests_created_at_idx ON emergency_requests(created_at);

CREATE INDEX IF NOT EXISTS donor_availability_donor_id_idx ON donor_availability(donor_id);
CREATE INDEX IF NOT EXISTS donor_availability_is_available_idx ON donor_availability(is_available);

CREATE INDEX IF NOT EXISTS emergency_responses_emergency_request_id_idx ON emergency_responses(emergency_request_id);
CREATE INDEX IF NOT EXISTS emergency_responses_donor_id_idx ON emergency_responses(donor_id);
CREATE INDEX IF NOT EXISTS emergency_responses_status_idx ON emergency_responses(response_status);

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON profiles TO authenticated;
GRANT SELECT ON profiles TO anon;
GRANT ALL ON emergency_requests TO authenticated;
GRANT SELECT ON emergency_requests TO anon;
GRANT ALL ON donor_availability TO authenticated;
GRANT SELECT ON donor_availability TO anon;
GRANT ALL ON emergency_responses TO authenticated;
GRANT SELECT ON emergency_responses TO anon;
