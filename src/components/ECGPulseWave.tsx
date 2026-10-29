import React, { useState, useEffect } from 'react';
import { Activity, Heart, ShieldCheck } from 'lucide-react';

interface ECGPulseWaveProps {
  bpm?: number;
  label?: string;
  className?: string;
  variant?: 'compact' | 'full';
}

export const ECGPulseWave: React.FC<ECGPulseWaveProps> = ({
  bpm = 74,
  label = 'Normal Sinus Rhythm • Clinical Telemetry Online',
  className = '',
  variant = 'compact',
}) => {
  const [currentBpm, setCurrentBpm] = useState(bpm);

  useEffect(() => {
    // Subtle organic heartbeat fluctuation (e.g. 73 - 76 bpm)
    const interval = setInterval(() => {
      setCurrentBpm(bpm + Math.floor(Math.random() * 5) - 2);
    }, 4000);
    return () => clearInterval(interval);
  }, [bpm]);

  return (
    <div
      className={`relative overflow-hidden rounded-2xl bg-slate-950 border border-emerald-950/80 shadow-inner flex items-center justify-between p-3 sm:p-4 text-emerald-400 ${className}`}
    >
      {/* Background Grid Pattern */}
      <div
        className="absolute inset-0 opacity-15 pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(to right, #10b981 1px, transparent 1px), linear-gradient(to bottom, #10b981 1px, transparent 1px)`,
          backgroundSize: '16px 16px',
        }}
      />

      {/* Left Telemetry readout */}
      <div className="relative z-10 flex items-center gap-3 shrink-0">
        <div className="relative flex items-center justify-center p-2 rounded-xl bg-emerald-950/80 border border-emerald-500/40 text-emerald-400">
          <Heart className="w-4 h-4 fill-emerald-500 text-emerald-400 animate-ping absolute opacity-70" />
          <Heart className="w-4 h-4 fill-emerald-500 text-emerald-400 relative" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="text-lg sm:text-xl font-mono font-black text-emerald-300 leading-none">
              {currentBpm} <span className="text-[10px] font-sans font-bold text-emerald-500 uppercase">BPM</span>
            </span>
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
          </div>
          <div className="text-[10px] sm:text-[11px] font-medium text-emerald-600/90 truncate max-w-[200px] sm:max-w-none">
            {label}
          </div>
        </div>
      </div>

      {/* Center/Right: SVG Animated ECG Waveform */}
      <div className="relative flex-1 max-w-md mx-3 h-10 overflow-hidden">
        <svg
          viewBox="0 0 400 40"
          className="w-full h-full preserve-3d"
          preserveAspectRatio="none"
        >
          <defs>
            {/* Glowing Phosphor Filter */}
            <filter id="ecg-glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="2" result="glow" />
              <feMerge>
                <feMergeNode in="glow" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>

            {/* Sweep gradient */}
            <linearGradient id="ecg-sweep" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.1" />
              <stop offset="70%" stopColor="#10b981" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#34d399" stopOpacity="1" />
            </linearGradient>
          </defs>

          {/* Baseline subtle reference line */}
          <line x1="0" y1="20" x2="400" y2="20" stroke="#064e3b" strokeWidth="1" strokeDasharray="3,3" />

          {/* Repeating ECG Wave Pattern Path */}
          {/* Wave: Isoelectric -> P Wave -> PR -> QRS Complex (sharp drop, high spike, deep dip) -> ST -> T Wave */}
          <path
            d="M 0,20 L 30,20 Q 38,15 45,20 L 60,20 L 65,22 L 72,4 L 78,34 L 84,20 L 95,20 Q 110,12 125,20 L 150,20 L 180,20 Q 188,15 195,20 L 210,20 L 215,22 L 222,4 L 228,34 L 234,20 L 245,20 Q 260,12 275,20 L 300,20 L 330,20 Q 338,15 345,20 L 360,20 L 365,22 L 372,4 L 378,34 L 384,20 L 400,20"
            fill="none"
            stroke="url(#ecg-sweep)"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            filter="url(#ecg-glow)"
            className="animate-pulse"
          />

          {/* Sweeping phosphor laser dot indicator */}
          <circle r="3.5" fill="#a7f3d0" filter="url(#ecg-glow)">
            <animateMotion
              path="M 0,20 L 30,20 Q 38,15 45,20 L 60,20 L 65,22 L 72,4 L 78,34 L 84,20 L 95,20 Q 110,12 125,20 L 150,20 L 180,20 Q 188,15 195,20 L 210,20 L 215,22 L 222,4 L 228,34 L 234,20 L 245,20 Q 260,12 275,20 L 300,20 L 330,20 Q 338,15 345,20 L 360,20 L 365,22 L 372,4 L 378,34 L 384,20 L 400,20"
              dur="2.4s"
              repeatCount="indefinite"
            />
          </circle>
        </svg>
      </div>

      {/* Right Safeguard status */}
      <div className="relative z-10 hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-950/60 border border-emerald-500/30 text-[10px] font-bold uppercase tracking-wider text-emerald-400">
        <Activity className="w-3.5 h-3.5" />
        <span>Vitals Synchronized</span>
      </div>
    </div>
  );
};
