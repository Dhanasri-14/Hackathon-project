import React from 'react';
import {
  LayoutDashboard,
  HeartPulse,
  Users,
  UserCheck,
  PlusCircle,
  Pill,
  FileText,
  ClipboardCheck,
  Boxes,
  ShoppingBag,
  Truck,
  ShieldAlert,
  History,
  Bell,
  Settings,
  Sparkles,
  X,
  Navigation,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';
import { useI18n } from '../i18n.tsx';

interface SidebarProps {
  currentPage: string;
  onNavigate: (page: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentPage, onNavigate, isOpen, onClose }) => {
  const { user } = useAuth();
  const { t } = useI18n();

  const role = user?.role || 'patient';

  const navSections = [
    {
      title: 'Core Navigation',
      items: [
        { id: 'dashboard', label: t('nav.dashboard'), icon: LayoutDashboard, roles: ['all'] },
      ],
    },
    {
      title: 'Emergency Blood System',
      items: [
        { id: 'blood-requests', label: t('nav.blood_requests'), icon: HeartPulse, roles: ['all'] },
        { id: 'donor-directory', label: t('nav.donor_directory'), icon: Users, roles: ['all'] },
        {
          id: 'donor-profile',
          label: t('nav.donor_profile'),
          icon: UserCheck,
          roles: ['donor', 'patient', 'admin'],
        },
      ],
    },
    {
      title: 'Pharmacy & Deliveries',
      items: [
        { id: 'medicines', label: t('nav.medicines'), icon: Pill, roles: ['all'] },
        { id: 'prescriptions', label: t('nav.prescriptions'), icon: FileText, roles: ['all'] },
        {
          id: 'pharmacy-review',
          label: t('nav.pharmacy_review'),
          icon: ClipboardCheck,
          roles: ['pharmacy_staff', 'admin'],
          badge: 'Rx Staff',
        },
        {
          id: 'pharmacy-inventory',
          label: t('nav.pharmacy_inventory'),
          icon: Boxes,
          roles: ['pharmacy_staff', 'admin'],
        },
        { id: 'orders', label: t('nav.orders'), icon: ShoppingBag, roles: ['all'] },
        {
          id: 'admission-tracking',
          label: t('nav.admission_tracking'),
          icon: Navigation,
          roles: ['all'],
          badge: 'Courier',
        },
        {
          id: 'courier',
          label: t('nav.courier_hub'),
          icon: Truck,
          roles: ['courier', 'pharmacy_staff', 'admin'],
          badge: 'Dispatch',
        },
      ],
    },
    {
      title: 'System & Logs',
      items: [
        {
          id: 'users',
          label: t('nav.user_management'),
          icon: ShieldAlert,
          roles: ['admin'],
          badge: 'Admin',
        },
        {
          id: 'audit-logs',
          label: t('nav.audit_logs'),
          icon: History,
          roles: ['admin'],
          badge: 'Security',
        },
        { id: 'notifications', label: t('nav.notifications'), icon: Bell, roles: ['all'] },
        { id: 'settings', label: t('nav.settings'), icon: Settings, roles: ['all'] },
      ],
    },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-xs md:hidden"
        />
      )}

      {/* Sidebar Panel */}
      <aside
        className={`fixed md:sticky top-16 left-0 z-40 h-[calc(100vh-4rem)] w-64 bg-white border-r border-slate-200 transition-transform duration-200 flex flex-col justify-between shrink-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div className="p-4 overflow-y-auto space-y-6">
          {/* Mobile close button */}
          <div className="flex md:hidden items-center justify-between pb-2 border-b border-slate-100">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Menu</span>
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Nav Items */}
          {navSections.map((section, idx) => {
            const filteredItems = section.items.filter(
              item => item.roles.includes('all') || item.roles.includes(role)
            );
            if (filteredItems.length === 0) return null;

            return (
              <div key={idx} className="space-y-1">
                <p className="px-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  {section.title}
                </p>
                {filteredItems.map(item => {
                  const Icon = item.icon;
                  const isActive = currentPage === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        onNavigate(item.id);
                        onClose();
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition group ${
                        isActive
                          ? 'bg-slate-900 text-white shadow-xs'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon
                          className={`w-4 h-4 transition ${
                            isActive
                              ? 'text-red-400'
                              : 'text-slate-400 group-hover:text-slate-700'
                          }`}
                        />
                        <span>{item.label}</span>
                      </div>
                      {item.badge && (
                        <span
                          className={`text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded ${
                            isActive
                              ? 'bg-red-500 text-white'
                              : 'bg-slate-200 text-slate-700'
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>

        {/* User Card at Bottom */}
        {user && (
          <div className="p-3 border-t border-slate-100 bg-slate-50">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-slate-800 text-white font-bold flex items-center justify-center text-xs shrink-0">
                {user.full_name.charAt(0)}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-slate-900 truncate">{user.full_name}</p>
                <p className="text-[10px] text-slate-500 truncate">{t(`role.${user.role}`)}</p>
              </div>
            </div>
          </div>
        )}
      </aside>
    </>
  );
};
