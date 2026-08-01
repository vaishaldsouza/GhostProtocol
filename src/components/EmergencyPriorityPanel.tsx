import React, { useState, useEffect, useCallback } from 'react';
import {
  Siren, RefreshCw, ChevronDown, ChevronUp, Clock,
  MapPin, Droplets, AlertTriangle, CheckCircle2,
  Activity, PhoneCall, ArrowUpRight, Info, Zap, Users,
} from 'lucide-react';
import { RankedEmergencyRequest, PriorityTier } from '../types';
import { fetchPriorityQueue, PriorityQueueResult } from '../utils/emergencyPriority';

// ── Tier config ───────────────────────────────────────────────────────────────

const TIER = {
  P1: {
    label:   'P1',
    border:  'border-red-400 dark:border-red-700',
    card:    'bg-red-50 dark:bg-red-950/60',
    badge:   'bg-red-600 text-white',
    bar:     'bg-red-500',
    text:    'text-red-700 dark:text-red-300',
    pulse:   true,
  },
  P2: {
    label:   'P2',
    border:  'border-amber-400 dark:border-amber-700',
    card:    'bg-amber-50 dark:bg-amber-950/50',
    badge:   'bg-amber-500 text-white',
    bar:     'bg-amber-400',
    text:    'text-amber-700 dark:text-amber-300',
    pulse:   false,
  },
  P3: {
    label:   'P3',
    border:  'border-yellow-300 dark:border-yellow-700',
    card:    'bg-yellow-50 dark:bg-yellow-950/40',
    badge:   'bg-yellow-500 text-white',
    bar:     'bg-yellow-400',
    text:    'text-yellow-700 dark:text-yellow-300',
    pulse:   false,
  },
  P4: {
    label:   'P4',
    border:  'border-slate-200 dark:border-slate-700',
    card:    'bg-slate-50 dark:bg-slate-900/50',
    badge:   'bg-slate-500 text-white',
    bar:     'bg-slate-400',
    text:    'text-slate-500 dark:text-slate-400',
    pulse:   false,
  },
} as const satisfies Record<PriorityTier, object>;

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtDeadline(minutes?: number): string {
  if (minutes === undefined) return '—';
  if (minutes <= 0)  return 'OVERDUE';
  if (minutes < 60)  return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

function fmtAgo(iso: string): string {
  const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60_000);
  if (mins < 1)   return 'just now';
  if (mins < 60)  return `${mins}m ago`;
  const h = Math.floor(mins / 60);
  return `${h}h ago`;
}

function ScoreBar({ score, color }: { score: number; color: string }) {
  return (
    <div className="flex items-center gap-1.5 min-w-0">
      <div className="flex-1 h-1.5 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ${color}`}
          style={{ width: `${score}%` }}
        />
      </div>
      <span className="text-[10px] font-bold w-6 text-right shrink-0">{score}</span>
    </div>
  );
}

// ── Request card ──────────────────────────────────────────────────────────────

function RequestCard({
  req,
  rank,
}: {
  req: RankedEmergencyRequest;
  rank: number;
  key?: React.Key;
}) {
  const [expanded, setExpanded] = useState(false);
  const cfg = TIER[req.priorityTier];
  const f   = req.priorityFactors;
  const isOverdue = (req.minutesToDeadline ?? 1) <= 0;

  return (
    <div className={`rounded-2xl border-2 ${cfg.border} ${cfg.card} transition-all duration-200`}>
      {/* ── Header row ── */}
      <button
        className="w-full px-4 py-3 flex items-start gap-3 text-left"
        onClick={() => setExpanded(v => !v)}
      >
        {/* Rank badge */}
        <div className={`shrink-0 w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black shadow-sm mt-0.5 ${cfg.badge}`}>
          {cfg.label}
          {cfg.pulse && (
            <span className="absolute w-3 h-3 rounded-full bg-red-400 animate-ping opacity-60 -top-1 -right-1" />
          )}
        </div>

        {/* Main info */}
        <div className="flex-1 min-w-0 space-y-0.5">
          <div className="flex items-center gap-2 flex-wrap">
            {/* Blood type pill */}
            <span className="px-2.5 py-0.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-black text-slate-900 dark:text-white shadow-sm">
              {req.bloodType}
            </span>
            <span className="text-sm font-bold text-slate-900 dark:text-white truncate">
              {req.hospitalName}
            </span>
            {req.isEscalated && (
              <span className="flex items-center gap-0.5 text-[10px] font-bold text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-950/60 px-2 py-0.5 rounded-full border border-red-200 dark:border-red-800 shrink-0">
                <Zap className="w-3 h-3" />
                Escalated
              </span>
            )}
            {isOverdue && (
              <span className="text-[10px] font-black text-white bg-red-600 px-2 py-0.5 rounded-full animate-pulse shrink-0">
                OVERDUE
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-slate-500 dark:text-slate-400 font-medium">
            <span className="flex items-center gap-1">
              <Droplets className="w-3 h-3 text-red-500" />
              {req.unitsNeeded} units needed
            </span>
            {req.patientName && (
              <span className="flex items-center gap-1">
                <Users className="w-3 h-3" />
                {req.patientName}
              </span>
            )}
            {req.surgeryType && (
              <span className="flex items-center gap-1">
                <Activity className="w-3 h-3" />
                {req.surgeryType}
              </span>
            )}
            <span className="flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              {req.hospitalLocation}
            </span>
          </div>
        </div>

        {/* Right column */}
        <div className="shrink-0 flex flex-col items-end gap-1 ml-2">
          {/* Priority score ring */}
          <div className="relative w-10 h-10">
            <svg className="w-10 h-10 -rotate-90" viewBox="0 0 36 36">
              <circle cx="18" cy="18" r="15" fill="none" stroke="currentColor"
                strokeWidth="3" className="text-slate-200 dark:text-slate-700" />
              <circle cx="18" cy="18" r="15" fill="none"
                strokeWidth="3"
                strokeDasharray={`${(req.priorityScore / 100) * 94.2} 94.2`}
                className={
                  req.priorityTier === 'P1' ? 'stroke-red-500' :
                  req.priorityTier === 'P2' ? 'stroke-amber-500' :
                  req.priorityTier === 'P3' ? 'stroke-yellow-400' :
                  'stroke-slate-400'
                }
                strokeLinecap="round"
              />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-[10px] font-black text-slate-800 dark:text-white">
              {req.priorityScore}
            </span>
          </div>

          <div className="flex items-center gap-1 text-[10px] font-medium text-slate-500 dark:text-slate-400">
            <Clock className="w-3 h-3" />
            <span className={isOverdue ? 'text-red-600 dark:text-red-400 font-black' : ''}>
              {fmtDeadline(req.minutesToDeadline)}
            </span>
          </div>

          {expanded
            ? <ChevronUp className="w-3.5 h-3.5 text-slate-400 mt-1" />
            : <ChevronDown className="w-3.5 h-3.5 text-slate-400 mt-1" />}
        </div>
      </button>

      {/* ── Summary line (always visible) ── */}
      <div className="px-4 pb-2 -mt-1 flex items-center justify-between gap-3">
        <p className={`text-[11px] font-semibold italic truncate ${cfg.text}`}>
          {req.priorityLabel}{req.escalationReason !== 'routine priority' ? ` · ${req.escalationReason}` : ''}
        </p>
        <span className="text-[10px] text-slate-400 dark:text-slate-500 shrink-0">
          {fmtAgo(req.createdAt)}
        </span>
      </div>

      {/* ── Expanded detail ── */}
      {expanded && (
        <div className="px-4 pb-4 pt-1 border-t border-slate-200/60 dark:border-slate-700/40 space-y-3">
          {/* Factor breakdown */}
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1.5">
              Scoring Breakdown
            </p>
            <div className="space-y-1.5">
              {([
                ['Urgency',       f.urgencyScore,      cfg.bar],
                ['Time Deadline', f.timeDeadlineScore, cfg.bar],
                ['Blood Rarity',  f.bloodRarityScore,  cfg.bar],
                ['Volume',        f.volumeScore,       cfg.bar],
                ['Surgery Type',  f.surgeryTypeScore,  cfg.bar],
                ['Wait Time',     f.waitTimeScore,     cfg.bar],
                ['Donor Gap',     f.donorGapScore,     cfg.bar],
              ] as [string, number, string][]).map(([label, score, color]) => (
                <div key={label} className="grid grid-cols-[100px_1fr] items-center gap-2">
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">{label}</span>
                  <ScoreBar score={score} color={color} />
                </div>
              ))}
            </div>
          </div>

          {/* Status + matched donors */}
          <div className="flex items-center justify-between text-[11px] font-medium">
            <span className="text-slate-500 dark:text-slate-400">
              Status: <span className="font-bold text-slate-700 dark:text-slate-200 capitalize">{req.status}</span>
            </span>
            <span className="text-slate-500 dark:text-slate-400">
              Matched donors: <span className="font-bold text-slate-700 dark:text-slate-200">{req.matchedDonorIds.length}</span>
            </span>
          </div>

          {req.notes && (
            <p className="text-[11px] text-slate-500 dark:text-slate-400 italic bg-slate-100 dark:bg-slate-800 rounded-xl px-3 py-2">
              {req.notes}
            </p>
          )}

          {/* Action buttons */}
          <div className="flex gap-2 pt-1">
            <button
              onClick={() => alert(`Dispatching donors for request ${req.id}`)}
              className="flex-1 py-2 bg-red-600 hover:bg-red-700 active:scale-[0.98] text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-sm shadow-red-500/20 transition-all"
            >
              <Siren className="w-3.5 h-3.5" />
              Dispatch Donors
            </button>
            <button
              onClick={() => alert(`Calling hospital for request ${req.id}`)}
              className="px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-red-400 text-slate-700 dark:text-slate-200 font-bold text-xs rounded-xl flex items-center gap-1.5 transition"
            >
              <PhoneCall className="w-3.5 h-3.5 text-red-500" />
              Contact
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Stat pill ─────────────────────────────────────────────────────────────────

function StatPill({
  label, value, highlight, icon,
}: {
  label: string; value: string | number; highlight?: boolean; icon: React.ReactNode;
}) {
  return (
    <div className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs ${
      highlight
        ? 'bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-800 text-red-700 dark:text-red-300'
        : 'bg-slate-50 dark:bg-slate-900/60 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
    }`}>
      <span className="opacity-60">{icon}</span>
      <div>
        <p className="text-[10px] opacity-60 leading-none mb-0.5">{label}</p>
        <p className="font-black text-sm leading-none">{value}</p>
      </div>
    </div>
  );
}

// ── Empty state ───────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <div className="py-10 flex flex-col items-center gap-3 text-center">
      <CheckCircle2 className="w-10 h-10 text-emerald-500" />
      <div>
        <p className="font-bold text-slate-800 dark:text-slate-200">All clear</p>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          No open emergency requests at this time.
        </p>
      </div>
    </div>
  );
}

// ── Main panel ────────────────────────────────────────────────────────────────

interface EmergencyPriorityPanelProps {
  /** Collapse the panel into a compact summary card by default */
  compact?: boolean;
}

export const EmergencyPriorityPanel: React.FC<EmergencyPriorityPanelProps> = ({
  compact = false,
}) => {
  const [result, setResult]       = useState<PriorityQueueResult | null>(null);
  const [loading, setLoading]     = useState(false);
  const [collapsed, setCollapsed] = useState(compact);
  const [filter, setFilter]       = useState<PriorityTier | 'all'>('all');

  const load = useCallback(async () => {
    setLoading(true);
    const data = await fetchPriorityQueue();
    setResult(data);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  // Auto-refresh every 60 s
  useEffect(() => {
    const id = setInterval(load, 60_000);
    return () => clearInterval(id);
  }, [load]);

  const visible = result?.requests.filter(
    r => filter === 'all' || r.priorityTier === filter,
  ) ?? [];

  const hasCritical = (result?.p1Count ?? 0) > 0;

  return (
    <div className={`bg-white dark:bg-slate-900 rounded-3xl border ${
      hasCritical
        ? 'border-red-300 dark:border-red-800 shadow-lg shadow-red-500/10'
        : 'border-slate-200 dark:border-slate-800'
    } overflow-hidden`}>

      {/* ── Panel header ── */}
      <div
        className={`px-5 py-4 flex items-center justify-between gap-3 cursor-pointer select-none ${
          hasCritical
            ? 'bg-gradient-to-r from-red-600 to-red-700 text-white'
            : 'bg-slate-50 dark:bg-slate-800/60'
        }`}
        onClick={() => setCollapsed(v => !v)}
      >
        <div className="flex items-center gap-2.5">
          <div className={`p-1.5 rounded-xl ${hasCritical ? 'bg-white/15' : 'bg-red-100 dark:bg-red-950/50'}`}>
            <Siren className={`w-5 h-5 ${hasCritical ? 'text-red-200 animate-pulse' : 'text-red-600 dark:text-red-400'}`} />
          </div>
          <div>
            <h3 className={`font-black text-sm ${hasCritical ? 'text-white' : 'text-slate-900 dark:text-white'}`}>
              Emergency Priority Queue
            </h3>
            <p className={`text-[11px] font-medium ${hasCritical ? 'text-red-100' : 'text-slate-500 dark:text-slate-400'}`}>
              Auto-ranked by clinical severity · live
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Summary badges */}
          {result && !collapsed && (
            <div className="hidden sm:flex items-center gap-1.5">
              {result.p1Count > 0 && (
                <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${hasCritical ? 'bg-white/20 text-white' : 'bg-red-600 text-white'}`}>
                  {result.p1Count} P1
                </span>
              )}
              {result.p2Count > 0 && (
                <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${hasCritical ? 'bg-white/20 text-white' : 'bg-amber-500 text-white'}`}>
                  {result.p2Count} P2
                </span>
              )}
              <span className={`text-[10px] font-medium ${hasCritical ? 'text-red-100' : 'text-slate-400'}`}>
                {result.totalOpen} total
              </span>
            </div>
          )}

          <button
            onClick={(e) => { e.stopPropagation(); load(); }}
            disabled={loading}
            className={`p-1.5 rounded-full transition ${hasCritical ? 'hover:bg-white/20' : 'hover:bg-slate-200 dark:hover:bg-slate-700'}`}
            title="Refresh"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${hasCritical ? 'text-white' : 'text-slate-500 dark:text-slate-400'} ${loading ? 'animate-spin' : ''}`} />
          </button>

          {collapsed
            ? <ChevronDown className={`w-4 h-4 ${hasCritical ? 'text-white' : 'text-slate-400'}`} />
            : <ChevronUp   className={`w-4 h-4 ${hasCritical ? 'text-white' : 'text-slate-400'}`} />}
        </div>
      </div>

      {/* ── Collapsed summary bar ── */}
      {collapsed && result && (
        <div
          className="px-5 py-3 flex items-center gap-4 cursor-pointer border-t border-slate-100 dark:border-slate-800"
          onClick={() => setCollapsed(false)}
        >
          {[
            { tier: 'P1' as PriorityTier, count: result.requests.filter(r => r.priorityTier === 'P1').length, color: 'bg-red-500' },
            { tier: 'P2' as PriorityTier, count: result.requests.filter(r => r.priorityTier === 'P2').length, color: 'bg-amber-500' },
            { tier: 'P3' as PriorityTier, count: result.requests.filter(r => r.priorityTier === 'P3').length, color: 'bg-yellow-400' },
            { tier: 'P4' as PriorityTier, count: result.requests.filter(r => r.priorityTier === 'P4').length, color: 'bg-slate-400' },
          ].map(({ tier, count, color }) => (
            <div key={tier} className="flex items-center gap-1.5">
              <span className={`w-2.5 h-2.5 rounded-full ${color}`} />
              <span className="text-xs font-bold text-slate-700 dark:text-slate-200">{tier}</span>
              <span className="text-xs text-slate-500 dark:text-slate-400">{count}</span>
            </div>
          ))}
          <span className="ml-auto text-xs text-slate-400 dark:text-slate-500 flex items-center gap-1">
            <ArrowUpRight className="w-3 h-3" /> Expand
          </span>
        </div>
      )}

      {/* ── Body ── */}
      {!collapsed && (
        <div className="p-5 space-y-4">

          {/* Loading */}
          {loading && !result && (
            <div className="flex items-center justify-center gap-3 py-10">
              <div className="w-8 h-8 rounded-full border-4 border-red-100 dark:border-red-900 border-t-red-600 animate-spin" />
              <p className="text-sm text-slate-500 dark:text-slate-400">Ranking requests…</p>
            </div>
          )}

          {/* Content */}
          {result && (
            <>
              {/* Stats row */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <StatPill icon={<Siren className="w-4 h-4" />}         label="P1 Critical"   value={result.p1Count}    highlight={result.p1Count > 0} />
                <StatPill icon={<AlertTriangle className="w-4 h-4" />} label="P2 Urgent"      value={result.p2Count}    highlight={result.p2Count > 0} />
                <StatPill icon={<Activity className="w-4 h-4" />}      label="Open Requests"  value={result.totalOpen} />
                <StatPill icon={<Info className="w-4 h-4" />}          label="Data Source"
                  value={result.dataSource === 'live' ? 'Live' : 'Demo'} />
              </div>

              {/* Tier filter */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[10px] font-bold uppercase text-slate-400 dark:text-slate-500 tracking-wide mr-1">Filter:</span>
                {(['all', 'P1', 'P2', 'P3', 'P4'] as const).map(f => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={`text-[10px] font-bold uppercase px-2.5 py-1 rounded-full border transition ${
                      filter === f
                        ? 'bg-red-600 text-white border-red-600'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-red-400'
                    }`}
                  >
                    {f === 'all' ? 'All' : f}
                    {f !== 'all' && result && (
                      <span className="ml-1 opacity-70">
                        ({result.requests.filter(r => r.priorityTier === f).length})
                      </span>
                    )}
                  </button>
                ))}
              </div>

              {/* Request cards */}
              <div className="space-y-3">
                {visible.length === 0 ? (
                  <EmptyState />
                ) : (
                  visible.map((req, idx) => (
                    <RequestCard key={req.id} req={req} rank={idx + 1} />
                  ))
                )}
              </div>

              {/* Footer note */}
              <p className="text-[10px] text-slate-400 dark:text-slate-600 text-center pt-1">
                Ranked by: urgency · deadline · blood rarity · surgery severity · wait time · donor gap
                {result.dataSource === 'fallback' && ' · Demo data — connect Supabase for live feed'}
              </p>
            </>
          )}
        </div>
      )}
    </div>
  );
};
