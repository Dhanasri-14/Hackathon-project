import React from 'react';
import { ShieldAlert, ArrowLeft, Sparkles, Building2, Pill, Truck, UserCheck, Shield } from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';
import { useI18n } from '../i18n.tsx';
import { UserRole } from '../types.ts';

export const AccessDenied: React.FC<{
  requiredRole?: string;
  onNavigate: (page: string) => void;
}> = ({ requiredRole, onNavigate }) => {
  const { user, switchDemoRole } = useAuth();
  const { t } = useI18n();

  const handleSwitch = async (role: UserRole) => {
    await switchDemoRole(role);
  };

  return (
    <div className="max-w-xl mx-auto py-12 text-center space-y-6">
      <div className="w-16 h-16 rounded-3xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto shadow-xs">
        <ShieldAlert className="w-8 h-8" />
      </div>

      <div className="space-y-2">
        <h1 className="text-2xl font-black text-slate-900">Access Restricted</h1>
        <p className="text-xs text-slate-600 max-w-md mx-auto leading-relaxed">
          Your current authenticated persona (<strong>{user ? t(`role.${user.role}`) : 'Guest'}</strong>) does not hold authorization for this feature.
          {requiredRole ? ` This workflow requires the '${requiredRole}' role.` : ''}
        </p>
      </div>

      {/* Department & Role Switcher */}
      <div className="p-5 rounded-2xl bg-slate-900 text-white text-left space-y-3 shadow-xl">
        <div className="flex items-center gap-2 text-blue-400 text-xs font-bold uppercase tracking-wider">
          <Building2 className="w-4 h-4" />
          Department Access Selector
        </div>
        <p className="text-xs text-slate-300">
          Switch to an authorized departmental role to access this protected healthcare area:
        </p>

        <div className="grid grid-cols-2 gap-2 pt-1">
          <button
            onClick={() => handleSwitch('hospital_staff')}
            className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-left text-xs font-bold text-white transition flex items-center gap-2"
          >
            <Building2 className="w-4 h-4 text-red-400 shrink-0" />
            <span>Hospital Blood Bank</span>
          </button>
          <button
            onClick={() => handleSwitch('pharmacy_staff')}
            className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-left text-xs font-bold text-white transition flex items-center gap-2"
          >
            <Pill className="w-4 h-4 text-blue-400 shrink-0" />
            <span>Licensed Pharmacist</span>
          </button>
          <button
            onClick={() => handleSwitch('courier')}
            className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-left text-xs font-bold text-white transition flex items-center gap-2"
          >
            <Truck className="w-4 h-4 text-amber-400 shrink-0" />
            <span>Delivery Courier</span>
          </button>
          <button
            onClick={() => handleSwitch('admin')}
            className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-left text-xs font-bold text-white transition flex items-center gap-2"
          >
            <Shield className="w-4 h-4 text-purple-400 shrink-0" />
            <span>System Administrator</span>
          </button>
        </div>
      </div>

      <button
        onClick={() => onNavigate('dashboard')}
        className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition inline-flex items-center gap-2"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Return to Main Dashboard</span>
      </button>
    </div>
  );
};
