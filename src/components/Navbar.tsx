import React, { useState, useEffect } from 'react';
import {
  Bell,
  Globe,
  ShoppingCart,
  User,
  LogOut,
  Sparkles,
  Menu,
  X,
  Check,
  ChevronDown,
  Building2,
  HeartHandshake,
  Pill,
  Truck,
  Shield,
  UserCircle,
} from 'lucide-react';
import { Logo } from './Logo.tsx';
import { useAuth } from '../context/AuthContext.tsx';
import { useI18n, Language } from '../i18n.tsx';
import { useCart } from '../context/CartContext.tsx';
import { DemoSwitcherModal } from './DemoSwitcherModal.tsx';
import { apiRequest } from '../api.ts';
import { NotificationItem } from '../types.ts';

interface NavbarProps {
  onToggleSidebar?: () => void;
  onNavigate: (page: string) => void;
  currentPage: string;
}

export const Navbar: React.FC<NavbarProps> = ({ onToggleSidebar, onNavigate, currentPage }) => {
  const { user, logout } = useAuth();
  const { lang, setLang, t } = useI18n();
  const { totalItemsCount } = useCart();

  const [isDemoModalOpen, setIsDemoModalOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);

  // Poll notifications every 10 seconds for real-time responsiveness
  useEffect(() => {
    if (!user) return;
    const fetchNotifs = async () => {
      try {
        const res = await apiRequest<{ notifications: NotificationItem[]; unreadCount: number }>(
          '/notifications'
        );
        setNotifications(res.notifications);
        setUnreadCount(res.unreadCount);
      } catch (e) {
        // quiet error on background poll
      }
    };

    fetchNotifs();
    const interval = setInterval(fetchNotifs, 10000);
    return () => clearInterval(interval);
  }, [user]);

  const markAllRead = async () => {
    try {
      await apiRequest('/notifications/read-all', { method: 'PUT' });
      setUnreadCount(0);
      setNotifications(prev => prev.map(n => ({ ...n, is_read: 1 })));
    } catch (e) {
      console.error(e);
    }
  };

  const getRoleIcon = (role?: string) => {
    switch (role) {
      case 'hospital_staff':
        return <Building2 className="w-3.5 h-3.5 text-red-400" />;
      case 'donor':
        return <HeartHandshake className="w-3.5 h-3.5 text-rose-400" />;
      case 'pharmacy_staff':
        return <Pill className="w-3.5 h-3.5 text-blue-400" />;
      case 'courier':
        return <Truck className="w-3.5 h-3.5 text-amber-400" />;
      case 'admin':
        return <Shield className="w-3.5 h-3.5 text-purple-400" />;
      default:
        return <UserCircle className="w-3.5 h-3.5 text-teal-400" />;
    }
  };

  return (
    <>
      <header className="sticky top-0 z-40 bg-slate-900 border-b border-slate-800 text-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          {/* Left: Mobile hamburger & Logo */}
          <div className="flex items-center gap-3">
            <button
              onClick={onToggleSidebar}
              className="md:hidden p-2 text-slate-300 hover:text-white rounded-lg hover:bg-slate-800 transition"
              aria-label="Toggle Navigation"
            >
              <Menu className="w-5 h-5" />
            </button>

            <button onClick={() => onNavigate('home')} className="text-left focus:outline-hidden">
              <Logo size="md" light showTagline={false} />
            </button>
          </div>

          {/* Center: Department Portal / Quick Role Badge */}
          <div className="hidden lg:flex items-center gap-2">
            <button
              onClick={() => setIsDemoModalOpen(true)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 border border-slate-700 transition shadow-inner"
            >
              <Shield className="w-3.5 h-3.5 text-blue-400" />
              <span>Portal: </span>
              {user ? (
                <span className="font-semibold text-white flex items-center gap-1.5">
                  {getRoleIcon(user.role)}
                  {t(`role.${user.role}`)}
                </span>
              ) : (
                <span className="text-blue-300 font-semibold">Select Department</span>
              )}
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>
          </div>

          {/* Right: Language switch, Cart, Notifications, Profile */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Language Switcher */}
            <div className="flex items-center bg-slate-800 rounded-lg p-0.5 border border-slate-700 text-xs">
              <button
                onClick={() => setLang('en')}
                className={`px-2 py-1 rounded font-medium transition ${
                  lang === 'en' ? 'bg-red-600 text-white shadow-xs' : 'text-slate-300 hover:text-white'
                }`}
              >
                EN
              </button>
              <button
                onClick={() => setLang('ta')}
                className={`px-2 py-1 rounded font-medium transition ${
                  lang === 'ta' ? 'bg-red-600 text-white shadow-xs' : 'text-slate-300 hover:text-white'
                }`}
              >
                தமிழ்
              </button>
            </div>

            {/* Shopping Cart button */}
            <button
              onClick={() => onNavigate('cart')}
              className="relative p-2 text-slate-300 hover:text-white rounded-lg hover:bg-slate-800 transition"
              title={t('pharma.cart_title')}
            >
              <ShoppingCart className="w-5 h-5" />
              {totalItemsCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-blue-600 text-white text-[11px] font-bold rounded-full flex items-center justify-center animate-bounce">
                  {totalItemsCount}
                </span>
              )}
            </button>

            {/* Notifications Dropdown */}
            {user && (
              <div className="relative">
                <button
                  onClick={() => setIsNotifOpen(!isNotifOpen)}
                  className="relative p-2 text-slate-300 hover:text-white rounded-lg hover:bg-slate-800 transition"
                  title={t('common.notifications')}
                >
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-600 text-white text-[11px] font-bold rounded-full flex items-center justify-center">
                      {unreadCount}
                    </span>
                  )}
                </button>

                {isNotifOpen && (
                  <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-2xl border border-slate-200 text-slate-900 overflow-hidden z-50">
                    <div className="p-3 bg-slate-900 text-white flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Bell className="w-4 h-4 text-red-400" />
                        <span className="text-sm font-bold">{t('common.notifications')}</span>
                      </div>
                      {unreadCount > 0 && (
                        <button
                          onClick={markAllRead}
                          className="text-xs text-slate-300 hover:text-white underline font-medium"
                        >
                          {t('common.mark_all_read')}
                        </button>
                      )}
                    </div>

                    <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                      {notifications.length === 0 ? (
                        <div className="p-6 text-center text-xs text-slate-500">
                          {t('common.no_notifications')}
                        </div>
                      ) : (
                        notifications.slice(0, 8).map(n => (
                          <div
                            key={n.id}
                            onClick={() => {
                              setIsNotifOpen(false);
                              if (n.link) onNavigate(n.link.replace('/', ''));
                            }}
                            className={`p-3 text-xs cursor-pointer hover:bg-slate-50 transition ${
                              n.is_read === 0 ? 'bg-red-50/40 border-l-3 border-red-600' : ''
                            }`}
                          >
                            <div className="font-bold text-slate-800 mb-0.5">
                              {lang === 'ta' ? n.title_ta : n.title}
                            </div>
                            <p className="text-slate-600 leading-relaxed">
                              {lang === 'ta' ? n.message_ta : n.message}
                            </p>
                            <span className="text-[10px] text-slate-400 mt-1 block">
                              {new Date(n.created_at).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          </div>
                        ))
                      )}
                    </div>

                    <div className="p-2 bg-slate-50 border-t border-slate-100 text-center">
                      <button
                        onClick={() => {
                          setIsNotifOpen(false);
                          onNavigate('notifications');
                        }}
                        className="text-xs font-semibold text-red-600 hover:text-red-700"
                      >
                        {t('action.view')} {t('common.notifications')} →
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* User Profile or Login */}
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                  className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-slate-800 transition"
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-red-600 to-rose-400 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                    {user.full_name.charAt(0)}
                  </div>
                  <span className="hidden md:block text-xs font-medium text-slate-200 max-w-[120px] truncate">
                    {user.full_name}
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </button>

                {isProfileMenuOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-2xl border border-slate-200 text-slate-900 py-1.5 z-50">
                    <div className="px-4 py-2 border-b border-slate-100">
                      <p className="text-xs font-bold text-slate-900 truncate">{user.full_name}</p>
                      <p className="text-[11px] text-slate-500 truncate">{user.email}</p>
                      <span className="inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-700">
                        {t(`role.${user.role}`)}
                      </span>
                    </div>

                    <button
                      onClick={() => {
                        setIsProfileMenuOpen(false);
                        onNavigate('dashboard');
                      }}
                      className="w-full text-left px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 transition"
                    >
                      {t('nav.dashboard')}
                    </button>
                    <button
                      onClick={() => {
                        setIsProfileMenuOpen(false);
                        onNavigate('settings');
                      }}
                      className="w-full text-left px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 transition"
                    >
                      {t('nav.settings')}
                    </button>
                    <button
                      onClick={() => {
                        setIsProfileMenuOpen(false);
                        setIsDemoModalOpen(true);
                      }}
                      className="w-full text-left px-4 py-2 text-xs text-red-600 font-bold hover:bg-red-50 transition flex items-center gap-1.5"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      {t('nav.switch_role')}
                    </button>

                    <div className="border-t border-slate-100 my-1"></div>

                    <button
                      onClick={() => {
                        setIsProfileMenuOpen(false);
                        logout();
                        onNavigate('home');
                      }}
                      className="w-full text-left px-4 py-2 text-xs text-rose-600 hover:bg-rose-50 transition flex items-center gap-1.5"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      {t('nav.logout')}
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsDemoModalOpen(true)}
                  className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs transition shadow-xs flex items-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Demo Logins</span>
                </button>
                <button
                  onClick={() => onNavigate('login')}
                  className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white font-semibold text-xs transition shadow-xs"
                >
                  {t('nav.login')}
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Demo Switcher Modal */}
      <DemoSwitcherModal isOpen={isDemoModalOpen} onClose={() => setIsDemoModalOpen(false)} />
    </>
  );
};
