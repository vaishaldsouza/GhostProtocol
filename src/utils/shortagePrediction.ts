import { supabase } from './supabase';
import type { BloodType, ShortageAlert, ShortageRiskLevel } from '../types';

export type RiskLevel = ShortageRiskLevel;

export interface BloodTypePrediction {
  bloodType: BloodType;
  currentStock: number;           // simulated from donor pool size
  activeDonors: number;           // available donors of this type
  demand7d: number;               // units requested in last 7 days
  demand14d: number;              // units requested in last 14 days
  demand30d: number;              // units requested in last 30 days
  avgDailyDemand: number;         // rolling 30-day average demand per day
  projectedDeficitDays: number;   // days until stock runs out at current demand
  riskLevel: RiskLevel;
  trendDirection: 'rising' | 'stable' | 'falling'; // demand trend
  criticalRequestsCount: number;  // # of critical/urgent open requests
  eligibleDonorsNearby: number;   // donors who can donate now
  recommendedUnitsToCollect: number; // how many units to proactively collect
  confidence: number;             // 0–1 forecast confidence
}

export type { ShortageAlert };

export interface PredictionSummary {
  predictions: BloodTypePrediction[];
  alerts: ShortageAlert[];
  criticalTypes: BloodType[];
  highRiskTypes: BloodType[];
  overallRisk: RiskLevel;
  totalActiveDonors: number;
  totalPendingDemand: number;
  lastUpdated: string;
  dataSource: 'live' | 'fallback';
}

const ALL_BLOOD_TYPES: BloodType[] = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

// Relative rarity multiplier (rare types need higher stock buffers)
const RARITY_FACTOR: Record<BloodType, number> = {
  'O-': 2.5,
  'AB-': 2.2,
  'B-': 2.0,
  'A-': 1.8,
  'O+': 1.0,
  'A+': 1.0,
  'B+': 1.0,
  'AB+': 1.0,
};

function classifyRisk(
  projectedDays: number,
  criticalRequests: number,
  trendDirection: 'rising' | 'stable' | 'falling',
): RiskLevel {
  if (projectedDays <= 3 || criticalRequests >= 3) return 'critical';
  if (projectedDays <= 6 || criticalRequests >= 2) return 'high';
  if (projectedDays <= 10 || (trendDirection === 'rising' && projectedDays <= 14)) return 'medium';
  return 'low';
}

function computeTrend(demand7d: number, demand30d: number): 'rising' | 'stable' | 'falling' {
  const recentRate = demand7d / 7;
  const historicRate = demand30d / 30;
  if (recentRate > historicRate * 1.25) return 'rising';
  if (recentRate < historicRate * 0.75) return 'falling';
  return 'stable';
}

function generateAlert(pred: BloodTypePrediction): ShortageAlert | null {
  if (pred.riskLevel === 'low') return null;

  const severityMessages: Record<RiskLevel, { message: string; action: string }> = {
    critical: {
      message: `CRITICAL: ${pred.bloodType} supply will be exhausted in ~${pred.projectedDeficitDays} day(s). ${pred.criticalRequestsCount} critical requests pending.`,
      action: `Immediately contact all ${pred.eligibleDonorsNearby} eligible ${pred.bloodType} donors. Trigger emergency SMS campaign.`,
    },
    high: {
      message: `HIGH RISK: ${pred.bloodType} has only ~${pred.projectedDeficitDays} days of supply left with rising demand.`,
      action: `Schedule targeted donor outreach for ${pred.recommendedUnitsToCollect} units. Notify nearby hospitals.`,
    },
    medium: {
      message: `MODERATE: ${pred.bloodType} demand is trending upward. Consider proactive collection in the next 5 days.`,
      action: `Send reminder notifications to ${Math.min(pred.eligibleDonorsNearby, 40)} inactive eligible donors.`,
    },
    low: {
      message: '',
      action: '',
    },
  };

  const info = severityMessages[pred.riskLevel];

  return {
    id: `alert-${pred.bloodType.replace('+', 'pos').replace('-', 'neg')}-${Date.now()}`,
    bloodType: pred.bloodType,
    severity: pred.riskLevel,
    message: info.message,
    actionRequired: info.action,
    estimatedDaysToShortage: pred.projectedDeficitDays,
    donorsToContact: pred.eligibleDonorsNearby,
    createdAt: new Date().toISOString(),
  };
}

// ---------------------------------------------------------------------------
// Main forecast function — pulls from Supabase and computes predictions
// ---------------------------------------------------------------------------
export async function computeShortPredictions(): Promise<PredictionSummary> {
  const now = new Date();
  const day7ago = new Date(now.getTime() - 7 * 86400000).toISOString();
  const day14ago = new Date(now.getTime() - 14 * 86400000).toISOString();
  const day30ago = new Date(now.getTime() - 30 * 86400000).toISOString();

  try {
    // Fetch all data in parallel
    const [donorsRes, availabilityRes, requests7dRes, requests14dRes, requests30dRes, openRequestsRes] =
      await Promise.all([
        // All donor profiles with blood type
        supabase
          .from('profiles')
          .select('blood_type')
          .eq('role', 'donor')
          .not('blood_type', 'is', null),

        // Available donors (eligible to donate right now)
        supabase
          .from('donor_availability')
          .select('donor_id, is_available, next_eligible_date')
          .eq('is_available', true),

        // Emergency requests in last 7 days
        supabase
          .from('emergency_requests')
          .select('blood_type, units_needed, urgency, status')
          .gte('created_at', day7ago)
          .neq('status', 'cancelled'),

        // Emergency requests in last 14 days
        supabase
          .from('emergency_requests')
          .select('blood_type, units_needed, urgency, status')
          .gte('created_at', day14ago)
          .neq('status', 'cancelled'),

        // Emergency requests in last 30 days
        supabase
          .from('emergency_requests')
          .select('blood_type, units_needed, urgency, status')
          .gte('created_at', day30ago)
          .neq('status', 'cancelled'),

        // Currently open / matching requests
        supabase
          .from('emergency_requests')
          .select('blood_type, units_needed, urgency')
          .in('status', ['open', 'matching']),
      ]);

    const donors = donorsRes.data ?? [];
    const available = availabilityRes.data ?? [];
    const req7d = requests7dRes.data ?? [];
    const req14d = requests14dRes.data ?? [];
    const req30d = requests30dRes.data ?? [];
    const openReqs = openRequestsRes.data ?? [];

    // Available donor IDs set (for quick lookup)
    const availableNow = new Set(
      available
        .filter((a) => {
          if (!a.next_eligible_date) return true;
          return new Date(a.next_eligible_date) <= now;
        })
        .map((a) => a.donor_id),
    );

    // Build per-blood-type aggregations
    const donorCountByType: Record<string, number> = {};
    const availableCountByType: Record<string, number> = {};

    for (const d of donors) {
      const bt = d.blood_type as string;
      donorCountByType[bt] = (donorCountByType[bt] ?? 0) + 1;
    }

    // Cross-reference available set — we don't have blood_type in donor_availability directly,
    // so we join through profiles. Use donor pool size as proxy for eligible donors.
    // We'll use the ratio of available/total donors applied per blood type.
    const totalDonors = donors.length;
    const totalAvailable = availableNow.size;
    const availabilityRatio = totalDonors > 0 ? totalAvailable / totalDonors : 0.6;

    for (const bt of ALL_BLOOD_TYPES) {
      const pool = donorCountByType[bt] ?? 0;
      availableCountByType[bt] = Math.round(pool * availabilityRatio);
    }

    // Aggregate demand per blood type
    function sumDemand(rows: any[], bt: BloodType) {
      return rows
        .filter((r) => r.blood_type === bt)
        .reduce((sum: number, r: any) => sum + (r.units_needed ?? 0), 0);
    }

    function countCritical(rows: any[], bt: BloodType) {
      return rows.filter(
        (r) => r.blood_type === bt && (r.urgency === 'critical' || r.urgency === 'urgent'),
      ).length;
    }

    const predictions: BloodTypePrediction[] = [];

    for (const bt of ALL_BLOOD_TYPES) {
      const totalDonorPool = donorCountByType[bt] ?? 0;
      const activeDonors = availableCountByType[bt] ?? 0;

      const d7 = sumDemand(req7d, bt);
      const d14 = sumDemand(req14d, bt);
      const d30 = sumDemand(req30d, bt);
      const critCount = countCritical(openReqs, bt);
      const openUnits = openReqs.filter((r) => r.blood_type === bt).reduce((s: number, r: any) => s + (r.units_needed ?? 0), 0);

      // Simulate current stock from donor pool (each eligible donor can provide ~1 unit)
      // Scaled by rarity factor to represent realistic inventory pressure
      const rarity = RARITY_FACTOR[bt];
      const currentStock = Math.max(1, Math.round(activeDonors * 0.8));

      // Average daily demand over 30 days (floor to avoid division by zero)
      const avgDailyDemand = d30 > 0 ? parseFloat((d30 / 30).toFixed(2)) : parseFloat((rarity * 0.3).toFixed(2));

      // Projected days until stock depleted
      const projectedDeficitDays = avgDailyDemand > 0
        ? Math.min(30, Math.round(currentStock / avgDailyDemand))
        : 30;

      const trend = computeTrend(d7, d30);
      const riskLevel = classifyRisk(projectedDeficitDays, critCount, trend);

      // How many units we need to collect to cover 14-day buffer
      const target14d = Math.ceil(avgDailyDemand * 14 * rarity);
      const recommendedUnitsToCollect = Math.max(0, target14d - currentStock + openUnits);

      const confidence = totalDonorPool > 0 && d30 > 0 ? 0.82 : totalDonorPool > 0 ? 0.65 : 0.45;

      predictions.push({
        bloodType: bt,
        currentStock,
        activeDonors,
        demand7d: d7,
        demand14d: d14,
        demand30d: d30,
        avgDailyDemand,
        projectedDeficitDays,
        riskLevel,
        trendDirection: trend,
        criticalRequestsCount: critCount,
        eligibleDonorsNearby: activeDonors,
        recommendedUnitsToCollect,
        confidence,
      });
    }

    // Sort: critical → high → medium → low, then by projectedDeficitDays asc
    const riskOrder: Record<RiskLevel, number> = { critical: 0, high: 1, medium: 2, low: 3 };
    predictions.sort((a, b) => {
      const ro = riskOrder[a.riskLevel] - riskOrder[b.riskLevel];
      if (ro !== 0) return ro;
      return a.projectedDeficitDays - b.projectedDeficitDays;
    });

    const alerts: ShortageAlert[] = predictions
      .map(generateAlert)
      .filter((a): a is ShortageAlert => a !== null);

    const criticalTypes = predictions.filter((p) => p.riskLevel === 'critical').map((p) => p.bloodType);
    const highRiskTypes = predictions.filter((p) => p.riskLevel === 'high').map((p) => p.bloodType);

    let overallRisk: RiskLevel = 'low';
    if (criticalTypes.length > 0) overallRisk = 'critical';
    else if (highRiskTypes.length > 0) overallRisk = 'high';
    else if (predictions.some((p) => p.riskLevel === 'medium')) overallRisk = 'medium';

    return {
      predictions,
      alerts,
      criticalTypes,
      highRiskTypes,
      overallRisk,
      totalActiveDonors: totalAvailable,
      totalPendingDemand: openReqs.reduce((s: number, r: any) => s + (r.units_needed ?? 0), 0),
      lastUpdated: now.toISOString(),
      dataSource: 'live',
    };
  } catch (err) {
    console.error('[ShortagePrediction] Supabase error, using fallback data:', err);
    return buildFallbackSummary();
  }
}

// ---------------------------------------------------------------------------
// Fallback — realistic-looking mock data when Supabase is unavailable
// ---------------------------------------------------------------------------
function buildFallbackSummary(): PredictionSummary {
  const fallbackRaw: Array<{
    bt: BloodType;
    stock: number;
    donors: number;
    d7: number;
    d14: number;
    d30: number;
    critCount: number;
  }> = [
    { bt: 'O-',  stock: 3,  donors: 4,  d7: 9,  d14: 16, d30: 22, critCount: 2 },
    { bt: 'AB-', stock: 5,  donors: 6,  d7: 7,  d14: 12, d30: 16, critCount: 1 },
    { bt: 'A-',  stock: 10, donors: 12, d7: 8,  d14: 14, d30: 19, critCount: 1 },
    { bt: 'B-',  stock: 11, donors: 14, d7: 7,  d14: 13, d30: 18, critCount: 0 },
    { bt: 'O+',  stock: 38, donors: 46, d7: 18, d14: 34, d30: 48, critCount: 0 },
    { bt: 'A+',  stock: 52, donors: 60, d7: 16, d14: 30, d30: 44, critCount: 0 },
    { bt: 'B+',  stock: 55, donors: 66, d7: 15, d14: 28, d30: 40, critCount: 0 },
    { bt: 'AB+', stock: 24, donors: 30, d7: 8,  d14: 14, d30: 20, critCount: 0 },
  ];

  const predictions: BloodTypePrediction[] = fallbackRaw.map(({ bt, stock, donors, d7, d14, d30, critCount }) => {
    const avgDaily = parseFloat((d30 / 30).toFixed(2));
    const projDays = avgDaily > 0 ? Math.min(30, Math.round(stock / avgDaily)) : 30;
    const trend = computeTrend(d7, d30);
    const riskLevel = classifyRisk(projDays, critCount, trend);
    const rarity = RARITY_FACTOR[bt];
    const recommended = Math.max(0, Math.ceil(avgDaily * 14 * rarity) - stock);

    return {
      bloodType: bt,
      currentStock: stock,
      activeDonors: donors,
      demand7d: d7,
      demand14d: d14,
      demand30d: d30,
      avgDailyDemand: avgDaily,
      projectedDeficitDays: projDays,
      riskLevel,
      trendDirection: trend,
      criticalRequestsCount: critCount,
      eligibleDonorsNearby: donors,
      recommendedUnitsToCollect: recommended,
      confidence: 0.5,
    };
  });

  const riskOrder: Record<RiskLevel, number> = { critical: 0, high: 1, medium: 2, low: 3 };
  predictions.sort((a, b) => {
    const ro = riskOrder[a.riskLevel] - riskOrder[b.riskLevel];
    return ro !== 0 ? ro : a.projectedDeficitDays - b.projectedDeficitDays;
  });

  const alerts = predictions.map(generateAlert).filter((a): a is ShortageAlert => a !== null);
  const criticalTypes = predictions.filter((p) => p.riskLevel === 'critical').map((p) => p.bloodType);
  const highRiskTypes = predictions.filter((p) => p.riskLevel === 'high').map((p) => p.bloodType);

  let overallRisk: RiskLevel = 'low';
  if (criticalTypes.length > 0) overallRisk = 'critical';
  else if (highRiskTypes.length > 0) overallRisk = 'high';
  else if (predictions.some((p) => p.riskLevel === 'medium')) overallRisk = 'medium';

  return {
    predictions,
    alerts,
    criticalTypes,
    highRiskTypes,
    overallRisk,
    totalActiveDonors: fallbackRaw.reduce((s, r) => s + r.donors, 0),
    totalPendingDemand: fallbackRaw.reduce((s, r) => s + r.critCount * 2, 0),
    lastUpdated: new Date().toISOString(),
    dataSource: 'fallback',
  };
}
