import React, { useState, useEffect } from 'react';
import {
  Brain,
  ShieldAlert,
  MapPin,
  Clock,
  PhoneCall,
  MessageSquare,
  Mail,
  CheckCircle2,
  XCircle,
  Sparkles,
  Activity,
  Layers,
  Award,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Send,
  Zap,
  X,
  SlidersHorizontal,
} from 'lucide-react';
import { BloodType } from '../types';
import {
  predictDonorsAPI,
  notifyDonorsAPI,
  acceptDonationAPI,
  declineDonationAPI,
  getPredictionHistoryAPI,
  RankedPredictionDonor,
} from '../utils/predictionEngine';

interface SmartDonorPredictionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SmartDonorPredictionModal: React.FC<SmartDonorPredictionModalProps> = ({ isOpen, onClose }) => {
  const [requestId, setRequestId] = useState(`REQ-${Date.now().toString().slice(-6)}`);
  const [hospitalName, setHospitalName] = useState('City General Hospital ICU');
  const [bloodGroup, setBloodGroup] = useState<BloodType>('O-');
  const [unitsNeeded, setUnitsNeeded] = useState(2);
  const [urgency, setUrgency] = useState<'critical' | 'high' | 'normal'>('critical');

  const [isLoading, setIsLoading] = useState(false);
  const [rankedDonors, setRankedDonors] = useState<RankedPredictionDonor[]>([]);
  const [selectedDonor, setSelectedDonor] = useState<RankedPredictionDonor | null>(null);
  const [expandedBreakdownId, setExpandedBreakdownId] = useState<string | null>(null);

  const [dispatchStatus, setDispatchStatus] = useState<string | null>(null);
  const [selectedChannels, setSelectedChannels] = useState<string[]>(['whatsapp', 'email', 'voice']);
  const [historyLogs, setHistoryLogs] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'prediction' | 'audit'>('prediction');

  useEffect(() => {
    if (isOpen) {
      runPrediction();
    }
  }, [isOpen, bloodGroup, urgency]);

  const runPrediction = async () => {
    setIsLoading(true);
    setDispatchStatus(null);
    try {
      const results = await predictDonorsAPI({
        request_id: requestId,
        hospital_name: hospitalName,
        hospital_latitude: 12.9716,
        hospital_longitude: 77.5946,
        blood_group: bloodGroup,
        units_needed: unitsNeeded,
        urgency: urgency,
      });
      setRankedDonors(results);
      if (results.length > 0) {
        setSelectedDonor(results[0]);
        setExpandedBreakdownId(results[0].id);
      }
    } catch (err) {
      console.error('Error running donor prediction:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSmartDispatch = async () => {
    if (rankedDonors.length === 0) return;
    setDispatchStatus('Dispatches queued...');
    const res = await notifyDonorsAPI(requestId, urgency, selectedChannels);
    setDispatchStatus(res.message || `Dispatched to Top ${res.batch_size} donors successfully!`);
    await fetchHistoryLogs();
  };

  const handleAcceptDonor = async (donor: RankedPredictionDonor) => {
    const res = await acceptDonationAPI(requestId, donor.id, 'web');
    setRankedDonors((prev) =>
      prev.map((d) => (d.id === donor.id ? { ...d, status: 'accepted' } : d))
    );
    setDispatchStatus(`✅ ${donor.name} ACCEPTED! Reserved for dispatch. Stopping cascade.`);
    await fetchHistoryLogs();
  };

  const handleDeclineDonor = async (donor: RankedPredictionDonor) => {
    const res = await declineDonationAPI(requestId, donor.id, 'Unavailable', 'web');
    setRankedDonors((prev) =>
      prev.map((d) => (d.id === donor.id ? { ...d, status: 'declined' } : d))
    );
    setDispatchStatus(`❌ ${donor.name} DECLINED. ${res.next_notified_donor !== 'None available' ? `Auto-cascading to ${res.next_notified_donor}` : 'No further donors in queue.'}`);
    await fetchHistoryLogs();
  };

  const fetchHistoryLogs = async () => {
    const history = await getPredictionHistoryAPI(requestId);
    setHistoryLogs(history.logs || []);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4">
      <div className="relative bg-white dark:bg-slate-900 rounded-3xl max-w-5xl w-full shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-red-600 via-rose-600 to-red-700 px-6 py-5 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-xs shadow-inner">
              <Brain className="w-6 h-6 text-white animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-extrabold tracking-tight">AI Smart Donor Prediction Engine</h2>
                <span className="px-2.5 py-0.5 bg-white/20 text-white font-mono text-[10px] font-bold rounded-full uppercase tracking-wider">
                  v2.0 FastAPI + Supabase
                </span>
              </div>
              <p className="text-xs text-red-100 font-medium">
                Predicts, ranks, and dispatches multi-channel alerts to optimal donors using 5-Factor Weighted AI Scoring
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-full transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 px-6 shrink-0">
          <button
            onClick={() => setActiveTab('prediction')}
            className={`px-5 py-3 text-sm font-bold flex items-center gap-2 border-b-2 transition ${
              activeTab === 'prediction'
                ? 'border-red-600 text-red-600 dark:text-red-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>Predictions & Ranking ({rankedDonors.length})</span>
          </button>
          <button
            onClick={() => {
              setActiveTab('audit');
              fetchHistoryLogs();
            }}
            className={`px-5 py-3 text-sm font-bold flex items-center gap-2 border-b-2 transition ${
              activeTab === 'audit'
                ? 'border-red-600 text-red-600 dark:text-red-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400'
            }`}
          >
            <Activity className="w-4 h-4" />
            <span>Prediction History & Real-Time Log</span>
          </button>
        </div>

        {/* Modal Main Content Area */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {activeTab === 'prediction' && (
            <>
              {/* Emergency Request Controls */}
              <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-700/60 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 items-end">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-500 dark:text-slate-400 mb-1">
                    Hospital Facility
                  </label>
                  <input
                    type="text"
                    value={hospitalName}
                    onChange={(e) => setHospitalName(e.target.value)}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-red-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-500 dark:text-slate-400 mb-1">
                    Required Blood Group
                  </label>
                  <select
                    value={bloodGroup}
                    onChange={(e) => setBloodGroup(e.target.value as BloodType)}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-red-500"
                  >
                    {(['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+'] as BloodType[]).map((bg) => (
                      <option key={bg} value={bg}>
                        {bg} {bg === 'O-' ? '(Universal Donor)' : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-500 dark:text-slate-400 mb-1">
                    Urgency Level
                  </label>
                  <select
                    value={urgency}
                    onChange={(e) => setUrgency(e.target.value as any)}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-red-500"
                  >
                    <option value="critical">🚨 Critical (Top 10 Batch)</option>
                    <option value="high">⚠️ High (Top 5 Batch)</option>
                    <option value="normal">🔵 Normal (Top 3 Batch)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-500 dark:text-slate-400 mb-1">
                    Units Required
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={unitsNeeded}
                    onChange={(e) => setUnitsNeeded(parseInt(e.target.value) || 1)}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-red-500"
                  />
                </div>

                <div>
                  <button
                    onClick={runPrediction}
                    disabled={isLoading}
                    className="w-full bg-red-600 hover:bg-red-700 text-white font-bold text-xs py-2.5 px-4 rounded-xl shadow-md transition flex items-center justify-center gap-1.5 disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                    <span>Run AI Prediction</span>
                  </button>
                </div>
              </div>

              {/* Formula & Weighting Overview */}
              <div className="bg-slate-900 text-white rounded-2xl p-4 shadow-lg flex flex-col md:flex-row items-center justify-between gap-4 border border-slate-800">
                <div className="flex items-center gap-3">
                  <SlidersHorizontal className="w-5 h-5 text-red-400 shrink-0" />
                  <div>
                    <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-300">
                      5-Factor Scoring Algorithm Formula
                    </h4>
                    <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                      Final Score = 0.40×Distance + 0.20×Eligibility + 0.20×Acceptance + 0.10×Availability + 0.10×BloodMatch
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 text-[10px] font-bold">
                  <span className="px-2 py-1 bg-red-950/80 text-red-300 rounded-lg border border-red-800/50">
                    Distance: 40%
                  </span>
                  <span className="px-2 py-1 bg-emerald-950/80 text-emerald-300 rounded-lg border border-emerald-800/50">
                    Eligibility: 20%
                  </span>
                  <span className="px-2 py-1 bg-blue-950/80 text-blue-300 rounded-lg border border-blue-800/50">
                    Acceptance: 20%
                  </span>
                  <span className="px-2 py-1 bg-amber-950/80 text-amber-300 rounded-lg border border-amber-800/50">
                    Availability: 10%
                  </span>
                  <span className="px-2 py-1 bg-purple-950/80 text-purple-300 rounded-lg border border-purple-800/50">
                    Blood Match: 10%
                  </span>
                </div>
              </div>

              {/* Dispatch Action Panel */}
              <div className="bg-gradient-to-r from-red-50 to-rose-50 dark:from-red-950/30 dark:to-rose-950/30 p-4 rounded-2xl border border-red-200 dark:border-red-900/50 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-red-600 dark:text-red-400" />
                    <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                      Smart Notification Batch ({urgency.toUpperCase()})
                    </h3>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                    Will trigger Top {urgency === 'critical' ? 10 : urgency === 'high' ? 5 : 3} ranked donors simultaneously.
                  </p>
                </div>

                <div className="flex items-center gap-3 flex-wrap">
                  <label className="flex items-center gap-1 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedChannels.includes('whatsapp')}
                      onChange={(e) =>
                        setSelectedChannels((prev) =>
                          e.target.checked ? [...prev, 'whatsapp'] : prev.filter((c) => c !== 'whatsapp')
                        )
                      }
                      className="rounded text-red-600 focus:ring-red-500"
                    />
                    WhatsApp
                  </label>
                  <label className="flex items-center gap-1 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedChannels.includes('email')}
                      onChange={(e) =>
                        setSelectedChannels((prev) =>
                          e.target.checked ? [...prev, 'email'] : prev.filter((c) => c !== 'email')
                        )
                      }
                      className="rounded text-red-600 focus:ring-red-500"
                    />
                    Email
                  </label>
                  <label className="flex items-center gap-1 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedChannels.includes('voice')}
                      onChange={(e) =>
                        setSelectedChannels((prev) =>
                          e.target.checked ? [...prev, 'voice'] : prev.filter((c) => c !== 'voice')
                        )
                      }
                      className="rounded text-red-600 focus:ring-red-500"
                    />
                    Twilio Voice Call
                  </label>

                  <button
                    onClick={handleSmartDispatch}
                    className="bg-red-600 hover:bg-red-700 text-white font-extrabold text-xs px-4 py-2.5 rounded-xl shadow-md transition flex items-center gap-1.5"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Dispatch Multi-Channel Alert</span>
                  </button>
                </div>
              </div>

              {dispatchStatus && (
                <div className="bg-slate-900 text-emerald-400 p-3 rounded-xl text-xs font-mono font-bold flex items-center justify-between border border-emerald-800">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>{dispatchStatus}</span>
                  </div>
                  <button onClick={() => setDispatchStatus(null)} className="text-slate-400 hover:text-white">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {/* Ranked Candidates List */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Ranked Candidates ({rankedDonors.length} Eligible Donors)
                  </h3>
                  <span className="text-xs font-medium text-slate-500">
                    Updated Real-time via Supabase & FastAPI
                  </span>
                </div>

                {isLoading ? (
                  <div className="py-12 text-center text-slate-500 dark:text-slate-400 font-semibold text-sm flex flex-col items-center gap-2">
                    <RefreshCw className="w-6 h-6 animate-spin text-red-600" />
                    <span>Calculating donor compatibility & distance matrix...</span>
                  </div>
                ) : (
                  rankedDonors.map((donor) => {
                    const isExpanded = expandedBreakdownId === donor.id;
                    const isAccepted = donor.status === 'accepted';
                    const isDeclined = donor.status === 'declined';

                    return (
                      <div
                        key={donor.id}
                        className={`rounded-2xl border transition-all overflow-hidden ${
                          isAccepted
                            ? 'bg-emerald-50/80 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800'
                            : isDeclined
                            ? 'bg-slate-100 dark:bg-slate-900/40 border-slate-300 dark:border-slate-800 opacity-60'
                            : 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700/80 hover:border-red-300 dark:hover:border-red-800'
                        }`}
                      >
                        {/* Main Donor Summary Card Row */}
                        <div className="p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-2xl bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 font-black text-sm flex items-center justify-center shrink-0 border border-red-200 dark:border-red-900">
                              #{donor.score_breakdown.rank}
                            </div>

                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">
                                  {donor.name}
                                </h4>
                                <span className="px-2 py-0.5 bg-red-600 text-white font-extrabold text-[10px] rounded-md">
                                  {donor.blood_group}
                                </span>
                                <span className="text-xs font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1">
                                  <MapPin className="w-3 h-3 text-slate-400" />
                                  {donor.score_breakdown.distance_km} km ({donor.estimated_eta_minutes} mins ETA)
                                </span>
                              </div>

                              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                Phone: {donor.phone} • Last Donated: {donor.last_donated_days_ago} days ago • Acceptance Rate: {Math.round((donor.accepted_requests / donor.total_requests_received) * 100)}%
                              </p>
                            </div>
                          </div>

                          {/* Prediction Score Badge & Controls */}
                          <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end border-t md:border-t-0 pt-3 md:pt-0 border-slate-100 dark:border-slate-700">
                            <div className="text-right">
                              <div className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-1 justify-end">
                                <span>{donor.score_breakdown.final_score}</span>
                                <span className="text-xs font-normal text-slate-400">/100</span>
                              </div>
                              <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/80 px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-800">
                                {Math.round(donor.score_breakdown.acceptance_probability * 100)}% Acceptance Prob.
                              </span>
                            </div>

                            <div className="flex items-center gap-2">
                              {!isAccepted && !isDeclined && (
                                <>
                                  <button
                                    onClick={() => handleAcceptDonor(donor)}
                                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition flex items-center gap-1"
                                    title="Simulate Accept (DTMF 1)"
                                  >
                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                    <span>Accept</span>
                                  </button>
                                  <button
                                    onClick={() => handleDeclineDonor(donor)}
                                    className="px-3 py-1.5 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl transition flex items-center gap-1"
                                    title="Simulate Decline (DTMF 2)"
                                  >
                                    <XCircle className="w-3.5 h-3.5" />
                                    <span>Decline</span>
                                  </button>
                                </>
                              )}

                              {isAccepted && (
                                <span className="px-3 py-1 bg-emerald-600 text-white font-extrabold text-xs rounded-xl flex items-center gap-1">
                                  <CheckCircle2 className="w-3.5 h-3.5" /> RESERVED
                                </span>
                              )}

                              {isDeclined && (
                                <span className="px-3 py-1 bg-slate-500 text-white font-bold text-xs rounded-xl">
                                  DECLINED
                                </span>
                              )}

                              <button
                                onClick={() => setExpandedBreakdownId(isExpanded ? null : donor.id)}
                                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl transition"
                              >
                                {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Detailed Score Breakdown Drawer */}
                        {isExpanded && (
                          <div className="px-4 py-3 bg-slate-50 dark:bg-slate-900/60 border-t border-slate-200 dark:border-slate-700/80 grid grid-cols-1 md:grid-cols-5 gap-3 text-xs">
                            {/* Factor 1: Distance */}
                            <div className="bg-white dark:bg-slate-800 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700">
                              <div className="flex justify-between font-bold text-slate-700 dark:text-slate-300 mb-1">
                                <span>Distance (40%)</span>
                                <span className="text-red-600">{donor.score_breakdown.distance_score}</span>
                              </div>
                              <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-1.5 overflow-hidden">
                                <div
                                  className="bg-red-600 h-1.5 rounded-full"
                                  style={{ width: `${donor.score_breakdown.distance_score}%` }}
                                />
                              </div>
                              <p className="text-[10px] text-slate-500 mt-1">{donor.score_breakdown.distance_km} km away</p>
                            </div>

                            {/* Factor 2: Eligibility */}
                            <div className="bg-white dark:bg-slate-800 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700">
                              <div className="flex justify-between font-bold text-slate-700 dark:text-slate-300 mb-1">
                                <span>Eligibility (20%)</span>
                                <span className="text-emerald-600">{donor.score_breakdown.eligibility_score}</span>
                              </div>
                              <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-1.5 overflow-hidden">
                                <div
                                  className="bg-emerald-600 h-1.5 rounded-full"
                                  style={{ width: `${donor.score_breakdown.eligibility_score}%` }}
                                />
                              </div>
                              <p className="text-[10px] text-slate-500 mt-1">{donor.last_donated_days_ago} days post donation</p>
                            </div>

                            {/* Factor 3: Acceptance Rate */}
                            <div className="bg-white dark:bg-slate-800 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700">
                              <div className="flex justify-between font-bold text-slate-700 dark:text-slate-300 mb-1">
                                <span>Acceptance (20%)</span>
                                <span className="text-blue-600">{donor.score_breakdown.acceptance_rate_score}</span>
                              </div>
                              <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-1.5 overflow-hidden">
                                <div
                                  className="bg-blue-600 h-1.5 rounded-full"
                                  style={{ width: `${donor.score_breakdown.acceptance_rate_score}%` }}
                                />
                              </div>
                              <p className="text-[10px] text-slate-500 mt-1">{donor.accepted_requests}/{donor.total_requests_received} accepted</p>
                            </div>

                            {/* Factor 4: Availability */}
                            <div className="bg-white dark:bg-slate-800 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700">
                              <div className="flex justify-between font-bold text-slate-700 dark:text-slate-300 mb-1">
                                <span>Availability (10%)</span>
                                <span className="text-amber-600">{donor.score_breakdown.availability_score}</span>
                              </div>
                              <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-1.5 overflow-hidden">
                                <div
                                  className="bg-amber-600 h-1.5 rounded-full"
                                  style={{ width: `${donor.score_breakdown.availability_score}%` }}
                                />
                              </div>
                              <p className="text-[10px] text-slate-500 mt-1 capitalize">{donor.availability_status}</p>
                            </div>

                            {/* Factor 5: Blood Match */}
                            <div className="bg-white dark:bg-slate-800 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700">
                              <div className="flex justify-between font-bold text-slate-700 dark:text-slate-300 mb-1">
                                <span>Blood Match (10%)</span>
                                <span className="text-purple-600">{donor.score_breakdown.blood_match_score}</span>
                              </div>
                              <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-1.5 overflow-hidden">
                                <div
                                  className="bg-purple-600 h-1.5 rounded-full"
                                  style={{ width: `${donor.score_breakdown.blood_match_score}%` }}
                                />
                              </div>
                              <p className="text-[10px] text-slate-500 mt-1 truncate">{donor.score_breakdown.compatibility_reason}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </>
          )}

          {activeTab === 'audit' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                  Prediction & Response Audit Trail Logs
                </h3>
                <button
                  onClick={fetchHistoryLogs}
                  className="px-3 py-1.5 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition flex items-center gap-1"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Refresh Logs</span>
                </button>
              </div>

              {historyLogs.length === 0 ? (
                <div className="py-12 text-center text-slate-500 dark:text-slate-400 font-medium text-xs">
                  No predictions or responses logged for request ID <code className="font-bold text-red-600">{requestId}</code> yet. Run prediction to trigger logs.
                </div>
              ) : (
                <div className="bg-slate-900 text-slate-200 rounded-2xl p-4 font-mono text-xs overflow-x-auto space-y-2 border border-slate-800">
                  {historyLogs.map((log, idx) => (
                    <div key={idx} className="p-2 border-b border-slate-800 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <span className="text-red-400 font-bold">[{log.created_at || 'LOG'}]</span>
                        <span>Donor: <strong className="text-white">{log.donor_id}</strong></span>
                        <span className="text-amber-300">Score: {log.prediction_score}</span>
                      </div>
                      <span className="text-slate-400 text-[10px]">{log.blood_compatibility}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-50 dark:bg-slate-900 px-6 py-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0">
          <div className="text-xs text-slate-500 dark:text-slate-400 font-medium flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            <span>FastAPI Server & Supabase Realtime Connected</span>
          </div>

          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs rounded-xl transition"
          >
            Close Dashboard
          </button>
        </div>
      </div>
    </div>
  );
};
