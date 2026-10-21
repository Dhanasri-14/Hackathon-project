import React, { useState, useEffect } from 'react';
import {
  HeartPulse,
  PlusCircle,
  Search,
  Filter,
  AlertCircle,
  Building2,
  Calendar,
  Users,
  CheckCircle2,
  X,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';
import { useI18n } from '../i18n.tsx';
import { apiRequest } from '../api.ts';
import { BloodRequest } from '../types.ts';
import { MedicalDisclaimer } from '../components/MedicalDisclaimer.tsx';

export const BloodRequestsPage: React.FC<{ onNavigate: (page: string) => void }> = ({ onNavigate }) => {
  const { user } = useAuth();
  const { t } = useI18n();

  const [requests, setRequests] = useState<BloodRequest[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchCity, setSearchCity] = useState('');
  const [filterBlood, setFilterBlood] = useState('All');
  const [filterUrgency, setFilterUrgency] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');

  // Modal State for New Request
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [patientRef, setPatientRef] = useState('');
  const [patientName, setPatientName] = useState('');
  const [bloodGroup, setBloodGroup] = useState('O-');
  const [unitsRequired, setUnitsRequired] = useState(2);
  const [urgencyLevel, setUrgencyLevel] = useState('critical');
  const [hospitalName, setHospitalName] = useState('Apollo Hospitals - Greams Road');
  const [hospitalCity, setHospitalCity] = useState('Chennai');
  const [hospitalLocality, setHospitalLocality] = useState('Greams Road');
  const [contactPerson, setContactPerson] = useState('');
  const [contactPhone, setContactPhone] = useState('+91 98402 34567');
  const [requiredByDate, setRequiredByDate] = useState('2026-10-22 18:00');
  const [clinicalNotes, setClinicalNotes] = useState('Acute polytrauma emergency requiring rapid packed red cell cross-matching.');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterStatus !== 'All') params.append('status', filterStatus);
      if (filterUrgency !== 'All') params.append('urgency', filterUrgency);
      if (filterBlood !== 'All') params.append('blood_group', filterBlood);
      if (searchCity) params.append('city', searchCity);

      const res = await apiRequest<{ requests: BloodRequest[] }>(`/blood/requests?${params.toString()}`);
      setRequests(res.requests);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [filterStatus, filterUrgency, filterBlood, searchCity]);

  const handleCreateRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setSubmitting(true);
    try {
      const res = await apiRequest<{ request: BloodRequest }>('/blood/requests', {
        method: 'POST',
        body: JSON.stringify({
          patient_reference_id: patientRef,
          patient_name: patientName,
          blood_group: bloodGroup,
          units_required: unitsRequired,
          urgency_level: urgencyLevel,
          hospital_name: hospitalName,
          hospital_city: hospitalCity,
          hospital_locality: hospitalLocality,
          contact_person: contactPerson || user?.full_name,
          contact_phone: contactPhone,
          required_by_date: requiredByDate,
          clinical_notes: clinicalNotes,
        }),
      });

      setIsModalOpen(false);
      // Reset form
      setPatientName('');
      setPatientRef('');
      await fetchRequests();
      // Navigate to detail page of created request
      onNavigate(`blood-requests/${res.request.id}`);
    } catch (err: any) {
      setFormError(err.message || 'Failed to submit request');
    } finally {
      setSubmitting(false);
    }
  };

  const getUrgencyBadge = (urgency: string) => {
    switch (urgency) {
      case 'critical':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-red-600 text-white animate-pulse">Critical</span>;
      case 'urgent':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-amber-500 text-slate-950">Urgent</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-medium uppercase bg-slate-200 text-slate-700">Standard</span>;
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-red-600 uppercase tracking-wider">
            <HeartPulse className="w-4 h-4" />
            Module A • Emergency Blood Coordination
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">
            {t('nav.blood_requests')}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Active hospital emergency requirements, candidate matching engine, and donor confirmations.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs transition flex items-center justify-center gap-2 shadow-md shadow-red-600/20"
        >
          <PlusCircle className="w-4 h-4" />
          <span>{t('action.create_blood_request')}</span>
        </button>
      </div>

      <MedicalDisclaimer compact />

      {/* Filters Bar */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2 flex-1 min-w-[280px]">
          {/* City search */}
          <div className="relative min-w-[160px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search city (e.g. Chennai)..."
              value={searchCity}
              onChange={e => setSearchCity(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-slate-200 text-xs focus:ring-2 focus:ring-red-500 focus:outline-hidden"
            />
          </div>

          {/* Blood group filter */}
          <select
            value={filterBlood}
            onChange={e => setFilterBlood(e.target.value)}
            className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold bg-white"
          >
            <option value="All">All Blood Groups</option>
            {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(bg => (
              <option key={bg} value={bg}>{bg}</option>
            ))}
          </select>

          {/* Urgency filter */}
          <select
            value={filterUrgency}
            onChange={e => setFilterUrgency(e.target.value)}
            className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold bg-white"
          >
            <option value="All">All Urgencies</option>
            <option value="critical">Critical</option>
            <option value="urgent">Urgent</option>
            <option value="standard">Standard</option>
          </select>

          {/* Status filter */}
          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold bg-white"
          >
            <option value="All">All Statuses</option>
            <option value="Submitted">Submitted</option>
            <option value="Matching in Progress">Matching in Progress</option>
            <option value="Awaiting Donor Response">Awaiting Donor Response</option>
            <option value="Under Staff Review">Under Staff Review</option>
            <option value="Fulfilled">Fulfilled</option>
            <option value="Cancelled">Cancelled</option>
          </select>
        </div>

        <div className="text-xs text-slate-500 font-medium">
          Showing <strong>{requests.length}</strong> requirements
        </div>
      </div>

      {/* Requests List */}
      {loading ? (
        <div className="p-12 text-center text-xs text-slate-500">
          <div className="w-8 h-8 border-3 border-red-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          Loading emergency requests from database...
        </div>
      ) : requests.length === 0 ? (
        <div className="p-12 rounded-3xl bg-white border border-slate-200 text-center space-y-3">
          <HeartPulse className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-slate-700">No matching blood requests found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Try adjusting your search criteria or create a new emergency blood request.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {requests.map(req => {
            const progress = Math.min(100, Math.round((req.units_fulfilled / req.units_required) * 100));
            return (
              <div
                key={req.id}
                onClick={() => onNavigate(`blood-requests/${req.id}`)}
                className="p-5 rounded-3xl bg-white border border-slate-200 hover:border-red-400 hover:shadow-md transition cursor-pointer flex flex-col justify-between space-y-4 group"
              >
                <div className="space-y-3">
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-red-600 to-rose-500 text-white font-black text-lg flex items-center justify-center shrink-0 shadow-sm">
                        {req.blood_group}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-bold text-slate-400">{req.id}</span>
                          <span className="text-slate-300">•</span>
                          <span className="text-[11px] font-medium text-slate-500">{req.patient_reference_id}</span>
                        </div>
                        <h3 className="text-base font-bold text-slate-900 group-hover:text-red-600 transition">
                          {req.patient_name}
                        </h3>
                      </div>
                    </div>
                    {getUrgencyBadge(req.urgency_level)}
                  </div>

                  {/* Hospital & Location */}
                  <div className="space-y-1.5 text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <div className="flex items-center gap-2 font-semibold text-slate-800">
                      <Building2 className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                      <span className="truncate">{req.hospital_name}</span>
                    </div>
                    <div className="text-[11px] text-slate-500 pl-5.5">
                      {req.hospital_locality ? `${req.hospital_locality}, ` : ''}{req.hospital_city}
                    </div>
                  </div>

                  {/* Units Progress */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-slate-600">Fulfillment Progress</span>
                      <span className="text-slate-900">
                        <strong>{req.units_fulfilled}</strong> / {req.units_required} units
                      </span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className={`h-full transition-all duration-300 ${
                          req.units_fulfilled >= req.units_required ? 'bg-emerald-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Footer status and candidates */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 text-slate-500">
                    <Users className="w-3.5 h-3.5 text-red-500" />
                    <span><strong>{req.potential_matches_count || 0}</strong> Candidates</span>
                    {req.accepted_donors_count ? (
                      <span className="text-emerald-600 font-bold ml-1">({req.accepted_donors_count} Accepted)</span>
                    ) : null}
                  </div>

                  <span className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-slate-100 text-slate-700">
                    {t(`status.${req.status}`)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal: Create Emergency Blood Request */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl shadow-2xl max-w-xl w-full max-h-[90vh] flex flex-col overflow-hidden border border-slate-200">
            <div className="p-5 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-red-600 rounded-lg">
                  <HeartPulse className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-base font-bold">New Emergency Blood Request</h3>
                  <p className="text-[11px] text-slate-300">Triggers automated compatibility matching engine</p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateRequest} className="p-6 overflow-y-auto space-y-4">
              {formError && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Patient Name *</label>
                  <input
                    type="text"
                    required
                    value={patientName}
                    onChange={e => setPatientName(e.target.value)}
                    placeholder="e.g. S. Murugesan"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-red-500 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Patient Hospital ID / Ref</label>
                  <input
                    type="text"
                    value={patientRef}
                    onChange={e => setPatientRef(e.target.value)}
                    placeholder="e.g. PAT-APO-9011"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-red-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Required Blood *</label>
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
                  <label className="block text-xs font-bold text-slate-700 mb-1">Units (Units = Bags) *</label>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    required
                    value={unitsRequired}
                    onChange={e => setUnitsRequired(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Urgency Level *</label>
                  <select
                    value={urgencyLevel}
                    onChange={e => setUrgencyLevel(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold bg-white"
                  >
                    <option value="critical">Critical</option>
                    <option value="urgent">Urgent</option>
                    <option value="standard">Standard</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Hospital Name *</label>
                  <input
                    type="text"
                    required
                    value={hospitalName}
                    onChange={e => setHospitalName(e.target.value)}
                    placeholder="e.g. Apollo Hospitals"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">City / District *</label>
                  <input
                    type="text"
                    required
                    value={hospitalCity}
                    onChange={e => setHospitalCity(e.target.value)}
                    placeholder="e.g. Chennai"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Hospital Locality / Area</label>
                  <input
                    type="text"
                    value={hospitalLocality}
                    onChange={e => setHospitalLocality(e.target.value)}
                    placeholder="e.g. Greams Road / Anna Nagar"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Contact Phone *</label>
                  <input
                    type="text"
                    required
                    value={contactPhone}
                    onChange={e => setContactPhone(e.target.value)}
                    placeholder="+91 98401 23456"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Clinical Notes & Surgical Context</label>
                <textarea
                  rows={2}
                  value={clinicalNotes}
                  onChange={e => setClinicalNotes(e.target.value)}
                  placeholder="e.g. Scheduled for emergency trauma surgery at 10 PM. Pre-transfusion cross match required."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                />
              </div>

              <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200 text-amber-900 text-xs space-y-1">
                <strong>Medical Matching Engine:</strong> Upon submission, UyirThunai will automatically compute compatible donor candidates based on standard ABO/Rh immunology rules and send instant in-app alerts.
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium"
                >
                  {t('action.cancel')}
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold flex items-center gap-2 shadow-xs disabled:opacity-50"
                >
                  {submitting ? 'Submitting & Matching...' : 'Submit Emergency Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
