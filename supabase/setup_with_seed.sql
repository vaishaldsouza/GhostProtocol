-- ============================================================
-- RedPulse Full Setup + Seed Data
-- Run this entire file in: Supabase Dashboard → SQL Editor
-- ============================================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─── TABLES ──────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL CHECK (role IN ('admin', 'hospital', 'donor', 'patient')),
  full_name TEXT NOT NULL,
  phone TEXT,
  blood_type TEXT CHECK (blood_type IN ('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-')),
  location TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  date_of_birth DATE,
  gender TEXT,
  is_available BOOLEAN DEFAULT true,
  total_donations INTEGER DEFAULT 0,
  accepted_requests INTEGER DEFAULT 0,
  declined_requests INTEGER DEFAULT 0,
  total_requests_received INTEGER DEFAULT 0,
  last_donated_at DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS emergency_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  blood_type TEXT NOT NULL CHECK (blood_type IN ('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-')),
  units_needed INTEGER NOT NULL DEFAULT 1,
  hospital_name TEXT NOT NULL,
  hospital_location TEXT NOT NULL,
  urgency TEXT NOT NULL DEFAULT 'urgent' CHECK (urgency IN ('critical', 'urgent', 'standard')),
  patient_name TEXT,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'matching', 'fulfilled', 'cancelled')),
  requesting_user_id UUID,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS donor_availability (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  donor_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  is_available BOOLEAN DEFAULT true,
  next_eligible_date DATE,
  can_travel_distance_km INTEGER DEFAULT 50,
  response_time_minutes INTEGER DEFAULT 30,
  preferred_donation_time TEXT DEFAULT 'any',
  last_donation_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(donor_id)
);

CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  request_id TEXT,
  donor_id TEXT,
  status TEXT DEFAULT 'pending',
  channel TEXT DEFAULT 'whatsapp',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS call_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  call_sid TEXT UNIQUE,
  donor_id TEXT,
  request_id TEXT,
  phone_number TEXT,
  blood_group TEXT,
  hospital_name TEXT,
  status TEXT DEFAULT 'initiated',
  duration_seconds INTEGER DEFAULT 0,
  dtmf_response TEXT DEFAULT 'none',
  retry_count INTEGER DEFAULT 0,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── UPDATED_AT TRIGGER ──────────────────────────────────────

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_profiles_updated_at') THEN
    CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_emergency_requests_updated_at') THEN
    CREATE TRIGGER update_emergency_requests_updated_at BEFORE UPDATE ON emergency_requests FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

-- ─── ROW LEVEL SECURITY ───────────────────────────────────────

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE emergency_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE donor_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE call_logs ENABLE ROW LEVEL SECURITY;

-- Allow anon + authenticated to read everything (needed for AI prediction)
DROP POLICY IF EXISTS "Public read profiles" ON profiles;
CREATE POLICY "Public read profiles" ON profiles FOR SELECT USING (true);

DROP POLICY IF EXISTS "Authenticated insert profiles" ON profiles;
CREATE POLICY "Authenticated insert profiles" ON profiles FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated update profiles" ON profiles;
CREATE POLICY "Authenticated update profiles" ON profiles FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Public read emergency_requests" ON emergency_requests;
CREATE POLICY "Public read emergency_requests" ON emergency_requests FOR SELECT USING (true);

DROP POLICY IF EXISTS "Authenticated manage emergency_requests" ON emergency_requests;
CREATE POLICY "Authenticated manage emergency_requests" ON emergency_requests FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public read donor_availability" ON donor_availability;
CREATE POLICY "Public read donor_availability" ON donor_availability FOR SELECT USING (true);

DROP POLICY IF EXISTS "Authenticated manage donor_availability" ON donor_availability;
CREATE POLICY "Authenticated manage donor_availability" ON donor_availability FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public manage notifications" ON notifications;
CREATE POLICY "Public manage notifications" ON notifications FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public manage call_logs" ON call_logs;
CREATE POLICY "Public manage call_logs" ON call_logs FOR ALL USING (true) WITH CHECK (true);

-- ─── GRANTS ───────────────────────────────────────────────────

GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON profiles TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON emergency_requests TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON donor_availability TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON notifications TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON call_logs TO anon, authenticated;

-- ─── SEED: DONOR PROFILES ─────────────────────────────────────
-- These are realistic donors the AI prediction engine will rank

INSERT INTO profiles (id, email, role, full_name, phone, blood_type, location, latitude, longitude, is_available, total_donations, accepted_requests, declined_requests, total_requests_received, last_donated_at) VALUES
  ('11111111-0001-0001-0001-000000000001', 'sarah.jenkins@redpulse.health', 'donor', 'Sarah Jenkins',   '+919108920911', 'O-', 'Indiranagar, Bangalore',   12.9720, 77.5950, true, 8,  11, 1,  12, NOW() - INTERVAL '115 days'),
  ('11111111-0001-0001-0001-000000000002', 'michael.chen@redpulse.health',  'donor', 'Michael Chen',    '+919876543210', 'O-', 'Koramangala, Bangalore',   12.9780, 77.6010, true, 10, 13, 2,  15, NOW() - INTERVAL '98 days'),
  ('11111111-0001-0001-0001-000000000003', 'elena.rostova@redpulse.health', 'donor', 'Elena Rostova',   '+918765432109', 'O+', 'MG Road, Bangalore',       12.9650, 77.5890, true, 5,  7,  1,  8,  NOW() - INTERVAL '125 days'),
  ('11111111-0001-0001-0001-000000000004', 'david.miller@redpulse.health',  'donor', 'David Miller',    '+917654321098', 'A-', 'Jayanagar, Bangalore',      12.9850, 77.6120, true, 12, 16, 4,  20, NOW() - INTERVAL '145 days'),
  ('11111111-0001-0001-0001-000000000005', 'priya.sharma@redpulse.health',  'donor', 'Priya Sharma',    '+916543210987', 'O-', 'Whitefield, Bangalore',     12.9910, 77.6250, true, 6,  8,  2,  10, NOW() - INTERVAL '78 days'),
  ('11111111-0001-0001-0001-000000000006', 'robert.taylor@redpulse.health', 'donor', 'Robert Taylor',   '+915432109876', 'B-', 'HSR Layout, Bangalore',     12.9550, 77.5750, true, 7,  10, 4,  14, NOW() - INTERVAL '102 days'),
  ('11111111-0001-0001-0001-000000000007', 'anita.patel@redpulse.health',   'donor', 'Anita Patel',     '+914321098765', 'A+', 'Electronic City, Bangalore',12.9400, 77.5600, true, 3,  5,  1,  6,  NOW() - INTERVAL '68 days'),
  ('11111111-0001-0001-0001-000000000008', 'rahul.verma@redpulse.health',   'donor', 'Rahul Verma',     '+913210987654', 'B+', 'Hebbal, Bangalore',         13.0350, 77.5970, true, 9,  14, 3,  17, NOW() - INTERVAL '90 days'),
  ('11111111-0001-0001-0001-000000000009', 'kavya.nair@redpulse.health',    'donor', 'Kavya Nair',      '+912109876543', 'AB-','Malleshwaram, Bangalore',   13.0050, 77.5680, true, 4,  6,  2,  8,  NOW() - INTERVAL '200 days'),
  ('11111111-0001-0001-0001-000000000010', 'arjun.singh@redpulse.health',   'donor', 'Arjun Singh',     '+911098765432', 'O+', 'Yelahanka, Bangalore',      13.1005, 77.5963, true, 15, 20, 2,  22, NOW() - INTERVAL '60 days')
ON CONFLICT (id) DO NOTHING;

-- ─── SEED: DONOR AVAILABILITY ────────────────────────────────

INSERT INTO donor_availability (donor_id, is_available, last_donation_date, next_eligible_date, can_travel_distance_km, response_time_minutes) VALUES
  ('11111111-0001-0001-0001-000000000001', true, NOW() - INTERVAL '115 days', NOW() - INTERVAL '59 days', 20, 15),
  ('11111111-0001-0001-0001-000000000002', true, NOW() - INTERVAL '98 days',  NOW() - INTERVAL '42 days', 25, 20),
  ('11111111-0001-0001-0001-000000000003', true, NOW() - INTERVAL '125 days', NOW() - INTERVAL '69 days', 30, 25),
  ('11111111-0001-0001-0001-000000000004', true, NOW() - INTERVAL '145 days', NOW() - INTERVAL '89 days', 40, 30),
  ('11111111-0001-0001-0001-000000000005', true, NOW() - INTERVAL '78 days',  NOW() - INTERVAL '22 days', 20, 20),
  ('11111111-0001-0001-0001-000000000006', true, NOW() - INTERVAL '102 days', NOW() - INTERVAL '46 days', 35, 35),
  ('11111111-0001-0001-0001-000000000007', true, NOW() - INTERVAL '68 days',  NOW() - INTERVAL '12 days', 15, 20),
  ('11111111-0001-0001-0001-000000000008', true, NOW() - INTERVAL '90 days',  NOW() - INTERVAL '34 days', 30, 25),
  ('11111111-0001-0001-0001-000000000009', true, NOW() - INTERVAL '200 days', NOW() - INTERVAL '144 days',20, 15),
  ('11111111-0001-0001-0001-000000000010', true, NOW() - INTERVAL '60 days',  NOW() - INTERVAL '4 days',  50, 40)
ON CONFLICT (donor_id) DO NOTHING;

-- ─── SEED: EMERGENCY REQUESTS (for shortage prediction history) ──

INSERT INTO emergency_requests (blood_type, units_needed, hospital_name, hospital_location, urgency, status, created_at) VALUES
  ('O-',  2, 'City General Hospital ICU',       'Indiranagar, Bangalore', 'critical', 'fulfilled', NOW() - INTERVAL '2 days'),
  ('O-',  3, 'St. Jude Trauma Care',            'Koramangala, Bangalore', 'critical', 'open',      NOW() - INTERVAL '1 day'),
  ('A+',  2, 'Apollo Hospital',                 'Jayanagar, Bangalore',   'urgent',   'fulfilled', NOW() - INTERVAL '4 days'),
  ('B+',  1, 'Manipal Hospital',                'MG Road, Bangalore',     'standard', 'fulfilled', NOW() - INTERVAL '6 days'),
  ('O+',  4, 'Fortis Hospital',                 'Whitefield, Bangalore',  'urgent',   'matching',  NOW() - INTERVAL '3 days'),
  ('AB-', 2, 'Narayana Health',                 'Electronic City, Bangalore','critical','open',    NOW() - INTERVAL '12 hours'),
  ('O-',  1, 'Victoria Hospital',               'City Centre, Bangalore', 'critical', 'open',      NOW() - INTERVAL '6 hours'),
  ('A-',  3, 'NIMHANS',                         'Hosur Road, Bangalore',  'urgent',   'fulfilled', NOW() - INTERVAL '8 days'),
  ('B-',  2, 'BGS Gleneagles Hospital',         'Kengeri, Bangalore',     'urgent',   'fulfilled', NOW() - INTERVAL '12 days'),
  ('O+',  2, 'Sparsh Hospital',                 'Hebbal, Bangalore',      'standard', 'fulfilled', NOW() - INTERVAL '15 days'),
  ('O-',  2, 'Sakra World Hospital',            'Marathahalli, Bangalore','critical', 'fulfilled', NOW() - INTERVAL '20 days'),
  ('A+',  1, 'Columbia Asia',                   'Hebbal, Bangalore',      'urgent',   'fulfilled', NOW() - INTERVAL '22 days'),
  ('O+',  3, 'Sri Shankara Cancer Hospital',    'Shankar Mutt, Bangalore','critical', 'fulfilled', NOW() - INTERVAL '25 days'),
  ('B+',  2, 'Aster CMI Hospital',              'Hebbal, Bangalore',      'urgent',   'fulfilled', NOW() - INTERVAL '28 days'),
  ('AB-', 1, 'Rajarajeshwari Medical College',  'Mysore Road, Bangalore', 'critical', 'open',      NOW() - INTERVAL '1 day')
ON CONFLICT DO NOTHING;

-- Done!
SELECT 'Setup complete! Tables created and seeded.' AS status;
SELECT role, COUNT(*) as count FROM profiles GROUP BY role;
SELECT blood_type, COUNT(*) as requests FROM emergency_requests GROUP BY blood_type ORDER BY requests DESC;
