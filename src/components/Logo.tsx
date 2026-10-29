import React from 'react';
import { useI18n } from '../i18n.tsx';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showTagline?: boolean;
  className?: string;
  light?: boolean;
}

export const Logo: React.FC<LogoProps> = ({
  size = 'md',
  showTagline = true,
  className = '',
  light = false,
}) => {
  const { t } = useI18n();

  const iconSizes = {
    sm: 'w-8 h-8',
    md: 'w-11 h-11',
    lg: 'w-14 h-14',
    xl: 'w-20 h-20',
  };

  const titleSizes = {
    sm: 'text-lg',
    md: 'text-2xl',
    lg: 'text-3xl',
    xl: 'text-4xl sm:text-5xl',
  };

  return (
    <div className={`flex items-center gap-3.5 select-none ${className}`}>
      {/* High-visibility Luminous Glowing Emblem */}
      <div className={`relative shrink-0 ${iconSizes[size]} flex items-center justify-center`}>
        {/* Ambient highlighter glow halo */}
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-red-600/40 via-rose-500/30 to-amber-400/30 blur-md scale-110 pointer-events-none" />

        <div className="relative w-full h-full drop-shadow-md">
          <svg viewBox="0 0 100 100" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* Outer Protective Heart (Red emergency symbol) */}
            <path
              d="M50 88 C18 58 10 38 10 25 C10 12 22 5 35 5 C44 5 48 10 50 14 C52 10 56 5 65 5 C78 5 90 12 90 25 C90 38 82 58 50 88 Z"
              fill="url(#heartGradientHighlighted)"
              stroke="#ffffff"
              strokeWidth="2.5"
            />

            {/* Medical Cross Symbol (White with subtle shadow) */}
            <rect x="44" y="20" width="12" height="24" rx="3" fill="#ffffff" />
            <rect x="38" y="26" width="24" height="12" rx="3" fill="#ffffff" />

            {/* Supportive Helping Hand Silhouette */}
            <path
              d="M26 62 C32 52 46 45 60 52 C70 57 74 68 68 76 C60 84 45 84 38 80"
              stroke="#ffffff"
              strokeWidth="5.5"
              strokeLinecap="round"
            />
            <path
              d="M32 60 C38 66 52 75 64 71"
              stroke="#38bdf8"
              strokeWidth="4"
              strokeLinecap="round"
            />

            <defs>
              <linearGradient id="heartGradientHighlighted" x1="10" y1="5" x2="90" y2="88" gradientUnits="userSpaceOnUse">
                <stop stopColor="#ff2e2e" />
                <stop offset="0.6" stopColor="#dc2626" />
                <stop offset="1" stopColor="#991b1b" />
              </linearGradient>
            </defs>
          </svg>
        </div>
      </div>

      <div className="flex flex-col">
        {/* Highlighted Project Name */}
        <div className="flex items-center gap-2">
          <span
            className={`font-black tracking-tight leading-none ${titleSizes[size]} ${
              light
                ? 'bg-gradient-to-r from-white via-red-200 to-rose-300 bg-clip-text text-transparent drop-shadow-sm'
                : 'bg-gradient-to-r from-red-600 via-rose-600 to-slate-900 bg-clip-text text-transparent'
            }`}
          >
            {t('app.name')}
          </span>
          <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-red-600 text-white shadow-xs tracking-wider shrink-0 hidden sm:inline">
            24/7 Network
          </span>
        </div>

        {showTagline && (
          <span
            className={`text-xs font-bold tracking-wide mt-1 ${
              light ? 'text-slate-300' : 'text-slate-600'
            }`}
          >
            {t('app.tagline')}
          </span>
        )}
      </div>
    </div>
  );
};
