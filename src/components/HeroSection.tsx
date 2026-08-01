import React from 'react';
import { HeroGraphicIllustration } from './BloodGraphics';
import { Sparkles, ArrowRight, Play, Users, Clock, ShieldCheck } from 'lucide-react';

interface HeroProps {
  onStartSavingLives: () => void;
  onWatchDemo: () => void;
}

export const HeroSection: React.FC<HeroProps> = ({ onStartSavingLives, onWatchDemo }) => {
  return (
    <section id="home" className="relative overflow-hidden pt-6 pb-16 md:pt-12 md:pb-24 bg-gradient-to-b from-red-50/40 via-white to-white dark:from-slate-900 dark:via-slate-900 dark:to-slate-950">
      
      {/* Background Decorative Soft Wave Line */}
      <div className="absolute top-1/2 left-0 w-full h-96 -translate-y-1/2 pointer-events-none opacity-40 dark:opacity-20 z-0">
        <svg viewBox="0 0 1440 320" className="w-full h-full text-red-200 dark:text-red-950 fill-none stroke-current stroke-[2] stroke-dasharray-4">
          <path d="M0,160 Q360,300 720,160 T1440,160" />
        </svg>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          
          {/* Left Text & Call-To-Actions Column */}
          <div className="lg:col-span-7 flex flex-col items-start space-y-6">
            
            {/* AI Pill Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-red-100/80 dark:bg-red-950/60 border border-red-200 dark:border-red-800/50 text-red-600 dark:text-red-400 text-xs sm:text-sm font-semibold tracking-wide shadow-xs">
              <Sparkles className="w-4 h-4 text-red-500 fill-red-100 dark:fill-red-900" />
              <span>AI-Powered Emergency Response</span>
            </div>

            {/* Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-slate-900 dark:text-white leading-[1.15]">
              Save Lives with <br />
              <span className="text-red-600 dark:text-red-500 underline decoration-red-200 dark:decoration-red-900 decoration-wavy decoration-2">
                Intelligent Matching
              </span>
            </h1>

            {/* Paragraph Description */}
            <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 max-w-2xl font-normal leading-relaxed">
              Beyond donor finding. Predict shortages, match donors intelligently, manage hospital inventory, and respond to emergencies in seconds.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-wrap items-center gap-4 pt-2">
              <button
                onClick={onStartSavingLives}
                className="px-6 py-3.5 bg-red-600 hover:bg-red-700 active:scale-98 text-white font-bold rounded-2xl shadow-lg shadow-red-500/30 flex items-center gap-2.5 transition-all text-base"
              >
                <span>Start Saving Lives</span>
                <ArrowRight className="w-5 h-5" />
              </button>

              <button
                onClick={onWatchDemo}
                className="px-6 py-3.5 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 font-semibold rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center gap-2.5 transition-all text-base"
              >
                <div className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-600">
                  <Play className="w-3 h-3 fill-current ml-0.5" />
                </div>
                <span>Watch Demo</span>
              </button>
            </div>

            {/* 3 Metric Cards Row */}
            <div className="grid grid-cols-3 gap-3 sm:gap-4 w-full pt-6">
              
              {/* Stat 1 */}
              <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-md p-3.5 sm:p-4 rounded-2xl border border-slate-100 dark:border-slate-700/60 shadow-sm flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-red-50 dark:bg-red-950/50 text-red-600 dark:text-red-400 shrink-0">
                  <Users className="w-5 h-5 sm:w-6 sm:h-6" />
                </div>
                <div>
                  <div className="text-lg sm:text-2xl font-black text-slate-900 dark:text-white leading-none">
                    10K+
                  </div>
                  <div className="text-[11px] sm:text-xs font-medium text-slate-500 dark:text-slate-400 mt-1">
                    Registered Donors
                  </div>
                </div>
              </div>

              {/* Stat 2 */}
              <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-md p-3.5 sm:p-4 rounded-2xl border border-slate-100 dark:border-slate-700/60 shadow-sm flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-red-50 dark:bg-red-950/50 text-red-600 dark:text-red-400 shrink-0">
                  <Clock className="w-5 h-5 sm:w-6 sm:h-6" />
                </div>
                <div>
                  <div className="text-lg sm:text-2xl font-black text-slate-900 dark:text-white leading-none">
                    &lt; 2min
                  </div>
                  <div className="text-[11px] sm:text-xs font-medium text-slate-500 dark:text-slate-400 mt-1">
                    Average Response Time
                  </div>
                </div>
              </div>

              {/* Stat 3 */}
              <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-md p-3.5 sm:p-4 rounded-2xl border border-slate-100 dark:border-slate-700/60 shadow-sm flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-red-50 dark:bg-red-950/50 text-red-600 dark:text-red-400 shrink-0">
                  <ShieldCheck className="w-5 h-5 sm:w-6 sm:h-6" />
                </div>
                <div>
                  <div className="text-lg sm:text-2xl font-black text-slate-900 dark:text-white leading-none">
                    95%
                  </div>
                  <div className="text-[11px] sm:text-xs font-medium text-slate-500 dark:text-slate-400 mt-1">
                    Match Accuracy
                  </div>
                </div>
              </div>

            </div>

          </div>

          {/* Right Hero Graphic Column */}
          <div className="lg:col-span-5 flex justify-center lg:justify-end lg:-mt-2">
            <HeroGraphicIllustration />
          </div>

        </div>
      </div>
    </section>
  );
};
