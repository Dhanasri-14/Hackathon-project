import React, { useState } from 'react';
import { Mic, Volume2, Sparkles, Search, ArrowRight, HeartPulse, Pill, Truck, Globe, RotateCcw } from 'lucide-react';
import { VoiceToTextButton } from './VoiceToTextButton.tsx';
import { useI18n } from '../i18n.tsx';

interface DashboardVoiceAssistantWidgetProps {
  onNavigate: (page: string) => void;
}

export const DashboardVoiceAssistantWidget: React.FC<DashboardVoiceAssistantWidgetProps> = ({ onNavigate }) => {
  const { lang } = useI18n();
  const [transcript, setTranscript] = useState('');
  const [lastAction, setLastAction] = useState<string | null>(null);

  const voiceLang = lang === 'ta' ? 'ta-IN' : 'en-IN';

  const handleVoiceInput = (text: string) => {
    setTranscript(text);
    const lower = text.toLowerCase();

    if (lower.includes('blood') || lower.includes('donor') || lower.includes('இரத்தம்') || lower.includes('கொடையாளர்')) {
      setLastAction('Filtering Emergency Blood Network...');
      setTimeout(() => onNavigate('blood-requests'), 1200);
    } else if (lower.includes('medicine') || lower.includes('pharmacy') || lower.includes('dolo') || lower.includes('மருந்து')) {
      setLastAction('Opening Pharmacy Catalogue...');
      setTimeout(() => onNavigate('medicines'), 1200);
    } else if (lower.includes('track') || lower.includes('admission') || lower.includes('hospital') || lower.includes('மருத்துவமனை')) {
      setLastAction('Opening Inpatient Delivery Radar...');
      setTimeout(() => onNavigate('admission-tracking'), 1200);
    } else if (lower.includes('order') || lower.includes('delivery') || lower.includes('ஆர்டர்')) {
      setLastAction('Opening Active Orders...');
      setTimeout(() => onNavigate('orders'), 1200);
    } else {
      setLastAction(`Processed Voice Query: "${text}"`);
    }
  };

  return (
    <div className="p-6 rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 text-white shadow-xl border border-slate-700/80 space-y-4 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 relative z-10">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-indigo-600/30 border border-indigo-400/30 text-indigo-300 shadow-inner">
            <Sparkles className="w-5 h-5 text-indigo-400 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-black uppercase tracking-widest text-indigo-400">
                Voice-to-Text Assistant
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-950 border border-indigo-500/40 text-indigo-300 font-bold">
                {lang === 'ta' ? 'தமிழ்' : 'English'} (IN)
              </span>
            </div>
            <h3 className="text-base font-black text-white mt-0.5">
              Hands-Free Emergency Command & Query
            </h3>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <VoiceToTextButton
            language={voiceLang}
            onTranscript={handleVoiceInput}
            className="!p-3 !rounded-2xl !bg-red-600 hover:!bg-red-500 !text-white shadow-lg shadow-red-600/30 active:scale-95 transition-transform"
          />
        </div>
      </div>

      {/* Transcript & Command Status display */}
      <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-2 relative z-10">
        <div className="flex items-center justify-between text-[11px] font-bold text-slate-400">
          <span className="flex items-center gap-1.5">
            <Mic className="w-3.5 h-3.5 text-indigo-400" />
            {transcript ? 'Spoken Voice Query:' : 'Tap microphone above and speak your emergency command...'}
          </span>
          {transcript && (
            <button
              onClick={() => { setTranscript(''); setLastAction(null); }}
              className="text-slate-500 hover:text-slate-300 flex items-center gap-1"
            >
              <RotateCcw className="w-3 h-3" /> Clear
            </button>
          )}
        </div>

        <p className="text-sm font-bold text-white min-h-[1.5rem] italic">
          {transcript ? `"${transcript}"` : (
            <span className="text-slate-500 not-italic">
              e.g. &quot;Find O Negative blood donors in Chennai&quot; or &quot;ஆர்டர் பாராசிட்டமால்&quot;
            </span>
          )}
        </p>

        {lastAction && (
          <div className="pt-2 border-t border-slate-800/80 text-xs font-bold text-emerald-400 flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            <span>{lastAction}</span>
          </div>
        )}
      </div>

      {/* Fast Preset Voice Shortcuts */}
      <div className="flex flex-wrap items-center gap-2 relative z-10 pt-1">
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mr-1">Quick Actions:</span>
        <button
          onClick={() => handleVoiceInput(lang === 'ta' ? 'அவசர O நெகடிவ் ரத்தம் தேவை' : 'Critical O negative blood needed')}
          className="px-3 py-1.5 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-slate-700 flex items-center gap-1.5 transition"
        >
          <HeartPulse className="w-3.5 h-3.5 text-red-400" />
          <span>🩸 O- Blood Request</span>
        </button>

        <button
          onClick={() => handleVoiceInput(lang === 'ta' ? 'மருந்தகம் Dolo 650 தேடு' : 'Search Paracetamol Dolo 650')}
          className="px-3 py-1.5 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-slate-700 flex items-center gap-1.5 transition"
        >
          <Pill className="w-3.5 h-3.5 text-blue-400" />
          <span>💊 Pharmacy Catalogue</span>
        </button>

        <button
          onClick={() => handleVoiceInput(lang === 'ta' ? 'மருத்துவமனை சேர்க்கை நிலை' : 'Check inpatient admission status')}
          className="px-3 py-1.5 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-slate-700 flex items-center gap-1.5 transition"
        >
          <Truck className="w-3.5 h-3.5 text-emerald-400" />
          <span>📡 Delivery Radar</span>
        </button>
      </div>
    </div>
  );
};
