export type UserRole = 'donor' | 'recipient' | 'hospital' | 'blood_bank' | 'admin' | 'patient';

export type BloodType = 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-';

export interface User {
  id: string;
  fullName: string;
  name?: string; // Alias for fullName for backward compatibility
  email: string;
  phone?: string;
  role: UserRole;
  bloodType?: BloodType;
  bloodGroup?: BloodType; // Alias for bloodType for backward compatibility
  hospitalName?: string;
  location?: string;
  dob?: string;
  gender?: 'Male' | 'Female' | 'Other' | 'Prefer not to say';
  weightKg?: number;
  emergencyContact?: string;
  medicalNotes?: string;
  avatarUrl?: string;
  preferredLanguage?: string; // BCP-47 code e.g. 'en-IN', 'hi-IN'
}

// ── Donation Eligibility AI ───────────────────────────────────────────────────

export type EligibilityStatus = 'eligible' | 'deferred' | 'ineligible' | 'needs_review';

export type DeferralDuration =
  | 'permanent'
  | '12_months'
  | '6_months'
  | '3_months'
  | '4_weeks'
  | '2_weeks'
  | '1_week'
  | 'until_resolved';

export interface EligibilityCheck {
  id: string;
  category: 'timing' | 'health' | 'medication' | 'lifestyle' | 'travel' | 'demographic';
  label: string;
  status: 'pass' | 'fail' | 'warn' | 'unknown';
  detail: string;
  deferralDuration?: DeferralDuration;
}

export interface EligibilityResult {
  status: EligibilityStatus;
  overallScore: number;           // 0-100
  checks: EligibilityCheck[];
  nextEligibleDate?: string;      // ISO date string
  daysUntilEligible?: number;
  summary: string;
  recommendations: string[];
  canDonateWhole: boolean;
  canDonatePlatelets: boolean;
  canDonatePlasma: boolean;
  screenedAt: string;             // ISO timestamp
}

export interface DonorCard {
  id: string;
  name: string;
  bloodGroup: BloodType;
  distanceKm: number;
  lastDonatedDaysAgo: number;
  responseRatePct: number;
  matchScorePct: number;
  status: 'available' | 'busy' | 'recently_donated';
  phone: string;
  location: string;
}

export interface HospitalInventory {
  bloodGroup: BloodType;
  unitsAvailable: number;
  unitsRequired: number;
  shortageRisk: 'low' | 'medium' | 'high' | 'critical';
  predictedDaysSupply: number;
}

export interface EmergencyRequest {
  id: string;
  patientName: string;
  hospitalName: string;
  bloodGroup: BloodType;
  unitsNeeded: number;
  urgency: 'critical' | 'urgent' | 'standard';
  location: string;
  timeAgo: string;
  status: 'open' | 'matching' | 'fulfilled';
  matchedDonorsCount: number;
  contactNumber: string;
  notes?: string;
}

export interface FeatureItem {
  id: string;
  title: string;
  description: string;
  iconName: string;
  badgeText?: string;
}

export type ShortageRiskLevel = 'critical' | 'high' | 'medium' | 'low';

export interface ShortageAlert {
  id: string;
  bloodType: BloodType;
  severity: ShortageRiskLevel;
  message: string;
  actionRequired: string;
  estimatedDaysToShortage: number;
  donorsToContact: number;
  createdAt: string;
}

// ── Emergency Priority Engine ────────────────────────────────────────────────

export type PriorityTier = 'P1' | 'P2' | 'P3' | 'P4';

export interface EmergencyPriorityFactors {
  urgencyScore: number;         // 0-100  base urgency level
  timeDeadlineScore: number;    // 0-100  time-to-required_by pressure
  bloodRarityScore: number;     // 0-100  how rare / hard to source the blood type
  volumeScore: number;          // 0-100  units needed (more = higher priority)
  surgeryTypeScore: number;     // 0-100  clinical severity of procedure
  waitTimeScore: number;        // 0-100  how long request has been open
  donorGapScore: number;        // 0-100  gap between matched donors and need
  finalScore: number;           // 0-100  weighted composite
}

export interface RankedEmergencyRequest {
  // core DB fields
  id: string;
  bloodType: BloodType;
  unitsNeeded: number;
  hospitalName: string;
  hospitalLocation: string;
  urgency: 'critical' | 'urgent' | 'standard';
  patientName?: string;
  surgeryType?: string;
  requiredBy?: string;
  status: 'open' | 'matching' | 'fulfilled' | 'cancelled';
  matchedDonorIds: string[];
  notes?: string;
  createdAt: string;
  updatedAt: string;
  // priority engine outputs
  priorityScore: number;
  priorityTier: PriorityTier;
  priorityFactors: EmergencyPriorityFactors;
  priorityLabel: string;        // human-readable e.g. "Immediate Dispatch"
  escalationReason: string;     // why this request is ranked high
  minutesToDeadline?: number;   // derived from requiredBy
  isEscalated: boolean;         // auto-escalated since last refresh
}

export interface BloodShortageInventory {
  bloodType: BloodType;
  currentStock: number;
  activeDonors: number;
  demand7d: number;
  demand14d: number;
  demand30d: number;
  avgDailyDemand: number;
  projectedDeficitDays: number;
  riskLevel: ShortageRiskLevel;
  trendDirection: 'rising' | 'stable' | 'falling';
  criticalRequestsCount: number;
  eligibleDonorsNearby: number;
  recommendedUnitsToCollect: number;
  confidence: number;
}

export interface BloodDrive {
  id: string;
  name: string;
  organizer: string;
  locationName: string;
  address: string;
  lat: number;
  lng: number;
  distanceKm: number;
  startDate: string;
  timeRange: string;
  status: 'active' | 'upcoming' | 'completed';
  targetBloodGroups: BloodType[];
  targetUnits: number;
  registeredDonors: number;
  availableSlots: number;
  contactPhone: string;
  demandIntensity: number; // 0.1 to 1.0 for heatmap intensity
  description: string;
  amenities: string[];
}

export interface DonationRecord {
  id: string;
  certificateId: string;
  donorName: string;
  hospitalName: string;
  location: string;
  date: string;
  time: string;
  bloodType: BloodType;
  unitsDonated: number;
  donationType: 'Whole Blood' | 'Platelets' | 'Plasma' | 'Double Red Cells' | 'Whole Blood Transfusion' | 'Platelets Transfusion' | 'Plasma Transfusion';
  status: 'completed' | 'verified' | 'processing';
  hemoglobinLevelGdl: number;
  bloodPressure: string;
  pulseBpm: number;
  attendingMedicalOfficer: string;
  livesImpactedEstimate: number;
  notes?: string;
}

