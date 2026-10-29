import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Radio,
  Flame,
  Volume2,
  VolumeX,
  ChevronLeft,
  ChevronRight,
  HeartPulse,
  ArrowRight,
  ShieldCheck,
  Clock,
  Building2,
  AlertOctagon,
  Eye,
  Pause,
  Play,
  Activity,
  Layers,
  X,
} from 'lucide-react';
import { BloodRequest } from '../types.ts';
import { useI18n } from '../i18n.tsx';

interface EmergencyBroadcastTickerProps {
  requests: BloodRequest[];
  onNavigate: (page: string) => void;
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

export const EmergencyBroadcastTicker: React.FC<EmergencyBroadcastTickerProps> = ({
  requests,
  onNavigate,
  onRefresh,
  isRefreshing,
}) => {
  const { t } = useI18n();

  // Filter for open/active critical blood requests first, fallback to urgent if no critical
  const criticalRequests = useMemo(() => {
    return requests.filter(
      r => r.urgency_level === 'critical' && r.status !== 'Fulfilled' && r.status !== 'Cancelled'
    );
  }, [requests]);

  const urgentRequests = useMemo(() => {
    return requests.filter(
      r => r.urgency_level === 'urgent' && r.status !== 'Fulfilled' && r.status !== 'Cancelled'
    );
  }, [requests]);

  // Active items for ticker: if critical exists, show critical; otherwise show urgent (if any)
  const activeItems = criticalRequests.length > 0 ? criticalRequests : urgentRequests;
  const isCritical = criticalRequests.length > 0;

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => {
    return localStorage.getItem('uyirthunai_siren_enabled') !== 'false';
  });
  const [showAllModal, setShowAllModal] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const sirenIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Track which critical requests have been viewed/acknowledged by the user
  const [viewedRequestIds, setViewedRequestIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('uyirthunai_viewed_emergency_ids');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Critical requests that have NOT yet been acknowledged/viewed
  const unviewedCriticalRequests = useMemo(() => {
    return criticalRequests.filter(r => !viewedRequestIds.includes(r.id));
  }, [criticalRequests, viewedRequestIds]);

  const hasUnviewedCritical = unviewedCriticalRequests.length > 0;

  // Acknowledge a single request
  const acknowledgeRequest = (requestId: string) => {
    setViewedRequestIds(prev => {
      if (prev.includes(requestId)) return prev;
      const updated = [...prev, requestId];
      try {
        localStorage.setItem('uyirthunai_viewed_emergency_ids', JSON.stringify(updated));
      } catch (err) {
        console.error(err);
      }
      return updated;
    });
  };

  // Acknowledge all active critical requests to stop siren
  const acknowledgeAllAlerts = () => {
    const allIds = Array.from(new Set([...viewedRequestIds, ...criticalRequests.map(r => r.id)]));
    setViewedRequestIds(allIds);
    try {
      localStorage.setItem('uyirthunai_viewed_emergency_ids', JSON.stringify(allIds));
    } catch (err) {
      console.error(err);
    }
  };

  // Reset/re-arm siren alerts
  const resetAlertAcknowledgements = () => {
    setViewedRequestIds([]);
    try {
      localStorage.removeItem('uyirthunai_viewed_emergency_ids');
    } catch (err) {
      console.error(err);
    }
  };

  // Play synthesized dual-tone emergency pager beep
  const playAlertChime = () => {
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!audioContextRef.current) {
        audioContextRef.current = new AudioCtx();
      }
      const ctx = audioContextRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }
      const now = ctx.currentTime;

      // Tone 1: 880Hz (A5)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(880, now);
      gain1.gain.setValueAtTime(0.09, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.18);

      // Tone 2: 1320Hz (E6)
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(1320, now + 0.12);
      gain2.gain.setValueAtTime(0.09, now + 0.12);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.32);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.12);
      osc2.stop(now + 0.32);
    } catch (err) {
      console.warn('Audio chime unsupported or blocked:', err);
    }
  };

  // Continuous Repeating Siren Loop: Repeats continuously until member views/acknowledges notification!
  useEffect(() => {
    if (sirenIntervalRef.current) {
      clearInterval(sirenIntervalRef.current);
      sirenIntervalRef.current = null;
    }

    if (soundEnabled && hasUnviewedCritical) {
      // Play immediately once
      playAlertChime();

      // Continuous interval every 3.8 seconds
      sirenIntervalRef.current = setInterval(() => {
        playAlertChime();
      }, 3800);
    }

    return () => {
      if (sirenIntervalRef.current) {
        clearInterval(sirenIntervalRef.current);
        sirenIntervalRef.current = null;
      }
    };
  }, [soundEnabled, hasUnviewedCritical]);

  // Carousel timer: advance item every 5 seconds unless hovered/paused
  useEffect(() => {
    if (activeItems.length <= 1 || isPaused) return;

    const timer = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % activeItems.length);
    }, 5000);

    return () => clearInterval(timer);
  }, [activeItems.length, isPaused]);

  // Adjust current index if requests change
  useEffect(() => {
    if (currentIndex >= activeItems.length) {
      setCurrentIndex(0);
    }
  }, [activeItems.length, currentIndex]);

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex(prev => (prev - 1 + activeItems.length) % activeItems.length);
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex(prev => (prev + 1) % activeItems.length);
  };

  const toggleSound = (e: React.MouseEvent) => {
    e.stopPropagation();
    const nextVal = !soundEnabled;
    setSoundEnabled(nextVal);
    localStorage.setItem('uyirthunai_siren_enabled', String(nextVal));
    if (nextVal) {
      setTimeout(() => playAlertChime(), 100);
    }
  };

  // Standby State when no active critical or urgent requests
  if (activeItems.length === 0) {
    return (
      <div className="relative overflow-hidden rounded-2xl bg-slate-900 border border-slate-800 text-slate-300 p-3 sm:p-4 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5">
            <span className="relative flex h-3 w-3 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
            <span className="px-2 py-0.5 rounded-md bg-emerald-950/80 border border-emerald-500/30 text-emerald-400 font-bold tracking-wider text-[10px] uppercase">
              {t('broadcast.network_active')}
            </span>
            <span className="text-slate-300 font-medium hidden md:inline">
              {t('broadcast.all_clear')}
            </span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end text-[11px] text-slate-400">
            <span className="flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-emerald-400" />
              <span>Blood Network Standby</span>
            </span>
            <button
              onClick={() => onNavigate('blood-requests')}
              className="text-red-400 hover:text-red-300 font-semibold underline underline-offset-2 ml-2"
            >
              View All Requests
            </button>
          </div>
        </div>
      </div>
    );
  }

  const currentReq = activeItems[currentIndex] || activeItems[0];
  const pendingUnits = Math.max(0, currentReq.units_required - currentReq.units_fulfilled);

  return (
    <>
      {/* Primary Emergency Broadcast Ticker Card */}
      <div
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        className={`relative overflow-hidden rounded-2xl border-2 transition-all duration-300 shadow-xl ${
          isCritical
            ? 'bg-gradient-to-r from-red-950 via-slate-950 to-red-950 border-red-500/80 text-white shadow-red-950/60 ring-2 ring-red-500/30 ring-offset-2 ring-offset-slate-950'
            : 'bg-gradient-to-r from-amber-950 via-slate-950 to-amber-950 border-amber-500/80 text-white shadow-amber-950/60 ring-2 ring-amber-500/30 ring-offset-2 ring-offset-slate-950'
        }`}
      >
        {/* Continuous Siren Active Alert Bar */}
        {hasUnviewedCritical && soundEnabled && (
          <div className="bg-red-600 text-white px-3.5 py-1.5 flex flex-wrap items-center justify-between gap-2 text-xs font-bold border-b border-red-400 animate-pulse">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-90"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-white"></span>
              </span>
              <Volume2 className="w-4 h-4 text-white animate-bounce" />
              <span>🚨 Critical Operations Alert — {unviewedCriticalRequests.length} Pending Requirement{unviewedCriticalRequests.length > 1 ? 's' : ''}</span>
            </div>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                acknowledgeAllAlerts();
              }}
              className="px-2.5 py-1 rounded-lg bg-white text-red-800 text-[11px] font-black hover:bg-red-50 transition shadow-xs flex items-center gap-1 shrink-0"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Acknowledge All</span>
            </button>
          </div>
        )}

        {/* Ambient Red Glow Bar at Top */}
        <div
          className={`h-1 w-full ${
            isCritical
              ? 'bg-gradient-to-r from-red-500 via-rose-400 to-red-600 animate-pulse'
              : 'bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600 animate-pulse'
          }`}
        />

        <div className="p-3.5 sm:p-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            {/* Left: Broadcast Header with Blinking Beacon & Alert Title */}
            <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
              {/* Dual-ring blinking beacon */}
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-red-600 text-white shadow-md shadow-red-600/40">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-90"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-white"></span>
                </span>
                <Radio className="w-3.5 h-3.5 animate-pulse" />
                <span className="text-[10px] font-black tracking-widest uppercase">
                  {t('broadcast.live')}
                </span>
              </div>

              {/* Broadcast Headline */}
              <div className="flex items-center gap-1.5">
                <span
                  className={`text-[11px] font-black tracking-wider uppercase px-2 py-0.5 rounded ${
                    isCritical
                      ? 'bg-red-500/20 text-red-300 border border-red-500/40'
                      : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  }`}
                >
                  {isCritical ? t('broadcast.critical_alert') : t('broadcast.urgent_alert')}
                </span>
                <span className="text-xs font-bold text-slate-300 hidden sm:inline">
                  [{currentIndex + 1}/{activeItems.length}]
                </span>
              </div>
            </div>

            {/* Center: Live Ticker Content */}
            <div
              onClick={() => {
                acknowledgeRequest(currentReq.id);
                onNavigate(`blood-requests/${currentReq.id}`);
              }}
              className="flex-1 min-w-0 cursor-pointer group flex flex-col sm:flex-row sm:items-center gap-2.5 sm:gap-3 py-1 sm:py-0 px-1 hover:opacity-95 transition"
            >
              {/* Prominent Blood Group Badge */}
              <div className="flex items-center gap-2 shrink-0">
                <div className="relative">
                  <span className="flex h-10 w-10 sm:h-11 sm:w-11 rounded-xl bg-red-600 text-white font-black text-sm sm:text-base flex-col items-center justify-center shrink-0 shadow-lg shadow-red-600/50 border border-white/20 animate-pulse">
                    <span>{currentReq.blood_group}</span>
                    <span className="text-[8px] font-bold tracking-tighter uppercase leading-none opacity-90">
                      Need
                    </span>
                  </span>
                </div>

                {/* Patient and Hospital */}
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-black text-white group-hover:text-red-300 transition truncate">
                      {currentReq.patient_name}
                    </span>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-red-950/80 border border-red-500/50 text-red-200 shrink-0">
                      {pendingUnits} {t('broadcast.needed')}
                    </span>
                  </div>
                  <div className="text-xs text-slate-300 flex items-center gap-1.5 truncate">
                    <Building2 className="w-3.5 h-3.5 text-red-400 shrink-0" />
                    <span className="font-medium truncate">{currentReq.hospital_name}</span>
                    <span className="text-slate-500">•</span>
                    <span className="text-slate-400 shrink-0">{currentReq.hospital_city}</span>
                  </div>
                </div>
              </div>

              {/* Urgent Clinical Need Note or Time */}
              <div className="min-w-0 hidden md:block border-l border-slate-800 pl-3">
                <p className="text-[11px] text-slate-300 line-clamp-1 italic">
                  "{currentReq.clinical_notes || t('broadcast.immediate_transfusion')}"
                </p>
                <div className="text-[10px] text-red-300 flex items-center gap-1 mt-0.5 font-semibold">
                  <Clock className="w-3 h-3 text-red-400" />
                  <span>Target: {currentReq.required_by_date}</span>
                </div>
              </div>
            </div>

            {/* Right: Controls & Direct Action Button */}
            <div className="flex items-center justify-between sm:justify-end gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-800/80">
              {/* Audio and Pause Indicators */}
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={toggleSound}
                  className={`p-1.5 rounded-lg border transition ${
                    soundEnabled
                      ? 'bg-red-600/30 border-red-500 text-red-200'
                      : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:text-white'
                  }`}
                  title={soundEnabled ? t('broadcast.audio_off') : t('broadcast.audio_on')}
                >
                  {soundEnabled ? (
                    <Volume2 className="w-3.5 h-3.5 animate-pulse text-red-400" />
                  ) : (
                    <VolumeX className="w-3.5 h-3.5" />
                  )}
                </button>

                {activeItems.length > 1 && (
                  <div className="flex items-center gap-0.5">
                    <button
                      type="button"
                      onClick={handlePrev}
                      className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition"
                      title="Previous Emergency"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={handleNext}
                      className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition"
                      title="Next Emergency"
                    >
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowAllModal(true)}
                      className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition ml-0.5"
                      title="View All Active Alerts"
                    >
                      <Layers className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>

              {/* Action Button: Jump Directly to Request Detail & Acknowledge */}
              <button
                type="button"
                onClick={() => {
                  acknowledgeRequest(currentReq.id);
                  onNavigate(`blood-requests/${currentReq.id}`);
                }}
                className="px-3.5 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-black text-xs transition flex items-center gap-1.5 shadow-md shadow-red-600/40 active:scale-95 shrink-0"
              >
                <span>{t('broadcast.respond')}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Mini-indicators when multiple critical emergencies */}
          {activeItems.length > 1 && (
            <div className="flex items-center justify-between pt-2.5 mt-2 border-t border-slate-800/60 text-[10px] text-slate-400">
              <div className="flex items-center gap-1.5">
                {activeItems.map((item, idx) => (
                  <button
                    key={item.id}
                    onClick={() => setCurrentIndex(idx)}
                    className={`h-1.5 rounded-full transition-all ${
                      idx === currentIndex
                        ? 'w-6 bg-red-500'
                        : 'w-2 bg-slate-700 hover:bg-slate-600'
                    }`}
                    title={`Switch to ${item.patient_name} (${item.blood_group})`}
                  />
                ))}
                {isPaused && (
                  <span className="text-[10px] text-slate-500 italic ml-2">
                    ({t('broadcast.paused')})
                  </span>
                )}
              </div>

              <div className="flex items-center gap-3">
                <span className="text-red-400 font-bold">
                  {criticalRequests.length} Critical Emergencies Active
                </span>
                <button
                  type="button"
                  onClick={() => setShowAllModal(true)}
                  className="hover:text-white underline underline-offset-2 font-medium"
                >
                  {t('broadcast.view_all')} ({activeItems.length})
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal: View All Active Critical Broadcasts */}
      {showAllModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-2xl w-full p-6 text-white shadow-2xl space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-red-600/20 text-red-400 border border-red-500/30">
                  <Flame className="w-5 h-5 animate-pulse" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white flex items-center gap-2">
                    <span>{t('broadcast.title')}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-red-600 text-white font-bold">
                      {activeItems.length} Active
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    Hospital operations priority queue requiring donor matching & cross-match dispatch
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={acknowledgeAllAlerts}
                  className="px-2.5 py-1 rounded-lg bg-emerald-600/30 hover:bg-emerald-600/50 border border-emerald-500/40 text-emerald-300 text-xs font-bold transition flex items-center gap-1"
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Acknowledge All</span>
                </button>
                <button
                  onClick={() => setShowAllModal(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="overflow-y-auto space-y-3 pr-1 flex-1">
              {activeItems.map((req, idx) => {
                const reqPending = Math.max(0, req.units_required - req.units_fulfilled);
                return (
                  <div
                    key={req.id}
                    onClick={() => {
                      acknowledgeRequest(req.id);
                      setShowAllModal(false);
                      onNavigate(`blood-requests/${req.id}`);
                    }}
                    className={`p-4 rounded-2xl border transition cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 group ${
                      idx === currentIndex
                        ? 'bg-red-950/40 border-red-500/80 hover:bg-red-950/60'
                        : 'bg-slate-800/60 border-slate-700/80 hover:border-red-400 hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-12 h-12 rounded-2xl bg-red-600 text-white font-black text-lg flex items-center justify-center shrink-0 shadow-md shadow-red-600/40">
                        {req.blood_group}
                      </span>
                      <div className="space-y-0.5">
                        <div className="text-sm font-bold text-white group-hover:text-red-300 transition flex items-center gap-2">
                          <span>{req.patient_name}</span>
                          <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-red-600 text-white">
                            {req.urgency_level}
                          </span>
                        </div>
                        <div className="text-xs text-slate-300 flex items-center gap-1.5">
                          <Building2 className="w-3.5 h-3.5 text-slate-400" />
                          <span>{req.hospital_name}</span>
                          <span className="text-slate-500">•</span>
                          <span>{req.hospital_city}</span>
                        </div>
                        <div className="text-[11px] text-slate-400">
                          Required: <strong>{req.units_required} units</strong> ({reqPending} pending) • Needed by {req.required_by_date}
                        </div>
                        {req.clinical_notes && (
                          <div className="text-[11px] text-red-300/90 italic line-clamp-1 mt-1">
                            {req.clinical_notes}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2 shrink-0">
                      <span className="text-[10px] font-bold px-2 py-1 rounded-md bg-slate-900 border border-slate-700 text-slate-300">
                        {t(`status.${req.status}`)}
                      </span>
                      <button
                        type="button"
                        className="px-3 py-1.5 rounded-xl bg-red-600 group-hover:bg-red-500 text-white text-xs font-bold flex items-center gap-1 transition shadow-xs"
                      >
                        <span>{t('broadcast.respond')}</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
              <span>Auto-synchronized with Central Command</span>
              <button
                onClick={() => setShowAllModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold transition"
              >
                {t('action.close')}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
