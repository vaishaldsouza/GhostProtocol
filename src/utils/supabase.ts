import { createClient } from '@supabase/supabase-js';

const rawSupabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const rawSupabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const isValidUrl = (url?: string): boolean => {
  if (!url || typeof url !== 'string') return false;
  const trimmed = url.trim();
  if (!trimmed || trimmed.includes('placeholder') || trimmed.includes('YOUR_')) return false;
  try {
    const parsed = new URL(trimmed);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
};

export const isSupabaseConfigured =
  isValidUrl(rawSupabaseUrl) && Boolean(rawSupabaseAnonKey && rawSupabaseAnonKey.trim().length > 0);

if (!isSupabaseConfigured) {
  console.warn('Supabase is not configured. Auth and database features will be unavailable.');
}

const safeUrl = isSupabaseConfigured && rawSupabaseUrl
  ? rawSupabaseUrl.trim()
  : 'https://placeholder.supabase.co';

const safeAnonKey = isSupabaseConfigured && rawSupabaseAnonKey
  ? rawSupabaseAnonKey.trim()
  : 'placeholder-anon-key';

export const supabase = createClient(safeUrl, safeAnonKey);

// Types for our database
export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          full_name: string;
          email: string;
          phone?: string;
          role: 'donor' | 'recipient' | 'hospital' | 'blood_bank' | 'admin' | 'patient';
          created_at: string;
        };
        Insert: {
          id: string;
          full_name: string;
          email: string;
          phone?: string;
          role: 'donor' | 'recipient' | 'hospital' | 'blood_bank' | 'admin' | 'patient';
          created_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string;
          email?: string;
          phone?: string;
          role?: 'donor' | 'recipient' | 'hospital' | 'blood_bank' | 'admin' | 'patient';
          created_at?: string;
        };
      };
      donors: {
        Row: {
          id: string;
          user_id: string;
          blood_group: string;
          age?: number;
          gender?: string;
          city?: string;
          latitude?: number;
          longitude?: number;
          last_donation_date?: string;
          eligible: boolean;
          availability: boolean;
          response_score: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          blood_group: string;
          age?: number;
          gender?: string;
          city?: string;
          latitude?: number;
          longitude?: number;
          last_donation_date?: string;
          eligible?: boolean;
          availability?: boolean;
          response_score?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          blood_group?: string;
          age?: number;
          gender?: string;
          city?: string;
          latitude?: number;
          longitude?: number;
          last_donation_date?: string;
          eligible?: boolean;
          availability?: boolean;
          response_score?: number;
          created_at?: string;
        };
      };
      hospitals: {
        Row: {
          id: string;
          hospital_name: string;
          address: string;
          latitude?: number;
          longitude?: number;
          contact_number?: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          hospital_name: string;
          address: string;
          latitude?: number;
          longitude?: number;
          contact_number?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          hospital_name?: string;
          address?: string;
          latitude?: number;
          longitude?: number;
          contact_number?: string;
          created_at?: string;
        };
      };
      blood_banks: {
        Row: {
          id: string;
          name: string;
          address: string;
          latitude?: number;
          longitude?: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          address: string;
          latitude?: number;
          longitude?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          address?: string;
          latitude?: number;
          longitude?: number;
          created_at?: string;
        };
      };
      blood_requests: {
        Row: {
          id: string;
          requester_id?: string;
          requester_type: string;
          blood_group: string;
          units_needed: number;
          urgency: string;
          patient_condition?: string;
          hospital_id?: string;
          status: string;
          created_at: string;
          fulfilled_at?: string;
        };
        Insert: {
          id?: string;
          requester_id?: string;
          requester_type: string;
          blood_group: string;
          units_needed?: number;
          urgency?: string;
          patient_condition?: string;
          hospital_id?: string;
          status?: string;
          created_at?: string;
          fulfilled_at?: string;
        };
        Update: {
          id?: string;
          requester_id?: string;
          requester_type?: string;
          blood_group?: string;
          units_needed?: number;
          urgency?: string;
          patient_condition?: string;
          hospital_id?: string;
          status?: string;
          created_at?: string;
          fulfilled_at?: string;
        };
      };
      inventory: {
        Row: {
          id: string;
          hospital_id: string;
          blood_group: string;
          units_available: number;
          last_updated: string;
        };
        Insert: {
          id?: string;
          hospital_id: string;
          blood_group: string;
          units_available?: number;
          last_updated?: string;
        };
        Update: {
          id?: string;
          hospital_id?: string;
          blood_group?: string;
          units_available?: number;
          last_updated?: string;
        };
      };
      call_logs: {
        Row: {
          id: string;
          call_sid: string;
          donor_id: string;
          request_id: string;
          phone_number: string;
          blood_group: string;
          hospital_name: string;
          status: string;
          duration_seconds: number;
          dtmf_response: string;
          retry_count: number;
          error_message?: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          call_sid: string;
          donor_id: string;
          request_id: string;
          phone_number: string;
          blood_group: string;
          hospital_name: string;
          status?: string;
          duration_seconds?: number;
          dtmf_response?: string;
          retry_count?: number;
          error_message?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          call_sid?: string;
          donor_id?: string;
          request_id?: string;
          phone_number?: string;
          blood_group?: string;
          hospital_name?: string;
          status?: string;
          duration_seconds?: number;
          dtmf_response?: string;
          retry_count?: number;
          error_message?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      notifications: {
        Row: {
          id: string;
          request_id: string;
          donor_id: string;
          status: string;
          notified_at: string;
          responded_at?: string;
        };
        Insert: {
          id?: string;
          request_id: string;
          donor_id: string;
          status?: string;
          notified_at?: string;
          responded_at?: string;
        };
        Update: {
          id?: string;
          request_id?: string;
          donor_id?: string;
          status?: string;
          notified_at?: string;
          responded_at?: string;
        };
      };
      donation_history: {
        Row: {
          id: string;
          donor_id: string;
          hospital_id?: string;
          donation_date: string;
          blood_group: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          donor_id: string;
          hospital_id?: string;
          donation_date: string;
          blood_group: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          donor_id?: string;
          hospital_id?: string;
          donation_date?: string;
          blood_group?: string;
          created_at?: string;
        };
      };
      // Backward compatibility tables for profiles & emergency requests
      profiles: {
        Row: {
          id: string;
          email: string;
          role: 'admin' | 'hospital' | 'donor' | 'patient' | 'recipient' | 'blood_bank';
          full_name: string;
          phone?: string;
          blood_type?: string;
          location?: string;
          date_of_birth?: string;
          gender?: 'Male' | 'Female' | 'Other' | 'Prefer not to say';
          emergency_contact?: string;
          medical_notes?: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          role: 'admin' | 'hospital' | 'donor' | 'patient' | 'recipient' | 'blood_bank';
          full_name: string;
          phone?: string;
          blood_type?: string;
          location?: string;
          date_of_birth?: string;
          gender?: 'Male' | 'Female' | 'Other' | 'Prefer not to say';
          emergency_contact?: string;
          medical_notes?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          role?: 'admin' | 'hospital' | 'donor' | 'patient' | 'recipient' | 'blood_bank';
          full_name?: string;
          phone?: string;
          blood_type?: string;
          location?: string;
          date_of_birth?: string;
          gender?: 'Male' | 'Female' | 'Other' | 'Prefer not to say';
          emergency_contact?: string;
          medical_notes?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
  };
}
