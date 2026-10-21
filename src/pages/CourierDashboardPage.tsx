import React, { useState, useEffect } from 'react';
import {
  Truck,
  MapPin,
  Phone,
  CheckCircle2,
  Clock,
  Navigation,
  ArrowRight,
  Package,
  AlertCircle,
  ShieldCheck,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';
import { useI18n } from '../i18n.tsx';
import { apiRequest } from '../api.ts';
import { Order } from '../types.ts';

export const CourierDashboardPage: React.FC<{ onNavigate: (page: string) => void }> = ({ onNavigate }) => {
  const { user } = useAuth();
  const { t } = useI18n();

  const [deliveries, setDeliveries] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const fetchDeliveries = async () => {
    setLoading(true);
    try {
      const res = await apiRequest<{ deliveries: Order[] }>('/courier/deliveries');
      setDeliveries(res.deliveries);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDeliveries();
  }, [user]);

  const handleUpdateDeliveryStatus = async (orderId: string, status: 'picked_up' | 'in_transit' | 'delivered') => {
    setUpdatingId(orderId);
    try {
      await apiRequest(`/courier/deliveries/${orderId}/status`, {
        method: 'PUT',
        body: JSON.stringify({
          pickup_status: status,
          status_note: status === 'delivered' ? 'Handed directly to recipient at doorstep.' : `Status progressed to ${status}`,
        }),
      });

      setToast(`Delivery for ${orderId} updated to ${status}!`);
      setTimeout(() => setToast(null), 3000);
      await fetchDeliveries();
    } catch (err: any) {
      alert(err.message || 'Update failed');
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="space-y-6 pb-16">
      <div>
        <div className="flex items-center gap-2 text-xs font-bold text-amber-600 uppercase tracking-wider">
          <Truck className="w-4 h-4" />
          Last-Mile Tracked Dispatch Fleet
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">
          {t('nav.courier_hub')}
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Assigned medicine parcels, recipient addresses, and status dispatch updater.
        </p>
      </div>

      {toast && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{toast}</span>
        </div>
      )}

      {loading ? (
        <div className="p-12 text-center text-xs text-slate-500">Loading deliveries...</div>
      ) : deliveries.length === 0 ? (
        <div className="p-12 bg-white rounded-3xl border border-slate-200 text-center space-y-3">
          <Truck className="w-10 h-10 text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-slate-800">No active delivery assignments</h3>
          <p className="text-xs text-slate-500">
            Orders assigned to you by the pharmacy hub will appear here automatically.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {deliveries.map(d => {
            const isDelivered = d.status === 'Delivered';
            const isProcessing = updatingId === d.id;

            return (
              <div
                key={d.id}
                className={`p-6 rounded-3xl border transition shadow-sm space-y-4 ${
                  isDelivered ? 'bg-slate-50 border-slate-200' : 'bg-white border-slate-200 hover:border-amber-400'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-black text-slate-900">{d.id}</span>
                      <span className="text-slate-300">•</span>
                      <span className="text-xs font-bold text-blue-700">₹{d.total_amount.toFixed(2)}</span>
                      <span className="text-xs font-medium text-slate-500">({d.payment_method})</span>
                    </div>

                    <h3 className="text-base font-bold text-slate-900">
                      Customer: {d.user_name}
                    </h3>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold ${
                        isDelivered
                          ? 'bg-emerald-100 text-emerald-800'
                          : d.status === 'Out for Delivery'
                          ? 'bg-amber-100 text-amber-800 animate-pulse'
                          : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      {d.status}
                    </span>
                  </div>
                </div>

                {/* Recipient Details & Location */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs">
                  <div className="flex items-start gap-2.5">
                    <MapPin className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-slate-900 block">Delivery Destination:</strong>
                      <span className="text-slate-700 leading-relaxed block">{d.delivery_address}</span>
                      <span className="text-slate-500 font-semibold">{d.delivery_city}</span>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <Phone className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-slate-900 block">Recipient Contact:</strong>
                      <span className="text-slate-800 font-mono font-bold block">{d.delivery_phone}</span>
                      <span className="text-[11px] text-slate-500">Call recipient before arriving</span>
                    </div>
                  </div>
                </div>

                {/* Action buttons for courier */}
                {!isDelivered && (
                  <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
                    <span className="text-xs font-bold text-slate-500">Update Courier Dispatch:</span>
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        onClick={() => handleUpdateDeliveryStatus(d.id, 'picked_up')}
                        disabled={isProcessing}
                        className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition shadow-xs"
                      >
                        1. Picked Up
                      </button>
                      <button
                        onClick={() => handleUpdateDeliveryStatus(d.id, 'in_transit')}
                        disabled={isProcessing}
                        className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold transition shadow-xs"
                      >
                        2. Out for Delivery
                      </button>
                      <button
                        onClick={() => handleUpdateDeliveryStatus(d.id, 'delivered')}
                        disabled={isProcessing}
                        className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition shadow-xs"
                      >
                        3. Mark Delivered
                      </button>
                    </div>
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
