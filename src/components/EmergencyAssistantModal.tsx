import React, { useState } from 'react';
import { X, Sparkles, AlertTriangle, Send, PhoneCall, MapPin, CheckCircle, ShieldAlert } from 'lucide-react';
import { BloodType, DonorCard } from '../types';

interface EmergencyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const EmergencyAssistantModal: React.FC<EmergencyModalProps> = ({ isOpen, onClose }) => {
  const [naturalQuery, setNaturalQuery] = useState(
    'Urgent need for 2 units of O- Negative blood at St. Jude Hospital for emergency heart surgery in 45 minutes.'
  );
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [matchResults, setMatchResults] = useState<{
    bloodGroup: BloodType;
    units: number;
    hospital: string;
    urgency: string;
    donors: DonorCard[];
  } | null>(null);

  if (!isOpen) return null;

  const handleAnalyze = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsAnalyzing(true);

    setTimeout(() => {
      // Mock extracted details and ranked donors
      const donorsList: DonorCard[] = [
        {
          id: 'd1',
          name: 'Dr. Rahul Sharma',
          bloodGroup: 'O-',
          distanceKm: 1.8,
          lastDonatedDaysAgo: 120,
          responseRatePct: 98,
          matchScorePct: 99,
          status: 'available',
          phone: '+91 98765 43210',
          location: '2 mins away (Green Avenue)',
        },
        {
          id: 'd2',
          name: 'Priya Patel',
          bloodGroup: 'O-',
          distanceKm: 3.4,
          lastDonatedDaysAgo: 95,
          responseRatePct: 94,
          matchScorePct: 95,
          status: 'available',
          phone: '+91 98123 45678',
          location: '5 mins away (Civil Lines)',
        },
        {
          id: 'd3',
          name: 'Anish Varma',
          bloodGroup: 'O-',
          distanceKm: 5.1,
          lastDonatedDaysAgo: 110,
          responseRatePct: 89,
          matchScorePct: 91,
          status: 'available',
          phone: '+91 99887 76655',
          location: '10 mins away (Lake District)',
        },
      ];

      setMatchResults({
        bloodGroup: 'O-',
        units: 2,
        hospital: 'St. Jude Hospital',
        urgency: 'CRITICAL (Heart Surgery)',
        donors: donorsList,
      });
      setIsAnalyzing(false);
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white dark:bg-slate-800 w-full max-w-3xl rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-700 overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Modal Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-red-600 to-red-700 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-white/10 rounded-xl backdrop-blur-md">
              <Sparkles className="w-5 h-5 text-red-200 fill-red-100" />
            </div>
            <div>
              <h3 className="text-lg font-bold">AI Emergency Assistant</h3>
              <p className="text-xs text-red-100">Natural language details extraction &amp; instant donor dispatch</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/20 text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          
          {/* Query Box */}
          <div>
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-200 mb-2">
              Describe Emergency Request
            </label>
            <form onSubmit={handleAnalyze} className="relative">
              <textarea
                rows={3}
                value={naturalQuery}
                onChange={(e) => setNaturalQuery(e.target.value)}
                placeholder="E.g., Urgent need for 3 units of B+ blood at City Hospital..."
                className="w-full p-4 pr-12 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm text-slate-800 dark:text-slate-100 bg-slate-50 dark:bg-slate-900/50 focus:outline-none focus:ring-2 focus:ring-red-500 font-medium resize-none"
              />
              <button
                type="submit"
                disabled={isAnalyzing}
                className="absolute bottom-3 right-3 px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-md shadow-red-500/20 disabled:opacity-50"
              >
                {isAnalyzing ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Analyzing...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>AI Match</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* AI Extracted Output */}
          {matchResults && (
            <div className="space-y-4 animate-fadeIn">
              
              {/* Emergency Summary Badge */}
              <div className="p-4 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/60 rounded-2xl flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-red-600 text-white font-extrabold flex items-center justify-center text-lg shadow-sm">
                    {matchResults.bloodGroup}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                      Extracted Request: {matchResults.units} Units needed
                    </h4>
                    <p className="text-xs text-slate-600 dark:text-slate-300 font-medium">
                      Location: {matchResults.hospital} • Urgency: <span className="text-red-600 font-bold">{matchResults.urgency}</span>
                    </p>
                  </div>
                </div>
                <div className="px-3 py-1 bg-red-600 text-white text-xs font-bold rounded-full animate-pulse flex items-center gap-1">
                  <ShieldAlert className="w-3.5 h-3.5" />
                  High Priority Match
                </div>
              </div>

              {/* Donor Rank Results */}
              <div>
                <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">
                  Top Ranked Eligible Donors Nearby
                </h4>

                <div className="space-y-3">
                  {matchResults.donors.map((donor, idx) => (
                    <div
                      key={donor.id}
                      className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/80 rounded-2xl flex flex-wrap items-center justify-between gap-4 shadow-xs hover:border-red-400 transition"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs flex items-center justify-center">
                          #{idx + 1}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h5 className="text-sm font-bold text-slate-900 dark:text-white">
                              {donor.name}
                            </h5>
                            <span className="text-[10px] bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 font-bold px-2 py-0.5 rounded-full">
                              {donor.matchScorePct}% AI Score
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
                            <MapPin className="w-3 h-3 text-red-500" />
                            {donor.location} ({donor.distanceKm} km away)
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <a
                          href={`tel:${donor.phone}`}
                          className="px-3.5 py-2 bg-red-50 dark:bg-red-950/50 hover:bg-red-100 text-red-600 dark:text-red-400 font-bold text-xs rounded-xl border border-red-200 dark:border-red-800 flex items-center gap-1.5 transition"
                        >
                          <PhoneCall className="w-3.5 h-3.5" />
                          <span>Call Donor</span>
                        </a>
                        <button
                          onClick={() => alert(`SOS Notification & Ambulance Navigation dispatched to ${donor.name}!`)}
                          className="px-3.5 py-2 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl shadow-sm transition"
                        >
                          Dispatch SOS
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs rounded-xl hover:bg-slate-300 transition"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
