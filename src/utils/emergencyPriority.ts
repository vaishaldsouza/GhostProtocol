import { supabase } from './supabase';
import {
  BloodType,
  RankedEmergencyRequest,
  EmergencyPriorityFactors,
  PriorityTier,
} from '../types';

// ── Scoring weights (must sum to 1.0) ────────────────────────────────────────
const WEIGHTS = {
  urgency:      0.30,  // base urgency level declared on the request
  timeDeadline: 0.25,  // time pressure from required_by deadline
  bloodRarity:  0.15,  // how hard the blood type is to source
  volume:       0.10,  // units needed
  surgeryType:  0.10,  // clinical severity of the procedure
  waitTime:     0.05,  // how long this request has been sitting open
  donorGap:     0.05,  // shortfall between matched donors and need
} as const;

// ── Blood rarity table (scarcer = higher score) ───────────────────────────────
const BLOOD_RARITY: Record<BloodType, number> = {
  'O-':  100,
  'AB-':  90,
  'B-':   80,
  'A-':   75,
  'O+':   50,
  'B+':   45,
  'A+':   40,
  'AB+':  30,
};

// ── Surgery severity table ────────────────────────────────────────────────────
// Keys are lowercase substrings matched against surgery_type
const SURGERY_SEVERITY: Array<[RegExp, number]> = [
  [/transplant|liver|heart|cardiac|aorta/i,         100],
  [/trauma|polytrauma|ruptured|hemorrhage|bleed/i,   95],
  [/bypass|open.?heart|thoracic/i,                    90],
  [/c.?section|obstetric|ectopic|placenta/i,          85],
  [/spinal|neuro|brain|cranio/i,                      80],
  [/hip|femur|pelvis|orthopedic/i,                    65],
  [/laparoscop|appendix|appendec/i,                   55],
  [/elective|routine|cosmetic/i,                      20],
];
const DEFAULT_SURGERY_SCORE = 50; // unknown / not specified

// ── Individual factor scorers ─────────────────────────────────────────────────

export function scoreUrgency(urgency: 'critical' | 'urgent' | 'standard'): number {
  return { critical: 100, urgent: 65, standard: 30 }[urgency];
}

/**
 * Time-deadline pressure: exponential ramp as required_by approaches.
 * Returns 100 when < 30 min away, decays toward 0 beyond 48 h.
 */
export function scoreTimeDeadline(requiredBy?: string | null): number {
  if (!requiredBy) return 40; // unknown deadline → moderate pressure
  const minutesLeft = (new Date(requiredBy).getTime() - Date.now()) / 60_000;
  if (minutesLeft <= 0)   return 100; // already overdue
  if (minutesLeft <= 30)  return 100;
  if (minutesLeft <= 60)  return 90;
  if (minutesLeft <= 120) return 80;
  if (minutesLeft <= 240) return 65;
  if (minutesLeft <= 480) return 50;
  if (minutesLeft <= 1440) return 35; // within 24 h
  return 15;
}

export function scoreBloodRarity(bloodType: BloodType): number {
  return BLOOD_RARITY[bloodType] ?? 50;
}

/**
 * More units needed → higher volume pressure, capped at 10 units.
 */
export function scoreVolume(unitsNeeded: number): number {
  return Math.min(100, Math.round((unitsNeeded / 10) * 100));
}

export function scoreSurgeryType(surgeryType?: string | null): number {
  if (!surgeryType) return DEFAULT_SURGERY_SCORE;
  for (const [pattern, score] of SURGERY_SEVERITY) {
    if (pattern.test(surgeryType)) return score;
  }
  return DEFAULT_SURGERY_SCORE;
}

/**
 * The longer a request sits open, the higher the wait-time pressure.
 * Caps at 6 hours.
 */
export function scoreWaitTime(createdAt: string): number {
  const minutesOpen = (Date.now() - new Date(createdAt).getTime()) / 60_000;
  if (minutesOpen >= 360) return 100;
  if (minutesOpen >= 120) return 80;
  if (minutesOpen >= 60)  return 60;
  if (minutesOpen >= 30)  return 40;
  return 20;
}

/**
 * Donor gap: ratio of unmet need. Full gap = 100, fully matched = 0.
 */
export function scoreDonorGap(
  unitsNeeded: number,
  matchedDonorCount: number,
): number {
  if (unitsNeeded <= 0) return 0;
  const gap = Math.max(0, unitsNeeded - matchedDonorCount);
  return Math.min(100, Math.round((gap / unitsNeeded) * 100));
}

// ── Composite scorer ──────────────────────────────────────────────────────────

export function computePriorityScore(
  request: Omit<RankedEmergencyRequest,
    'priorityScore' | 'priorityTier' | 'priorityFactors' |
    'priorityLabel' | 'escalationReason' | 'minutesToDeadline' | 'isEscalated'>
): EmergencyPriorityFactors {
  const urgencyScore      = scoreUrgency(request.urgency);
  const timeDeadlineScore = scoreTimeDeadline(request.requiredBy);
  const bloodRarityScore  = scoreBloodRarity(request.bloodType);
  const volumeScore       = scoreVolume(request.unitsNeeded);
  const surgeryTypeScore  = scoreSurgeryType(request.surgeryType);
  const waitTimeScore     = scoreWaitTime(request.createdAt);
  const donorGapScore     = scoreDonorGap(
    request.unitsNeeded,
    request.matchedDonorIds.length,
  );

  const finalScore = Math.round(
    urgencyScore      * WEIGHTS.urgency +
    timeDeadlineScore * WEIGHTS.timeDeadline +
    bloodRarityScore  * WEIGHTS.bloodRarity +
    volumeScore       * WEIGHTS.volume +
    surgeryTypeScore  * WEIGHTS.surgeryType +
    waitTimeScore     * WEIGHTS.waitTime +
    donorGapScore     * WEIGHTS.donorGap,
  );

  return {
    urgencyScore,
    timeDeadlineScore,
    bloodRarityScore,
    volumeScore,
    surgeryTypeScore,
    waitTimeScore,
    donorGapScore,
    finalScore,
  };
}

// ── Tier classification ───────────────────────────────────────────────────────

export function classifyTier(score: number): PriorityTier {
  if (score >= 80) return 'P1';
  if (score >= 60) return 'P2';
  if (score >= 40) return 'P3';
  return 'P4';
}

const TIER_LABELS: Record<PriorityTier, string> = {
  P1: 'Immediate Dispatch',
  P2: 'Urgent — Act within 1 h',
  P3: 'Moderate — Act within 4 h',
  P4: 'Standard — Scheduled',
};

// ── Escalation reason builder ─────────────────────────────────────────────────

export function buildEscalationReason(
  factors: EmergencyPriorityFactors,
  request: { bloodType: BloodType; surgeryType?: string | null; urgency: string; requiredBy?: string | null },
): string {
  const reasons: string[] = [];

  if (factors.urgencyScore >= 100)
    reasons.push('declared critical');
  if (factors.timeDeadlineScore >= 90)
    reasons.push('deadline ≤ 1 h');
  if (factors.bloodRarityScore >= 90)
    reasons.push(`${request.bloodType} is scarce`);
  if (factors.volumeScore >= 70)
    reasons.push('high volume needed');
  if (factors.surgeryTypeScore >= 85 && request.surgeryType)
    reasons.push(`high-severity procedure (${request.surgeryType})`);
  if (factors.waitTimeScore >= 80)
    reasons.push('waiting > 2 h');
  if (factors.donorGapScore >= 80)
    reasons.push('donor shortfall');

  return reasons.length > 0
    ? reasons.join(' · ')
    : 'routine priority';
}

// ── Full ranked request builder ───────────────────────────────────────────────

function buildRankedRequest(row: any): RankedEmergencyRequest {
  const base = {
    id:               row.id,
    bloodType:        row.blood_type as BloodType,
    unitsNeeded:      row.units_needed,
    hospitalName:     row.hospital_name,
    hospitalLocation: row.hospital_location,
    urgency:          row.urgency as 'critical' | 'urgent' | 'standard',
    patientName:      row.patient_name ?? undefined,
    surgeryType:      row.surgery_type ?? undefined,
    requiredBy:       row.required_by ?? undefined,
    status:           row.status as 'open' | 'matching' | 'fulfilled' | 'cancelled',
    matchedDonorIds:  row.matched_donor_ids ?? [],
    notes:            row.notes ?? undefined,
    createdAt:        row.created_at,
    updatedAt:        row.updated_at,
  };

  const factors     = computePriorityScore(base);
  const tier        = classifyTier(factors.finalScore);
  const label       = TIER_LABELS[tier];
  const reason      = buildEscalationReason(factors, base);

  const minutesToDeadline = base.requiredBy
    ? Math.round((new Date(base.requiredBy).getTime() - Date.now()) / 60_000)
    : undefined;

  // A request is "escalated" when wait > 30 min and still not matched
  const isEscalated =
    factors.waitTimeScore >= 40 &&
    base.status !== 'fulfilled' &&
    base.status !== 'cancelled';

  return {
    ...base,
    priorityScore:   factors.finalScore,
    priorityTier:    tier,
    priorityFactors: factors,
    priorityLabel:   label,
    escalationReason: reason,
    minutesToDeadline,
    isEscalated,
  };
}

// ── Public API ────────────────────────────────────────────────────────────────

export type PriorityQueueResult = {
  requests: RankedEmergencyRequest[];
  p1Count: number;
  p2Count: number;
  totalOpen: number;
  dataSource: 'live' | 'fallback';
};

/** Fetches all open/matching requests and returns them ranked by priority score. */
export async function fetchPriorityQueue(): Promise<PriorityQueueResult> {
  try {
    const { data, error } = await supabase
      .from('emergency_requests')
      .select('*')
      .in('status', ['open', 'matching'])
      .order('created_at', { ascending: true });

    if (error) throw error;

    const rows: any[] = data ?? [];
    const requests = rows
      .map(buildRankedRequest)
      .sort((a, b) => b.priorityScore - a.priorityScore);

    return {
      requests,
      p1Count:   requests.filter((r) => r.priorityTier === 'P1').length,
      p2Count:   requests.filter((r) => r.priorityTier === 'P2').length,
      totalOpen: requests.length,
      dataSource: 'live',
    };
  } catch (err) {
    console.error('[EmergencyPriority] Supabase error, using fallback:', err);
    return buildFallbackQueue();
  }
}

// ── Fallback demo data ────────────────────────────────────────────────────────

function buildFallbackQueue(): PriorityQueueResult {
  const now = new Date().toISOString();
  const ago = (m: number) =>
    new Date(Date.now() - m * 60_000).toISOString();
  const inMin = (m: number) =>
    new Date(Date.now() + m * 60_000).toISOString();

  const rawRows = [
    {
      id: 'req-001',
      blood_type: 'O-',
      units_needed: 4,
      hospital_name: 'St. Mary Trauma Center',
      hospital_location: 'Zone A, Central Metro',
      urgency: 'critical',
      patient_name: 'John D.',
      surgery_type: 'Trauma / Polytrauma',
      required_by: inMin(25),
      status: 'open',
      matched_donor_ids: [],
      notes: 'MVA victim, active haemorrhage',
      created_at: ago(45),
      updated_at: ago(5),
    },
    {
      id: 'req-002',
      blood_type: 'AB-',
      units_needed: 2,
      hospital_name: 'City General Hospital',
      hospital_location: 'Zone B, Midtown',
      urgency: 'critical',
      patient_name: 'Priya S.',
      surgery_type: 'Cardiac Bypass',
      required_by: inMin(55),
      status: 'matching',
      matched_donor_ids: ['d1'],
      notes: 'Emergency CABG',
      created_at: ago(30),
      updated_at: ago(10),
    },
    {
      id: 'req-003',
      blood_type: 'B-',
      units_needed: 3,
      hospital_name: 'Apollo Surgical Institute',
      hospital_location: 'Zone C, North District',
      urgency: 'urgent',
      patient_name: 'Ali K.',
      surgery_type: 'Liver Transplant',
      required_by: inMin(180),
      status: 'open',
      matched_donor_ids: ['d2'],
      notes: 'Donor liver confirmed',
      created_at: ago(90),
      updated_at: ago(15),
    },
    {
      id: 'req-004',
      blood_type: 'A+',
      units_needed: 2,
      hospital_name: 'Metro Children\'s Hospital',
      hospital_location: 'Zone D, East Side',
      urgency: 'urgent',
      patient_name: 'Infant M.',
      surgery_type: 'Spinal Surgery',
      required_by: inMin(300),
      status: 'open',
      matched_donor_ids: [],
      notes: 'Paediatric case',
      created_at: ago(20),
      updated_at: ago(20),
    },
    {
      id: 'req-005',
      blood_type: 'O+',
      units_needed: 1,
      hospital_name: 'Lakeside Clinic',
      hospital_location: 'Zone E, South',
      urgency: 'standard',
      patient_name: 'Rina P.',
      surgery_type: 'Hip Replacement',
      required_by: inMin(720),
      status: 'open',
      matched_donor_ids: ['d3'],
      notes: 'Elective procedure',
      created_at: ago(10),
      updated_at: ago(10),
    },
  ];

  const requests = rawRows
    .map(buildRankedRequest)
    .sort((a, b) => b.priorityScore - a.priorityScore);

  return {
    requests,
    p1Count:   requests.filter((r) => r.priorityTier === 'P1').length,
    p2Count:   requests.filter((r) => r.priorityTier === 'P2').length,
    totalOpen: requests.length,
    dataSource: 'fallback',
  };
}
