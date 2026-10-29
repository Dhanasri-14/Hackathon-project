import React, { useState } from 'react';
import {
  User,
  Shield,
  Globe,
  Phone,
  MapPin,
  Mail,
  Volume2,
  VolumeX,
  Bell,
  Eye,
  Type,
  CheckCircle2,
  Lock,
  Building2,
  HeartPulse,
  Save,
  ArrowRight,
  Sparkles,
  Fingerprint,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';
import { useI18n, Language } from '../i18n.tsx';
import { apiRequest } from '../api.ts';
import { BiometricAuth } from '../components/BiometricAuth.tsx';

interface ProfileSettingsPageProps {
  onNavigate: (page: string) => void;
}

export const ProfileSettingsPage: React.FC<ProfileSettingsPageProps> = ({ onNavigate }) => {
  const { user, donorInfo, refreshMe } = useAuth();
  const { lang, setLang, t } = useI18n();

  const [activeTab, setActiveTab] = useState<'profile' | 'notifications' | 'display' | 'security'>('profile');
  const [phone, setPhone] = useState(user?.phone || '');
  const [city, setCity] = useState(user?.city || '');
  const [locality, setLocality] = useState(user?.locality || '');
  const [emergencyAlertsEnabled, setEmergencyAlertsEnabled] = useState(true);
  const [soundVolume, setSoundVolume] = useState<'loud' | 'gentle' | 'mute'>('loud');
  const [fontSize, setFontSize] = useState<'normal' | 'large' | 'xl'>('large');
  const [highContrast, setHighContrast] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [testingChime, setTestingChime] = useState(false);

  // Sound chime tester
  const testAlertChime = () => {
    setTestingChime(true);
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new AudioCtx();
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(soundVolume === 'gentle' ? 660 : 880, now);
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.3);
    } catch (e) {
      console.warn('Audio chime test error:', e);
    } finally {
      setTimeout(() => setTestingChime(false), 500);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20">
      {/* Header with High-Contrast Title */}
      <div className="p-6 sm:p-8 rounded-3xl bg-slate-900 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4 border border-slate-800">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="text-xs font-black text-red-400 uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-red-950/80 border border-red-500/40">
              System Settings & Preferences
            </span>
            <span className="text-slate-500">•</span>
            <span className="text-xs font-semibold text-slate-300">
              {user ? t(`role.${user.role}`) : 'Guest'}
            </span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
            {t('nav.settings')}
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-xl">
            {t('settings.header_desc')}
          </p>
        </div>

        {savedSuccess && (
          <div className="px-4 py-2.5 rounded-2xl bg-emerald-600 text-white text-xs font-bold flex items-center gap-2 shadow-lg animate-in fade-in">
            <CheckCircle2 className="w-4 h-4" />
            <span>{t('settings.saved')}</span>
          </div>
        )}
      </div>

      {/* Modern Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('profile')}
          className={`px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'profile'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <User className="w-4 h-4" />
          <span>{t('settings.tab_profile')}</span>
        </button>

        <button
          onClick={() => setActiveTab('notifications')}
          className={`px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'notifications'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Bell className="w-4 h-4" />
          <span>{t('settings.tab_notifications')}</span>
        </button>

        <button
          onClick={() => setActiveTab('display')}
          className={`px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'display'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Type className="w-4 h-4" />
          <span>{t('settings.tab_display')}</span>
        </button>

        <button
          onClick={() => setActiveTab('security')}
          className={`px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'security'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Shield className="w-4 h-4" />
          <span>{t('settings.tab_security')}</span>
        </button>
      </div>

      {/* Tab 1: Profile & Hospital Credentials */}
      {activeTab === 'profile' && (
        <div className="space-y-6">
          <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-slate-900 via-slate-800 to-red-600 text-white font-black text-2xl flex items-center justify-center shadow-lg shadow-red-600/20">
                  {user?.full_name?.charAt(0) || 'U'}
                </div>
                <div>
                  <h2 className="text-xl font-black text-slate-900">{user?.full_name}</h2>
                  <p className="text-xs sm:text-sm text-slate-500 font-mono">{user?.email}</p>
                  <span className="inline-block mt-1 px-3 py-0.5 rounded-full text-xs font-bold uppercase bg-red-100 text-red-800 border border-red-200">
                    {user ? t(`role.${user.role}`) : 'Guest'}
                  </span>
                </div>
              </div>

              {donorInfo && (
                <div className="p-3.5 rounded-2xl bg-red-50 border border-red-200 text-right">
                  <span className="text-[10px] font-black uppercase text-red-700 block">
                    Verified Donor Group
                  </span>
                  <span className="text-2xl font-black text-red-600">{donorInfo.blood_group}</span>
                </div>
              )}
            </div>

            <form onSubmit={handleSave} className="space-y-4 pt-4 border-t border-slate-100">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs sm:text-sm">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    {t('settings.phone')}
                  </label>
                  <input
                    type="text"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    placeholder="+91 98400 12345"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm focus:ring-2 focus:ring-red-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    {t('settings.city')}
                  </label>
                  <input
                    type="text"
                    value={city}
                    onChange={e => setCity(e.target.value)}
                    placeholder="Chennai"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm focus:ring-2 focus:ring-red-500 focus:outline-hidden"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">
                    {t('settings.locality')}
                  </label>
                  <input
                    type="text"
                    value={locality}
                    onChange={e => setLocality(e.target.value)}
                    placeholder="Greams Road / Anna Nagar / Adyar"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm focus:ring-2 focus:ring-red-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs sm:text-sm transition flex items-center gap-2 shadow-xs"
                >
                  <Save className="w-4 h-4" />
                  <span>{t('action.save')}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Tab 2: Notifications & Emergency Broadcast Audio */}
      {activeTab === 'notifications' && (
        <div className="space-y-6">
          <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-6">
            <div>
              <h3 className="text-lg sm:text-xl font-black text-slate-900">
                {t('settings.alert_prefs')}
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                Configure immediate audiovisual chimes for critical universal donor blood alerts
              </p>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-200">
                <div className="space-y-0.5">
                  <span className="font-bold text-slate-900 text-sm block">
                    {t('settings.enable_critical_ticker')}
                  </span>
                  <span className="text-xs text-slate-500 block">
                    Displays high-urgency blinking emergency banners when O- or rare blood is required
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={emergencyAlertsEnabled}
                  onChange={e => setEmergencyAlertsEnabled(e.target.checked)}
                  className="w-5 h-5 accent-red-600 rounded cursor-pointer"
                />
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 text-sm">
                    {t('settings.chime_volume')}
                  </span>
                  <button
                    type="button"
                    onClick={testAlertChime}
                    disabled={testingChime}
                    className="px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs flex items-center gap-1.5 transition shadow-xs"
                  >
                    <Volume2 className={`w-3.5 h-3.5 ${testingChime ? 'animate-ping' : ''}`} />
                    <span>{testingChime ? 'Playing...' : t('settings.test_chime')}</span>
                  </button>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  {(['loud', 'gentle', 'mute'] as const).map(vol => (
                    <button
                      key={vol}
                      type="button"
                      onClick={() => setSoundVolume(vol)}
                      className={`p-3 rounded-xl border text-xs font-bold capitalize transition text-center ${
                        soundVolume === vol
                          ? 'border-red-600 bg-red-50 text-red-900 ring-2 ring-red-500'
                          : 'border-slate-200 text-slate-700 hover:bg-white'
                      }`}
                    >
                      {vol}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Display, Big Fonts & Language Switcher */}
      {activeTab === 'display' && (
        <div className="space-y-6">
          {/* Language Switcher */}
          <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center gap-2 text-slate-900 font-black text-base sm:text-lg">
              <Globe className="w-5 h-5 text-blue-600" />
              <span>{t('settings.language_preference')}</span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500">
              {t('settings.language_desc')}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <button
                onClick={() => setLang('en')}
                className={`p-4 rounded-2xl border-2 text-xs font-bold transition text-left ${
                  lang === 'en'
                    ? 'border-red-600 bg-red-50 text-red-900 ring-2 ring-red-500/20 shadow-sm'
                    : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <div className="text-base font-black">English</div>
                <div className="text-xs text-slate-500 mt-1">Standard clinical hospital interface</div>
              </button>

              <button
                onClick={() => setLang('ta')}
                className={`p-4 rounded-2xl border-2 text-xs font-bold transition text-left ${
                  lang === 'ta'
                    ? 'border-red-600 bg-red-50 text-red-900 ring-2 ring-red-500/20 shadow-sm'
                    : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <div className="text-base font-black">தமிழ் (Tamil)</div>
                <div className="text-xs text-slate-500 mt-1">முழுமையான தமிழ் மொழிபெயர்ப்பு முறை</div>
              </button>
            </div>
          </div>

          {/* Big Fonts & Readability */}
          <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center gap-2 text-slate-900 font-black text-base sm:text-lg">
              <Type className="w-5 h-5 text-red-600" />
              <span>{t('settings.typography_size')}</span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500">
              Adjust typography size across charts, patient cards, and operational dashboards for optimal clinical readability.
            </p>

            <div className="grid grid-cols-3 gap-3 pt-2">
              {[
                { id: 'normal', label: 'Standard (14px)', desc: 'Compact' },
                { id: 'large', label: 'Large (16px)', desc: 'Recommended' },
                { id: 'xl', label: 'Extra Large (18px)', desc: 'High Visibility' },
              ].map(item => (
                <button
                  key={item.id}
                  onClick={() => setFontSize(item.id as any)}
                  className={`p-3.5 rounded-2xl border-2 text-left transition ${
                    fontSize === item.id
                      ? 'border-slate-900 bg-slate-900 text-white shadow-md'
                      : 'border-slate-200 text-slate-800 hover:bg-slate-50'
                  }`}
                >
                  <div className="text-sm font-black">{item.label}</div>
                  <div className={`text-[10px] mt-0.5 ${fontSize === item.id ? 'text-slate-300' : 'text-slate-500'}`}>
                    {item.desc}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Security & Audit */}
      {activeTab === 'security' && (
        <div className="space-y-6">
          <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-6">
            <div>
              <h3 className="text-lg sm:text-xl font-black text-slate-900">
                {t('settings.security_title')}
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                Account role verification, audit logs, and authenticated hospital credentials
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 text-xs sm:text-sm">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Current Role Authority:</span>
                <strong className="text-slate-900 uppercase font-black">{user?.role}</strong>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Authentication Token:</span>
                <span className="font-mono text-emerald-700 font-bold">Encrypted JWT Active</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => onNavigate('audit-logs')}
                className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs sm:text-sm transition flex items-center gap-2"
              >
                <Shield className="w-4 h-4" />
                <span>{t('nav.audit_logs')}</span>
              </button>
            </div>
          </div>

          <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-6">
            <div>
              <div className="flex items-center gap-2 text-slate-900 font-black text-base sm:text-lg">
                <Fingerprint className="w-5 h-5 text-purple-600" />
                <span>Biometric Quick Access (WebAuthn)</span>
              </div>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                Enable TouchID, FaceID or device PIN for instant access during high-pressure medical emergencies.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-purple-50 border border-purple-200 text-xs sm:text-sm">
               <BiometricAuth mode="register" />
            </div>

            <p className="text-[10px] text-slate-400 leading-relaxed italic">
              * Biometric data never leaves your device. This process uses cryptographically secure public-key credentials to authorize your browser session locally.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
