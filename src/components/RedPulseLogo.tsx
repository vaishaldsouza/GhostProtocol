import React from 'react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showSubtitle?: boolean;
  subtitleText?: string;
  className?: string;
  onClick?: () => void;
}

export const RedPulseLogo: React.FC<LogoProps> = ({
  size = 'md',
  showSubtitle = false,
  subtitleText,
  className = '',
  onClick
}) => {
  const iconSizes = {
    sm: 'w-7 h-7',
    md: 'w-9 h-9',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16',
  };

  const textSizes = {
    sm: 'text-lg',
    md: 'text-2xl',
    lg: 'text-3xl',
    xl: 'text-4xl',
  };

  const badgeSizes = {
    sm: 'text-xs px-1.5 py-0.5 ml-1 rounded-md',
    md: 'text-sm px-2 py-0.5 ml-1.5 rounded-lg',
    lg: 'text-base px-2.5 py-1 ml-2 rounded-xl',
    xl: 'text-lg px-3 py-1 ml-2.5 rounded-xl',
  };

  return (
    <div
      onClick={onClick}
      className={`inline-flex flex-col items-center justify-center select-none ${onClick ? 'cursor-pointer hover:opacity-95 transition-opacity' : ''} ${className}`}
    >
      <div className="flex items-center gap-2">
        {/* Blood drop icon with heartbeat pulse wave inside */}
        <div className={`relative flex items-center justify-center ${iconSizes[size]} transition-transform hover:scale-105 duration-300`}>
          <svg viewBox="0 0 100 120" className="w-full h-full drop-shadow-md">
            <defs>
              <linearGradient id="dropGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#EF4444" />
                <stop offset="60%" stopColor="#DC2626" />
                <stop offset="100%" stopColor="#991B1B" />
              </linearGradient>
              <linearGradient id="shineGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.6" />
                <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
              </linearGradient>
            </defs>
            {/* Teardrop / Blood drop path */}
            <path
              d="M50 8 C50 8, 12 58, 12 82 A38 38 0 0 0 88 82 C88 58, 50 8, 50 8 Z"
              fill="url(#dropGrad)"
            />
            {/* Shine highlight */}
            <path
              d="M38 32 C38 32, 22 60, 24 75 C21 68, 26 48, 38 32 Z"
              fill="url(#shineGrad)"
            />
            {/* ECG Pulse heartbeat wave line */}
            <path
              d="M 22 72 L 36 72 L 42 60 L 48 84 L 54 52 L 60 76 L 66 72 L 78 72"
              fill="none"
              stroke="#FFFFFF"
              strokeWidth="4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>

        {/* Text RedPulse AI */}
        <div className="flex items-center tracking-tight">
          <span className={`font-extrabold text-red-600 ${textSizes[size]}`}>Red</span>
          <span className={`font-extrabold text-slate-900 ${textSizes[size]}`}>Pulse</span>
          <span className={`font-extrabold bg-red-600 text-white shadow-sm shadow-red-500/40 ${badgeSizes[size]}`}>
            AI
          </span>
        </div>
      </div>

      {showSubtitle && subtitleText && (
        <p className="text-slate-600 dark:text-slate-400 text-sm md:text-base mt-1.5 font-medium text-center">
          {subtitleText}
        </p>
      )}
    </div>
  );
};
