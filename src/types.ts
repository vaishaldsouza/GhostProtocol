export type UserRole = 'donor' | 'hospital' | 'admin' | 'patient';

export type BloodType = 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-';

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: UserRole;
  bloodGroup?: BloodType;
  hospitalName?: string;
  location?: string;
  avatarUrl?: string;
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
