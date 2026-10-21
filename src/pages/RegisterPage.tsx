import React, { useState } from 'react';
import { Shield, ArrowRight, Lock, Mail, User, Phone, MapPin, AlertCircle, HeartPulse } from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';
import { useI18n } from '../i18n.tsx';
import { Logo } from '../components/Logo.tsx';
import { UserRole } from '../types.ts';

export const RegisterPage: React.FC<{ onNavigate: (page: string) => void }> = ({ onNavigate }) => {
  const { register } = useAuth();
  const { t } = useI18n();

  const [role, setRole] = useState<UserRole>('donor');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('Chennai');
  const [locality, setLocality] = useState('');

  // Donor-specific fields
  const [bloodGroup, setBloodGroup] = useState('O+');
  const [age, setAge] = useState('28');
  const [gender, setGender] = useState('Male');
  const [consent, setConsent] = useState(true);

  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (role === 'donor') {
      const ageNum = Number(age);
      if (ageNum < 18 || ageNum > 65) {
        setError('Blood donors must be between 18 and 65 years of age according to medical guidelines.');
        return;
      }
      if (!consent) {
        setError('Please check consent to receive emergency blood notifications.');
        return;
      }
    }

    setSubmitting(true);
    try {
      await register({
        role,
        full_name: fullName,
        email,
        password,
        phone,
        city,
        locality,
        blood_group: role === 'donor' ? bloodGroup : undefined,
        age: role === 'donor' ? Number(age) : undefined,
        gender: role === 'donor' ? gender : undefined,
      });
      onNavigate('dashboard');
    } catch (err: any) {
      setError(err.message || 'Registration failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-8">
      <div className="p-8 rounded-3xl bg-white border border-slate-200 shadow-xl space-y-6">
        <div className="space-y-2">
          <Logo size="md" showTagline={true} />
          <h2 className="text-xl font-bold text-slate-900 pt-2">Create an Account</h2>
          <p className="text-xs text-slate-500">
            Join the UyirThunai emergency coordination and healthcare delivery network.
          </p>
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Role selector */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Select Role</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {[
                { r: 'donor' as UserRole, label: 'Blood Donor' },
                { r: 'patient' as UserRole, label: 'Patient / Requester' },
                { r: 'hospital_staff' as UserRole, label: 'Hospital Blood Bank' },
                { r: 'pharmacy_staff' as UserRole, label: 'Pharmacy Staff' },
                { r: 'courier' as UserRole, label: 'Delivery Courier' },
                { r: 'admin' as UserRole, label: 'Administrator' },
              ].map(item => (
                <button
                  type="button"
                  key={item.r}
                  onClick={() => setRole(item.r)}
                  className={`p-2.5 rounded-xl border text-xs font-bold transition text-center ${
                    role === item.r
                      ? 'border-red-600 bg-red-50 text-red-700 shadow-xs'
                      : 'border-slate-200 hover:border-slate-300 text-slate-600'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Full Name *</label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  placeholder="e.g. Ramesh Kumar"
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-red-500 focus:outline-hidden"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Email Address *</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="ramesh@example.com"
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-red-500 focus:outline-hidden"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Password *</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-red-500 focus:outline-hidden"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Contact Phone *</label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  required
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="+91 98401 23456"
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-red-500 focus:outline-hidden"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">City / District *</label>
              <select
                value={city}
                onChange={e => setCity(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-red-500 focus:outline-hidden bg-white"
              >
                <option value="Chennai">Chennai</option>
                <option value="Coimbatore">Coimbatore</option>
                <option value="Madurai">Madurai</option>
                <option value="Trichy">Trichy</option>
                <option value="Salem">Salem</option>
                <option value="Tirunelveli">Tirunelveli</option>
                <option value="Vellore">Vellore</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Locality / Area</label>
              <div className="relative">
                <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  value={locality}
                  onChange={e => setLocality(e.target.value)}
                  placeholder="e.g. T. Nagar / Gandhipuram"
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-red-500 focus:outline-hidden"
                />
              </div>
            </div>
          </div>

          {/* Donor specific section */}
          {role === 'donor' && (
            <div className="p-4 rounded-2xl bg-rose-50/70 border border-rose-200 space-y-3">
              <div className="flex items-center gap-2 text-rose-800 font-bold text-xs">
                <HeartPulse className="w-4 h-4 text-rose-600" />
                <span>Donor Health & Eligibility Details</span>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Blood Group *</label>
                  <select
                    value={bloodGroup}
                    onChange={e => setBloodGroup(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-bold bg-white"
                  >
                    {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(bg => (
                      <option key={bg} value={bg}>{bg}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Age (18-65) *</label>
                  <input
                    type="number"
                    min={18}
                    max={65}
                    value={age}
                    onChange={e => setAge(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs bg-white"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Gender</label>
                  <select
                    value={gender}
                    onChange={e => setGender(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs bg-white"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={consent}
                  onChange={e => setConsent(e.target.checked)}
                  className="rounded text-red-600 focus:ring-red-500"
                />
                <span>I consent to receive emergency blood matching alerts in my locality.</span>
              </label>
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs transition shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {submitting ? 'Creating Account...' : 'Complete Registration'}
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="pt-2 text-center text-xs text-slate-500 border-t border-slate-100">
          Already registered?{' '}
          <button
            onClick={() => onNavigate('login')}
            className="font-bold text-slate-900 hover:underline"
          >
            Sign In Here
          </button>
        </div>
      </div>
    </div>
  );
};
