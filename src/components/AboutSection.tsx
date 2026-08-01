import React from 'react';
import { Target, Users, Shield, Zap, Award, Sparkles, HeartPulse, Building, CheckCircle2 } from 'lucide-react';

export const AboutSection: React.FC = () => {
  const stats = [
    { value: '15,000+', label: 'Emergency Dispatches', desc: 'Matched & fulfilled via AI' },
    { value: '99.4%', label: 'Match Accuracy', desc: 'Based on blood type & proximity' },
    { value: '240+', label: 'Hospital Partners', desc: 'Connected in real-time' },
    { value: '< 12 mins', label: 'Avg Response Time', desc: 'From SOS to donor confirmation' },
  ];

  const values = [
    {
      icon: Zap,
      title: 'Rapid Emergency Dispatch',
      desc: 'Our predictive algorithms match available donors within seconds, cutting critical dispatch delays during life-threatening surgeries.',
    },
    {
      icon: Shield,
      title: 'Strict Privacy & Security',
      desc: 'Donor data is encrypted with enterprise-grade protection. Contact numbers are never exposed publicly without explicit consent.',
    },
    {
      icon: HeartPulse,
      title: 'AI-Driven Shortage Forecasting',
      desc: 'Using machine learning on historical demand trends, we alert blood banks up to 14 days before critical shortages occur.',
    },
    {
      icon: Building,
      title: 'Seamless Hospital Integration',
      desc: 'Integrates with hospital EHR and blood bank management systems for automated inventory tracking and instant SOS requests.',
    },
  ];

  return (
    <section id="about" className="py-16 md:py-24 bg-slate-50/70 dark:bg-slate-900/40 border-t border-slate-100 dark:border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-xs font-bold uppercase tracking-wider text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/60 px-3 py-1 rounded-full border border-red-200 dark:border-red-800/60">
            About RedPulse AI
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight mt-3">
            Pioneering AI-Powered Lifesaving Technology
          </h2>
          <p className="mt-4 text-base sm:text-lg text-slate-600 dark:text-slate-300 font-normal leading-relaxed">
            RedPulse AI was created to solve one of healthcare's most urgent challenges: preventable deaths caused by delayed blood availability. By combining predictive machine learning, real-time geolocation, and automated SOS routing, we connect hospitals and donors in seconds.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-16">
          {stats.map((stat, i) => (
            <div
              key={i}
              className="bg-white dark:bg-slate-800/90 rounded-2xl p-6 border border-slate-100 dark:border-slate-700/80 shadow-xs text-center"
            >
              <div className="text-3xl sm:text-4xl font-black text-red-600 dark:text-red-500 tracking-tight">
                {stat.value}
              </div>
              <div className="text-sm font-bold text-slate-900 dark:text-white mt-1">
                {stat.label}
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                {stat.desc}
              </div>
            </div>
          ))}
        </div>

        {/* Values Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
          {values.map((item, i) => {
            const Icon = item.icon;
            return (
              <div
                key={i}
                className="flex items-start gap-4 p-6 bg-white dark:bg-slate-800/80 rounded-2xl border border-slate-100 dark:border-slate-700/80 shadow-xs hover:border-red-300 dark:hover:border-red-800 transition"
              >
                <div className="w-12 h-12 rounded-xl bg-red-50 dark:bg-red-950/80 border border-red-100 dark:border-red-900/50 flex-shrink-0 flex items-center justify-center text-red-600 dark:text-red-400">
                  <Icon className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1.5">
                    {item.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-normal">
                    {item.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Mission Statement Box */}
        <div className="mt-16 bg-gradient-to-r from-red-600 to-red-800 text-white rounded-3xl p-8 sm:p-10 shadow-xl relative overflow-hidden">
          <div className="relative z-10 max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/20 rounded-full text-xs font-bold uppercase tracking-wider mb-4 backdrop-blur-sm">
              <Award className="w-3.5 h-3.5" />
              <span>Our Vision</span>
            </div>
            <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              "A world where no patient dies waiting for a compatible blood donor."
            </h3>
            <p className="mt-3 text-red-100 text-sm sm:text-base leading-relaxed">
              We empower blood banks, donors, and emergency care teams with intelligent matching technology that turns panic into precise action. Every drop counts, and every second saved brings someone back home.
            </p>
          </div>
          <div className="absolute right-[-40px] bottom-[-40px] w-64 h-64 bg-white/5 rounded-full blur-2xl pointer-events-none" />
        </div>

      </div>
    </section>
  );
};
