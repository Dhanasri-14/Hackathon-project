import React, { useState, useEffect } from 'react';
import {
  HeartPulse,
  Pill,
  Users,
  Truck,
  AlertTriangle,
  Clock,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  Building2,
  FileText,
  Boxes,
  PlusCircle,
  RefreshCw,
  Eye,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';
import { useI18n } from '../i18n.tsx';
import { apiRequest } from '../api.ts';
import { DashboardStats, BloodRequest, Order, Prescription } from '../types.ts';
import { MedicalDisclaimer } from '../components/MedicalDisclaimer.tsx';
import { EmergencyBroadcastTicker } from '../components/EmergencyBroadcastTicker.tsx';
import { BloodInventoryBarChart } from '../components/BloodInventoryBarChart.tsx';
import { ECGPulseWave } from '../components/ECGPulseWave.tsx';
import { DashboardVoiceAssistantWidget } from '../components/DashboardVoiceAssistantWidget.tsx';
import { BiometricAuth } from '../components/BiometricAuth.tsx';
import { Fingerprint, Mic } from 'lucide-react';

export const DashboardPage: React.FC<{ onNavigate: (page: string) => void }> = ({ onNavigate }) => {
  const { user, donorInfo, refreshMe } = useAuth();
  const { t, lang } = useI18n();

  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [allBloodRequests, setAllBloodRequests] = useState<BloodRequest[]>([]);
  const [recentRequests, setRecentRequests] = useState<BloodRequest[]>([]);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [pendingPrescriptions, setPendingPrescriptions] = useState<Prescription[]>([]);
  const [loading, setLoading] = useState(true);
  const [showQRModal, setShowQRModal] = useState(false);

  // Donor availability state
  const [availStatus, setAvailStatus] = useState<string>(donorInfo?.availability_status || 'available');
  const [updatingAvail, setUpdatingAvail] = useState(false);

  const fetchDashboardData = async (silent = false) => {
    if (!user) return;
    if (!silent) setLoading(true);
    try {
      const [statsRes, reqsRes, ordersRes] = await Promise.all([
        apiRequest<DashboardStats>('/dashboard/stats'),
        apiRequest<{ requests: BloodRequest[] }>('/blood/requests'),
        apiRequest<{ orders: Order[] }>('/orders'),
      ]);

      setStats(statsRes);
      setAllBloodRequests(reqsRes.requests);
      setRecentRequests(reqsRes.requests.slice(0, 5));
      setRecentOrders(ordersRes.orders.slice(0, 5));

      if (user?.role === 'pharmacy_staff' || user?.role === 'admin') {
        const rxRes = await apiRequest<{ prescriptions: Prescription[] }>('/prescriptions?status=Submitted');
        setPendingPrescriptions(rxRes.prescriptions.slice(0, 5));
      }
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    // Real-time polling every 15s to update emergency broadcast ticker and network stats
    const interval = setInterval(() => {
      fetchDashboardData(true);
    }, 15000);
    return () => clearInterval(interval);
  }, [user]);

  const handleUpdateAvailability = async (newStatus: string) => {
    setUpdatingAvail(true);
    try {
      await apiRequest('/blood/donors/profile', {
        method: 'PUT',
        body: JSON.stringify({ availability_status: newStatus }),
      });
      setAvailStatus(newStatus);
      await refreshMe();
    } catch (err) {
      console.error(err);
    } finally {
      setUpdatingAvail(false);
    }
  };

  const getUrgencyBadge = (urgency: string) => {
    switch (urgency) {
      case 'critical':
        return <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-red-600 text-white animate-pulse">Critical</span>;
      case 'urgent':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-amber-500 text-slate-950">Urgent</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[10px] font-semibold uppercase bg-slate-200 text-slate-700">Standard</span>;
    }
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Top Banner Greeting */}
      <div className="p-6 sm:p-8 rounded-3xl bg-slate-900 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4 border border-slate-800">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-red-400 uppercase tracking-wider">
              {t('app.name')} Central Command
            </span>
            <span className="text-slate-600">•</span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
              Role: {user ? t(`role.${user.role}`) : 'Guest'}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white">
            Welcome back, {user?.full_name}
          </h1>
          <p className="text-xs text-slate-400">
            Real-time emergency blood requirements and tracked prescription fulfillment operations.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => fetchDashboardData(false)}
            className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition"
            title="Refresh Data"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          {user?.role === 'hospital_staff' && (
            <button
              onClick={() => onNavigate('blood-requests')}
              className="px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs transition flex items-center gap-2 shadow-xs"
            >
              <PlusCircle className="w-4 h-4" />
              <span>{t('action.create_blood_request')}</span>
            </button>
          )}
          {user?.role === 'patient' && (
            <button
              onClick={() => onNavigate('prescriptions')}
              className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition flex items-center gap-2 shadow-xs"
            >
              <PlusCircle className="w-4 h-4" />
              <span>{t('action.upload_rx')}</span>
            </button>
          )}
          {user?.role === 'pharmacy_staff' && (
            <button
              onClick={() => onNavigate('pharmacy-review')}
              className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition flex items-center gap-2 shadow-xs"
            >
              <FileText className="w-4 h-4" />
              <span>Prescription Queue ({stats?.pharmacy.pendingPrescriptions || 0})</span>
            </button>
          )}
        </div>
      </div>

      {/* Grid: Voice-to-Text Command Widget & Real-Time Biometric Verification Bar */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        <div className="lg:col-span-8">
          <DashboardVoiceAssistantWidget onNavigate={onNavigate} />
        </div>
        <div className="lg:col-span-4 p-6 rounded-3xl bg-slate-900 text-white border border-slate-800 shadow-xl flex flex-col justify-between space-y-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <Fingerprint className="w-5 h-5 text-purple-400 animate-pulse" />
              <span className="text-xs font-black uppercase tracking-wider text-purple-400">
                Real-Time Biometrics
              </span>
            </div>
            <h3 className="text-sm font-bold text-white">
              Instant WebAuthn Identity Verification
            </h3>
            <p className="text-[11px] text-slate-400">
              Verify TouchID / FaceID locally to authorize critical emergency procedures.
            </p>
          </div>

          <BiometricAuth mode="verify" />
        </div>
      </div>

      {/* Animation 1: Animated Clinical ECG Cardiac Rhythm Waveform */}
      <ECGPulseWave
        bpm={74}
        label="Clinical Monitoring Sync • Cardiac & Vitals Network Online"
      />

      {/* Real-time Emergency Broadcast Ticker for Critical Blood Requests */}
      <EmergencyBroadcastTicker
        requests={allBloodRequests}
        onNavigate={onNavigate}
        onRefresh={() => fetchDashboardData(true)}
        isRefreshing={loading}
      />

      {/* Primary KPI Metrics with Luminous Vitality Glow */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div
          onClick={() => onNavigate('blood-requests')}
          className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-sm hover:shadow-md hover:border-red-300 transition-all cursor-pointer flex items-center gap-4 group relative overflow-hidden"
        >
          <div className="p-3 rounded-2xl bg-red-50 text-red-600 group-hover:scale-110 group-hover:bg-red-600 group-hover:text-white transition duration-300 shrink-0">
            <HeartPulse className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900 group-hover:text-red-600 transition">
              {stats?.blood.activeRequests ?? 0}
            </div>
            <div className="text-xs font-semibold text-slate-500">Active Blood Requests</div>
            <div className="text-[11px] text-red-600 font-bold mt-0.5 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-red-600 animate-ping"></span>
              <span>{stats?.blood.criticalRequests ?? 0} Critical Emergency</span>
            </div>
          </div>
        </div>

        <div
          onClick={() => onNavigate('donors')}
          className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-sm hover:shadow-md hover:border-rose-300 transition-all cursor-pointer flex items-center gap-4 group relative overflow-hidden"
        >
          <div className="p-3 rounded-2xl bg-rose-50 text-rose-600 group-hover:scale-110 group-hover:bg-rose-600 group-hover:text-white transition duration-300 shrink-0">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900 group-hover:text-rose-600 transition">
              {stats?.blood.availableDonors ?? 0}
            </div>
            <div className="text-xs font-semibold text-slate-500">Available Donors</div>
            <div className="text-[11px] text-emerald-600 font-semibold mt-0.5">
              of {stats?.blood.totalDonors ?? 0} registered
            </div>
          </div>
        </div>

        <div
          onClick={() => onNavigate('medicines')}
          className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-sm hover:shadow-md hover:border-blue-300 transition-all cursor-pointer flex items-center gap-4 group relative overflow-hidden"
        >
          <div className="p-3 rounded-2xl bg-blue-50 text-blue-600 group-hover:scale-110 group-hover:bg-blue-600 group-hover:text-white transition duration-300 shrink-0">
            <Pill className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900 group-hover:text-blue-600 transition">
              {stats?.pharmacy.totalMedicines ?? 0}
            </div>
            <div className="text-xs font-semibold text-slate-500">Medicine Inventory</div>
            <div className="text-[11px] text-amber-600 font-bold mt-0.5">
              {stats?.pharmacy.lowStockCount ?? 0} Low Stock Alerts
            </div>
          </div>
        </div>

        <div
          onClick={() => onNavigate('admission-tracking')}
          className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-sm hover:shadow-md hover:border-emerald-300 transition-all cursor-pointer flex items-center gap-4 group relative overflow-hidden"
        >
          <div className="p-3 rounded-2xl bg-emerald-50 text-emerald-600 group-hover:scale-110 group-hover:bg-emerald-600 group-hover:text-white transition duration-300 shrink-0">
            <Truck className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900 group-hover:text-emerald-600 transition">
              {stats?.pharmacy.activeOrders ?? 0}
            </div>
            <div className="text-xs font-semibold text-slate-500">Active Delivery Orders</div>
            <div className="text-[11px] text-emerald-600 font-semibold mt-0.5 flex items-center gap-1">
              <span>{stats?.pharmacy.deliveredOrders ?? 0} Completed • D3 Radar</span>
            </div>
          </div>
        </div>
      </div>

      {/* Blood Inventory Levels Section (Interactive Bar Chart Visualization) */}
      <BloodInventoryBarChart
        levels={stats?.blood.inventoryLevels}
        onNavigate={onNavigate}
      />

      {/* Donor Role-Specific Quick Widget */}
      {user?.role === 'donor' && (
        <div className="p-6 rounded-2xl bg-gradient-to-r from-rose-50 to-red-50 border border-rose-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="text-[11px] font-bold text-rose-700 uppercase tracking-wide">
              Your Donor Profile Status
            </span>
            <h3 className="text-base font-bold text-slate-900">
              Blood Group: <span className="text-red-600 font-black text-lg">{donorInfo?.blood_group || 'O+'}</span>
              {' • '}
              Status: <span className="capitalize font-semibold">{t(`status.${availStatus}`)}</span>
            </h3>
            <p className="text-xs text-slate-600">
              Total life-saving donations verified: <strong>{donorInfo?.total_donations || 4} units</strong>
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-700">Toggle Status:</span>
            {(['available', 'on_hold', 'unavailable'] as const).map(s => (
              <button
                key={s}
                disabled={updatingAvail}
                onClick={() => handleUpdateAvailability(s)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition capitalize ${
                  availStatus === s
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-100'
                }`}
              >
                {t(`status.${s}`)}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Main Grid: Urgent Blood Requests & Active Medicine Orders */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Module A: Recent Blood Requests */}
        <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-red-100 text-red-600">
                <HeartPulse className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Urgent Blood Requests</h3>
                <p className="text-[11px] text-slate-500">Live matching & clinical confirmation</p>
              </div>
            </div>
            <button
              onClick={() => onNavigate('blood-requests')}
              className="text-xs font-bold text-red-600 hover:text-red-700 flex items-center gap-1"
            >
              <span>{t('action.view')} All</span> →
            </button>
          </div>

          <div className="space-y-3">
            {recentRequests.length === 0 ? (
              <p className="text-xs text-slate-500 py-4 text-center">No active blood requests.</p>
            ) : (
              recentRequests.map(req => (
                <div
                  key={req.id}
                  onClick={() => onNavigate(`blood-requests/${req.id}`)}
                  className="p-3.5 rounded-2xl border border-slate-200 hover:border-red-300 hover:bg-red-50/20 transition cursor-pointer flex items-center justify-between gap-3 group"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="w-8 h-8 rounded-full bg-red-600 text-white font-black text-xs flex items-center justify-center shrink-0 shadow-xs">
                        {req.blood_group}
                      </span>
                      <div>
                        <div className="text-xs font-bold text-slate-900 group-hover:text-red-600 transition">
                          {req.patient_name} ({req.hospital_name})
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {req.hospital_city} • Need: {req.units_required} units (Fulfilled: {req.units_fulfilled})
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-1.5 shrink-0">
                    {getUrgencyBadge(req.urgency_level)}
                    <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                      {t(`status.${req.status}`)}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Module B: Recent Orders & Pharmacy Activity */}
        <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-blue-100 text-blue-600">
                <Pill className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Recent Medicine Orders</h3>
                <p className="text-[11px] text-slate-500">Prescription verification & courier delivery</p>
              </div>
            </div>
            <button
              onClick={() => onNavigate('orders')}
              className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              <span>{t('action.view')} All</span> →
            </button>
          </div>

          <div className="space-y-3">
            {recentOrders.length === 0 ? (
              <p className="text-xs text-slate-500 py-4 text-center">No orders placed yet.</p>
            ) : (
              recentOrders.map(ord => (
                <div
                  key={ord.id}
                  onClick={() => onNavigate(`orders/${ord.id}`)}
                  className="p-3.5 rounded-2xl border border-slate-200 hover:border-blue-300 hover:bg-blue-50/20 transition cursor-pointer flex items-center justify-between gap-3 group"
                >
                  <div className="space-y-1">
                    <div className="text-xs font-bold text-slate-900 group-hover:text-blue-600 transition flex items-center gap-2">
                      <span>{ord.id}</span>
                      <span className="text-slate-400">•</span>
                      <span className="text-emerald-700 font-black">₹{ord.total_amount.toFixed(2)}</span>
                    </div>
                    <div className="text-[11px] text-slate-500 truncate max-w-xs">
                      {ord.delivery_address}, {ord.delivery_city}
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                      {t(`status.${ord.status}`)}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {new Date(ord.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
