import React, { useState, useEffect } from 'react';
import {
  HeartPulse,
  UserCheck,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  Calendar,
  Clock,
  ArrowRight,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';
import { useI18n } from '../i18n.tsx';
import { apiRequest } from '../api.ts';
import { MedicalDisclaimer } from '../components/MedicalDisclaimer.tsx';

export const DonorRegistrationPage: React.FC<{ onNavigate: (page: string) => void }> = ({ onNavigate }) => {
  const { user, donorInfo, refreshMe } = useAuth();
  const { t } = useI18n();

  const [bloodGroup, setBloodGroup] = useState(donorInfo?.blood_group || 'O+');
  const [availability, setAvailability] = useState(donorInfo?.availability_status || 'available');
  const [lastDonation, setLastDonation] = useState(donorInfo?.last_donation_date || '2026-06-10');
  const [age, setAge] = useState(donorInfo?.age?.toString() || '28');
  const [gender, setGender] = useState(donorInfo?.gender || 'Female');

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (donorInfo) {
      setBloodGroup(donorInfo.blood_group);
      setAvailability(donorInfo.availability_status);
      setLastDonation(donorInfo.last_donation_date || '');
      setAge(donorInfo.age?.toString() || '28');
      setGender(donorInfo.gender || 'Female');
    }
  }, [donorInfo]);

  // Compute cooldown days
  let cooldownDays = 0;
  let canDonate = true;
  if (lastDonation) {
    const diff = Math.floor((new Date().getTime() - new Date(lastDonation).getTime()) / (1000 * 60 * 60 * 24));
    cooldownDays = diff;
    canDonate = diff >= 90;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);

    const ageNum = Number(age);
    if (ageNum < 18 || ageNum > 65) {
      setError('Eligible donor age must be between 18 and 65 years.');
      return;
    }

    setSaving(true);
    try {
      await apiRequest('/blood/donors/profile', {
        method: 'PUT',
        body: JSON.stringify({
          blood_group: bloodGroup,
          availability_status: availability,
          last_donation_date: lastDonation || null,
          age: ageNum,
          gender,
        }),
      });

      setMessage('Donor profile and availability status successfully updated!');
      await refreshMe();
    } catch (err: any) {
      setError(err.message || 'Failed to update donor profile');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-12">
      <div>
        <div className="flex items-center gap-2 text-xs font-bold text-red-600 uppercase tracking-wider">
          <HeartPulse className="w-4 h-4" />
          Volunteer Donor Profile
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">
          {t('nav.donor_profile')}
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Manage your blood group, medical eligibility cooldown, and live availability to save lives.
        </p>
      </div>

      <MedicalDisclaimer compact />

      {message && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2 font-medium">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{message}</span>
        </div>
      )}

      {error && (
        <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2 font-medium">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Cooldown Information Card */}
      <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-red-50 text-red-600 rounded-xl">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Medical Cooldown Calculator</h3>
              <p className="text-[11px] text-slate-500">Standard 90-day biological recovery guideline</p>
            </div>
          </div>
          <span
            className={`px-3 py-1 rounded-full text-xs font-bold ${
              canDonate ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
            }`}
          >
            {canDonate ? 'Eligible to Donate' : `Cooldown Active (${90 - cooldownDays} days remaining)`}
          </span>
        </div>

        <div className="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100 flex items-center justify-between">
          <span>Days since last donation:</span>
          <strong>{lastDonation ? `${cooldownDays} days` : 'No prior donation date recorded'}</strong>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">Blood Group *</label>
          <select
            value={bloodGroup}
            onChange={e => setBloodGroup(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold bg-white"
          >
            {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(bg => (
              <option key={bg} value={bg}>{bg}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">Availability Status *</label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { val: 'available', label: 'Available', color: 'border-emerald-600 bg-emerald-50 text-emerald-800' },
              { val: 'on_hold', label: 'On Hold', color: 'border-amber-600 bg-amber-50 text-amber-800' },
              { val: 'unavailable', label: 'Unavailable', color: 'border-slate-400 bg-slate-100 text-slate-700' },
            ].map(item => (
              <button
                type="button"
                key={item.val}
                onClick={() => setAvailability(item.val as any)}
                className={`py-2 px-3 rounded-xl border text-xs font-bold transition text-center ${
                  availability === item.val ? `${item.color} shadow-xs` : 'border-slate-200 text-slate-600'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Last Donation Date</label>
            <input
              type="date"
              value={lastDonation}
              onChange={e => setLastDonation(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Age (18 - 65) *</label>
            <input
              type="number"
              min={18}
              max={65}
              required
              value={age}
              onChange={e => setAge(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">Gender</label>
          <select
            value={gender}
            onChange={e => setGender(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white"
          >
            <option value="Male">Male</option>
            <option value="Female">Female</option>
            <option value="Other">Other</option>
          </select>
        </div>

        <div className="pt-2">
          <button
            type="submit"
            disabled={saving}
            className="w-full py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs transition shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {saving ? 'Saving Changes...' : 'Save Donor Profile'}
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  );
};
