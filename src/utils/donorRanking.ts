import { BloodType, DonorCard } from '../types';

// Blood compatibility rules
export const BLOOD_COMPATIBILITY: Record<BloodType, BloodType[]> = {
  'O+': ['O+', 'O-'],
  'O-': ['O-'],
  'A+': ['A+', 'A-', 'O+', 'O-'],
  'A-': ['A-', 'O-'],
  'B+': ['B+', 'B-', 'O+', 'O-'],
  'B-': ['B-', 'O-'],
  'AB+': ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'], // Universal recipient
  'AB-': ['A-', 'B-', 'AB-', 'O-'],
};

// Blood type priority for matching (exact match = highest priority)
export const BLOOD_TYPE_PRIORITY: Record<BloodType, number> = {
  'O-': 100, // Universal donor - highest priority
  'O+': 90,
  'A-': 85,
  'A+': 80,
  'B-': 75,
  'B+': 70,
  'AB-': 65,
  'AB+': 60,
};

// Urgency-based weight configurations
export const URGENCY_WEIGHTS = {
  critical: {
    distance: 0.45,      // Distance is most critical
    responseTime: 0.30,  // Response time very important
    bloodMatch: 0.15,   // Blood compatibility still important
    reliability: 0.10,   // Reliability less critical in emergencies
  },
  urgent: {
    distance: 0.35,
    responseTime: 0.25,
    bloodMatch: 0.25,
    reliability: 0.15,
  },
  standard: {
    distance: 0.25,
    responseTime: 0.20,
    bloodMatch: 0.35,   // Blood match more important for planned procedures
    reliability: 0.20,   // Reliability more important for planned procedures
  },
};

// Donor ranking factors
export interface DonorRankingFactors {
  distanceScore: number;      // 0-100 based on proximity
  responseTimeScore: number;  // 0-100 based on response time
  bloodMatchScore: number;    // 0-100 based on blood compatibility
  reliabilityScore: number;   // 0-100 based on historical reliability
  eligibilityScore: number;   // 0-100 based on donation eligibility
  availabilityScore: number;  // 0-100 based on current availability
  finalScore: number;         // Weighted final score
}

// Extended donor information for ranking
export interface ExtendedDonorInfo {
  id: string;
  name: string;
  bloodGroup: BloodType;
  phone: string;
  location: string;
  distanceKm: number;
  lastDonatedDaysAgo: number;
  responseRatePct: number;
  responseTimeMinutes: number;
  isAvailable: boolean;
  canTravelDistanceKm: number;
  preferredDonationTime?: string;
  successfulDonations: number;
  failedDonations: number;
  averageResponseTime: number;
  lastResponseTime: number;
  emergencyResponseCount: number;
}

// Smart donor ranking result
export interface RankedDonor extends DonorCard {
  rankingFactors: DonorRankingFactors;
  compatibilityReason: string;
  backupStatus: 'primary' | 'backup' | 'emergency';
  estimatedArrivalTime: string;
  contactPriority: number;
}

// Calculate blood compatibility score
export const calculateBloodMatchScore = (
  donorBlood: BloodType,
  requiredBlood: BloodType
): { score: number; isCompatible: boolean; reason: string } => {
  if (donorBlood === requiredBlood) {
    return {
      score: 100,
      isCompatible: true,
      reason: 'Exact blood type match',
    };
  }

  const compatibleTypes = BLOOD_COMPATIBILITY[requiredBlood];
  if (compatibleTypes.includes(donorBlood)) {
    const priorityScore = BLOOD_TYPE_PRIORITY[donorBlood];
    return {
      score: priorityScore,
      isCompatible: true,
      reason: `Compatible (${donorBlood} can donate to ${requiredBlood})`,
    };
  }

  return {
    score: 0,
    isCompatible: false,
    reason: 'Incompatible blood type',
  };
};

// Calculate distance score (exponential decay with distance)
export const calculateDistanceScore = (
  distanceKm: number,
  maxDistance: number = 50
): number => {
  if (distanceKm > maxDistance) return 0;
  
  // Exponential decay: closer donors get much higher scores
  const score = 100 * Math.exp(-distanceKm / 15);
  return Math.max(0, Math.min(100, score));
};

// Calculate response time score
export const calculateResponseTimeScore = (responseTimeMinutes: number): number => {
  // Lower response time = higher score
  // Using exponential decay
  const score = 100 * Math.exp(-responseTimeMinutes / 20);
  return Math.max(0, Math.min(100, score));
};

// Calculate reliability score based on donation history
export const calculateReliabilityScore = (
  successfulDonations: number,
  failedDonations: number,
  averageResponseTime: number,
  emergencyResponseCount: number
): number => {
  const totalDonations = successfulDonations + failedDonations;
  if (totalDonations === 0) return 50; // Neutral score for new donors

  // Success rate component (40% weight)
  const successRate = successfulDonations / totalDonations;
  const successScore = successRate * 100;

  // Response time component (30% weight)
  const responseScore = calculateResponseTimeScore(averageResponseTime);

  // Emergency response component (30% weight)
  // Bonus points for emergency experience
  const emergencyBonus = Math.min(30, emergencyResponseCount * 5);
  const emergencyScore = 30 + emergencyBonus;

  // Weighted average
  const reliabilityScore = (successScore * 0.4) + (responseScore * 0.3) + (emergencyScore * 0.3);
  return Math.max(0, Math.min(100, reliabilityScore));
};

// Calculate eligibility score based on last donation
export const calculateEligibilityScore = (lastDonatedDaysAgo: number): number => {
  // Minimum 56 days between donations (WHO guidelines)
  const MIN_DAYS = 56;
  const OPTIMAL_DAYS = 90; // Optimal time between donations
  
  if (lastDonatedDaysAgo < MIN_DAYS) {
    return 0; // Not eligible
  }

  if (lastDonatedDaysAgo >= MIN_DAYS && lastDonatedDaysAgo <= OPTIMAL_DAYS) {
    // Optimal window - higher score
    return 100;
  }

  // Beyond optimal - score decreases slightly but still good
  const excessDays = lastDonatedDaysAgo - OPTIMAL_DAYS;
  const score = 100 - (excessDays * 0.5); // Decrease by 0.5 points per excess day
  return Math.max(50, Math.min(100, score));
};

// Calculate availability score
export const calculateAvailabilityScore = (
  isAvailable: boolean,
  preferredDonationTime?: string,
  currentTime?: string
): number => {
  if (!isAvailable) return 0;

  if (!preferredDonationTime || preferredDonationTime === 'any') {
    return 100;
  }

  // Simple time matching (can be enhanced with actual time logic)
  if (currentTime) {
    const currentHour = parseInt(currentTime.split(':')[0]);
    let matches = false;

    switch (preferredDonationTime) {
      case 'morning':
        matches = currentHour >= 6 && currentHour < 12;
        break;
      case 'afternoon':
        matches = currentHour >= 12 && currentHour < 18;
        break;
      case 'evening':
        matches = currentHour >= 18 && currentHour < 22;
        break;
    }

    return matches ? 100 : 70; // Still willing but not preferred time
  }

  return 100;
};

// Main smart donor ranking algorithm
export const rankDonors = (
  donors: ExtendedDonorInfo[],
  requiredBlood: BloodType,
  urgency: 'critical' | 'urgent' | 'standard' = 'urgent',
  hospitalLocation: string = '',
  currentTime?: string
): RankedDonor[] => {
  const weights = URGENCY_WEIGHTS[urgency];

  const rankedDonors = donors
    .map((donor) => {
      // Blood compatibility
      const bloodMatch = calculateBloodMatchScore(donor.bloodGroup, requiredBlood);
      if (!bloodMatch.isCompatible) {
        return null; // Skip incompatible donors
      }

      // Distance score
      const distanceScore = calculateDistanceScore(donor.distanceKm, donor.canTravelDistanceKm);

      // Response time score
      const responseTimeScore = calculateResponseTimeScore(donor.responseTimeMinutes);

      // Reliability score
      const reliabilityScore = calculateReliabilityScore(
        donor.successfulDonations,
        donor.failedDonations,
        donor.averageResponseTime,
        donor.emergencyResponseCount
      );

      // Eligibility score
      const eligibilityScore = calculateEligibilityScore(donor.lastDonatedDaysAgo);

      // Availability score
      const availabilityScore = calculateAvailabilityScore(
        donor.isAvailable,
        donor.preferredDonationTime,
        currentTime
      );

      // Calculate weighted final score
      const finalScore =
        (distanceScore * weights.distance) +
        (responseTimeScore * weights.responseTime) +
        (bloodMatch.score * weights.bloodMatch) +
        (reliabilityScore * weights.reliability);

      // Determine backup status
      let backupStatus: 'primary' | 'backup' | 'emergency';
      if (finalScore >= 80) {
        backupStatus = 'primary';
      } else if (finalScore >= 60) {
        backupStatus = 'backup';
      } else {
        backupStatus = 'emergency';
      }

      // Calculate estimated arrival time
      const travelTime = Math.ceil(donor.distanceKm / 30 * 60); // Assume 30km/h average speed
      const estimatedArrivalTime = `${travelTime} mins`;

      // Determine contact priority (higher = contact first)
      const contactPriority = Math.round(finalScore);

      const rankingFactors: DonorRankingFactors = {
        distanceScore: Math.round(distanceScore),
        responseTimeScore: Math.round(responseTimeScore),
        bloodMatchScore: Math.round(bloodMatch.score),
        reliabilityScore: Math.round(reliabilityScore),
        eligibilityScore: Math.round(eligibilityScore),
        availabilityScore: Math.round(availabilityScore),
        finalScore: Math.round(finalScore),
      };

      return {
        id: donor.id,
        name: donor.name,
        bloodGroup: donor.bloodGroup,
        distanceKm: Math.round(donor.distanceKm * 10) / 10,
        lastDonatedDaysAgo: donor.lastDonatedDaysAgo,
        responseRatePct: donor.responseRatePct,
        matchScorePct: Math.round(finalScore),
        status: donor.isAvailable ? 'available' : 'busy',
        phone: donor.phone,
        location: donor.location,
        rankingFactors,
        compatibilityReason: bloodMatch.reason,
        backupStatus,
        estimatedArrivalTime,
        contactPriority,
      };
    })
    .filter((donor): donor is RankedDonor => donor !== null)
    .sort((a, b) => b.contactPriority - a.contactPriority);

  return rankedDonors;
};

// Select optimal donors with backup strategy
export const selectOptimalDonors = (
  rankedDonors: RankedDonor[],
  unitsNeeded: number,
  maxPrimaryDonors: number = 3,
  maxBackupDonors: number = 5
): { primary: RankedDonor[]; backup: RankedDonor[]; emergency: RankedDonor[] } => {
  const primary = rankedDonors
    .filter(d => d.backupStatus === 'primary')
    .slice(0, maxPrimaryDonors);

  const backup = rankedDonors
    .filter(d => d.backupStatus === 'backup')
    .slice(0, maxBackupDonors);

  const emergency = rankedDonors
    .filter(d => d.backupStatus === 'emergency')
    .slice(0, 3); // Keep 3 emergency backups

  return { primary, backup, emergency };
};

// Generate ranking summary for UI
export const generateRankingSummary = (rankedDonors: RankedDonor[], unitsNeeded: number = 1): {
  totalDonors: number;
  primaryDonors: number;
  backupDonors: number;
  emergencyDonors: number;
  averageScore: number;
  topDonor: RankedDonor | null;
  recommendations: string[];
} => {
  const totalDonors = rankedDonors.length;
  const primaryDonors = rankedDonors.filter(d => d.backupStatus === 'primary').length;
  const backupDonors = rankedDonors.filter(d => d.backupStatus === 'backup').length;
  const emergencyDonors = rankedDonors.filter(d => d.backupStatus === 'emergency').length;

  const averageScore = totalDonors > 0
    ? Math.round(rankedDonors.reduce((sum, d) => sum + d.rankingFactors.finalScore, 0) / totalDonors)
    : 0;

  const topDonor = rankedDonors.length > 0 ? rankedDonors[0] : null;

  const recommendations: string[] = [];

  if (primaryDonors >= unitsNeeded) {
    recommendations.push(`✅ Sufficient primary donors available (${primaryDonors} for ${unitsNeeded} units)`);
  } else if (primaryDonors + backupDonors >= unitsNeeded) {
    recommendations.push(`⚠️ Need to contact backup donors (${primaryDonors} primary + ${backupDonors} backup for ${unitsNeeded} units)`);
  } else {
    recommendations.push(`🚨 Critical shortage: Only ${primaryDonors + backupDonors} qualified donors for ${unitsNeeded} units`);
  }

  if (averageScore >= 80) {
    recommendations.push('🎯 High-quality donor pool with excellent match scores');
  } else if (averageScore >= 60) {
    recommendations.push('👍 Good donor pool with acceptable match scores');
  } else {
    recommendations.push('⚡ Low-quality donor pool - consider expanding search area');
  }

  if (topDonor && topDonor.rankingFactors.finalScore >= 90) {
    recommendations.push(`🌟 Excellent top match: ${topDonor.name} (${topDonor.rankingFactors.finalScore}% score)`);
  }

  return {
    totalDonors,
    primaryDonors,
    backupDonors,
    emergencyDonors,
    averageScore,
    topDonor,
    recommendations,
  };
};

// Calculate distance between two locations (simplified - in production use Google Maps API)
export const calculateDistance = (
  location1: string,
  location2: string
): number => {
  // This is a placeholder implementation
  // In production, use Google Maps Distance Matrix API or similar
  const hash1 = location1.split('').reduce((a, b) => ((a << 5) - a) + b.charCodeAt(0), 0);
  const hash2 = location2.split('').reduce((a, b) => ((a << 5) - a) + b.charCodeAt(0), 0);
  const difference = Math.abs(hash1 - hash2) % 50;
  return difference;
};

// Expand search radius if insufficient donors found
export const expandSearchRadius = (
  originalRadius: number,
  currentDonors: number,
  requiredDonors: number
): number => {
  if (currentDonors >= requiredDonors) return originalRadius;

  // Double the radius until we find enough donors or reach max radius
  const newRadius = Math.min(originalRadius * 2, 200); // Max 200km
  return newRadius;
};
