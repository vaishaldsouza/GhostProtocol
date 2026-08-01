import React, { useState } from 'react';
import { X, ShieldCheck, CheckCircle2, AlertCircle, HelpCircle, Send } from 'lucide-react';

interface EligibilityModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const EligibilityAiModal: React.FC<EligibilityModalProps> = ({ isOpen, onClose }) => {
  const [question, setQuestion] = useState('Can I donate blood if I received a Covid vaccine 5 days ago and weigh 62kg?');
  const [answer, setAnswer] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleCheck = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsLoading(true);

    setTimeout(() => {
      setAnswer(
        '✅ **Eligible with standard guidelines!**\n\n' +
        '• **Vaccination Deferral**: Standard blood donation guidelines require a 14-day deferral for live vaccines, but most inactivated Covid vaccines (Covaxin, Covishield, Pfizer, Moderna) allow donation after 14 days if symptom-free.\n' +
        '• **Weight Requirement**: Your weight (62kg) exceeds the minimum 50kg requirement.\n' +
        '• **Hemoglobin**: Ensure your Hb level is ≥ 12.5 g/dL on donation day.\n\n' +
        '💡 *Recommendation*: Wait 9 more days for full compliance or consult your local donation center.'
      );
      setIsLoading(false);
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white dark:bg-slate-800 w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-700 overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-red-600 to-red-700 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-white/10 rounded-xl backdrop-blur-md">
              <ShieldCheck className="w-5 h-5 text-red-200" />
            </div>
            <div>
              <h3 className="text-lg font-bold">Eligibility AI Guidance</h3>
              <p className="text-xs text-red-100">Ask any medical eligibility or deferral question</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-white/20 text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">
          <form onSubmit={handleCheck}>
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-200 mb-2">
              Ask your donation eligibility question:
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="E.g., Can I donate if I got a tattoo 3 months ago?"
                className="flex-1 px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-900/50 focus:outline-none focus:ring-2 focus:ring-red-500 font-medium"
              />
              <button
                type="submit"
                disabled={isLoading}
                className="px-5 py-3 bg-red-600 hover:bg-red-700 text-white font-bold text-sm rounded-2xl flex items-center gap-2 shrink-0 shadow-md shadow-red-500/20"
              >
                {isLoading ? 'Checking...' : 'Ask AI'}
              </button>
            </div>
          </form>

          {/* Quick Preset Buttons */}
          <div className="flex flex-wrap gap-2 pt-1">
            <button
              onClick={() => {
                setQuestion('What is the minimum age and weight to donate blood?');
                handleCheck();
              }}
              className="text-xs px-3 py-1.5 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium rounded-xl hover:bg-red-50 hover:text-red-600 transition"
            >
              Age &amp; Weight rules
            </button>
            <button
              onClick={() => {
                setQuestion('Can I donate blood if I got a tattoo or piercing recently?');
                handleCheck();
              }}
              className="text-xs px-3 py-1.5 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium rounded-xl hover:bg-red-50 hover:text-red-600 transition"
            >
              Tattoo / Piercing deferral
            </button>
            <button
              onClick={() => {
                setQuestion('How often can a healthy male or female donate blood?');
                handleCheck();
              }}
              className="text-xs px-3 py-1.5 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium rounded-xl hover:bg-red-50 hover:text-red-600 transition"
            >
              Donation frequency
            </button>
          </div>

          {/* AI Response Box */}
          {answer && (
            <div className="p-5 bg-red-50/70 dark:bg-red-950/40 border border-red-200 dark:border-red-800/60 rounded-2xl text-sm text-slate-800 dark:text-slate-200 leading-relaxed font-medium whitespace-pre-line animate-fadeIn">
              {answer}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs rounded-xl"
          >
            Done
          </button>
        </div>

      </div>
    </div>
  );
};
