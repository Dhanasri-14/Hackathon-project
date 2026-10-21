import React from 'react';
import { X, Shield, Building2, HeartHandshake, Pill, Truck, UserCircle, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';
import { useI18n } from '../i18n.tsx';
import { UserRole } from '../types.ts';

interface DemoSwitcherModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DemoSwitcherModal: React.FC<DemoSwitcherModalProps> = ({ isOpen, onClose }) => {
  const { user, switchDemoRole } = useAuth();
  const { t } = useI18n();

  if (!isOpen) return null;

  const roles: {
    role: UserRole;
    name: string;
    title: string;
    email: string;
    color: string;
    icon: React.ReactNode;
    features: string[];
  }[] = [
    {
      role: 'hospital_staff',
      name: 'Rajesh Kannan',
      title: 'Hospital Blood Bank Officer',
      email: 'staff.rajesh@apollo-hospital.org',
      color: 'border-red-500 bg-red-50/50 text-red-900',
      icon: <Building2 className="w-5 h-5 text-red-600" />,
      features: ['Post emergency blood requests', 'Trigger matching algorithm', 'Review donor responses & cross-matches', 'Confirm clinical fulfillment'],
    },
    {
      role: 'donor',
      name: 'Kavitha Ramanathan',
      title: 'Registered Blood Donor (O+)',
      email: 'donor.kavitha@gmail.com',
      color: 'border-rose-500 bg-rose-50/50 text-rose-900',
      icon: <HeartHandshake className="w-5 h-5 text-rose-600" />,
      features: ['Receive instant emergency notifications', 'Accept or decline donation request', 'Manage availability & cooldown status'],
    },
    {
      role: 'pharmacy_staff',
      name: 'Anandhan Selvaraj',
      title: 'Licensed Chief Pharmacist',
      email: 'pharmacist.anand@medplus-tn.org',
      color: 'border-blue-500 bg-blue-50/50 text-blue-900',
      icon: <Pill className="w-5 h-5 text-blue-600" />,
      features: ['Review & approve uploaded prescriptions', 'Manage inventory & stock levels', 'Process orders & assign couriers'],
    },
    {
      role: 'courier',
      name: 'Murugan Perumal',
      title: 'Medicine Delivery Partner',
      email: 'courier.murugan@fastmed-logistics.org',
      color: 'border-amber-500 bg-amber-50/50 text-amber-900',
      icon: <Truck className="w-5 h-5 text-amber-600" />,
      features: ['View assigned medicine deliveries', 'Update delivery status (In Transit, Delivered)', 'Add delivery completion notes'],
    },
    {
      role: 'patient',
      name: 'S. Priya',
      title: 'Patient & Family Requester',
      email: 'patient.priya@outlook.com',
      color: 'border-teal-500 bg-teal-50/50 text-teal-900',
      icon: <UserCircle className="w-5 h-5 text-teal-600" />,
      features: ['Order essential medicines & OTC items', 'Upload doctor prescriptions', 'Track order delivery timeline & status'],
    },
    {
      role: 'admin',
      name: 'Dr. Meenakshi Sundaram',
      title: 'System Administrator',
      email: 'admin@uyirthunai.org',
      color: 'border-purple-500 bg-purple-50/50 text-purple-900',
      icon: <Shield className="w-5 h-5 text-purple-600" />,
      features: ['Complete system audit trail', 'Manage users and assign roles', 'System-wide analytics and demo data reset'],
    },
  ];

  const handleSelect = async (role: UserRole) => {
    await switchDemoRole(role);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="p-5 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-600 rounded-lg">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold">Fast Role Switcher (Judge & Demo Mode)</h3>
              <p className="text-xs text-slate-300">
                Instantly switch roles with 1-click to test complete end-to-end workflows
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-3">
          <p className="text-xs text-slate-600">
            Select any persona below to authenticate instantly without entering passwords:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {roles.map(item => {
              const isActive = user?.role === item.role;
              return (
                <div
                  key={item.role}
                  onClick={() => handleSelect(item.role)}
                  className={`cursor-pointer p-4 rounded-xl border-2 transition-all hover:scale-[1.01] hover:shadow-md relative ${
                    isActive ? 'border-emerald-600 bg-emerald-50/60' : item.color
                  }`}
                >
                  {isActive && (
                    <div className="absolute top-3 right-3 flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Active
                    </div>
                  )}

                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-lg bg-white shadow-xs shrink-0">{item.icon}</div>
                    <div>
                      <h4 className="font-bold text-sm text-slate-900 leading-tight">{item.name}</h4>
                      <p className="text-xs font-semibold text-slate-600">{t(`role.${item.role}`)}</p>
                    </div>
                  </div>

                  <div className="mt-3 pt-2 border-t border-slate-200/60">
                    <ul className="text-[11px] text-slate-600 space-y-1">
                      {item.features.slice(0, 2).map((feat, i) => (
                        <li key={i} className="flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                          <span>{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="mt-3">
                    <button
                      className={`w-full py-1.5 px-3 rounded-lg text-xs font-bold transition text-center shadow-xs ${
                        isActive
                          ? 'bg-emerald-600 text-white'
                          : 'bg-slate-900 text-white hover:bg-slate-800'
                      }`}
                    >
                      {isActive ? 'Currently Logged In' : `Switch to ${item.name.split(' ')[0]}`}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-between items-center text-xs text-slate-500">
          <span>Academic Hackathon Demo Mode: All records are fictional and safe.</span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-lg font-medium transition"
          >
            {t('action.close')}
          </button>
        </div>
      </div>
    </div>
  );
};
