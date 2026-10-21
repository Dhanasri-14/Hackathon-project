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
  const { t, lang } = useI18n();

  const iconSizes = {
    sm: 'w-7 h-7',
    md: 'w-9 h-9',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16',
  };

  const titleSizes = {
    sm: 'text-base',
    md: 'text-xl',
    lg: 'text-2xl',
    xl: 'text-3xl',
  };

  return (
    <div className={`flex items-center gap-3 select-none ${className}`}>
      {/* Custom Vector Icon: Heart + Helping Hand + Medical Cross */}
      <div className={`relative shrink-0 ${iconSizes[size]} flex items-center justify-center drop-shadow-sm`}>
        <svg viewBox="0 0 100 100" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Outer Protective Heart (Red emergency symbol) */}
          <path
            d="M50 88 C18 58 10 38 10 25 C10 12 22 5 35 5 C44 5 48 10 50 14 C52 10 56 5 65 5 C78 5 90 12 90 25 C90 38 82 58 50 88 Z"
            fill="url(#heartGradient)"
          />

          {/* Medical Cross Symbol (White) */}
          <rect x="44" y="20" width="12" height="24" rx="3" fill="#ffffff" />
          <rect x="38" y="26" width="24" height="12" rx="3" fill="#ffffff" />

          {/* Supportive Helping Hand Silhouette (Cyan / Blue gradient curve) */}
          <path
            d="M26 62 C32 52 46 45 60 52 C70 57 74 68 68 76 C60 84 45 84 38 80"
            stroke="#ffffff"
            strokeWidth="5"
            strokeLinecap="round"
          />
          <path
            d="M32 60 C38 66 52 75 64 71"
            stroke="#38bdf8"
            strokeWidth="3.5"
            strokeLinecap="round"
          />

          <defs>
            <linearGradient id="heartGradient" x1="10" y1="5" x2="90" y2="88" gradientUnits="userSpaceOnUse">
              <stop stopColor="#ef4444" />
              <stop offset="1" stopColor="#b91c1c" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      <div className="flex flex-col">
        <span className={`font-black tracking-tight leading-none ${titleSizes[size]} ${light ? 'text-white' : 'text-slate-900'}`}>
          {t('app.name')}
        </span>
        {showTagline && (
          <span className={`text-[11px] font-medium tracking-wide mt-0.5 ${light ? 'text-slate-300' : 'text-slate-500'}`}>
            {t('app.tagline')}
          </span>
        )}
      </div>
    </div>
  );
};
