import React, { useEffect, useState, useRef } from 'react';
import { Bell, HeartPulse, ShoppingBag, X, Volume2, VolumeX } from 'lucide-react';
import { apiRequest } from '../api.ts';
import { useAuth } from '../context/AuthContext.tsx';
import { NotificationItem } from '../types.ts';

export const NotificationAlertSound: React.FC<{ onNavigate: (page: string) => void }> = ({ onNavigate }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [activeToast, setActiveToast] = useState<NotificationItem | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const lastNotifCountRef = useRef(0);

  const fetchNotifs = async () => {
    if (!user) return;
    try {
      const res = await apiRequest<{ notifications: NotificationItem[] }>('/notifications?unread=true');
      const newNotifs = res.notifications || [];
      
      // If count increased, trigger sound and toast
      if (newNotifs.length > lastNotifCountRef.current) {
        const latest = newNotifs[0];
        setActiveToast(latest);
        if (soundEnabled) playMedicalChime();
        
        // Auto-dismiss toast after 8 seconds
        setTimeout(() => {
          setActiveToast(null);
        }, 8000);
      }
      
      setNotifications(newNotifs);
      lastNotifCountRef.current = newNotifs.length;
    } catch (err) {
      // ignore
    }
  };

  useEffect(() => {
    fetchNotifs();
    const interval = setInterval(fetchNotifs, 10000);
    return () => clearInterval(interval);
  }, [user, soundEnabled]);

  const playMedicalChime = () => {
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      // Medical "pager" chime (E5 -> A5)
      osc.frequency.setValueAtTime(659.25, ctx.currentTime); 
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.1);

      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.6);
    } catch (e) {
      // Audio context policy
    }
  };

  if (!user) return null;

  return (
    <>
      {/* Subtle Toast Notification */}
      {activeToast && (
        <div className="fixed top-20 right-6 z-[60] animate-in slide-in-from-right duration-500 max-w-sm w-full">
          <div 
            onClick={() => {
              if (activeToast.link) onNavigate(activeToast.link.replace('/', ''));
              setActiveToast(null);
            }}
            className="p-4 bg-white border border-slate-200 rounded-3xl shadow-2xl flex items-start gap-4 cursor-pointer hover:border-blue-300 transition-colors"
          >
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
              activeToast.type === 'blood_request' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'
            }`}>
              {activeToast.type === 'blood_request' ? <HeartPulse className="w-6 h-6" /> : <ShoppingBag className="w-6 h-6" />}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Medical Alert</span>
                <button 
                  onClick={(e) => { e.stopPropagation(); setActiveToast(null); }}
                  className="p-1 rounded-full hover:bg-slate-100 text-slate-400"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
              <h4 className="text-xs font-black text-slate-900 truncate">{activeToast.title}</h4>
              <p className="text-[11px] text-slate-500 line-clamp-2 mt-0.5">{activeToast.message}</p>
            </div>
          </div>
        </div>
      )}

      {/* Floating Unread Indicator with Sound Toggle */}
      {notifications.length > 0 && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2">
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`p-3 rounded-full shadow-lg transition-all border-2 ${
              soundEnabled ? 'bg-blue-600 text-white border-blue-400' : 'bg-slate-800 text-slate-400 border-slate-600'
            }`}
            title={soundEnabled ? 'Mute Alerts' : 'Unmute Alerts'}
          >
            {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
          </button>
          
          <button
            onClick={() => onNavigate('notifications')}
            className="group relative flex items-center gap-3 pl-4 pr-6 py-3 bg-slate-900 text-white rounded-full shadow-2xl border-2 border-red-500 hover:bg-slate-800 transition-all"
          >
            <div className="relative">
              <Bell className="w-5 h-5" />
              <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-600 text-[10px] font-black flex items-center justify-center rounded-full border-2 border-slate-900">
                {notifications.length}
              </span>
            </div>
            <div className="text-left hidden sm:block">
              <div className="text-[10px] font-black uppercase tracking-widest text-red-400 leading-none mb-0.5">Alerts Active</div>
              <div className="text-[11px] font-bold text-white leading-none">View Clinical Updates</div>
            </div>
          </button>
        </div>
      )}
    </>
  );
};
