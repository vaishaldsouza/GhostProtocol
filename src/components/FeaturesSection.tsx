import React from 'react';
import { Cpu, BarChart3, BellRing, ShieldCheck, Mic, MapPin, ArrowRight } from 'lucide-react';

interface FeaturesSectionProps {
  onSelectFeature: (featureId: string) => void;
}

export const FeaturesSection: React.FC<FeaturesSectionProps> = ({ onSelectFeature }) => {
  const features = [
    {
      id: 'smart-matching',
      title: 'AI Smart Matching',
      description: 'Ranks donors by distance, availability, response history, and acceptance probability.',
      icon: Cpu,
    },
    {
      id: 'shortage-prediction',
      title: 'Shortage Prediction',
      description: 'Predicts blood group scarcity 7-14 days ahead using historical data and AI.',
      icon: BarChart3,
    },
    {
      id: 'emergency-assistant',
      title: 'Emergency Assistant',
      description: 'Describe emergencies in natural language — AI extracts details and finds donors.',
      icon: BellRing,
    },
    {
      id: 'eligibility-ai',
      title: 'Eligibility AI',
      description: 'Ask donation eligibility questions and get instant guideline-based answers.',
      icon: ShieldCheck,
    },
    {
      id: 'voice-assistant',
      title: 'Voice Assistant',
      description: 'Multilingual voice input/output supporting Hindi, Tamil, Telugu, and more.',
      icon: Mic,
    },
    {
      id: 'smart-routing',
      title: 'Smart Routing',
      description: 'AI-optimized blood transport routes with emergency priority routing.',
      icon: MapPin,
    },
  ];

  return (
    <section id="features" className="py-16 md:py-24 bg-slate-50/50 dark:bg-slate-900/60 border-t border-slate-100 dark:border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-12 md:mb-16">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Platform Features
          </h2>
          <p className="mt-3 text-base sm:text-lg text-slate-600 dark:text-slate-300 font-normal">
            A complete healthcare platform powered by AI for every stakeholder in the blood donation ecosystem.
          </p>
        </div>

        {/* 6 Feature Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature) => {
            const IconComponent = feature.icon;
            return (
              <div
                key={feature.id}
                onClick={() => onSelectFeature(feature.id)}
                className="group relative bg-white dark:bg-slate-800/90 rounded-2xl p-6 border border-slate-100 dark:border-slate-700/80 shadow-xs hover:shadow-xl hover:shadow-red-500/5 hover:-translate-y-1 transition-all duration-300 cursor-pointer flex flex-col justify-between"
              >
                <div>
                  {/* Soft Red Icon Container */}
                  <div className="w-12 h-12 rounded-xl bg-red-50 dark:bg-red-950/60 border border-red-100 dark:border-red-900/40 flex items-center justify-center text-red-600 dark:text-red-400 group-hover:scale-110 group-hover:bg-red-600 group-hover:text-white transition-all duration-300 shadow-xs">
                    <IconComponent className="w-6 h-6" />
                  </div>

                  {/* Title */}
                  <h3 className="mt-5 text-xl font-bold text-slate-900 dark:text-white group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors">
                    {feature.title}
                  </h3>

                  {/* Description */}
                  <p className="mt-2.5 text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-normal">
                    {feature.description}
                  </p>
                </div>

                {/* Interactive Action Link */}
                <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-700/50 flex items-center gap-1.5 text-xs font-bold text-red-600 dark:text-red-400 group-hover:translate-x-1 transition-transform">
                  <span>Try Interactive Demo</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
};
