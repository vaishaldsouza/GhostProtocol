import React from 'react';
import { Building2, Users, HeartHandshake, UserCheck } from 'lucide-react';

export const HeroGraphicIllustration: React.FC = () => {
  return (
    <div className="relative w-full max-w-lg mx-auto aspect-square flex items-center justify-center p-4">
      {/* Background Soft Red Radial Glow */}
      <div className="absolute inset-0 bg-gradient-to-tr from-red-500/15 via-pink-400/10 to-transparent rounded-full blur-3xl -z-10 animate-pulse" />

      {/* World Map Dotted Background Graphic */}
      <div className="absolute inset-2 border border-red-100 dark:border-red-900/30 rounded-full p-8 flex items-center justify-center bg-white/40 dark:bg-slate-900/40 backdrop-blur-sm shadow-xl shadow-red-500/5">
        
        {/* Dotted Connection Rings */}
        <div className="absolute inset-10 rounded-full border border-dashed border-red-200 dark:border-red-800/40 animate-[spin_60s_linear_infinite]" />
        <div className="absolute inset-20 rounded-full border border-dotted border-red-300 dark:border-red-700/50" />

        {/* Center Big 3D Glossy Blood Drop */}
        <div className="relative z-10 w-44 h-52 md:w-52 md:h-64 flex items-center justify-center drop-shadow-2xl hover:scale-105 transition-transform duration-500">
          <svg viewBox="0 0 100 120" className="w-full h-full filter drop-shadow-[0_20px_25px_rgba(220,38,38,0.35)]">
            <defs>
              <linearGradient id="heroDropGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FF4D4D" />
                <stop offset="45%" stopColor="#E52E2E" />
                <stop offset="80%" stopColor="#B91C1C" />
                <stop offset="100%" stopColor="#7F1D1D" />
              </linearGradient>
              <linearGradient id="heroShineGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0.0" />
              </linearGradient>
              <filter id="glow">
                <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                <feMerge>
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
            </defs>

            {/* Main Blood Drop Body */}
            <path
              d="M50 6 C50 6, 10 58, 10 82 A40 40 0 0 0 90 82 C90 58, 50 6, 50 6 Z"
              fill="url(#heroDropGrad)"
            />

            {/* Glossy Curved Highlight */}
            <path
              d="M38 28 C38 28, 20 58, 22 76 C19 68, 24 46, 38 28 Z"
              fill="url(#heroShineGrad)"
            />

            {/* Heartbeat Pulse Line */}
            <path
              d="M 18 72 L 34 72 L 40 58 L 48 88 L 54 48 L 62 78 L 68 72 L 82 72"
              fill="none"
              stroke="#FFFFFF"
              strokeWidth="4.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              filter="url(#glow)"
            />
          </svg>
        </div>

        {/* Top-Left Connected Node: Hospitals */}
        <div className="absolute top-4 left-6 md:top-8 md:left-10 z-20 flex flex-col items-center group">
          <div className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-white dark:bg-slate-800 shadow-lg shadow-red-500/10 border border-red-100 dark:border-red-900/40 flex items-center justify-center text-red-600 group-hover:scale-110 group-hover:bg-red-50 transition-all cursor-pointer">
            <Building2 className="w-6 h-6" />
          </div>
          <span className="mt-1 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-white/80 dark:bg-slate-800/80 px-2 py-0.5 rounded-full border border-slate-100 dark:border-slate-700 shadow-sm">
            Hospitals
          </span>
          <svg className="absolute top-10 left-10 w-24 h-24 -z-10 pointer-events-none stroke-red-300 dark:stroke-red-800 stroke-dasharray-2 opacity-60">
            <line x1="0" y1="0" x2="80" y2="80" strokeDasharray="4 4" strokeWidth="2" />
          </svg>
        </div>

        {/* Top-Right Connected Node: Donors */}
        <div className="absolute top-4 right-6 md:top-8 md:right-10 z-20 flex flex-col items-center group">
          <div className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-white dark:bg-slate-800 shadow-lg shadow-red-500/10 border border-red-100 dark:border-red-900/40 flex items-center justify-center text-red-600 group-hover:scale-110 group-hover:bg-red-50 transition-all cursor-pointer">
            <Users className="w-6 h-6" />
          </div>
          <span className="mt-1 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-white/80 dark:bg-slate-800/80 px-2 py-0.5 rounded-full border border-slate-100 dark:border-slate-700 shadow-sm">
            Donors
          </span>
        </div>

        {/* Bottom-Left Connected Node: Blood Banks */}
        <div className="absolute bottom-4 left-6 md:bottom-8 md:left-10 z-20 flex flex-col items-center group">
          <div className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-white dark:bg-slate-800 shadow-lg shadow-red-500/10 border border-red-100 dark:border-red-900/40 flex items-center justify-center text-red-600 group-hover:scale-110 group-hover:bg-red-50 transition-all cursor-pointer">
            <HeartHandshake className="w-6 h-6" />
          </div>
          <span className="mt-1 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-white/80 dark:bg-slate-800/80 px-2 py-0.5 rounded-full border border-slate-100 dark:border-slate-700 shadow-sm">
            Blood Banks
          </span>
        </div>

        {/* Bottom-Right Connected Node: Recipients */}
        <div className="absolute bottom-4 right-6 md:bottom-8 md:right-10 z-20 flex flex-col items-center group">
          <div className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-white dark:bg-slate-800 shadow-lg shadow-red-500/10 border border-red-100 dark:border-red-900/40 flex items-center justify-center text-red-600 group-hover:scale-110 group-hover:bg-red-50 transition-all cursor-pointer">
            <UserCheck className="w-6 h-6" />
          </div>
          <span className="mt-1 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-white/80 dark:bg-slate-800/80 px-2 py-0.5 rounded-full border border-slate-100 dark:border-slate-700 shadow-sm">
            Recipients
          </span>
        </div>

      </div>
    </div>
  );
};

export const Image3FullLogoGraphic: React.FC<{ className?: string }> = ({ className = 'w-48 h-48' }) => {
  return (
    <div className={`relative flex items-center justify-center ${className}`}>
      <svg viewBox="0 0 200 200" className="w-full h-full filter drop-shadow-xl">
        <defs>
          <linearGradient id="emblemRed" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#EF4444" />
            <stop offset="100%" stopColor="#B91C1C" />
          </linearGradient>
        </defs>

        {/* Circular Outer Arc */}
        <path
          d="M 30 110 A 75 75 0 1 1 170 110"
          fill="none"
          stroke="#DC2626"
          strokeWidth="6"
          strokeLinecap="round"
        />

        {/* Pixel AI Matrix Dots */}
        <g fill="#DC2626">
          <rect x="115" y="48" width="8" height="8" rx="1.5" />
          <rect x="127" y="48" width="8" height="8" rx="1.5" />
          <rect x="122" y="58" width="8" height="8" rx="1.5" />
          <rect x="134" y="58" width="8" height="8" rx="1.5" />
          <rect x="146" y="58" width="8" height="8" rx="1.5" />
          <rect x="129" y="68" width="8" height="8" rx="1.5" />
          <rect x="141" y="68" width="8" height="8" rx="1.5" />
          <rect x="153" y="68" width="8" height="8" rx="1.5" />
          <rect x="165" y="68" width="8" height="8" rx="1.5" />
          <rect x="148" y="78" width="8" height="8" rx="1.5" />
          <rect x="160" y="78" width="8" height="8" rx="1.5" />
          <rect x="155" y="88" width="8" height="8" rx="1.5" />
          <rect x="167" y="88" width="8" height="8" rx="1.5" />
          <rect x="179" y="88" width="8" height="8" rx="1.5" />
        </g>

        {/* Center Blood Drop */}
        <path
          d="M 100 18 C 100 18, 40 85, 40 122 A 60 60 0 0 0 160 122 C 160 85, 100 18, 100 18 Z"
          fill="url(#emblemRed)"
        />

        {/* Heartbeat pulse white line */}
        <path
          d="M 40 118 L 70 118 L 80 98 L 92 142 L 102 78 L 114 128 L 126 118 L 160 118"
          fill="none"
          stroke="#FFFFFF"
          strokeWidth="6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Supporting Hands white curve vector */}
        <path
          d="M 45 135 C 55 168, 90 182, 100 182 C 110 182, 145 168, 155 135 C 135 158, 110 162, 100 162 C 90 162, 65 158, 45 135 Z"
          fill="#FFFFFF"
        />
      </svg>
    </div>
  );
};
