import React, { useState, useEffect } from 'react';
import {
  ClipboardCheck,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  FileText,
  Search,
  Filter,
  Eye,
  Check,
  X,
  User,
  ShieldCheck,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';
import { useI18n } from '../i18n.tsx';
import { apiRequest } from '../api.ts';
import { Prescription } from '../types.ts';

export const PrescriptionReviewQueuePage: React.FC<{ onNavigate: (page: string) => void }> = ({ onNavigate }) => {
  const { user } = useAuth();
  const { t } = useI18n();

  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [selectedRx, setSelectedRx] = useState<Prescription | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('All');
  const [actionNotes, setActionNotes] = useState('Prescription verified: Doctor registration valid, dosage schedules compliant with pharmacology safety.');
  const [processing, setProcessing] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const fetchQueue = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== 'All') params.append('status', statusFilter);
      const res = await apiRequest<{ prescriptions: Prescription[] }>(`/prescriptions?${params.toString()}`);
      setPrescriptions(res.prescriptions);
      if (res.prescriptions.length > 0 && !selectedRx) {
        setSelectedRx(res.prescriptions[0]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueue();
  }, [statusFilter]);

  const handleReviewAction = async (action: 'Approved' | 'Rejected' | 'Correction Requested') => {
    if (!selectedRx) return;
    setProcessing(true);
    try {
      await apiRequest(`/prescriptions/${selectedRx.id}/review`, {
        method: 'POST',
        body: JSON.stringify({
          action,
          reviewer_notes: actionNotes,
        }),
      });

      setToast(`Prescription ${selectedRx.id} marked as ${action}!`);
      setTimeout(() => setToast(null), 3000);
      await fetchQueue();
      // Keep selected or update
      const updated = prescriptions.find(p => p.id === selectedRx.id);
      if (updated) setSelectedRx({ ...updated, status: action, reviewer_notes: actionNotes });
    } catch (err: any) {
      alert(err.message || 'Action failed');
    } finally {
      setProcessing(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Approved':
        return <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-emerald-100 text-emerald-800">Approved</span>;
      case 'Rejected':
        return <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-rose-100 text-rose-800">Rejected</span>;
      case 'Correction Requested':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-amber-100 text-amber-800">Correction Needed</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-blue-100 text-blue-800">Under Review</span>;
    }
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-blue-600 uppercase tracking-wider">
            <ClipboardCheck className="w-4 h-4" />
            Licensed Pharmacy Operations
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">
            {t('nav.pharmacy_review')}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Clinical review queue for uploaded medical prescriptions and dosage verification.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold bg-white"
          >
            <option value="All">All Prescriptions</option>
            <option value="Submitted">Submitted (Pending)</option>
            <option value="Approved">Approved</option>
            <option value="Rejected">Rejected</option>
            <option value="Correction Requested">Correction Requested</option>
          </select>
        </div>
      </div>

      {toast && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{toast}</span>
        </div>
      )}

      {/* Main Split View: Queue List on Left, Document & Review Controls on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Queue Items */}
        <div className="lg:col-span-5 space-y-3">
          <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700">Prescription Queue</span>
            <span className="text-xs font-bold text-blue-600">{prescriptions.length} Records</span>
          </div>

          {loading ? (
            <div className="p-8 text-center text-xs text-slate-500">Loading prescription queue...</div>
          ) : prescriptions.length === 0 ? (
            <div className="p-8 bg-white rounded-2xl border border-slate-200 text-center space-y-2">
              <FileText className="w-8 h-8 text-slate-300 mx-auto" />
              <p className="text-xs text-slate-500">No prescriptions found.</p>
            </div>
          ) : (
            <div className="space-y-2.5 max-h-[70vh] overflow-y-auto pr-1">
              {prescriptions.map(rx => {
                const isSelected = selectedRx?.id === rx.id;
                return (
                  <div
                    key={rx.id}
                    onClick={() => {
                      setSelectedRx(rx);
                      setActionNotes(rx.reviewer_notes || 'Prescription verified: Doctor registration valid, dosage schedules compliant with pharmacology safety.');
                    }}
                    className={`p-4 rounded-2xl border transition cursor-pointer space-y-2 ${
                      isSelected
                        ? 'border-blue-600 bg-blue-50/40 shadow-sm'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="text-xs font-bold text-slate-900">{rx.id}</div>
                        <div className="text-xs font-semibold text-slate-700 mt-0.5">{rx.patient_name}</div>
                        <div className="text-[11px] text-slate-500">{rx.doctor_name}</div>
                      </div>
                      {getStatusBadge(rx.status)}
                    </div>

                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400">
                      <span>{rx.clinic_hospital}</span>
                      <span>{new Date(rx.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: Prescription Inspector & Clinical Review Actions */}
        <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-6">
          {selectedRx ? (
            <>
              {/* Prescription Header Info */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-black text-slate-900">{selectedRx.id}</h3>
                    {getStatusBadge(selectedRx.status)}
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Patient: <strong>{selectedRx.patient_name}</strong> • Prescriber: <strong>{selectedRx.doctor_name}</strong>
                  </p>
                </div>

                <div className="text-xs text-slate-500">
                  <span>Facility: {selectedRx.clinic_hospital}</span>
                </div>
              </div>

              {/* Prescription Document Display */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-700 block">Uploaded Medical Document</span>
                <div className="border border-slate-200 rounded-2xl overflow-hidden bg-slate-50 p-2 max-h-96 flex items-center justify-center">
                  <img
                    src={selectedRx.file_data}
                    alt={selectedRx.file_name}
                    className="max-h-90 object-contain w-auto rounded-lg shadow-xs"
                  />
                </div>
              </div>

              {/* Clinical Verification Actions (Pharmacist / Admin) */}
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-blue-600" />
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                    Pharmacist Clinical Verification Controls
                  </h4>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Pharmacist Audit Notes & Justification
                  </label>
                  <textarea
                    rows={2}
                    value={actionNotes}
                    onChange={e => setActionNotes(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-hidden bg-white"
                  />
                </div>

                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <button
                    onClick={() => handleReviewAction('Approved')}
                    disabled={processing}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition flex items-center gap-1.5 shadow-xs disabled:opacity-50"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Approve Prescription</span>
                  </button>

                  <button
                    onClick={() => handleReviewAction('Correction Requested')}
                    disabled={processing}
                    className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs transition flex items-center gap-1.5 shadow-xs disabled:opacity-50"
                  >
                    <AlertTriangle className="w-4 h-4" />
                    <span>Request Correction</span>
                  </button>

                  <button
                    onClick={() => handleReviewAction('Rejected')}
                    disabled={processing}
                    className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs transition flex items-center gap-1.5 shadow-xs disabled:opacity-50"
                  >
                    <XCircle className="w-4 h-4" />
                    <span>Reject Prescription</span>
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="p-12 text-center text-xs text-slate-400">
              Select a prescription from the queue to inspect and verify.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
