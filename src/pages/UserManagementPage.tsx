import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  Search,
  Filter,
  CheckCircle2,
  UserCheck,
  User,
  Shield,
  Building2,
  HeartHandshake,
  Pill,
  Truck,
  UserCircle,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';
import { useI18n } from '../i18n.tsx';
import { apiRequest } from '../api.ts';
import { User as UserType, UserRole } from '../types.ts';

export const UserManagementPage: React.FC<{ onNavigate: (page: string) => void }> = ({ onNavigate }) => {
  const { user } = useAuth();
  const { t } = useI18n();

  const [users, setUsers] = useState<UserType[]>([]);
  const [loading, setLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [toast, setToast] = useState<string | null>(null);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (roleFilter !== 'All') params.append('role', roleFilter);
      const res = await apiRequest<{ users: UserType[] }>(`/users?${params.toString()}`);
      setUsers(res.users);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [roleFilter]);

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      await apiRequest(`/users/${userId}/role`, {
        method: 'PUT',
        body: JSON.stringify({ role: newRole }),
      });
      setToast(`Updated role for user to ${newRole}`);
      setTimeout(() => setToast(null), 3000);
      await fetchUsers();
    } catch (err: any) {
      alert(err.message || 'Failed to update role');
    }
  };

  const filteredUsers = users.filter(u =>
    search ? u.full_name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase()) : true
  );

  return (
    <div className="space-y-6 pb-16">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-purple-600 uppercase tracking-wider">
            <ShieldAlert className="w-4 h-4" />
            Administrative Security Controls
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">
            {t('nav.user_management')}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage user accounts, assign roles, and configure clinical access privileges.
          </p>
        </div>
      </div>

      {toast && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{toast}</span>
        </div>
      )}

      {/* Filter bar */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2 flex-1">
          <div className="relative min-w-[220px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search user name or email..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-slate-200 text-xs focus:ring-2 focus:ring-purple-500 focus:outline-hidden"
            />
          </div>

          <select
            value={roleFilter}
            onChange={e => setRoleFilter(e.target.value)}
            className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold bg-white"
          >
            <option value="All">All Roles</option>
            <option value="patient">Patient / Requester</option>
            <option value="donor">Blood Donor</option>
            <option value="hospital_staff">Hospital Blood Bank Staff</option>
            <option value="pharmacy_staff">Pharmacy Staff</option>
            <option value="courier">Delivery Courier</option>
            <option value="admin">Administrator</option>
          </select>
        </div>

        <div className="text-xs text-slate-500 font-medium">
          Total users: <strong>{filteredUsers.length}</strong>
        </div>
      </div>

      {/* User Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">User</th>
                <th className="py-3 px-4">Email</th>
                <th className="py-3 px-4">Phone & City</th>
                <th className="py-3 px-4">Assigned Role</th>
                <th className="py-3 px-4">Modify Role</th>
                <th className="py-3 px-4 text-right">Joined</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredUsers.map(u => (
                <tr key={u.id} className="hover:bg-slate-50/60 transition">
                  <td className="py-3.5 px-4">
                    <div className="font-bold text-slate-900">{u.full_name}</div>
                    <div className="text-[10px] text-slate-400 font-mono">{u.id}</div>
                  </td>
                  <td className="py-3.5 px-4 text-slate-600 font-mono">{u.email}</td>
                  <td className="py-3.5 px-4 text-slate-700">
                    <div>{u.phone || 'No phone'}</div>
                    <div className="text-[11px] text-slate-400">{u.city || 'Tamil Nadu'}</div>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-slate-100 text-slate-800 border border-slate-200">
                      {t(`role.${u.role}`)}
                    </span>
                  </td>
                  <td className="py-3.5 px-4">
                    <select
                      value={u.role}
                      onChange={e => handleRoleChange(u.id, e.target.value)}
                      className="px-2 py-1 rounded-lg border border-slate-300 text-xs font-semibold bg-white"
                    >
                      <option value="patient">Patient</option>
                      <option value="donor">Donor</option>
                      <option value="hospital_staff">Hospital Staff</option>
                      <option value="pharmacy_staff">Pharmacy Staff</option>
                      <option value="courier">Courier</option>
                      <option value="admin">Admin</option>
                    </select>
                  </td>
                  <td className="py-3.5 px-4 text-right text-slate-400">
                    {u.created_at ? new Date(u.created_at).toLocaleDateString() : 'Hospital Registry'}
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
