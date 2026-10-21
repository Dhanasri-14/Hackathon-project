import React, { useState } from 'react';
import { Shield, ArrowRight, Lock, Mail, AlertCircle, CheckCircle2, Sparkles, Building2, HeartHandshake, Pill, Truck, UserCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';
import { useI18n } from '../i18n.tsx';
import { Logo } from '../components/Logo.tsx';
import { UserRole } from '../types.ts';

export const LoginPage: React.FC<{ onNavigate: (page: string) => void }> = ({ onNavigate }) => {
  const { login, switchDemoRole } = useAuth();
  const { t } = useI18n();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login(email, password);
      onNavigate('dashboard');
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handle1ClickLogin = async (role: UserRole) => {
    setError(null);
    setSubmitting(true);
    try {
      await switchDemoRole(role);
      onNavigate('dashboard');
    } catch (err: any) {
      setError(err.message || 'Demo login failed');
    } finally {
      setSubmitting(false);
    }
  };

  const demoAccounts = [
    { role: 'hospital_staff' as UserRole, name: 'Rajesh Kannan', label: 'Hospital Blood Bank Staff', icon: <Building2 className="w-4 h-4 text-red-500" />, email: 'staff.rajesh@apollo-hospital.org' },
    { role: 'donor' as UserRole, name: 'Kavitha Ramanathan', label: 'Blood Donor (O+)', icon: <HeartHandshake className="w-4 h-4 text-rose-500" />, email: 'donor.kavitha@gmail.com' },
    { role: 'pharmacy_staff' as UserRole, name: 'Anandhan Selvaraj', label: 'Licensed Pharmacist', icon: <Pill className="w-4 h-4 text-blue-500" />, email: 'pharmacist.anand@medplus-tn.org' },
    { role: 'courier' as UserRole, name: 'Murugan Perumal', label: 'Delivery Courier Partner', icon: <Truck className="w-4 h-4 text-amber-500" />, email: 'courier.murugan@fastmed-logistics.org' },
    { role: 'patient' as UserRole, name: 'S. Priya', label: 'Patient / Requester', icon: <UserCircle className="w-4 h-4 text-teal-500" />, email: 'patient.priya@outlook.com' },
    { role: 'admin' as UserRole, name: 'Dr. Meenakshi Sundaram', label: 'Administrator', icon: <Shield className="w-4 h-4 text-purple-500" />, email: 'admin@uyirthunai.org' },
  ];

  return (
    <div className="max-w-4xl mx-auto py-6 sm:py-12">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
        {/* Left: Email/Password Form */}
        <div className="p-8 rounded-3xl bg-white border border-slate-200 shadow-xl space-y-6">
          <div className="space-y-2">
            <Logo size="md" showTagline={true} />
            <h2 className="text-xl font-bold text-slate-900 pt-3">Sign In to UyirThunai</h2>
            <p className="text-xs text-slate-500">
              Enter your credentials to access role-specific emergency services.
            </p>
          </div>

          {error && (
            <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="e.g. staff.rajesh@apollo-hospital.org"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-red-500 focus:outline-hidden"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-red-500 focus:outline-hidden"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {submitting ? 'Authenticating...' : t('nav.login')}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="pt-2 text-center text-xs text-slate-500 border-t border-slate-100">
            Don&apos;t have an account?{' '}
            <button
              onClick={() => onNavigate('register')}
              className="font-bold text-red-600 hover:underline"
            >
              Create Account
            </button>
          </div>
        </div>

        {/* Right: Quick Access Staff & User Portals */}
        <div className="p-8 rounded-3xl bg-slate-900 text-white border border-slate-800 shadow-xl space-y-5">
          <div className="flex items-center gap-2 text-blue-400 text-xs font-bold uppercase tracking-wider">
            <Building2 className="w-4 h-4" />
            Verified Department Portals
          </div>
          <h3 className="text-lg font-bold text-white">Direct Department Sign-In</h3>
          <p className="text-xs text-slate-300 leading-relaxed">
            Select your assigned healthcare department or account profile to access your active session:
          </p>

          <div className="space-y-2.5">
            {demoAccounts.map(acc => (
              <button
                key={acc.role}
                onClick={() => handle1ClickLogin(acc.role)}
                disabled={submitting}
                className="w-full p-3 rounded-xl bg-slate-800 hover:bg-slate-700/80 border border-slate-700 hover:border-slate-500 text-left transition flex items-center justify-between group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-slate-900 shrink-0">{acc.icon}</div>
                  <div>
                    <div className="text-xs font-bold text-white group-hover:text-blue-300 transition">
                      {acc.name}
                    </div>
                    <div className="text-[11px] text-slate-400">{acc.label}</div>
                  </div>
                </div>
                <span className="text-[11px] text-slate-300 group-hover:text-white font-semibold flex items-center gap-1">
                  Login →
                </span>
              </button>
            ))}
          </div>

          <p className="text-[11px] text-slate-400 pt-2 border-t border-slate-800">
            Connected to central hospital operations, blood bank registry, and pharmacy network.
          </p>
        </div>
      </div>
    </div>
  );
};
