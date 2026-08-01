import React from 'react';
import { X, Mic, MapPin, Cpu, CheckCircle2 } from 'lucide-react';

interface GenericFeatureModalProps {
  featureId: string | null;
  onClose: () => void;
}

export const GenericFeatureModal: React.FC<GenericFeatureModalProps> = ({ featureId, onClose }) => {
  if (!featureId || ['emergency-assistant', 'eligibility-ai', 'shortage-prediction'].includes(featureId)) {
    return null;
  }

  const getDetails = () => {
    switch (featureId) {
      case 'voice-assistant':
        return {
          title: 'Multilingual Voice Assistant',
          icon: Mic,
          subtitle: 'Voice-first blood emergency registration in multiple regional languages',
          content: (
            <div className="space-y-4">
              <div className="p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl">
                <p className="text-xs font-bold text-slate-500 uppercase">Supported Languages</p>
                <div className="flex flex-wrap gap-2 mt-2">
                  {['English', 'Hindi (हिंदी)', 'Tamil (தமிழ்)', 'Telugu (తెలుగు)', 'Bengali (বাংলা)', 'Marathi (मराठी)'].map((lang) => (
                    <span key={lang} className="px-3 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full text-xs font-semibold text-slate-700 dark:text-slate-300">
                      {lang}
                    </span>
                  ))}
                </div>
              </div>

              <div className="p-4 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-2xl flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">Live Voice Simulation</h4>
                  <p className="text-xs text-slate-600 dark:text-slate-400">"मुझे तुरंत B+ पॉज़िटिव ब्लड चाहिए सिटी हॉस्पिटल के लिए"</p>
                </div>
                <button
                  onClick={() => alert('Speech synthesis demo played in Hindi!')}
                  className="px-4 py-2 bg-red-600 text-white font-bold text-xs rounded-xl shadow-xs"
                >
                  <Mic className="w-4 h-4 inline mr-1" /> Listen Demo
                </button>
              </div>
            </div>
          ),
        };

      case 'smart-routing':
        return {
          title: 'Smart AI Transport Routing',
          icon: MapPin,
          subtitle: 'Priority routing and traffic bypass for emergency blood transport',
          content: (
            <div className="space-y-4">
              <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 rounded-2xl flex items-center gap-3">
                <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
                <div>
                  <h4 className="text-sm font-bold text-emerald-900 dark:text-emerald-200">AI Priority Corridor Active</h4>
                  <p className="text-xs text-emerald-800 dark:text-emerald-300">
                    Est. Transit Time reduced from 28 mins to 11 mins via Green Wave traffic light synchronization.
                  </p>
                </div>
              </div>

              <div className="p-4 border border-slate-200 dark:border-slate-700 rounded-2xl bg-slate-50 dark:bg-slate-900/50">
                <div className="text-xs font-bold text-slate-500 uppercase mb-2">Live Transport Tracking</div>
                <div className="flex justify-between items-center text-xs font-bold text-slate-700 dark:text-slate-300">
                  <span>Blood Bank (Central Storage)</span>
                  <span className="text-red-600">➔ 11 mins ➔</span>
                  <span>Trauma Center (ICU Wing)</span>
                </div>
              </div>
            </div>
          ),
        };

      default:
        return {
          title: 'AI Smart Donor Matching Engine',
          icon: Cpu,
          subtitle: 'Multi-variable ranking algorithm evaluating proximity, eligibility, and response probability',
          content: (
            <div className="space-y-4">
              <div className="p-4 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-2xl">
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">Matching Parameters Evaluated:</h4>
                <ul className="text-xs text-slate-700 dark:text-slate-300 space-y-1.5 mt-2 font-medium">
                  <li>• Proximity &amp; ETA via Real-Time Traffic API (30% weight)</li>
                  <li>• Blood Group Antigen Compatibility Matrix (35% weight)</li>
                  <li>• Historical Acceptance Rate &amp; Response Time (20% weight)</li>
                  <li>• Donation Interval &amp; Hemoglobin Readiness (15% weight)</li>
                </ul>
              </div>
            </div>
          ),
        };
    }
  };

  const details = getDetails();
  const IconComponent = details.icon;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white dark:bg-slate-800 w-full max-w-xl rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-700 overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-red-600 to-red-700 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-white/10 rounded-xl backdrop-blur-md">
              <IconComponent className="w-5 h-5 text-red-200" />
            </div>
            <div>
              <h3 className="text-lg font-bold">{details.title}</h3>
              <p className="text-xs text-red-100">{details.subtitle}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-white/20 text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {details.content}
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
