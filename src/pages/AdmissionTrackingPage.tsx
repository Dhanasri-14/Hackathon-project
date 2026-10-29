import React, { useState, useEffect } from 'react';
import {
  Activity,
  Truck,
  Building2,
  User,
  Clock,
  MapPin,
  Thermometer,
  ShieldAlert,
  ArrowRight,
  ExternalLink,
  Search,
  Filter,
  CheckCircle2,
  RefreshCw,
  Phone,
  Pill,
  Navigation,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';
import { useI18n } from '../i18n.tsx';
import { apiRequest } from '../api.ts';
import { AdmissionRecord } from '../types.ts';
import { D3PharmacyDeliveryMap } from '../components/D3PharmacyDeliveryMap.tsx';
import { ECGPulseWave } from '../components/ECGPulseWave.tsx';

interface AdmissionTrackingPageProps {
  onNavigate: (page: string) => void;
}

export const AdmissionTrackingPage: React.FC<AdmissionTrackingPageProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const { t, lang } = useI18n();
  const [admissions, setAdmissions] = useState<AdmissionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAdmission, setSelectedAdmission] = useState<AdmissionRecord | null>(null);
  const [statusFilter, setStatusFilter] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');

  const fetchAdmissions = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const res = await apiRequest<{ admissions: AdmissionRecord[] }>('/admissions');
      setAdmissions(res.admissions);
      if (res.admissions.length > 0 && !selectedAdmission) {
        setSelectedAdmission(res.admissions[0]);
      }
    } catch (err) {
      console.error('Failed to load admissions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdmissions();
    const interval = setInterval(fetchAdmissions, 15000);
    return () => clearInterval(interval);
  }, []);

  const filteredAdmissions = admissions.filter(adm => {
    const matchesStatus = statusFilter === 'All' || adm.status === statusFilter || adm.emergency_priority === statusFilter;
    const matchesSearch =
      adm.patient_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      adm.hospital_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      adm.diagnosis.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (adm.order_id && adm.order_id.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesStatus && matchesSearch;
  });

  const activeTracking = selectedAdmission || admissions[0];
  const telemetry = activeTracking?.gps_telemetry;

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'Critical Emergency':
        return <span className="px-2.5 py-1 rounded-md text-[11px] font-black uppercase bg-red-600 text-white animate-pulse">Critical Emergency</span>;
      case 'Urgent':
      case 'High Priority':
        return <span className="px-2.5 py-1 rounded-md text-[11px] font-bold uppercase bg-amber-500 text-slate-950">High Priority</span>;
      default:
        return <span className="px-2.5 py-1 rounded-md text-[11px] font-semibold uppercase bg-slate-200 text-slate-700">Inpatient</span>;
    }
  };

  return (
    <div className="space-y-8 pb-16">
      {/* Page Header */}
      <div className="p-6 sm:p-8 rounded-3xl bg-slate-900 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4 border border-slate-800">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-black text-red-400 uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-red-950/80 border border-red-500/40">
              {t('admission.badge')}
            </span>
            <span className="text-slate-500">•</span>
            <span className="text-xs font-bold text-slate-300">
              {t('admission.sub')}
            </span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
            {t('admission.title')}
          </h1>
          <p className="text-sm text-slate-300 max-w-2xl leading-relaxed">
            {t('admission.desc')}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchAdmissions}
            className="p-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition"
            title="Refresh Deliveries"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => onNavigate('orders')}
            className="px-4 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm transition flex items-center gap-2 shadow-md shadow-blue-600/30"
          >
            <Truck className="w-4 h-4" />
            <span>{t('nav.orders')}</span>
          </button>
        </div>
      </div>

      {/* Animation 1: Animated Clinical ECG Pulse Monitor Header */}
      <ECGPulseWave
        bpm={76}
        label="Hospital Intensive Care Telemetry • Vitals Synchronized"
      />

      {/* Primary D3.js Visual Delivery Radar & Map */}
      {activeTracking && (
        <D3PharmacyDeliveryMap
          admission={activeTracking}
          onNavigateOrder={(orderId) => onNavigate(`orders/${orderId}`)}
        />
      )}

      {/* Admissions Inpatient List & Search */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-black text-slate-900">
              {t('admission.inpatient_list')}
            </h2>
            <span className="px-2.5 py-0.5 rounded-full bg-slate-200 text-slate-800 font-bold text-xs">
              {filteredAdmissions.length} Records
            </span>
          </div>

          <div className="flex items-center gap-3">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Search patient, hospital, bed..."
                className="pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-hidden w-60"
              />
            </div>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 bg-white"
            >
              <option value="All">All Inpatients</option>
              <option value="Active">Active Admitted</option>
              <option value="Critical Emergency">Critical Priority</option>
              <option value="Discharged / Recovered">Discharged</option>
            </select>
          </div>
        </div>

        {/* Admissions Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredAdmissions.map(adm => {
            const isSelected = selectedAdmission?.id === adm.id;
            return (
              <div
                key={adm.id}
                onClick={() => setSelectedAdmission(adm)}
                className={`p-5 rounded-3xl border-2 transition-all cursor-pointer space-y-4 hover:shadow-md ${
                  isSelected
                    ? 'border-blue-600 bg-blue-50/20 ring-2 ring-blue-600/20 shadow-md'
                    : 'border-slate-200 bg-white hover:border-slate-400'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="w-12 h-12 rounded-2xl bg-slate-900 text-white font-black text-sm flex items-center justify-center shrink-0 shadow-sm">
                      {adm.blood_group || 'O+'}
                    </span>
                    <div>
                      <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                        <span>{adm.patient_name}</span>
                        <span className="text-xs font-semibold text-slate-500">
                          ({adm.patient_age || 45}y, {adm.patient_gender || 'M'})
                        </span>
                      </h3>
                      <div className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
                        <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{adm.hospital_name}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-1 shrink-0">
                    {getPriorityBadge(adm.emergency_priority)}
                    <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                      {adm.status}
                    </span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/60 text-xs space-y-1.5">
                  <div className="flex items-center justify-between text-slate-600">
                    <span>Ward & Bed:</span>
                    <strong className="text-slate-900">{adm.ward_number} • {adm.bed_number}</strong>
                  </div>
                  <div className="flex items-center justify-between text-slate-600">
                    <span>Attending Physician:</span>
                    <strong className="text-slate-900">{adm.attending_physician}</strong>
                  </div>
                  <div className="text-slate-600">
                    <span>Diagnosis: </span>
                    <span className="font-semibold text-red-700">{adm.diagnosis}</span>
                  </div>
                </div>

                {/* Linked Order Status & Action */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                  <div>
                    {adm.order ? (
                      <span className="font-bold text-blue-700 flex items-center gap-1">
                        <Truck className="w-3.5 h-3.5" />
                        <span>Order: {adm.order.id} ({adm.order.status})</span>
                      </span>
                    ) : (
                      <span className="text-slate-500 italic">No live courier delivery linked</span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {adm.order_id && (
                      <button
                        type="button"
                        onClick={e => {
                          e.stopPropagation();
                          onNavigate(`orders/${adm.order_id}`);
                        }}
                        className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center gap-1 transition"
                      >
                        <span>View Order</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
