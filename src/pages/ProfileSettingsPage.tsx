import React from 'react';
import { User, Shield, Globe, Phone, MapPin, Mail, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';
import { useI18n, Language } from '../i18n.tsx';

export const ProfileSettingsPage: React.FC<{ onNavigate: (page: string) => void }> = ({ onNavigate }) => {
  const { user, donorInfo } = useAuth();
  const { lang, setLang, t } = useI18n();

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-16">
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900">
          {t('nav.settings')} & Profile
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Account information, language preferences, and clinical role permissions.
        </p>
      </div>

      {/* Profile Card */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-slate-900 to-slate-700 text-white font-black text-2xl flex items-center justify-center shadow-md">
            {user?.full_name?.charAt(0) || 'U'}
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">{user?.full_name}</h2>
            <p className="text-xs text-slate-500 font-mono">{user?.email}</p>
            <span className="inline-block mt-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-red-100 text-red-800 border border-red-200">
              {user ? t(`role.${user.role}`) : 'Guest'}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-slate-100 text-xs">
          <div>
            <span className="text-slate-400 block font-medium">Contact Phone</span>
            <span className="font-bold text-slate-800 font-mono mt-0.5 block">{user?.phone || 'Not configured'}</span>
          </div>
          <div>
            <span className="text-slate-400 block font-medium">Location</span>
            <span className="font-bold text-slate-800 mt-0.5 block">{user?.locality ? `${user.locality}, ` : ''}{user?.city || 'Chennai'}</span>
          </div>
          {donorInfo && (
            <div>
              <span className="text-slate-400 block font-medium">Blood Group & Availability</span>
              <span className="font-bold text-red-600 mt-0.5 block">
                {donorInfo.blood_group} ({t(`status.${donorInfo.availability_status}`)})
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Language Switcher Card */}
      <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
          <Globe className="w-4 h-4 text-blue-600" />
          <span>Language Preference / மொழி தேர்வு</span>
        </div>
        <p className="text-xs text-slate-500">
          Switch the application interface between English and Tamil. This preference is saved permanently.
        </p>

        <div className="grid grid-cols-2 gap-3 pt-2">
          <button
            onClick={() => setLang('en')}
            className={`p-3.5 rounded-2xl border text-xs font-bold transition text-left ${
              lang === 'en'
                ? 'border-red-600 bg-red-50/50 text-red-900 ring-2 ring-red-500'
                : 'border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            <div className="text-sm font-black">English</div>
            <div className="text-[11px] text-slate-500 mt-0.5">Primary language interface</div>
          </button>

          <button
            onClick={() => setLang('ta')}
            className={`p-3.5 rounded-2xl border text-xs font-bold transition text-left ${
              lang === 'ta'
                ? 'border-red-600 bg-red-50/50 text-red-900 ring-2 ring-red-500'
                : 'border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            <div className="text-sm font-black">தமிழ் (Tamil)</div>
            <div className="text-[11px] text-slate-500 mt-0.5">இயற்கையான தமிழ் மொழிபெயர்ப்பு</div>
          </button>
        </div>
      </div>

      {/* Healthcare Network Information */}
      <div className="p-6 rounded-3xl bg-slate-900 text-white shadow-xl space-y-2 text-xs">
        <span className="text-emerald-400 font-bold uppercase tracking-wider block">
          Healthcare Operations Platform
        </span>
        <h3 className="font-bold text-white text-sm">UyirThunai — Integrated Hospital & Pharmacy Network</h3>
        <p className="text-slate-300 leading-relaxed">
          Centralized coordination platform for emergency blood bank matching, donor registries, verified prescription processing, and tracked delivery logistics.
        </p>
      </div>
    </div>
  );
};
