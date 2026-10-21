import React, { useState, useEffect } from 'react';
import {
  HeartPulse,
  Pill,
  ShieldCheck,
  Activity,
  Truck,
  Users,
  Building2,
  ArrowRight,
  CheckCircle2,
  Sparkles,
  PhoneCall,
  Clock,
  FileCheck,
} from 'lucide-react';
import { Logo } from '../components/Logo.tsx';
import { MedicalDisclaimer } from '../components/MedicalDisclaimer.tsx';
import { useAuth } from '../context/AuthContext.tsx';
import { useI18n } from '../i18n.tsx';
import { apiRequest } from '../api.ts';
import { DashboardStats, UserRole } from '../types.ts';

export const LandingPage: React.FC<{ onNavigate: (page: string) => void }> = ({ onNavigate }) => {
  const { user, switchDemoRole } = useAuth();
  const { t } = useI18n();

  const [stats, setStats] = useState<DashboardStats | null>(null);

  useEffect(() => {
    // Try to load public or demo stats
    apiRequest<DashboardStats>('/dashboard/stats')
      .then(setStats)
      .catch(() => {
        // Fallback default statistics for display
        setStats({
          blood: {
            totalRequests: 10,
            criticalRequests: 3,
            activeRequests: 6,
            fulfilledRequests: 2,
            totalDonors: 22,
            availableDonors: 19,
            bloodDistribution: [],
          },
          pharmacy: {
            totalMedicines: 26,
            lowStockCount: 5,
            pendingPrescriptions: 2,
            activeOrders: 4,
            deliveredOrders: 2,
          },
        });
      });
  }, []);

  const handleQuickRole = async (role: UserRole) => {
    await switchDemoRole(role);
    onNavigate('dashboard');
  };

  return (
    <div className="space-y-12 pb-16">
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-3xl bg-radial from-slate-800 via-slate-900 to-slate-950 text-white p-8 sm:p-12 lg:p-16 border border-slate-800 shadow-2xl">
        <div className="relative z-10 max-w-3xl space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-600/20 border border-red-500/30 text-red-300 text-xs font-bold tracking-wide">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
            RISQUADATHON-2.0 ACADEMIC HACKATHON PROJECT
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-tight">
            <span className="text-white">UyirThunai</span>
            <span className="block text-2xl sm:text-3xl lg:text-4xl text-slate-300 font-medium mt-2">
              {t('app.tagline')}
            </span>
          </h1>

          <p className="text-slate-300 text-sm sm:text-base leading-relaxed max-w-2xl">
            A unified, high-reliability healthcare coordination system combining{' '}
            <strong className="text-white">Emergency Blood Requirement & Donor Matching</strong>{' '}
            with{' '}
            <strong className="text-white">Licensed Pharmacy Prescription Fulfilment & Tracked Medicine Delivery</strong>.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              onClick={() => onNavigate(user ? 'dashboard' : 'login')}
              className="px-6 py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-sm shadow-lg shadow-red-600/30 transition flex items-center gap-2"
            >
              <span>{user ? t('nav.dashboard') : 'Launch Demo Portal'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => onNavigate('blood-requests')}
              className="px-5 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold text-sm transition"
            >
              View Active Blood Requests
            </button>
            <button
              onClick={() => onNavigate('medicines')}
              className="px-5 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold text-sm transition"
            >
              Search Medicines
            </button>
          </div>
        </div>

        {/* Decorative background glow */}
        <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-red-600/10 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 rounded-full bg-blue-600/10 blur-3xl pointer-events-none" />
      </section>

      {/* Live System Metrics Bar */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="p-3 rounded-xl bg-red-50 text-red-600 shrink-0">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900">
              {stats?.blood.totalDonors || 22}
            </div>
            <div className="text-xs font-semibold text-slate-500">Registered Donors</div>
            <div className="text-[11px] text-emerald-600 font-medium">
              {stats?.blood.availableDonors || 19} actively available
            </div>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="p-3 rounded-xl bg-rose-50 text-rose-600 shrink-0">
            <HeartPulse className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900">
              {stats?.blood.totalRequests || 10}
            </div>
            <div className="text-xs font-semibold text-slate-500">Blood Requests</div>
            <div className="text-[11px] text-red-600 font-medium">
              {stats?.blood.criticalRequests || 3} critical cases
            </div>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="p-3 rounded-xl bg-blue-50 text-blue-600 shrink-0">
            <Pill className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900">
              {stats?.pharmacy.totalMedicines || 26}
            </div>
            <div className="text-xs font-semibold text-slate-500">Medicines in Catalogue</div>
            <div className="text-[11px] text-blue-600 font-medium">8 Therapeutic categories</div>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="p-3 rounded-xl bg-amber-50 text-amber-600 shrink-0">
            <Truck className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900">
              {(stats?.pharmacy.activeOrders || 4) + (stats?.pharmacy.deliveredOrders || 2)}
            </div>
            <div className="text-xs font-semibold text-slate-500">Total Orders</div>
            <div className="text-[11px] text-emerald-600 font-medium">Last-mile courier tracked</div>
          </div>
        </div>
      </section>

      {/* Fast 1-Click Persona Testing Panel for Evaluators */}
      <section className="p-6 sm:p-8 rounded-3xl bg-slate-900 text-white border border-slate-800 shadow-xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 text-amber-400 text-xs font-bold uppercase tracking-wider">
              <Sparkles className="w-4 h-4" />
              Evaluation & Judging Fast-Track
            </div>
            <h2 className="text-xl sm:text-2xl font-bold mt-1">1-Click Role Switcher</h2>
            <p className="text-xs text-slate-300 mt-0.5">
              Switch directly into any of the 6 roles without entering passwords to test each role&apos;s permissions and workflows.
            </p>
          </div>
          <div className="text-xs text-slate-400 bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700">
            Database: Persistent SQLite with Foreign Keys
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            { role: 'hospital_staff' as UserRole, name: 'Hospital Staff', desc: 'Blood Bank Officer', color: 'hover:border-red-500 hover:bg-red-950/30' },
            { role: 'donor' as UserRole, name: 'Blood Donor', desc: 'O+ Donor Profile', color: 'hover:border-rose-500 hover:bg-rose-950/30' },
            { role: 'pharmacy_staff' as UserRole, name: 'Pharmacist', desc: 'Rx Reviewer', color: 'hover:border-blue-500 hover:bg-blue-950/30' },
            { role: 'courier' as UserRole, name: 'Courier Partner', desc: 'Delivery Fleet', color: 'hover:border-amber-500 hover:bg-amber-950/30' },
            { role: 'patient' as UserRole, name: 'Patient', desc: 'Medicine Buyer', color: 'hover:border-teal-500 hover:bg-teal-950/30' },
            { role: 'admin' as UserRole, name: 'Administrator', desc: 'Audit & Controls', color: 'hover:border-purple-500 hover:bg-purple-950/30' },
          ].map(p => (
            <button
              key={p.role}
              onClick={() => handleQuickRole(p.role)}
              className={`p-3.5 rounded-2xl bg-slate-800/80 border border-slate-700 text-left transition text-slate-200 ${p.color}`}
            >
              <div className="text-xs font-bold text-white leading-tight">{p.name}</div>
              <div className="text-[10px] text-slate-400 mt-0.5">{p.desc}</div>
              <div className="mt-2 text-[10px] text-red-400 font-semibold flex items-center gap-1">
                <span>Login</span> →
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* Module Overview: Two Pillars */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Module A */}
        <div className="p-8 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-6 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="inline-flex p-3 rounded-2xl bg-red-100 text-red-600">
              <HeartPulse className="w-8 h-8" />
            </div>
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-red-600">Module A</span>
              <h3 className="text-2xl font-black text-slate-900 mt-1">
                Emergency Blood & Donor Coordination
              </h3>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                Connects critical hospital blood emergencies with verified compatible donors. Features an immunological matching engine evaluating ABO/Rh compatibility, location proximity, and cooldown intervals.
              </p>
            </div>

            <ul className="space-y-2.5 text-xs text-slate-700">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Multi-factor compatibility scoring (Exact match, universal donor, proximity)</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Immediate in-app notifications to candidate donors</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Donor accept/decline response tracking & hospital clinical verification</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Strict donor privacy protection (phone masking for unverified users)</span>
              </li>
            </ul>
          </div>

          <div className="pt-4 border-t border-slate-100">
            <button
              onClick={() => onNavigate('blood-requests')}
              className="w-full py-2.5 px-4 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs transition flex items-center justify-center gap-2 shadow-xs"
            >
              <span>Explore Blood Requests</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Module B */}
        <div className="p-8 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-6 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="inline-flex p-3 rounded-2xl bg-blue-100 text-blue-600">
              <Pill className="w-8 h-8" />
            </div>
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-blue-600">Module B</span>
              <h3 className="text-2xl font-black text-slate-900 mt-1">
                Pharmacy Prescription & Delivery System
              </h3>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                Complete workflow from browsing essential medications to doctor prescription upload, licensed pharmacist review, atomic stock validation, and courier status dispatch.
              </p>
            </div>

            <ul className="space-y-2.5 text-xs text-slate-700">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Catalogue of 26+ medicines with Indian Rupee (₹) pricing & stock status</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Prescription upload with drag-and-drop & demo 1-click sample prescriptions</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Pharmacist approval queue with approval notes & rejection reasons</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Live status tracking: Submitted → Approved → Processing → Out for Delivery → Delivered</span>
              </li>
            </ul>
          </div>

          <div className="pt-4 border-t border-slate-100">
            <button
              onClick={() => onNavigate('medicines')}
              className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition flex items-center justify-center gap-2 shadow-xs"
            >
              <span>Explore Medicine Catalogue</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* Medical Safeguards Banner */}
      <MedicalDisclaimer />
    </div>
  );
};
