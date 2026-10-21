import React, { useState, useEffect } from 'react';
import {
  Bell,
  CheckCircle2,
  Clock,
  ArrowRight,
  Filter,
  Check,
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

  const fetchNotifs = async () => {
    setLoading(true);
    try {
      const url = unreadOnly ? '/notifications?unread=true' : '/notifications';
      const res = await apiRequest<{ notifications: NotificationItem[] }>(url);
      setNotifications(res.notifications);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifs();
  }, [unreadOnly]);

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

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-16">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900">
            {t('common.notifications')}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time alerts for blood matches, donor responses, and prescription updates.
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

      {loading ? (
        <div className="p-12 text-center text-xs text-slate-500">Loading notifications...</div>
      ) : notifications.length === 0 ? (
        <div className="p-12 bg-white rounded-3xl border border-slate-200 text-center space-y-2">
          <Bell className="w-10 h-10 text-slate-300 mx-auto" />
          <h3 className="font-bold text-slate-700 text-sm">{t('common.no_notifications')}</h3>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map(n => (
            <div
              key={n.id}
              onClick={() => handleReadSingle(n)}
              className={`p-4 rounded-2xl border transition cursor-pointer flex items-start justify-between gap-3 ${
                n.is_read === 0
                  ? 'bg-red-50/40 border-l-4 border-l-red-600 border-slate-200 shadow-xs'
                  : 'bg-white border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="space-y-1">
                <div className="text-xs font-bold text-slate-900">
                  {lang === 'ta' ? n.title_ta : n.title}
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {lang === 'ta' ? n.message_ta : n.message}
                </p>
                <span className="text-[10px] text-slate-400 block pt-1">
                  {new Date(n.created_at).toLocaleString()}
                </span>
              </div>

              {n.link && (
                <div className="shrink-0 text-slate-400 hover:text-slate-700 pt-1">
                  <ArrowRight className="w-4 h-4" />
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
