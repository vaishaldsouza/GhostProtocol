-- Create call_logs table for storing Twilio Voice call details
CREATE TABLE IF NOT EXISTS public.call_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    call_sid VARCHAR(255) NOT NULL UNIQUE,
    donor_id UUID NOT NULL,
    request_id UUID NOT NULL,
    phone_number VARCHAR(50) NOT NULL,
    blood_group VARCHAR(10) NOT NULL,
    hospital_name VARCHAR(255) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'initiated', -- 'queued', 'initiated', 'ringing', 'in-progress', 'completed', 'failed', 'busy', 'no-answer'
    duration_seconds INTEGER DEFAULT 0,
    dtmf_response VARCHAR(10) DEFAULT 'none', -- '1' (Accepted), '2' (Declined), 'none', 'timeout'
    retry_count INTEGER DEFAULT 0,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- Index for fast queries
CREATE INDEX IF NOT EXISTS idx_call_logs_request_id ON public.call_logs(request_id);
CREATE INDEX IF NOT EXISTS idx_call_logs_donor_id ON public.call_logs(donor_id);
CREATE INDEX IF NOT EXISTS idx_call_logs_status ON public.call_logs(status);
CREATE INDEX IF NOT EXISTS idx_call_logs_created_at ON public.call_logs(created_at DESC);

-- Enable RLS
ALTER TABLE public.call_logs ENABLE ROW LEVEL SECURITY;

-- Allow read for authenticated users
CREATE POLICY "Allow read for authenticated users on call_logs"
    ON public.call_logs FOR SELECT
    TO authenticated, anon
    USING (true);

-- Allow insert/update for authenticated users and service role
CREATE POLICY "Allow write for authenticated users on call_logs"
    ON public.call_logs FOR ALL
    TO authenticated, anon
    USING (true)
    WITH CHECK (true);
