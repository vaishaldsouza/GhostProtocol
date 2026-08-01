import { supabase, isSupabaseConfigured } from './supabase';
import type { BloodType, DonorCard } from '../types';
import { 
  rankDonors, 
  selectOptimalDonors, 
  generateRankingSummary,
  ExtendedDonorInfo,
  RankedDonor,
  calculateDistance
} from './donorRanking';

export interface EmergencyRequest {
  id?: string;
  bloodType: BloodType;
  unitsNeeded: number;
  hospitalName: string;
  hospitalLocation: string;
  urgency: 'critical' | 'urgent' | 'standard';
  patientName?: string;
  surgeryType?: string;
  requiredBy?: string;
  requestingUserId?: string;
  status?: 'open' | 'matching' | 'fulfilled' | 'cancelled';
  notes?: string;
}

export interface EmergencyRequestWithId extends EmergencyRequest {
  id: string;
  created_at: string;
  updated_at: string;
}

export interface DonorAvailability {
  id?: string;
  donorId: string;
  isAvailable: boolean;
  currentLocation?: string;
  lastKnownLocation?: string;
  canTravelDistanceKm: number;
  responseTimeMinutes: number;
  preferredDonationTime?: string;
  lastDonationDate?: string;
  nextEligibleDate?: string;
  notes?: string;
}

export interface EmergencyResponse {
  id?: string;
  emergencyRequestId: string;
  donorId: string;
  responseStatus: 'pending' | 'accepted' | 'declined' | 'completed';
  responseTimeMinutes?: number;
  estimatedArrivalMinutes?: number;
  actualArrivalMinutes?: number;
  notes?: string;
}

export interface AIAnalysis {
  extractedBloodType: BloodType;
  extractedUnits: number;
  extractedHospital: string;
  extractedUrgency: string;
  extractedSurgeryType?: string;
  extractedTimeframe?: string;
  confidence: number;
  suggestedActions: string[];
}

const LOCAL_EMERGENCY_REQUESTS_KEY = 'redpulse-emergency-requests';

const readLocalEmergencyRequests = (): EmergencyRequestWithId[] => {
  try {
    const stored = localStorage.getItem(LOCAL_EMERGENCY_REQUESTS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

// Create a new emergency request
export const createEmergencyRequest = async (
  request: EmergencyRequest,
  aiAnalysis?: AIAnalysis
): Promise<{ success: boolean; data?: EmergencyRequestWithId; error?: string }> => {
  if (!isSupabaseConfigured) {
    const now = new Date().toISOString();
    const localRequest: EmergencyRequestWithId = {
      ...request,
      id: typeof crypto.randomUUID === 'function'
        ? crypto.randomUUID()
        : `emergency-${Date.now()}`,
      status: request.status || 'open',
      created_at: now,
      updated_at: now,
    };
    const requests = readLocalEmergencyRequests();
    requests.unshift(localRequest);
    localStorage.setItem(LOCAL_EMERGENCY_REQUESTS_KEY, JSON.stringify(requests));
    return { success: true, data: localRequest };
  }

  try {
    const { data, error } = await supabase
      .from('emergency_requests')
      .insert({
        blood_type: request.bloodType,
        units_needed: request.unitsNeeded,
        hospital_name: request.hospitalName,
        hospital_location: request.hospitalLocation,
        urgency: request.urgency,
        patient_name: request.patientName,
        surgery_type: request.surgeryType,
        required_by: request.requiredBy ? new Date(request.requiredBy).toISOString() : null,
        requesting_user_id: request.requestingUserId,
        status: request.status || 'open',
        notes: request.notes,
        ai_analysis: aiAnalysis,
      })
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};

// Find matching donors for an emergency request
export const findMatchingDonors = async (
  bloodType: BloodType,
  hospitalLocation: string,
  unitsNeeded: number,
  urgency: 'critical' | 'urgent' | 'standard' = 'urgent',
  maxDistanceKm: number = 50
): Promise<{ success: boolean; donors?: DonorCard[]; rankedDonors?: RankedDonor[]; summary?: any; error?: string }> => {
  if (!isSupabaseConfigured) {
    return { success: false, error: 'Supabase is not configured; using local donor matches.' };
  }

  try {
    // Query for available donors with matching or compatible blood types
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select(`
        id,
        full_name,
        email,
        phone,
        blood_type,
        location,
        donor_availability (
          is_available,
          current_location,
          can_travel_distance_km,
          response_time_minutes,
          preferred_donation_time,
          last_donation_date,
          next_eligible_date
        )
      `)
      .eq('role', 'donor');

    if (profilesError) {
      return { success: false, error: profilesError.message };
    }

    if (!profiles || profiles.length === 0) {
      return { success: true, donors: [], rankedDonors: [], summary: null };
    }

    // Convert to extended donor info format
    const currentTime = new Date().getHours().toString();
    const extendedDonors: ExtendedDonorInfo[] = profiles
      .map((profile: any): ExtendedDonorInfo | null => {
        const availability = profile.donor_availability?.[0];
        if (!availability) return null;

        const distance = calculateDistance(
          hospitalLocation,
          availability.current_location || profile.location || 'Unknown'
        );

        const lastDonatedDaysAgo = availability.last_donation_date ? 
          Math.floor((new Date().getTime() - new Date(availability.last_donation_date).getTime()) / (1000 * 60 * 60 * 24)) : 120;

        return {
          id: profile.id,
          name: profile.full_name,
          bloodGroup: profile.blood_type as BloodType,
          phone: profile.phone || 'N/A',
          location: availability.current_location || profile.location || 'Unknown',
          distanceKm: distance,
          lastDonatedDaysAgo: lastDonatedDaysAgo,
          responseRatePct: 95, // Default - would come from actual response history
          responseTimeMinutes: availability.response_time_minutes || 30,
          isAvailable: availability.is_available,
          canTravelDistanceKm: availability.can_travel_distance_km || 50,
          preferredDonationTime: availability.preferred_donation_time,
          successfulDonations: 5, // Default - would come from actual history
          failedDonations: 0, // Default - would come from actual history
          averageResponseTime: availability.response_time_minutes || 30,
          lastResponseTime: availability.response_time_minutes || 30,
          emergencyResponseCount: 2, // Default - would come from actual history
        };
      })
      .filter((donor): donor is ExtendedDonorInfo => donor !== null);

    // Apply smart ranking algorithm
    const rankedDonors = rankDonors(
      extendedDonors,
      bloodType,
      urgency,
      hospitalLocation,
      currentTime
    );

    // Generate ranking summary
    const summary = generateRankingSummary(rankedDonors, unitsNeeded);

    // Convert back to DonorCard format for backward compatibility
    const donors: DonorCard[] = rankedDonors.map(donor => ({
      id: donor.id,
      name: donor.name,
      bloodGroup: donor.bloodGroup,
      distanceKm: donor.distanceKm,
      lastDonatedDaysAgo: donor.lastDonatedDaysAgo,
      responseRatePct: donor.responseRatePct,
      matchScorePct: donor.matchScorePct,
      status: donor.status,
      phone: donor.phone,
      location: donor.location,
    }));

    return { 
      success: true, 
      donors, 
      rankedDonors,
      summary
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};

// Update donor availability
export const updateDonorAvailability = async (
  donorId: string,
  availability: Partial<DonorAvailability>
): Promise<{ success: boolean; error?: string }> => {
  try {
    const { error } = await supabase
      .from('donor_availability')
      .upsert({
        donor_id: donorId,
        is_available: availability.isAvailable,
        current_location: availability.currentLocation,
        last_known_location: availability.lastKnownLocation,
        can_travel_distance_km: availability.canTravelDistanceKm,
        response_time_minutes: availability.responseTimeMinutes,
        preferred_donation_time: availability.preferredDonationTime,
        last_donation_date: availability.lastDonationDate,
        next_eligible_date: availability.nextEligibleDate,
        notes: availability.notes,
      });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};

// Get donor availability
export const getDonorAvailability = async (
  donorId: string
): Promise<{ success: boolean; data?: DonorAvailability; error?: string }> => {
  try {
    const { data, error } = await supabase
      .from('donor_availability')
      .select('*')
      .eq('donor_id', donorId)
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    if (!data) {
      return { success: false, error: 'Availability not found' };
    }

    return {
      success: true,
      data: {
        id: data.id,
        donorId: data.donor_id,
        isAvailable: data.is_available,
        currentLocation: data.current_location,
        lastKnownLocation: data.last_known_location,
        canTravelDistanceKm: data.can_travel_distance_km,
        responseTimeMinutes: data.response_time_minutes,
        preferredDonationTime: data.preferred_donation_time,
        lastDonationDate: data.last_donation_date,
        nextEligibleDate: data.next_eligible_date,
        notes: data.notes,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};

// Create emergency response
export const createEmergencyResponse = async (
  response: EmergencyResponse
): Promise<{ success: boolean; error?: string }> => {
  try {
    const { error } = await supabase
      .from('emergency_responses')
      .insert({
        emergency_request_id: response.emergencyRequestId,
        donor_id: response.donorId,
        response_status: response.responseStatus || 'pending',
        response_time_minutes: response.responseTimeMinutes,
        estimated_arrival_minutes: response.estimatedArrivalMinutes,
        actual_arrival_minutes: response.actualArrivalMinutes,
        notes: response.notes,
      });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};

// Update emergency response
export const updateEmergencyResponse = async (
  responseId: string,
  updates: Partial<EmergencyResponse>
): Promise<{ success: boolean; error?: string }> => {
  try {
    const { error } = await supabase
      .from('emergency_responses')
      .update({
        response_status: updates.responseStatus,
        response_time_minutes: updates.responseTimeMinutes,
        estimated_arrival_minutes: updates.estimatedArrivalMinutes,
        actual_arrival_minutes: updates.actualArrivalMinutes,
        notes: updates.notes,
      })
      .eq('id', responseId);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};

// Get emergency request by ID
export const getEmergencyRequest = async (
  requestId: string
): Promise<{ success: boolean; data?: EmergencyRequestWithId; error?: string }> => {
  try {
    const { data, error } = await supabase
      .from('emergency_requests')
      .select('*')
      .eq('id', requestId)
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    if (!data) {
      return { success: false, error: 'Request not found' };
    }

    return {
      success: true,
      data: {
        id: data.id,
        bloodType: data.blood_type as BloodType,
        unitsNeeded: data.units_needed,
        hospitalName: data.hospital_name,
        hospitalLocation: data.hospital_location,
        urgency: data.urgency,
        patientName: data.patient_name,
        surgeryType: data.surgery_type,
        requiredBy: data.required_by,
        requestingUserId: data.requesting_user_id,
        status: data.status,
        notes: data.notes,
        created_at: data.created_at,
        updated_at: data.updated_at,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};

// Get recent emergency requests
export const getRecentEmergencyRequests = async (
  limit: number = 10
): Promise<{ success: boolean; data?: EmergencyRequestWithId[]; error?: string }> => {
  try {
    const { data, error } = await supabase
      .from('emergency_requests')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      return { success: false, error: error.message };
    }

    const requests = data?.map((req: any) => ({
      id: req.id,
      bloodType: req.blood_type as BloodType,
      unitsNeeded: req.units_needed,
      hospitalName: req.hospital_name,
      hospitalLocation: req.hospital_location,
      urgency: req.urgency,
      patientName: req.patient_name,
      surgeryType: req.surgery_type,
      requiredBy: req.required_by,
      requestingUserId: req.requesting_user_id,
      status: req.status,
      notes: req.notes,
      created_at: req.created_at,
      updated_at: req.updated_at,
    })) || [];

    return { success: true, data: requests };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};

// Initialize donor availability for new donor accounts
export const initializeDonorAvailability = async (
  donorId: string,
  location?: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    const { error } = await supabase
      .from('donor_availability')
      .insert({
        donor_id: donorId,
        is_available: true,
        current_location: location,
        last_known_location: location,
        can_travel_distance_km: 50,
        response_time_minutes: 30,
        preferred_donation_time: 'any',
      });

    if (error) {
      // If already exists, that's okay
      if (error.code === '23505') { // Unique violation
        return { success: true };
      }
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};
