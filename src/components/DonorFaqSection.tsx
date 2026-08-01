import React, { useState } from 'react';
import {
  HelpCircle,
  Search,
  Clock,
  HeartPulse,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  BookOpen,
  ShieldCheck,
  Award,
  Zap,
  Info,
} from 'lucide-react';

export interface FAQItem {
  id: string;
  category: 'Intervals & Timing' | 'Health Benefits' | 'Eligibility' | 'Care & Safety';
  question: string;
  answer: string;
  highlightBadge?: string;
  keyTakeaways?: string[];
}

export const DONOR_FAQS: FAQItem[] = [
  {
    id: 'faq-1',
    category: 'Intervals & Timing',
    question: 'How many months must I wait before donating blood again?',
    answer:
      'For standard Whole Blood donation, male donors can donate every 3 months (90 days) and female donors every 3 to 4 months (12 weeks). Platelet donors can donate every 7 days (up to 24 times a year), and Plasma donors can donate every 28 days.',
    highlightBadge: 'Every 3 Months (90 Days)',
    keyTakeaways: [
      'Whole Blood: 3 Months (Male) / 3-4 Months (Female)',
      'Platelet Donation: Every 7 Days (Max 24/yr)',
      'Plasma Donation: Every 28 Days',
    ],
  },
  {
    id: 'faq-2',
    category: 'Health Benefits',
    question: 'What are the main health benefits of donating blood?',
    answer:
      'Regular blood donation stimulates bone marrow to produce fresh, healthy red blood cells, improves cardiovascular wellness, and naturally regulates excess iron levels in the bloodstream. Every donation also includes a free mini-health screening for blood pressure, hemoglobin, pulse, and infectious disease screening.',
    highlightBadge: 'Reduces Excess Iron & Rejuvenates Cells',
    keyTakeaways: [
      'Stimulates fresh red blood cell production',
      'Free mini-health & hemoglobin checkup on arrival',
      'Lowers risk of iron overload & arterial stiffness',
      'High mental satisfaction: 1 donation saves up to 3 lives',
    ],
  },
  {
    id: 'faq-3',
    category: 'Eligibility',
    question: 'What are the basic eligibility criteria to donate blood?',
    answer:
      'Donors must be between 18 and 65 years old, weigh at least 45 kg (100 lbs), maintain a minimum hemoglobin level of 12.5 g/dL, have normal blood pressure/pulse, and be in good overall health without active infections or fever on the donation day.',
    highlightBadge: 'Age 18-65 • Weight 45kg+ • Hb 12.5+',
    keyTakeaways: [
      'Age range: 18 to 65 years',
      'Minimum weight: 45 kg (100 lbs)',
      'Hemoglobin: At least 12.5 g/dL',
      'Must be free of active fever or antibiotic treatments',
    ],
  },
  {
    id: 'faq-4',
    category: 'Intervals & Timing',
    question: 'How long does the whole donation process take?',
    answer:
      'The actual blood extraction takes only 8 to 10 minutes! However, the complete appointment (including registration, brief health screening, blood pressure check, and post-donation refreshment rest) takes approximately 45 to 60 minutes.',
    highlightBadge: 'Only 8-10 Min Extraction',
    keyTakeaways: [
      'Total appointment time: ~45-60 minutes',
      'Blood extraction time: 8-10 minutes',
      'Post-donation rest & snacks: 15 minutes',
    ],
  },
  {
    id: 'faq-5',
    category: 'Care & Safety',
    question: 'What should I do BEFORE and AFTER donating blood?',
    answer:
      'BEFORE: Drink at least 500ml of water, eat a healthy iron-rich meal, get 7-8 hours of sleep, and avoid alcohol for 24 hours. AFTER: Drink extra fluids, rest for 15 minutes at the clinic, avoid heavy lifting or strenuous workouts for 24 hours, and keep the bandage on for 4 hours.',
    highlightBadge: 'Hydrate & Rest Well',
    keyTakeaways: [
      'Drink 500ml+ water before arriving',
      'Eat an iron-rich meal prior to donation',
      'Avoid alcohol 24h before & heavy lifting 24h after',
    ],
  },
  {
    id: 'faq-6',
    category: 'Eligibility',
    question: 'Can I donate if I recently got a tattoo or body piercing?',
    answer:
      'Yes, but there is usually a deferral period of 3 to 6 months depending on local health authority guidelines and whether the tattoo or piercing was applied at a state-licensed facility using sterile single-use needles.',
    highlightBadge: '3-6 Month Deferral',
    keyTakeaways: [
      '3-6 months waiting period after new tattoos',
      'Applies to body piercings and cosmetic ink',
      'Ensures zero risk of blood-borne viral transmission',
    ],
  },
  {
    id: 'faq-7',
    category: 'Care & Safety',
    question: 'Will donating blood hurt or make me weak?',
    answer:
      'You only feel a brief, mild pinch when the needle enters the vein. Your body restores lost fluid volume (plasma) within 24 to 48 hours, and red blood cells are fully replenished within 4 to 8 weeks. Most healthy donors feel completely normal right after drinking juice and having a light snack.',
    highlightBadge: 'Fluid Volume Restores in 24-48 Hours',
    keyTakeaways: [
      'Only a momentary quick pinch',
      'Fluid volume fully restored in 24-48 hrs',
      'Free snacks & juice provided after donation',
    ],
  },
];

export const DonorFaqSection: React.FC = () => {
  const [openFaqId, setOpenFaqId] = useState<string>('faq-1');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const filteredFaqs = DONOR_FAQS.filter((faq) => {
    const matchesCategory =
      categoryFilter === 'All' || faq.category === categoryFilter;
    const matchesQuery =
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesQuery;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner Header */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-100 dark:bg-red-950/80 text-red-600 dark:text-red-400 text-xs font-bold uppercase tracking-wider">
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Donor Education &amp; Knowledge Center</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Blood Donation FAQs
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
            Everything you need to know about donation intervals, health benefits, eligibility requirements, and post-donation care.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-4 py-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 rounded-2xl text-center">
            <div className="text-2xl font-black text-red-600 dark:text-red-400">90 Days</div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Whole Blood Interval
            </div>
          </div>
          <div className="px-4 py-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/50 rounded-2xl text-center">
            <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">3 Lives</div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Impact Per Donation
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stat Highlight Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-red-100 dark:bg-red-950/80 text-red-600 dark:text-red-400 flex items-center justify-center shrink-0">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">Donation Frequency</div>
            <div className="text-base font-black text-slate-900 dark:text-white">Every 3 Months</div>
            <div className="text-[10px] font-bold text-red-600 dark:text-red-400">90 days for males / 12 wks females</div>
          </div>
        </div>

        <div className="p-5 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <HeartPulse className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">Health Benefit</div>
            <div className="text-base font-black text-slate-900 dark:text-white">Regulates Iron</div>
            <div className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">Lowers cardiovascular risk</div>
          </div>
        </div>

        <div className="p-5 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-950/80 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">Free Checkup</div>
            <div className="text-base font-black text-slate-900 dark:text-white">Mini Health Screening</div>
            <div className="text-[10px] font-bold text-amber-600 dark:text-amber-400">BP, Hemoglobin &amp; Pulse</div>
          </div>
        </div>

        <div className="p-5 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-100 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
            <Zap className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">Recovery Speed</div>
            <div className="text-base font-black text-slate-900 dark:text-white">24 - 48 Hours</div>
            <div className="text-[10px] font-bold text-blue-600 dark:text-blue-400">Plasma volume restored</div>
          </div>
        </div>
      </div>

      {/* Main FAQ Search & Accordion Section */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-xs space-y-6">
        
        {/* Search & Filter Controls */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-6">
          {/* Category Filter Pills */}
          <div className="flex flex-wrap gap-2">
            {['All', 'Intervals & Timing', 'Health Benefits', 'Eligibility', 'Care & Safety'].map((cat) => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`px-4 py-2 rounded-2xl text-xs font-bold transition ${
                  categoryFilter === cat
                    ? 'bg-red-600 text-white shadow-md'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Search questions or keywords..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>
        </div>

        {/* Accordion Questions List */}
        <div className="space-y-4">
          {filteredFaqs.length === 0 ? (
            <div className="text-center py-12 text-slate-500 dark:text-slate-400 text-sm">
              No matching questions found for "{searchQuery}". Try searching another keyword or resetting the filter.
            </div>
          ) : (
            filteredFaqs.map((faq) => {
              const isOpen = openFaqId === faq.id;
              return (
                <div
                  key={faq.id}
                  className={`border rounded-2xl transition overflow-hidden ${
                    isOpen
                      ? 'border-red-300 dark:border-red-800 bg-red-50/20 dark:bg-red-950/20 shadow-xs'
                      : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <button
                    onClick={() => setOpenFaqId(isOpen ? '' : faq.id)}
                    className="w-full p-5 text-left flex items-start justify-between gap-4 font-bold text-sm text-slate-900 dark:text-white leading-snug"
                  >
                    <div className="space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[10px] uppercase font-extrabold text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-950/80 px-2.5 py-0.5 rounded-md">
                          {faq.category}
                        </span>
                        {faq.highlightBadge && (
                          <span className="text-[10px] font-bold text-amber-700 dark:text-amber-400 bg-amber-100 dark:bg-amber-950/80 px-2.5 py-0.5 rounded-md">
                            {faq.highlightBadge}
                          </span>
                        )}
                      </div>
                      <p className="text-base font-extrabold pt-1">{faq.question}</p>
                    </div>
                    <div className="mt-1 text-slate-400 shrink-0">
                      {isOpen ? <ChevronUp className="w-5 h-5 text-red-600" /> : <ChevronDown className="w-5 h-5" />}
                    </div>
                  </button>

                  {isOpen && (
                    <div className="px-5 pb-5 text-sm text-slate-600 dark:text-slate-300 space-y-4 border-t border-slate-100 dark:border-slate-800/80 pt-4">
                      <p className="leading-relaxed text-slate-700 dark:text-slate-300">{faq.answer}</p>

                      {faq.keyTakeaways && (
                        <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2">
                          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                            Key Takeaways &amp; Rules:
                          </span>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {faq.keyTakeaways.map((takeaway, idx) => (
                              <div key={idx} className="flex items-start gap-2 text-xs font-semibold text-slate-800 dark:text-slate-200">
                                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                                <span>{takeaway}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer Guidance Callout */}
        <div className="p-5 bg-gradient-to-r from-red-600 to-rose-600 text-white rounded-3xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center shrink-0">
              <BookOpen className="w-6 h-6 text-red-100" />
            </div>
            <div>
              <h4 className="text-sm font-extrabold">Still have questions regarding your eligibility?</h4>
              <p className="text-xs text-red-100 mt-0.5">Use our built-in Eligibility AI Assistant or Side Chatbot for personal medical advice.</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
