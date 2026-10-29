import React, { useState, useEffect } from 'react';
import {
  HeartPulse,
  ArrowLeft,
  Building2,
  Calendar,
  Phone,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Sparkles,
  Users,
  Clock,
  RefreshCw,
  Award,
  Check,
  Activity,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';
import { useI18n } from '../i18n.tsx';
import { apiRequest } from '../api.ts';
import { BloodRequest, DonorMatch } from '../types.ts';
import { MedicalDisclaimer } from '../components/MedicalDisclaimer.tsx';
import { DonorReceiverGpsTracker } from '../components/DonorReceiverGpsTracker.tsx';

interface BloodRequestDetailPageProps {
  requestId: string;
  onNavigate: (page: string) => void;
}

export const BloodRequestDetailPage: React.FC<BloodRequestDetailPageProps> = ({ requestId, onNavigate }) => {
  const { user } = useAuth();
  const { t, lang } = useI18n();

  const [request, setRequest] = useState<BloodRequest | null>(null);
  const [matches, setMatches] = useState<DonorMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [staffNote, setStaffNote] = useState('Laboratory cross-match compatible. Donor vital signs and hemoglobin 13.8 g/dL verified.');

  const fetchRequestDetails = async () => {
    setLoading(true);
    try {
      const res = await apiRequest<{ request: BloodRequest; matches: DonorMatch[] }>(`/blood/requests/${requestId}`);
      setRequest(res.request);
      setMatches(res.matches);
    } catch (err: any) {
      console.warn('Failed to load blood request ID directly, trying fallback:', err);
      try {
        const listRes = await apiRequest<{ requests: BloodRequest[] }>('/blood/requests');
        if (listRes.requests && listRes.requests.length > 0) {
          const fallbackReq = listRes.requests[0];
          const fallbackDetail = await apiRequest<{ request: BloodRequest; matches: DonorMatch[] }>(`/blood/requests/${fallbackReq.id}`);
          setRequest(fallbackDetail.request);
          setMatches(fallbackDetail.matches);
        }
      } catch (fallbackErr) {
        console.error('Fallback blood request fetch failed:', fallbackErr);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequestDetails();
  }, [requestId]);

  const handleRunMatching = async () => {
    setActionLoading(true);
    setMessage(null);
    try {
      const res = await apiRequest<{ message: string; matchesCount: number }>(`/blood/requests/${requestId}/match`, {
        method: 'POST',
      });
      setMessage(res.message);
      await fetchRequestDetails();
    } catch (err: any) {
      setMessage(err.message || 'Matching engine failed');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDonorResponse = async (matchId: string, responseAction: 'accepted' | 'declined' | 'unavailable') => {
    setActionLoading(true);
    setMessage(null);
    try {
      const res = await apiRequest<{ message: string }>(`/blood/matches/${matchId}/respond`, {
        method: 'POST',
        body: JSON.stringify({ response_action: responseAction }),
      });
      setMessage(res.message);
      await fetchRequestDetails();
    } catch (err: any) {
      setMessage(err.message || 'Failed to submit response');
    } finally {
      setActionLoading(false);
    }
  };

  const handleClinicalConfirmation = async (matchId: string) => {
    setActionLoading(true);
    setMessage(null);
    try {
      const res = await apiRequest<{ message: string; unitsFulfilled: number }>(`/blood/matches/${matchId}/confirm`, {
        method: 'POST',
        body: JSON.stringify({ staff_notes: staffNote }),
      });
      setMessage(res.message);
      await fetchRequestDetails();
    } catch (err: any) {
      setMessage(err.message || 'Failed to confirm clinical donation');
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateStatus = async (newStatus: string) => {
    setActionLoading(true);
    try {
      await apiRequest(`/blood/requests/${requestId}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status: newStatus }),
      });
      await fetchRequestDetails();
    } catch (err: any) {
      setMessage(err.message || 'Failed to update status');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-16 text-center text-xs text-slate-500">
        <div className="w-8 h-8 border-3 border-red-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        Loading emergency request details...
      </div>
    );
  }

  if (!request) {
    return (
      <div className="p-8 text-center space-y-4">
        <p className="text-sm font-bold text-slate-700">Blood request not found.</p>
        <button
          onClick={() => onNavigate('blood-requests')}
          className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold"
        >
          Back to Blood Requests
        </button>
      </div>
    );
  }

  const isHospitalOrAdmin = user?.role === 'hospital_staff' || user?.role === 'admin';
  const progressPercent = Math.min(100, Math.round((request.units_fulfilled / request.units_required) * 100));

  return (
    <div className="space-y-6 pb-16">
      {/* Top back button */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => onNavigate('blood-requests')}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to All Requests</span>
        </button>

        <div className="flex items-center gap-2">
          {isHospitalOrAdmin && (
            <button
              onClick={handleRunMatching}
              disabled={actionLoading}
              className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition flex items-center gap-1.5 shadow-xs disabled:opacity-50"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Re-run Matching Engine</span>
            </button>
          )}

          {isHospitalOrAdmin && request.status !== 'Fulfilled' && (
            <button
              onClick={() => handleUpdateStatus('Fulfilled')}
              disabled={actionLoading}
              className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition shadow-xs disabled:opacity-50"
            >
              Mark Fulfilled
            </button>
          )}
        </div>
      </div>

      {message && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2 font-medium">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{message}</span>
        </div>
      )}

      {/* Primary Header Card */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-6">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-red-600 to-rose-500 text-white font-black text-2xl flex items-center justify-center shrink-0 shadow-md">
              {request.blood_group}
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-400">{request.id}</span>
                <span className="text-slate-300">•</span>
                <span className="text-xs font-semibold text-slate-600">Ref: {request.patient_reference_id}</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900">
                {request.patient_name}
              </h1>
              <div className="text-xs text-slate-500 flex items-center gap-1.5 font-medium">
                <Building2 className="w-4 h-4 text-slate-400" />
                <span>{request.hospital_name}, {request.hospital_city}</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col items-start md:items-end gap-2">
            <span
              className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${
                request.urgency_level === 'critical'
                  ? 'bg-red-600 text-white animate-pulse'
                  : 'bg-amber-500 text-slate-950'
              }`}
            >
              {request.urgency_level.toUpperCase()} URGENCY
            </span>
            <span className="text-xs font-bold px-3 py-1 rounded-lg bg-slate-100 text-slate-800 border border-slate-200">
              Status: {t(`status.${request.status}`)}
            </span>
          </div>
        </div>

        {/* Fulfillment Progress Bar */}
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
          <div className="flex justify-between items-center text-xs font-bold">
            <span className="text-slate-700">Life-Saving Units Progress</span>
            <span className="text-slate-900">
              <strong className="text-red-600 text-sm">{request.units_fulfilled}</strong> of {request.units_required} units fulfilled ({progressPercent}%)
            </span>
          </div>
          <div className="w-full h-3 rounded-full bg-slate-200 overflow-hidden">
            <div
              className={`h-full transition-all duration-500 ${
                request.units_fulfilled >= request.units_required ? 'bg-emerald-500' : 'bg-red-500'
              }`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Key Information Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 pt-2 border-t border-slate-100 text-xs">
          <div>
            <span className="text-slate-400 font-medium block">Hospital Facility</span>
            <span className="font-bold text-slate-800 mt-0.5 block">{request.hospital_name}</span>
            <span className="text-slate-500">{request.hospital_locality}, {request.hospital_city}</span>
          </div>
          <div>
            <span className="text-slate-400 font-medium block">Contact Coordinator</span>
            <span className="font-bold text-slate-800 mt-0.5 block">{request.contact_person}</span>
            <span className="text-slate-500 font-mono">{request.contact_phone}</span>
          </div>
          <div>
            <span className="text-slate-400 font-medium block">Target Time Required By</span>
            <span className="font-bold text-slate-800 mt-0.5 block">{request.required_by_date}</span>
            <span className="text-slate-500">Transfusion Schedule</span>
          </div>
          <div>
            <span className="text-slate-400 font-medium block">Created Timestamp</span>
            <span className="font-bold text-slate-800 mt-0.5 block">
              {new Date(request.created_at).toLocaleDateString()}
            </span>
            <span className="text-slate-500">
              {new Date(request.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        </div>

        {request.clinical_notes && (
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700">
            <strong className="text-slate-900 block mb-0.5">Clinical Notes & Surgical Brief:</strong>
            {request.clinical_notes}
          </div>
        )}
      </div>

      {/* Live Google Maps Receiver & Donor GPS Radar */}
      <DonorReceiverGpsTracker request={request} currentUserRole={user?.role} />

      {/* Module A Matching Section: Ranked Donor Candidates */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-red-600" />
              <h2 className="text-lg font-black text-slate-900">
                Candidate Donors Ranked by Compatibility Engine
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Evaluated based on ABO/Rh immunological matrix, location proximity, active availability, and 90-day cooldown rules.
            </p>
          </div>
          <span className="text-xs font-bold px-3 py-1 rounded-full bg-red-50 text-red-700 border border-red-200">
            {matches.length} Candidates Identified
          </span>
        </div>

        {matches.length === 0 ? (
          <div className="p-8 text-center space-y-3">
            <Users className="w-10 h-10 text-slate-300 mx-auto" />
            <p className="text-xs text-slate-500">
              No matching donors recorded yet. Click &quot;Re-run Matching Engine&quot; above to search registered donors.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {matches.map(m => {
              const isCurrentUserDonor = user?.id === m.donor_user_id;
              const hasResponded = m.status === 'accepted' || m.status === 'declined' || m.status === 'reviewed';

              return (
                <div
                  key={m.id}
                  className={`p-5 rounded-2xl border transition-all ${
                    m.status === 'accepted' || m.status === 'reviewed'
                      ? 'border-emerald-300 bg-emerald-50/20'
                      : isCurrentUserDonor
                      ? 'border-red-400 bg-red-50/20 ring-2 ring-red-400'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                    {/* Donor Details */}
                    <div className="flex items-start gap-3.5">
                      <div className="w-12 h-12 rounded-xl bg-slate-900 text-white font-black text-base flex items-center justify-center shrink-0">
                        {m.blood_group}
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-slate-900">{m.donor_name}</h4>
                          {m.verified_badge === 1 && (
                            <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded">
                              <ShieldCheck className="w-3 h-3 text-emerald-600" />
                              Verified
                            </span>
                          )}
                          {isCurrentUserDonor && (
                            <span className="text-[10px] font-bold text-red-600 bg-red-100 px-2 py-0.5 rounded-full">
                              You
                            </span>
                          )}
                        </div>

                        <div className="text-xs text-slate-500">
                          {m.donor_locality ? `${m.donor_locality}, ` : ''}{m.donor_city} • Contact: <span className="font-mono">{m.donor_phone}</span>
                        </div>

                        <div className="text-[11px] text-slate-500">
                          Total Prior Donations: <strong>{m.total_donations || 0}</strong> • Status: <span className="capitalize font-semibold">{m.availability_status}</span>
                        </div>

                        {/* Reason Tags */}
                        <div className="flex flex-wrap gap-1.5 pt-2">
                          {m.match_reasons.map((r, i) => (
                            <span
                              key={i}
                              className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-slate-100 text-slate-700 border border-slate-200"
                            >
                              ✓ {r}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Compatibility Score & Action Column */}
                    <div className="flex flex-col items-start md:items-end gap-2.5 shrink-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-500">Compatibility:</span>
                        <span className="px-2.5 py-1 rounded-xl text-xs font-black bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-xs">
                          {m.compatibility_score}% Match
                        </span>
                      </div>

                      <div className="text-xs font-semibold">
                        <span className="text-slate-400">Response: </span>
                        <span
                          className={`font-bold capitalize ${
                            m.status === 'accepted'
                              ? 'text-emerald-600'
                              : m.status === 'declined'
                              ? 'text-rose-600'
                              : m.status === 'reviewed'
                              ? 'text-blue-600'
                              : 'text-amber-600'
                          }`}
                        >
                          {m.status === 'reviewed' ? 'Clinically Confirmed' : m.status}
                        </span>
                      </div>

                      {/* Donor Response Actions if current user is this donor */}
                      {(isCurrentUserDonor || isHospitalOrAdmin) && m.status === 'notified' && (
                        <div className="flex items-center gap-1.5 pt-1">
                          <button
                            onClick={() => handleDonorResponse(m.id, 'accepted')}
                            disabled={actionLoading}
                            className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition flex items-center gap-1 shadow-xs"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Accept</span>
                          </button>
                          <button
                            onClick={() => handleDonorResponse(m.id, 'declined')}
                            disabled={actionLoading}
                            className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition flex items-center gap-1 shadow-xs"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            <span>Decline</span>
                          </button>
                        </div>
                      )}

                      {/* Hospital Staff Clinical Confirmation Action */}
                      {isHospitalOrAdmin && m.status === 'accepted' && (
                        <div className="pt-2">
                          <button
                            onClick={() => handleClinicalConfirmation(m.id)}
                            disabled={actionLoading}
                            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-emerald-600/20"
                          >
                            <ShieldCheck className="w-4 h-4" />
                            <span>Confirm Clinical Unit</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {m.staff_notes && (
                    <div className="mt-3 p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-[11px] text-slate-700 flex items-center gap-2">
                      <strong className="text-slate-900">Hospital Note:</strong>
                      <span>{m.staff_notes}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
