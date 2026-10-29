import React, { useState, useEffect } from 'react';
import {
  History,
  Search,
  Filter,
  Shield,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Lock,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';
import { useI18n } from '../i18n.tsx';
import { apiRequest } from '../api.ts';
import { AuditLogItem } from '../types.ts';

export const AuditLogsPage: React.FC<{ onNavigate: (page: string) => void }> = ({ onNavigate }) => {
  const { user } = useAuth();
  const { t } = useI18n();

  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState('All');
  const [actionFilter, setActionFilter] = useState('All');
  const [resetting, setResetting] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (roleFilter !== 'All') params.append('role', roleFilter);
      if (actionFilter !== 'All') params.append('action', actionFilter);
      const res = await apiRequest<{ logs: AuditLogItem[] }>(`/audit-logs?${params.toString()}`);
      setLogs(res.logs);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [roleFilter, actionFilter]);

  const handleSynchronizeOperationalData = async () => {
    if (!window.confirm('Synchronize database to clean baseline operational state? Active hospital records will be refreshed.')) {
      return;
    }
    setResetting(true);
    try {
      await apiRequest('/system/reset-demo', { method: 'POST' });
      setToast('System database verified and synchronized with baseline hospital records!');
      setTimeout(() => setToast(null), 3500);
      await fetchLogs();
    } catch (err: any) {
      console.error(err);
    } finally {
      setResetting(false);
    }
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-purple-600 uppercase tracking-wider">
            <History className="w-4 h-4" />
            Compliance & System Audit Trail
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">
            {t('nav.audit_logs')}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Immutable system activity log recording critical clinical confirmations, orders, and matching actions.
          </p>
        </div>

        <button
          onClick={handleSynchronizeOperationalData}
          disabled={resetting}
          className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition flex items-center justify-center gap-2 shadow-xs disabled:opacity-50"
        >
          <RotateCcw className={`w-4 h-4 ${resetting ? 'animate-spin' : ''}`} />
          <span>Synchronize Operational Records</span>
        </button>
      </div>

      {toast && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{toast}</span>
        </div>
      )}

      {/* Filter toolbar */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2 flex-1">
          <select
            value={roleFilter}
            onChange={e => setRoleFilter(e.target.value)}
            className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold bg-white"
          >
            <option value="All">All User Roles</option>
            <option value="hospital_staff">Hospital Staff</option>
            <option value="pharmacy_staff">Pharmacy Staff</option>
            <option value="donor">Blood Donor</option>
            <option value="courier">Courier</option>
            <option value="patient">Patient</option>
            <option value="admin">Admin</option>
          </select>

          <select
            value={actionFilter}
            onChange={e => setActionFilter(e.target.value)}
            className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold bg-white"
          >
            <option value="All">All Audit Actions</option>
            <option value="CREATE_BLOOD_REQUEST">CREATE_BLOOD_REQUEST</option>
            <option value="RUN_MATCHING_ENGINE">RUN_MATCHING_ENGINE</option>
            <option value="CONFIRM_DONATION">CONFIRM_DONATION</option>
            <option value="REVIEW_PRESCRIPTION">REVIEW_PRESCRIPTION</option>
            <option value="CREATE_ORDER">CREATE_ORDER</option>
            <option value="ASSIGN_COURIER">ASSIGN_COURIER</option>
            <option value="UPDATE_DELIVERY_STATUS">UPDATE_DELIVERY_STATUS</option>
            <option value="LOGIN">LOGIN</option>
          </select>
        </div>

        <div className="text-xs text-slate-500 font-medium">
          Logged events: <strong>{logs.length}</strong>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Action</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4">Entity</th>
                <th className="py-3 px-4">Details</th>
                <th className="py-3 px-4 text-right">IP Address</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
              {logs.map(log => (
                <tr key={log.id} className="hover:bg-slate-50/60 transition">
                  <td className="py-3 px-4 text-slate-400 whitespace-nowrap">
                    {new Date(log.created_at).toLocaleString([], { hour12: false })}
                  </td>
                  <td className="py-3 px-4 font-bold text-slate-900 font-sans">
                    <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-800">
                      {log.action}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-600 font-sans">
                    {log.user_role ? t(`role.${log.user_role}`) : 'System'}
                  </td>
                  <td className="py-3 px-4 text-slate-700">
                    {log.entity_type} ({log.entity_id})
                  </td>
                  <td className="py-3 px-4 text-slate-600 font-sans max-w-sm truncate" title={log.details}>
                    {log.details}
                  </td>
                  <td className="py-3 px-4 text-right text-slate-400 whitespace-nowrap">
                    {log.ip_address}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
