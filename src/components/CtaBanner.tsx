import React from 'react';
import { ArrowRight } from 'lucide-react';

interface CtaBannerProps {
  onRegister: () => void;
}

export const CtaBanner: React.FC<CtaBannerProps> = ({ onRegister }) => {
  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 my-8">
      <div className="relative overflow-hidden bg-gradient-to-r from-red-600 via-red-600 to-red-700 rounded-3xl p-8 sm:p-12 text-white shadow-2xl shadow-red-600/30 flex flex-col md:flex-row items-center justify-between gap-8">
        
        {/* Ambient Heart Icon Overlays */}
        <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-white/5 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute left-1/3 -top-12 w-48 h-48 bg-red-400/20 rounded-full blur-xl pointer-events-none" />

        {/* Left Side: Graphic + Text */}
        <div className="flex flex-col sm:flex-row items-center gap-6 text-center sm:text-left z-10">
          
          {/* Hands holding blood drop graphic */}
          <div className="w-24 h-24 sm:w-28 sm:h-28 shrink-0 bg-white/10 rounded-2xl p-2 backdrop-blur-md border border-white/20 flex items-center justify-center shadow-inner">
            <svg viewBox="0 0 100 100" className="w-full h-full filter drop-shadow-md">
              <defs>
                <linearGradient id="ctaDrop" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#FFFFFF" />
                  <stop offset="100%" stopColor="#FECDD3" />
                </linearGradient>
              </defs>
              
              {/* Blood Drop */}
              <path
                d="M50 15 C50 15, 25 50, 25 68 A25 25 0 0 0 75 68 C75 50, 50 15, 50 15 Z"
                fill="url(#ctaDrop)"
              />
              
              {/* Heart inside drop */}
              <path
                d="M50 62 C46 56, 38 56, 38 64 C38 70, 50 76, 50 76 C50 76, 62 70, 62 64 C62 56, 54 56, 50 62 Z"
                fill="#DC2626"
              />

              {/* Hands outline holding */}
              <path
                d="M20 75 C25 88, 45 92, 50 92 C55 92, 75 88, 80 75 C70 82, 55 84, 50 84 C45 84, 30 82, 20 75 Z"
                fill="#FFFFFF"
                opacity="0.9"
              />
            </svg>
          </div>

          {/* Text Content */}
          <div className="max-w-xl">
            <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Every Drop Counts
            </h3>
            <p className="mt-2 text-sm sm:text-base text-red-100 font-medium leading-relaxed">
              Join thousands of donors and hospitals saving lives with AI-powered coordination.
            </p>
          </div>

        </div>

        {/* Right Side: Register Button */}
        <div className="shrink-0 w-full sm:w-auto z-10">
          <button
            onClick={onRegister}
            className="w-full sm:w-auto px-7 py-3.5 bg-white hover:bg-red-50 text-red-600 font-bold rounded-2xl shadow-lg hover:shadow-xl active:scale-98 transition-all flex items-center justify-center gap-2 text-base"
          >
            <span>Register Now</span>
            <ArrowRight className="w-5 h-5 text-red-600" />
          </button>
        </div>

      </div>
    </section>
  );
};
