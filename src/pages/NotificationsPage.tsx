import React, { useState, useEffect } from 'react';
import {
  Bell,
  CheckCircle2,
  Clock,
  ArrowRight,
  Filter,
  Check,
  HeartPulse,
  ShoppingBag,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';
import { useI18n } from '../i18n.tsx';
import { apiRequest } from '../api.ts';
import { NotificationItem } from '../types.ts';

export const NotificationsPage: React.FC<{ onNavigate: (page: string) => void }> = ({ onNavigate }) => {
  const { user } = useAuth();
  const { t, lang } = useI18n();

  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'blood' | 'delivery'>('all');

  const fetchNotifs = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const url = unreadOnly ? '/notifications?unread=true' : '/notifications';
      const res = await apiRequest<{ notifications: NotificationItem[] }>(url);
      setNotifications(res.notifications || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifs();
  }, [unreadOnly, user]);

  const markAllRead = async () => {
    try {
      await apiRequest('/notifications/read-all', { method: 'PUT' });
      await fetchNotifs();
    } catch (err) {
      console.error(err);
    }
  };

  const handleReadSingle = async (n: NotificationItem) => {
    try {
      if (n.is_read === 0) {
        await apiRequest(`/notifications/${n.id}/read`, { method: 'PUT' });
      }
      if (n.link) {
        onNavigate(n.link.replace('/', ''));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const isBloodNotification = (n: NotificationItem) => {
    const t = (n.title + ' ' + n.message).toLowerCase();
    return n.type === 'blood_request' || n.type === 'donor_accepted' || t.includes('blood') || t.includes('donor') || t.includes('🩸');
  };

  const isDeliveryNotification = (n: NotificationItem) => {
    const t = (n.title + ' ' + n.message).toLowerCase();
    return n.type === 'order_status' || n.type === 'order_payment' || n.type === 'prescription_update' || t.includes('order') || t.includes('prescription') || t.includes('delivery') || t.includes('payment') || t.includes('📦');
  };

  const filteredNotifications = notifications.filter(n => {
    if (activeTab === 'blood') return isBloodNotification(n);
    if (activeTab === 'delivery') return isDeliveryNotification(n);
    return true;
  });

  const bloodCount = notifications.filter(isBloodNotification).length;
  const deliveryCount = notifications.filter(isDeliveryNotification).length;

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-16">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900">
            {t('common.notifications')}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Separate audio alerts for 🩸 Blood Requests and 📦 Order Deliveries. Continuous sound active until viewed.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 bg-white px-3 py-1.5 rounded-xl border border-slate-200 cursor-pointer">
            <input
              type="checkbox"
              checked={unreadOnly}
              onChange={e => setUnreadOnly(e.target.checked)}
              className="rounded text-red-600 focus:ring-red-500"
            />
            <span>Unread Only</span>
          </label>

          <button
            onClick={markAllRead}
            className="px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition"
          >
            {t('common.mark_all_read')}
          </button>
        </div>
      </div>

      {/* Category Tabs: All, Blood Requests (🩸), Order Deliveries (📦) */}
      <div className="flex items-center gap-2 p-1.5 bg-slate-200/80 rounded-2xl w-fit">
        <button
          onClick={() => setActiveTab('all')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
            activeTab === 'all' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Bell className="w-3.5 h-3.5" />
          <span>All ({notifications.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('blood')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
            activeTab === 'blood' ? 'bg-red-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <HeartPulse className="w-3.5 h-3.5 text-red-300" />
          <span>🩸 ({bloodCount})</span>
        </button>

        <button
          onClick={() => setActiveTab('delivery')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
            activeTab === 'delivery' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <ShoppingBag className="w-3.5 h-3.5 text-blue-300" />
          <span>📦 ({deliveryCount})</span>
        </button>
      </div>

      {loading ? (
        <div className="p-12 text-center text-xs text-slate-500">Loading notifications...</div>
      ) : filteredNotifications.length === 0 ? (
        <div className="p-12 bg-white rounded-3xl border border-slate-200 text-center space-y-2">
          <Bell className="w-10 h-10 text-slate-300 mx-auto" />
          <h3 className="font-bold text-slate-700 text-sm">{t('common.no_notifications')}</h3>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredNotifications.map(n => {
            const isBlood = isBloodNotification(n);
            const badgeEmoji = isBlood ? '🩸' : '📦';
            const displayTitle = lang === 'ta' ? n.title_ta : n.title;
            const displayMsg = lang === 'ta' ? n.message_ta : n.message;

            return (
              <div
                key={n.id}
                onClick={() => handleReadSingle(n)}
                className={`p-4 rounded-2xl border transition cursor-pointer flex items-start justify-between gap-3 ${
                  n.is_read === 0
                    ? isBlood
                      ? 'bg-red-50/50 border-l-4 border-l-red-600 border-slate-200 shadow-xs'
                      : 'bg-blue-50/50 border-l-4 border-l-blue-600 border-slate-200 shadow-xs'
                    : 'bg-white border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-lg shrink-0 shadow-xs ${
                    isBlood ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'
                  }`}>
                    {badgeEmoji}
                  </div>
                  <div className="space-y-1">
                    <div className="text-xs font-bold text-slate-900 flex items-center gap-2">
                      <span>{displayTitle}</span>
                      {n.is_read === 0 && (
                        <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse"></span>
                      )}
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      {displayMsg}
                    </p>
                    <span className="text-[10px] text-slate-400 block pt-1">
                      {new Date(n.created_at).toLocaleString()}
                    </span>
                  </div>
                </div>

                {n.link && (
                  <div className="shrink-0 text-slate-400 hover:text-slate-700 pt-2">
                    <ArrowRight className="w-4 h-4" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
