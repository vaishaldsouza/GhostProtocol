import React from 'react';
import { X, BarChart3, AlertTriangle, TrendingDown, ArrowUpRight, ShieldAlert } from 'lucide-react';

interface ShortagePredictionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ShortagePredictionModal: React.FC<ShortagePredictionModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const bloodInventory = [
    { type: 'O-', available: 4, demand14d: 18, risk: 'critical', daysLeft: 2 },
    { type: 'AB-', available: 6, demand14d: 14, risk: 'high', daysLeft: 4 },
    { type: 'A-', available: 12, demand14d: 20, risk: 'medium', daysLeft: 7 },
    { type: 'B-', available: 15, demand14d: 22, risk: 'medium', daysLeft: 8 },
    { type: 'O+', available: 45, demand14d: 50, risk: 'low', daysLeft: 12 },
    { type: 'A+', available: 58, demand14d: 48, risk: 'low', daysLeft: 14 },
    { type: 'B+', available: 62, demand14d: 52, risk: 'low', daysLeft: 14 },
    { type: 'AB+', available: 28, demand14d: 22, risk: 'low', daysLeft: 15 },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white dark:bg-slate-800 w-full max-w-3xl rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-700 overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-red-600 to-red-700 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-white/10 rounded-xl backdrop-blur-md">
              <BarChart3 className="w-5 h-5 text-red-200" />
            </div>
            <div>
              <h3 className="text-lg font-bold">AI Shortage Predictor</h3>
              <p className="text-xs text-red-100">Forecasts blood scarcity 7-14 days ahead using AI models</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-white/20 text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6">
          
          {/* AI Scarcity Alert Banner */}
          <div className="p-4 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-2xl flex items-center gap-3">
            <ShieldAlert className="w-6 h-6 text-amber-600 shrink-0" />
            <div>
              <h4 className="text-xs font-bold text-amber-800 dark:text-amber-300 uppercase tracking-wide">
                AI Shortage Warning (Next 7 Days)
              </h4>
              <p className="text-xs text-amber-900 dark:text-amber-200 font-medium mt-0.5">
                Critical deficit predicted for <strong>O- Negative</strong> and <strong>AB- Negative</strong> blood. AI recommends triggering targeted SMS drives to 120 registered donors nearby.
              </p>
            </div>
          </div>

          {/* Grid of Blood Types */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {bloodInventory.map((item) => {
              const isCritical = item.risk === 'critical';
              const isHigh = item.risk === 'high';
              const isMedium = item.risk === 'medium';

              return (
                <div
                  key={item.type}
                  className={`p-3.5 rounded-2xl border flex flex-col justify-between ${
                    isCritical
                      ? 'bg-red-50 dark:bg-red-950/50 border-red-300 dark:border-red-800 text-red-900 dark:text-red-200'
                      : isHigh
                      ? 'bg-amber-50 dark:bg-amber-950/50 border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200'
                      : 'bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-black">{item.type}</span>
                    <span
                      className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                        isCritical
                          ? 'bg-red-600 text-white'
                          : isHigh
                          ? 'bg-amber-500 text-white'
                          : 'bg-emerald-600 text-white'
                      }`}
                    >
                      {item.risk}
                    </span>
                  </div>

                  <div className="mt-3">
                    <div className="text-2xl font-extrabold">{item.available} <span className="text-xs font-normal opacity-80">units</span></div>
                    <div className="text-[11px] font-medium opacity-80 mt-1">
                      Supply: ~{item.daysLeft} days left
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="pt-2 flex justify-end">
            <button
              onClick={() => alert('AI Targeted Campaign triggered! 120 O- negative donors notified via SMS & WhatsApp.')}
              className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl shadow-md shadow-red-500/20"
            >
              Trigger AI Targeted Donor Campaign
            </button>
          </div>

        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs rounded-xl"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
