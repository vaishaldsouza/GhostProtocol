import React from 'react';
import { Sparkles, Building2, Heart, ShieldCheck, ArrowRight } from 'lucide-react';

export const HowItWorksSection: React.FC = () => {
  const steps = [
    {
      step: '01',
      title: 'Smart Emergency Request',
      description: 'Hospitals or patients submit natural language or voice requests. RedPulse AI extracts blood group, quantity, and urgency.',
      icon: Sparkles,
    },
    {
      step: '02',
      title: 'Predictive Matching Engine',
      description: 'AI algorithms calculate distance, blood compatibility, donor response probability, and traffic routing in real time.',
      icon: Building2,
    },
    {
      step: '03',
      title: 'Targeted SOS Dispatch',
      description: 'Compatible donors nearby receive instant high-priority notifications with automated priority transport navigation.',
      icon: Heart,
    },
    {
      step: '04',
      title: 'Rapid Fulfilment & Audit',
      description: 'Donations are verified, hospital inventory updates automatically, and shortage prediction models refine future forecasts.',
      icon: ShieldCheck,
    },
  ];

  return (
    <section id="how-it-works" className="py-16 md:py-24 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-xs font-bold uppercase tracking-wider text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/60 px-3 py-1 rounded-full border border-red-200 dark:border-red-800/60">
            Automated Workflow
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight mt-3">
            How RedPulse AI Works
          </h2>
          <p className="mt-3 text-slate-600 dark:text-slate-300 text-base">
            Bridging the critical gap between emergency blood demand and registered donors in under 2 minutes.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.step}
                className="relative bg-slate-50 dark:bg-slate-800/80 p-6 rounded-3xl border border-slate-100 dark:border-slate-700/80 flex flex-col justify-between hover:border-red-400 transition"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-2xl font-black text-red-600 dark:text-red-400 opacity-80">
                      {item.step}
                    </span>
                    <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-700 shadow-xs flex items-center justify-center text-red-600 dark:text-red-400">
                      <Icon className="w-5 h-5" />
                    </div>
                  </div>

                  <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
                    {item.title}
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    {item.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
};
