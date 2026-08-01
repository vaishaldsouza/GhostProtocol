import React, { useState, useEffect, useCallback } from 'react';
import {
  X, BarChart3, ShieldAlert, TrendingUp, TrendingDown, Minus,
  RefreshCw, AlertTriangle, CheckCircle2, Users, Activity,
  Bell, Zap, Info, ChevronDown, ChevronUp, Clock,
} from 'lucide-react';
import {
  computeShortPredictions,
  PredictionSummary,
  BloodTypePrediction,
  RiskLevel,
  ShortageAlert,
} from '../utils/shortagePrediction';

interface ShortagePredictionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// ── helpers ──────────────────────────────────────────────────────────────────

const RISK_CONFIG: Record<RiskLevel, {
  label: string;
  cardBg: string;
  badge: string;
  bar: string;
  text: string;
  icon: React.ReactNode;
}> = {
  critical: {
    label: 'CRITICAL',
    cardBg: 'bg-red-50 dark:bg-red-950/60 border-red-300 dark:border-red-800',
    badge: 'bg-red-600 text-white',
    bar: 'bg-red-500',
    text: 'text-red-700 dark:text-red-300',
    icon: <ShieldAlert className="w-3.5 h-3.5" />,
  },
  high: {
    label: 'HIGH',
    cardBg: 'bg-amber-50 dark:bg-amber-950/50 border-amber-300 dark:border-amber-800',
    badge: 'bg-amber-500 text-white',
    bar: 'bg-amber-500',
    text: 'text-amber-700 dark:text-amber-300',
    icon: <AlertTriangle className="w-3.5 h-3.5" />,
  },
  medium: {
    label: 'MODERATE',
    cardBg: 'bg-yellow-50 dark:bg-yellow-950/40 border-yellow-200 dark:border-yellow-800',
    badge: 'bg-yellow-500 text-white',
    bar: 'bg-yellow-400',
    text: 'text-yellow-700 dark:text-yellow-300',
    icon: <Info className="w-3.5 h-3.5" />,
  },
  low: {
    label: 'STABLE',
    cardBg: 'bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-700',
    badge: 'bg-emerald-600 text-white',
    bar: 'bg-emerald-500',
    text: 'text-emerald-700 dark:text-emerald-400',
    icon: <CheckCircle2 className="w-3.5 h-3.5" />,
  },
};

const OVERALL_BANNER: Record<RiskLevel, { bg: string; text: string; subtitle: string }> = {
  critical: {
    bg: 'bg-red-600',
    text: 'CRITICAL SHORTAGE RISK DETECTED',
    subtitle: 'Immediate action required — multiple blood types are near depletion.',
  },
  high: {
    bg: 'bg-amber-500',
    text: 'HIGH SHORTAGE RISK DETECTED',
    subtitle: 'Proactive donor outreach recommended within 24–48 hours.',
  },
  medium: {
    bg: 'bg-yellow-500',
    text: 'MODERATE SHORTAGE RISK',
    subtitle: 'Monitor closely and schedule targeted donation drives.',
  },
  low: {
    bg: 'bg-emerald-600',
    text: 'BLOOD SUPPLY STABLE',
    subtitle: 'All blood types are at safe inventory levels.',
  },
};

function TrendIcon({ direction }: { direction: 'rising' | 'stable' | 'falling' }) {
  if (direction === 'rising') return <TrendingUp className="w-3.5 h-3.5 text-red-500" />;
  if (direction === 'falling') return <TrendingDown className="w-3.5 h-3.5 text-emerald-500" />;
  return <Minus className="w-3.5 h-3.5 text-slate-400" />;
}

/** Thin horizontal bar showing stock vs 14-day demand */
function StockBar({ pred }: { pred: BloodTypePrediction }) {
  const maxUnits = Math.max(pred.currentStock, pred.demand14d, 1);
  const stockPct = Math.min(100, Math.round((pred.currentStock / maxUnits) * 100));
  const demandPct = Math.min(100, Math.round((pred.demand14d / maxUnits) * 100));
  const cfg = RISK_CONFIG[pred.riskLevel];

  return (
    <div className="mt-2 space-y-1">
      <div className="flex justify-between text-[10px] text-slate-500 dark:text-slate-400 font-medium">
        <span>Stock</span>
        <span>14-day demand</span>
      </div>
      {/* stock bar */}
      <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ${cfg.bar}`}
          style={{ width: `${stockPct}%` }}
        />
      </div>
      {/* demand marker */}
      <div className="relative w-full h-1.5">
        <div
          className="absolute top-0 h-1.5 w-0.5 rounded-full bg-slate-500 dark:bg-slate-300"
          style={{ left: `${demandPct}%` }}
        />
      </div>
    </div>
  );
}

// ── Expanded detail card ─────────────────────────────────────────────────────
function DetailRow({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex justify-between items-center text-[11px]">
      <span className="text-slate-500 dark:text-slate-400">{label}</span>
      <span className="font-bold text-slate-800 dark:text-slate-200">{value}</span>
    </div>
  );
}

function BloodTypeCard({ pred }: { pred: BloodTypePrediction; key?: React.Key }) {
  const [expanded, setExpanded] = useState(false);
  const cfg = RISK_CONFIG[pred.riskLevel];
  const isPulsing = pred.riskLevel === 'critical';

  return (
    <div className={`rounded-2xl border ${cfg.cardBg} transition-all duration-200`}>
      {/* ── Card header ── */}
      <button
        className="w-full p-3.5 flex flex-col text-left"
        onClick={() => setExpanded((v) => !v)}
      >
        {/* row 1: type + badge + expand toggle */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl font-black text-slate-900 dark:text-white">{pred.bloodType}</span>
            {isPulsing && <span className="w-2 h-2 rounded-full bg-red-600 animate-ping" />}
          </div>
          <div className="flex items-center gap-1.5">
            <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full flex items-center gap-1 ${cfg.badge}`}>
              {cfg.icon}{cfg.label}
            </span>
            {expanded
              ? <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
              : <ChevronDown className="w-3.5 h-3.5 text-slate-400" />}
          </div>
        </div>

        {/* row 2: stock + days + trend */}
        <div className="flex items-end justify-between mt-2">
          <div>
            <span className="text-2xl font-extrabold text-slate-900 dark:text-white">{pred.currentStock}</span>
            <span className="text-xs font-normal text-slate-500 dark:text-slate-400 ml-1">units</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300">
            <Clock className="w-3.5 h-3.5 opacity-60" />
            <span className={`font-bold ${pred.projectedDeficitDays <= 5 ? 'text-red-600' : ''}`}>
              ~{pred.projectedDeficitDays}d left
            </span>
            <TrendIcon direction={pred.trendDirection} />
          </div>
        </div>

        {/* progress bar */}
        <StockBar pred={pred} />
      </button>

      {/* ── Expanded details ── */}
      {expanded && (
        <div className="px-3.5 pb-3.5 space-y-1.5 border-t border-slate-200/60 dark:border-slate-700/40 pt-2.5">
          <DetailRow label="Active donors" value={pred.activeDonors} />
          <DetailRow label="Avg daily demand" value={`${pred.avgDailyDemand} units/day`} />
          <DetailRow label="Demand (7 days)" value={`${pred.demand7d} units`} />
          <DetailRow label="Demand (14 days)" value={`${pred.demand14d} units`} />
          <DetailRow label="Demand (30 days)" value={`${pred.demand30d} units`} />
          <DetailRow label="Open critical requests" value={pred.criticalRequestsCount} />
          <DetailRow label="Recommended collection" value={`${pred.recommendedUnitsToCollect} units`} />
          <DetailRow label="Forecast confidence" value={`${Math.round(pred.confidence * 100)}%`} />
          <div className="flex items-center gap-1 mt-1.5 pt-1.5 border-t border-slate-200/60 dark:border-slate-700/40">
            <span className="text-[10px] text-slate-500 dark:text-slate-400">Demand trend:</span>
            <span className="text-[10px] font-bold text-slate-700 dark:text-slate-200 capitalize flex items-center gap-1">
              <TrendIcon direction={pred.trendDirection} />{pred.trendDirection}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Summary stat pill ────────────────────────────────────────────────────────
function StatPill({ icon, label, value, highlight }: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  highlight?: boolean;
}) {
  return (
    <div className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs ${
      highlight
        ? 'bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-800 text-red-700 dark:text-red-300'
        : 'bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
    }`}>
      <span className="opacity-70">{icon}</span>
      <div>
        <p className="text-[10px] opacity-60 leading-none mb-0.5">{label}</p>
        <p className="font-black text-sm leading-none">{value}</p>
      </div>
    </div>
  );
}

// ── Alert card ───────────────────────────────────────────────────────────────

function AlertCard({ alert }: { alert: ShortageAlert; key?: React.Key }) {
  const cfg = RISK_CONFIG[alert.severity as RiskLevel];
  return (
    <div className={`p-3.5 rounded-2xl border ${cfg.cardBg}`}>
      <div className="flex items-start gap-2.5">
        <span className={`mt-0.5 shrink-0 ${cfg.text}`}>{cfg.icon}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-black text-slate-900 dark:text-white text-sm">{alert.bloodType}</span>
            <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full ${cfg.badge}`}>
              {cfg.label}
            </span>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 ml-auto">
              ~{alert.estimatedDaysToShortage}d to shortage
            </span>
          </div>
          <p className="text-xs text-slate-700 dark:text-slate-300 mt-1 font-medium">{alert.message}</p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 italic">{alert.actionRequired}</p>
        </div>
      </div>
    </div>
  );
}

// ── Main modal component ─────────────────────────────────────────────────────
export const ShortagePredictionModal: React.FC<ShortagePredictionModalProps> = ({ isOpen, onClose }) => {
  const [summary, setSummary] = useState<PredictionSummary | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'forecast' | 'alerts'>('forecast');
  const [campaignFired, setCampaignFired] = useState(false);
  const [campaignBloodType, setCampaignBloodType] = useState<string>('');
  const [filterRisk, setFilterRisk] = useState<RiskLevel | 'all'>('all');

  const loadPredictions = useCallback(async () => {
    setIsLoading(true);
    setCampaignFired(false);
    const result = await computeShortPredictions();
    setSummary(result);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    if (isOpen && !summary) {
      loadPredictions();
    }
  }, [isOpen, summary, loadPredictions]);

  if (!isOpen) return null;

  const handleTriggerCampaign = (bloodType?: string) => {
    const bt = bloodType ?? summary?.criticalTypes[0] ?? 'O-';
    setCampaignBloodType(bt);
    setCampaignFired(true);
  };

  const filteredPredictions = summary?.predictions.filter(
    (p) => filterRisk === 'all' || p.riskLevel === filterRisk,
  ) ?? [];

  const banner = summary ? OVERALL_BANNER[summary.overallRisk] : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white dark:bg-slate-800 w-full max-w-3xl rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-700 overflow-hidden flex flex-col max-h-[90vh]">

        {/* ── Header ──────────────────────────────────────────────────────── */}
        <div className="px-6 py-4 bg-gradient-to-r from-red-600 to-red-700 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-white/10 rounded-xl backdrop-blur-md">
              <BarChart3 className="w-5 h-5 text-red-200" />
            </div>
            <div>
              <h3 className="text-lg font-bold">AI Shortage Predictor</h3>
              <p className="text-xs text-red-100">Forecasts blood scarcity 7–14 days ahead using live Supabase data</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={loadPredictions}
              disabled={isLoading}
              className="p-1.5 rounded-full hover:bg-white/20 text-white disabled:opacity-50 transition"
              title="Refresh forecast"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
            <button onClick={onClose} className="p-1.5 rounded-full hover:bg-white/20 text-white">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ── Body ────────────────────────────────────────────────────────── */}
        <div className="overflow-y-auto flex-1 p-6 space-y-5">

          {/* Loading */}
          {isLoading && (
            <div className="flex flex-col items-center justify-center py-16 gap-4">
              <div className="relative">
                <div className="w-16 h-16 rounded-full border-4 border-red-100 dark:border-red-900 border-t-red-600 animate-spin" />
                <Activity className="w-6 h-6 text-red-600 absolute inset-0 m-auto" />
              </div>
              <div className="text-center">
                <p className="font-bold text-slate-800 dark:text-slate-200">Running AI Forecast Engine</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Analysing demand trends, donor pools & emergency requests…</p>
              </div>
              <div className="flex gap-1.5">
                {[0, 150, 300].map((d) => (
                  <div key={d} className="w-2 h-2 bg-red-600 rounded-full animate-bounce" style={{ animationDelay: `${d}ms` }} />
                ))}
              </div>
            </div>
          )}

          {/* Loaded state */}
          {!isLoading && summary && (
            <>
              {/* ── Overall risk banner ── */}
              {banner && (
                <div className={`p-4 ${banner.bg} text-white rounded-2xl flex items-center gap-3`}>
                  <ShieldAlert className="w-6 h-6 shrink-0" />
                  <div>
                    <h4 className="text-xs font-black uppercase tracking-wide">{banner.text}</h4>
                    <p className="text-xs mt-0.5 opacity-90">{banner.subtitle}</p>
                  </div>
                  {summary.dataSource === 'fallback' && (
                    <span className="ml-auto text-[10px] opacity-70 border border-white/30 rounded-lg px-2 py-1 shrink-0">Demo data</span>
                  )}
                </div>
              )}

              {/* ── Summary stats ── */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <StatPill
                  icon={<ShieldAlert className="w-4 h-4" />}
                  label="Critical types"
                  value={summary.criticalTypes.length || '—'}
                  highlight={summary.criticalTypes.length > 0}
                />
                <StatPill
                  icon={<AlertTriangle className="w-4 h-4" />}
                  label="High-risk types"
                  value={summary.highRiskTypes.length || '—'}
                  highlight={summary.highRiskTypes.length > 0}
                />
                <StatPill
                  icon={<Users className="w-4 h-4" />}
                  label="Active donors"
                  value={summary.totalActiveDonors}
                />
                <StatPill
                  icon={<Zap className="w-4 h-4" />}
                  label="Pending demand"
                  value={`${summary.totalPendingDemand} units`}
                  highlight={summary.totalPendingDemand > 0}
                />
              </div>

              {/* ── Campaign success toast ── */}
              {campaignFired && (
                <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-2xl flex items-center gap-3 animate-fadeIn">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  <div>
                    <p className="text-xs font-bold text-emerald-800 dark:text-emerald-300">
                      Campaign Triggered for {campaignBloodType}!
                    </p>
                    <p className="text-[11px] text-emerald-700 dark:text-emerald-400 mt-0.5">
                      SMS &amp; WhatsApp notifications dispatched to all eligible nearby donors.
                    </p>
                  </div>
                </div>
              )}

              {/* ── Tabs ── */}
              <div className="flex gap-1 p-1 bg-slate-100 dark:bg-slate-900 rounded-xl w-fit">
                {(['forecast', 'alerts'] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-4 py-1.5 text-xs font-bold rounded-lg capitalize transition ${
                      activeTab === tab
                        ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                    }`}
                  >
                    {tab === 'alerts'
                      ? `Alerts ${summary.alerts.length > 0 ? `(${summary.alerts.length})` : ''}`
                      : 'Forecast'}
                  </button>
                ))}
              </div>

              {/* ── FORECAST TAB ── */}
              {activeTab === 'forecast' && (
                <div className="space-y-4">
                  {/* Filter row */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Filter:</span>
                    {(['all', 'critical', 'high', 'medium', 'low'] as const).map((f) => (
                      <button
                        key={f}
                        onClick={() => setFilterRisk(f)}
                        className={`text-[10px] font-bold uppercase px-2.5 py-1 rounded-full border transition ${
                          filterRisk === f
                            ? 'bg-red-600 text-white border-red-600'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        {f}
                      </button>
                    ))}
                  </div>

                  {/* Cards grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {filteredPredictions.map((pred) => (
                      <BloodTypeCard key={pred.bloodType} pred={pred} />
                    ))}
                    {filteredPredictions.length === 0 && (
                      <div className="col-span-4 text-center py-8 text-slate-400 dark:text-slate-600 text-sm">
                        No blood types match this filter.
                      </div>
                    )}
                  </div>

                  {/* Legend */}
                  <div className="flex items-center gap-4 text-[10px] text-slate-500 dark:text-slate-400 pt-1 flex-wrap">
                    <span className="font-bold uppercase tracking-wide">Legend:</span>
                    <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block" /> Critical ≤3d</span>
                    <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" /> High ≤6d</span>
                    <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-yellow-400 inline-block" /> Moderate ≤10d</span>
                    <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" /> Stable &gt;10d</span>
                    <span className="ml-auto flex items-center gap-1"><TrendingUp className="w-3 h-3 text-red-500" /> Rising demand</span>
                  </div>
                </div>
              )}

              {/* ── ALERTS TAB ── */}
              {activeTab === 'alerts' && (
                <div className="space-y-3">
                  {summary.alerts.length === 0 ? (
                    <div className="p-6 text-center rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800">
                      <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
                      <p className="text-sm font-bold text-emerald-800 dark:text-emerald-300">No active shortage alerts</p>
                      <p className="text-xs text-emerald-700 dark:text-emerald-400 mt-1">All blood types are at safe inventory levels.</p>
                    </div>
                  ) : (
                    summary.alerts.map((alert) => (
                      <AlertCard key={alert.id} alert={alert} />
                    ))
                  )}
                </div>
              )}

              {/* ── Campaign CTA ── */}
              {(summary.criticalTypes.length > 0 || summary.highRiskTypes.length > 0) && (
                <div className="pt-2">
                  <button
                    onClick={() => handleTriggerCampaign()}
                    className="w-full py-3 bg-red-600 hover:bg-red-700 active:scale-[0.98] text-white font-bold text-sm rounded-2xl shadow-lg shadow-red-500/20 flex items-center justify-center gap-2 transition-all"
                  >
                    <Bell className="w-4 h-4" />
                    Trigger AI Donor Campaign for {summary.criticalTypes[0] ?? summary.highRiskTypes[0]}
                  </button>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 text-center mt-1.5">
                    Sends targeted SMS &amp; WhatsApp notifications to eligible donors near critical hospitals.
                  </p>
                </div>
              )}

              {/* ── Last updated ── */}
              <p className="text-[10px] text-slate-400 dark:text-slate-600 text-center">
                Forecast last updated: {new Date(summary.lastUpdated).toLocaleString()} •{' '}
                {summary.dataSource === 'live' ? '🟢 Live Supabase data' : '🟡 Demo / fallback data'}
              </p>
            </>
          )}
        </div>

        {/* ── Footer ──────────────────────────────────────────────────────── */}
        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center shrink-0">
          <p className="text-[10px] text-slate-400 dark:text-slate-600">
            Predictions are based on historical demand + active donor pool.
          </p>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs rounded-xl hover:bg-slate-300 dark:hover:bg-slate-600 transition"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
