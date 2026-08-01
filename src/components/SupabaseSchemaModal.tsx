import React, { useState } from 'react';
import { Database, Copy, Check, X, ShieldCheck, Terminal, Download } from 'lucide-react';

interface SupabaseSchemaModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SUPABASE_SQL_SCHEMA = `-- RedPulse AI Supabase Database Schema (PostgreSQL)
-- Run this script in your Supabase SQL Editor (https://supabase.com/dashboard/project/_/sql)

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. users table
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  role TEXT NOT NULL CHECK (role IN ('donor', 'recipient', 'hospital', 'blood_bank', 'admin', 'patient')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. donors table
CREATE TABLE IF NOT EXISTS public.donors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  blood_group TEXT NOT NULL,
  age INTEGER,
  gender TEXT,
  city TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  last_donation_date DATE,
  eligible BOOLEAN DEFAULT TRUE,
  availability BOOLEAN DEFAULT TRUE,
  response_score NUMERIC DEFAULT 100.0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. hospitals table
CREATE TABLE IF NOT EXISTS public.hospitals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  hospital_name TEXT NOT NULL,
  address TEXT NOT NULL,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  contact_number TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. blood_banks table
CREATE TABLE IF NOT EXISTS public.blood_banks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. blood_requests table
CREATE TABLE IF NOT EXISTS public.blood_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  requester_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  requester_type TEXT NOT NULL,
  blood_group TEXT NOT NULL,
  units_needed INTEGER NOT NULL DEFAULT 1,
  urgency TEXT DEFAULT 'standard',
  patient_condition TEXT,
  hospital_id UUID REFERENCES public.hospitals(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'open',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  fulfilled_at TIMESTAMPTZ
);

-- 6. inventory table
CREATE TABLE IF NOT EXISTS public.inventory (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  hospital_id UUID REFERENCES public.hospitals(id) ON DELETE CASCADE,
  blood_group TEXT NOT NULL,
  units_available INTEGER DEFAULT 0,
  last_updated TIMESTAMPTZ DEFAULT NOW()
);

-- 7. notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  request_id UUID REFERENCES public.blood_requests(id) ON DELETE CASCADE,
  donor_id UUID REFERENCES public.donors(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'notified',
  notified_at TIMESTAMPTZ DEFAULT NOW(),
  responded_at TIMESTAMPTZ
);

-- 8. donation_history table
CREATE TABLE IF NOT EXISTS public.donation_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  donor_id UUID REFERENCES public.donors(id) ON DELETE CASCADE,
  hospital_id UUID REFERENCES public.hospitals(id) ON DELETE SET NULL,
  donation_date DATE NOT NULL,
  blood_group TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS Security Policies
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.donors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hospitals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blood_banks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blood_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.donation_history ENABLE ROW LEVEL SECURITY;

-- Read/Write Policies
CREATE POLICY "Public users read" ON public.users FOR SELECT USING (true);
CREATE POLICY "User write own profile" ON public.users FOR ALL USING (auth.uid() = id);

CREATE POLICY "Public donors read" ON public.donors FOR SELECT USING (true);
CREATE POLICY "Donor write own record" ON public.donors FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Public hospitals read" ON public.hospitals FOR SELECT USING (true);
CREATE POLICY "Hospitals write" ON public.hospitals FOR ALL USING (true);

CREATE POLICY "Public blood_banks read" ON public.blood_banks FOR SELECT USING (true);
CREATE POLICY "Blood banks write" ON public.blood_banks FOR ALL USING (true);

CREATE POLICY "Public blood_requests read" ON public.blood_requests FOR SELECT USING (true);
CREATE POLICY "Blood requests write" ON public.blood_requests FOR ALL USING (true);

CREATE POLICY "Public inventory read" ON public.inventory FOR SELECT USING (true);
CREATE POLICY "Inventory write" ON public.inventory FOR ALL USING (true);

CREATE POLICY "Notifications read write" ON public.notifications FOR ALL USING (true);
CREATE POLICY "Donation history read write" ON public.donation_history FOR ALL USING (true);

-- Auto Sync Trigger for auth.users -> public.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, role, phone)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'User'),
    COALESCE(NEW.raw_user_meta_data->>'role', 'donor'),
    NEW.raw_user_meta_data->>'phone'
  )
  ON CONFLICT (id) DO UPDATE
  SET
    full_name = EXCLUDED.full_name,
    role = EXCLUDED.role,
    phone = EXCLUDED.phone;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
`;

export const SupabaseSchemaModal: React.FC<SupabaseSchemaModalProps> = ({ isOpen, onClose }) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(SUPABASE_SQL_SCHEMA);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([SUPABASE_SQL_SCHEMA], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'supabase_schema.sql';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-800 rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-100 dark:border-slate-700 relative max-h-[90vh] flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Supabase PostgreSQL Schema</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                8 Tables: users, donors, hospitals, blood_banks, blood_requests, inventory, notifications, donation_history
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Info Box */}
        <div className="p-3 bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200/60 dark:border-emerald-800 rounded-2xl text-xs text-emerald-900 dark:text-emerald-200 flex items-start gap-2.5 mb-4">
          <Terminal className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
          <span>
            Copy and run this SQL script in your <strong>Supabase SQL Editor</strong> to automatically create all 8 PostgreSQL tables, foreign key constraints, RLS policies, and user synchronization triggers.
          </span>
        </div>

        {/* SQL Code Block */}
        <div className="flex-1 overflow-auto rounded-2xl bg-slate-950 p-4 font-mono text-xs text-slate-200 border border-slate-800 relative group">
          <pre>{SUPABASE_SQL_SCHEMA}</pre>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between gap-3 pt-4 mt-4 border-t border-slate-100 dark:border-slate-700">
          <button
            onClick={handleDownload}
            className="px-4 py-2.5 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 text-slate-700 dark:text-slate-200 rounded-2xl text-xs font-bold transition flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            <span>Download .sql File</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 transition"
            >
              Close
            </button>
            <button
              onClick={handleCopy}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-xs font-bold transition flex items-center gap-2 shadow-md shadow-emerald-500/20"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>Copied SQL!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>Copy SQL Script</span>
                </>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
