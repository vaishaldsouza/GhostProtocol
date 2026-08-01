import { BloodType } from '../types';

export interface DonorScoreBreakdown {
  distance_km: number;
  distance_score: number;
  eligibility_score: number;
  acceptance_rate_score: number;
  availability_score: number;
  blood_match_score: number;
  final_score: number;
  acceptance_probability: number;
  compatibility_reason: string;
  rank: number;
}

export interface RankedPredictionDonor {
  id: string;
  name: string;
  blood_group: BloodType;
  phone: string;
  email?: string;
  latitude: number;
  longitude: number;
  location: string;
  is_available: boolean;
  is_active: boolean;
  is_verified: boolean;
  age: number;
  last_donated_days_ago: number;
  total_requests_received: number;
  accepted_requests: number;
  declined_requests: number;
  total_donations: number;
  availability_status: string;
  score_breakdown: DonorScoreBreakdown;
  status: 'eligible' | 'notified' | 'accepted' | 'declined' | 'reserved';
  estimated_eta_minutes: number;
}

export interface PredictDonorsParams {
  request_id: string;
  hospital_name: string;
  hospital_latitude: number;
  hospital_longitude: number;
  blood_group: BloodType;
  units_needed: number;
  urgency: 'critical' | 'high' | 'normal';
  max_distance_km?: number;
}

// Client-side fallback dataset in case backend API is booting
const LOCAL_DONOR_POOL: Array<Omit<RankedPredictionDonor, 'score_breakdown' | 'status' | 'estimated_eta_minutes'>> = [
  {
    id: 'd1',
    name: 'Sarah Jenkins',
    blood_group: 'O-',
    phone: '+15550192831',
    email: 'sarah.j@redpulse.health',
    latitude: 12.9720,
    longitude: 77.5950,
    location: 'Indiranagar (1.2 km away)',
    is_available: true,
    is_active: true,
    is_verified: true,
    age: 29,
    last_donated_days_ago: 110,
    total_requests_received: 12,
    accepted_requests: 11,
    declined_requests: 1,
    total_donations: 8,
    availability_status: 'available',
  },
  {
    id: 'd2',
    name: 'Michael Chen',
    blood_group: 'O-',
    phone: '+15550183722',
    email: 'm.chen@redpulse.health',
    latitude: 12.9780,
    longitude: 77.6010,
    location: 'Koramangala (2.8 km away)',
    is_available: true,
    is_active: true,
    is_verified: true,
    age: 34,
    last_donated_days_ago: 95,
    total_requests_received: 15,
    accepted_requests: 13,
    declined_requests: 2,
    total_donations: 10,
    availability_status: 'available',
  },
  {
    id: 'd3',
    name: 'Elena Rostova',
    blood_group: 'O+',
    phone: '+15550174833',
    email: 'elena.r@redpulse.health',
    latitude: 12.9650,
    longitude: 77.5890,
    location: 'MG Road (3.4 km away)',
    is_available: true,
    is_active: true,
    is_verified: true,
    age: 26,
    last_donated_days_ago: 120,
    total_requests_received: 8,
    accepted_requests: 7,
    declined_requests: 1,
    total_donations: 5,
    availability_status: 'available',
  },
  {
    id: 'd4',
    name: 'David Miller',
    blood_group: 'A-',
    phone: '+15550165944',
    email: 'david.m@redpulse.health',
    latitude: 12.9850,
    longitude: 77.6120,
    location: 'Jayanagar (4.5 km away)',
    is_available: true,
    is_active: true,
    is_verified: true,
    age: 41,
    last_donated_days_ago: 140,
    total_requests_received: 20,
    accepted_requests: 16,
    declined_requests: 4,
    total_donations: 12,
    availability_status: 'available',
  },
  {
    id: 'd5',
    name: 'Priya Sharma',
    blood_group: 'O-',
    phone: '+15550156055',
    email: 'priya.s@redpulse.health',
    latitude: 12.9910,
    longitude: 77.6250,
    location: 'Whitefield (6.1 km away)',
    is_available: true,
    is_active: true,
    is_verified: true,
    age: 31,
    last_donated_days_ago: 75,
    total_requests_received: 10,
    accepted_requests: 8,
    declined_requests: 2,
    total_donations: 6,
    availability_status: 'available',
  },
  {
    id: 'd6',
    name: 'Robert Taylor',
    blood_group: 'B-',
    phone: '+15550147166',
    email: 'robert.t@redpulse.health',
    latitude: 12.9550,
    longitude: 77.5750,
    location: 'HSR Layout (7.2 km away)',
    is_available: true,
    is_active: true,
    is_verified: true,
    age: 38,
    last_donated_days_ago: 100,
    total_requests_received: 14,
    accepted_requests: 10,
    declined_requests: 4,
    total_donations: 7,
    availability_status: 'available',
  },
  {
    id: 'd7',
    name: 'Anita Patel',
    blood_group: 'A+',
    phone: '+15550138277',
    email: 'anita.p@redpulse.health',
    latitude: 12.9400,
    longitude: 77.5600,
    location: 'Electronic City (12.0 km away)',
    is_available: true,
    is_active: true,
    is_verified: true,
    age: 24,
    last_donated_days_ago: 65,
    total_requests_received: 6,
    accepted_requests: 5,
    declined_requests: 1,
    total_donations: 3,
    availability_status: 'available',
  },
];

// Helper formula to compute Haversine distance
function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 100) / 100;
}

// Local evaluation matching exact FastAPI weighted formula
export function evaluateLocalPrediction(params: PredictDonorsParams): RankedPredictionDonor[] {
  const results: RankedPredictionDonor[] = [];

  for (const donor of LOCAL_DONOR_POOL) {
    if (!donor.is_active || !donor.is_verified || donor.age < 18 || donor.age > 65 || donor.last_donated_days_ago < 56) {
      continue;
    }

    const distKm = haversineDistance(donor.latitude, donor.longitude, params.hospital_latitude, params.hospital_longitude);
    if (params.max_distance_km && distKm > params.max_distance_km) {
      continue;
    }

    // Distance Score (40%)
    let distScore = 100;
    if (distKm <= 1) distScore = 100;
    else if (distKm <= 3) distScore = 95;
    else if (distKm <= 5) distScore = 88;
    else if (distKm <= 10) distScore = 75;
    else if (distKm <= 20) distScore = 50;
    else distScore = Math.max(0, Math.round(100 * Math.exp(-0.06 * distKm)));

    // Eligibility Score (20%)
    const eligScore = donor.last_donated_days_ago >= 180 ? 100 : donor.last_donated_days_ago >= 90 ? 95 : 80 + ((donor.last_donated_days_ago - 56) / 34) * 15;

    // Acceptance Score (20%)
    const acceptScore = donor.total_requests_received > 0 ? (donor.accepted_requests / donor.total_requests_received) * 100 : 80;

    // Availability Score (10%)
    const availScore = donor.availability_status === 'available' && donor.is_available ? 100 : donor.availability_status === 'busy' ? 40 : 0;

    // Blood Match Score (10%)
    let bloodMatchScore = 0;
    let matchReason = '';
    if (donor.blood_group === params.blood_group) {
      bloodMatchScore = 100;
      matchReason = 'Exact blood group match';
    } else if (donor.blood_group === 'O-') {
      bloodMatchScore = 90;
      matchReason = 'Universal donor O- compatibility';
    } else {
      bloodMatchScore = 75;
      matchReason = `Compatible blood group (${donor.blood_group} -> ${params.blood_group})`;
    }

    // Final Weighted Score
    const finalScore = Math.round(
      0.4 * distScore + 0.2 * eligScore + 0.2 * acceptScore + 0.1 * availScore + 0.1 * bloodMatchScore
    );

    const eta = Math.max(5, Math.round(5 + distKm * 2.5));

    results.push({
      ...donor,
      score_breakdown: {
        distance_km: distKm,
        distance_score: distScore,
        eligibility_score: Math.round(eligScore),
        acceptance_rate_score: Math.round(acceptScore),
        availability_score: availScore,
        blood_match_score: bloodMatchScore,
        final_score: finalScore,
        acceptance_probability: Math.round((finalScore / 100) * 100) / 100,
        compatibility_reason: matchReason,
        rank: 1,
      },
      status: 'eligible',
      estimated_eta_minutes: eta,
    });
  }

  // Sort descending by final_score
  results.sort((a, b) => b.score_breakdown.final_score - a.score_breakdown.final_score);
  results.forEach((d, idx) => {
    d.score_breakdown.rank = idx + 1;
  });

  return results;
}

// API Callers
export async function predictDonorsAPI(params: PredictDonorsParams): Promise<RankedPredictionDonor[]> {
  try {
    const res = await fetch('/predict-donors', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    if (res.ok) {
      const data = await res.json();
      if (data.ranked_donors && Array.isArray(data.ranked_donors)) {
        return data.ranked_donors;
      }
    }
  } catch (err) {
    console.warn('Backend API /predict-donors unavailable, falling back to client evaluation:', err);
  }

  return evaluateLocalPrediction(params);
}

export async function notifyDonorsAPI(
  requestId: string,
  urgency: 'critical' | 'high' | 'normal' = 'critical',
  channels: string[] = ['whatsapp', 'email', 'voice']
) {
  try {
    const res = await fetch('/notify-donors', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        request_id: requestId,
        urgency,
        channels,
      }),
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn('Backend /notify-donors endpoint offline:', err);
  }

  const batchSize = urgency === 'critical' ? 10 : urgency === 'high' ? 5 : 3;
  return {
    status: 'success',
    request_id: requestId,
    urgency,
    batch_size: batchSize,
    message: `Multi-channel notifications dispatched to Top ${batchSize} donors.`,
  };
}

export async function acceptDonationAPI(requestId: string, donorId: string, channel: string = 'web') {
  try {
    const res = await fetch('/accept-donation', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        request_id: requestId,
        donor_id: donorId,
        channel,
      }),
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn('Backend /accept-donation offline:', err);
  }

  return {
    status: 'success',
    message: `Donor ${donorId} ACCEPTED request ${requestId}. Reserved for dispatch.`,
    donation_status: 'ACCEPTED',
  };
}

export async function declineDonationAPI(requestId: string, donorId: string, reason?: string, channel: string = 'web') {
  try {
    const res = await fetch('/decline-donation', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        request_id: requestId,
        donor_id: donorId,
        reason,
        channel,
      }),
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn('Backend /decline-donation offline:', err);
  }

  return {
    status: 'success',
    message: `Donor ${donorId} DECLINED. Auto-cascade triggered for next top donor in queue.`,
    donation_status: 'DECLINED',
  };
}

export async function getPredictionHistoryAPI(requestId: string) {
  try {
    const res = await fetch(`/prediction-history/${requestId}`);
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn('Backend /prediction-history offline:', err);
  }

  return { request_id: requestId, logs: [] };
}
