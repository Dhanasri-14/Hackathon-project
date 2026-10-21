import React, { useState, useEffect } from 'react';
import {
  ShoppingBag,
  Search,
  Filter,
  Truck,
  ArrowRight,
  Clock,
  CheckCircle2,
  FileText,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';
import { useI18n } from '../i18n.tsx';
import { apiRequest } from '../api.ts';
import { Order } from '../types.ts';

export const OrdersPage: React.FC<{ onNavigate: (page: string) => void }> = ({ onNavigate }) => {
  const { user } = useAuth();
  const { t } = useI18n();

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('All');

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== 'All') params.append('status', statusFilter);
      const res = await apiRequest<{ orders: Order[] }>(`/orders?${params.toString()}`);
      setOrders(res.orders);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [statusFilter]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Delivered':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">Delivered</span>;
      case 'Out for Delivery':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">Out for Delivery</span>;
      case 'Courier Assigned':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800">Courier Assigned</span>;
      case 'Processing':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800">Processing</span>;
      case 'Awaiting Prescription Review':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-orange-100 text-orange-800">Awaiting Rx Review</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">{status}</span>;
    }
  };

  return (
    <div className="space-y-6 pb-16">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-blue-600 uppercase tracking-wider">
            <ShoppingBag className="w-4 h-4" />
            Medicine Orders & Tracked Dispatch
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">
            {t('nav.orders')}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Track prescription verification, packing status, courier assignment, and last-mile delivery.
          </p>
        </div>

        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold bg-white"
        >
          <option value="All">All Order Statuses</option>
          <option value="Submitted">Submitted</option>
          <option value="Awaiting Prescription Review">Awaiting Rx Review</option>
          <option value="Approved">Approved</option>
          <option value="Processing">Processing</option>
          <option value="Courier Assigned">Courier Assigned</option>
          <option value="Out for Delivery">Out for Delivery</option>
          <option value="Delivered">Delivered</option>
        </select>
      </div>

      {loading ? (
        <div className="p-12 text-center text-xs text-slate-500">Loading orders...</div>
      ) : orders.length === 0 ? (
        <div className="p-12 bg-white rounded-3xl border border-slate-200 text-center space-y-3">
          <ShoppingBag className="w-10 h-10 text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-slate-800">No orders found</h3>
          <p className="text-xs text-slate-500">Place an order from the medicine catalogue to begin tracking.</p>
          <button
            onClick={() => onNavigate('medicines')}
            className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold"
          >
            Browse Medicines
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map(ord => (
            <div
              key={ord.id}
              onClick={() => onNavigate(`orders/${ord.id}`)}
              className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-blue-400 hover:shadow-md transition cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-4 group"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-black text-slate-900 group-hover:text-blue-600 transition">
                    {ord.id}
                  </span>
                  <span className="text-slate-300">•</span>
                  <span className="text-xs font-bold text-emerald-700">₹{ord.total_amount.toFixed(2)}</span>
                  {ord.prescription_id && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                      Rx Linked
                    </span>
                  )}
                </div>

                <div className="text-xs text-slate-600">
                  Recipient: <strong>{ord.user_name}</strong> • Delivery: {ord.delivery_address}, {ord.delivery_city}
                </div>

                {ord.courier_name && (
                  <div className="text-[11px] text-purple-700 flex items-center gap-1">
                    <Truck className="w-3.5 h-3.5" />
                    <span>Courier Assigned: <strong>{ord.courier_name}</strong></span>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between md:justify-end gap-3 shrink-0">
                <div className="text-left md:text-right">
                  {getStatusBadge(ord.status)}
                  <span className="text-[10px] text-slate-400 block mt-1">
                    {new Date(ord.created_at).toLocaleDateString()}
                  </span>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-blue-600 group-hover:translate-x-1 transition" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
