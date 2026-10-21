import React, { useState, useEffect } from 'react';
import {
  ShoppingBag,
  ArrowLeft,
  Truck,
  CheckCircle2,
  Clock,
  MapPin,
  Phone,
  FileText,
  User,
  ShieldCheck,
  AlertTriangle,
  Send,
  Boxes,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';
import { useI18n } from '../i18n.tsx';
import { apiRequest } from '../api.ts';
import { Order, OrderItem, DeliveryAssignment } from '../types.ts';

interface OrderDetailPageProps {
  orderId: string;
  onNavigate: (page: string) => void;
}

const TIMELINE_STEPS = [
  { key: 'Submitted', label: 'Order Placed', desc: 'Received by UyirThunai' },
  { key: 'Approved', label: 'Rx Verified', desc: 'Pharmacist approved' },
  { key: 'Processing', label: 'Packed & Ready', desc: 'Temperature-safe packaging' },
  { key: 'Courier Assigned', label: 'Courier Assigned', desc: 'Assigned to delivery fleet' },
  { key: 'Out for Delivery', label: 'Out for Delivery', desc: 'In transit to customer' },
  { key: 'Delivered', label: 'Delivered', desc: 'Handed over successfully' },
];

export const OrderDetailPage: React.FC<OrderDetailPageProps> = ({ orderId, onNavigate }) => {
  const { user } = useAuth();
  const { t } = useI18n();

  const [order, setOrder] = useState<Order | null>(null);
  const [items, setItems] = useState<OrderItem[]>([]);
  const [history, setHistory] = useState<DeliveryAssignment[]>([]);
  const [couriers, setCouriers] = useState<any[]>([]);
  const [selectedCourierId, setSelectedCourierId] = useState('');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const fetchOrderDetails = async () => {
    setLoading(true);
    try {
      const res = await apiRequest<{ order: Order; items: OrderItem[]; deliveryHistory: DeliveryAssignment[] }>(
        `/orders/${orderId}`
      );
      setOrder(res.order);
      setItems(res.items);
      setHistory(res.deliveryHistory);

      if (user?.role === 'pharmacy_staff' || user?.role === 'admin') {
        const cRes = await apiRequest<{ couriers: any[] }>('/couriers');
        setCouriers(cRes.couriers);
        if (cRes.couriers.length > 0 && !selectedCourierId) {
          setSelectedCourierId(cRes.couriers[0].id);
        }
      }
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrderDetails();
  }, [orderId]);

  const handleUpdateStatus = async (newStatus: string) => {
    setActionLoading(true);
    try {
      await apiRequest(`/orders/${orderId}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status: newStatus }),
      });
      setToast(`Order status updated to ${newStatus}`);
      await fetchOrderDetails();
    } catch (err: any) {
      alert(err.message || 'Status update failed');
    } finally {
      setActionLoading(false);
    }
  };

  const handleAssignCourier = async () => {
    if (!selectedCourierId) return;
    setActionLoading(true);
    try {
      await apiRequest(`/orders/${orderId}/assign-courier`, {
        method: 'POST',
        body: JSON.stringify({
          courier_id: selectedCourierId,
          notes: 'Package ready at pharmacy counter for immediate delivery.',
        }),
      });
      setToast('Courier partner successfully assigned to order!');
      await fetchOrderDetails();
    } catch (err: any) {
      alert(err.message || 'Assign courier failed');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCourierStatus = async (pickupStatus: string) => {
    setActionLoading(true);
    try {
      await apiRequest(`/courier/deliveries/${orderId}/status`, {
        method: 'PUT',
        body: JSON.stringify({
          pickup_status: pickupStatus,
          status_note: pickupStatus === 'delivered' ? 'Package delivered to recipient with signature.' : 'Courier in transit with emergency cooler pack.',
        }),
      });
      setToast(`Delivery progress updated: ${pickupStatus}`);
      await fetchOrderDetails();
    } catch (err: any) {
      alert(err.message || 'Failed to update delivery');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-16 text-center text-xs text-slate-500">
        <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        Loading order tracking details...
      </div>
    );
  }

  if (!order) {
    return (
      <div className="p-8 text-center space-y-4">
        <p className="text-sm font-bold text-slate-700">Order not found.</p>
        <button
          onClick={() => onNavigate('orders')}
          className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold"
        >
          Back to Orders
        </button>
      </div>
    );
  }

  const isPharmaOrAdmin = user?.role === 'pharmacy_staff' || user?.role === 'admin';
  const isCourier = user?.role === 'courier';

  // Compute active step index for timeline
  const statusIndexMap: Record<string, number> = {
    Submitted: 0,
    'Awaiting Prescription Review': 0,
    Approved: 1,
    Processing: 2,
    'Ready for Dispatch': 2,
    'Courier Assigned': 3,
    'Out for Delivery': 4,
    Delivered: 5,
  };
  const currentStepIndex = statusIndexMap[order.status] ?? 0;

  return (
    <div className="space-y-6 pb-16">
      <div className="flex items-center justify-between">
        <button
          onClick={() => onNavigate('orders')}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to All Orders</span>
        </button>
      </div>

      {toast && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{toast}</span>
        </div>
      )}

      {/* Header Info */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-400">ORDER TRACKING</span>
              <span className="text-slate-300">•</span>
              <span className="text-xs font-semibold text-slate-500">
                {new Date(order.created_at).toLocaleString()}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900">{order.id}</h1>
            <p className="text-xs text-slate-500">
              Customer: <strong>{order.user_name}</strong> • Phone: <span className="font-mono">{order.delivery_phone}</span>
            </p>
          </div>

          <div className="flex flex-col sm:items-end gap-1.5">
            <span className="text-2xl font-black text-blue-700">₹{order.total_amount.toFixed(2)}</span>
            <span className="text-xs font-bold px-3 py-1 rounded-full bg-blue-100 text-blue-800 border border-blue-200">
              {order.status}
            </span>
          </div>
        </div>

        {/* Visual Progress Timeline */}
        <div className="pt-4 border-t border-slate-100">
          <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-4">
            Live Delivery Journey & Verification Status
          </span>

          <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
            {TIMELINE_STEPS.map((step, idx) => {
              const isPast = idx < currentStepIndex;
              const isCurrent = idx === currentStepIndex;

              return (
                <div
                  key={step.key}
                  className={`p-3 rounded-2xl border text-left transition ${
                    isCurrent
                      ? 'border-blue-600 bg-blue-50/50 shadow-xs ring-1 ring-blue-500'
                      : isPast
                      ? 'border-emerald-300 bg-emerald-50/20'
                      : 'border-slate-200 bg-slate-50/50 opacity-60'
                  }`}
                >
                  <div className="flex items-center gap-1.5 mb-1">
                    {isPast ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    ) : isCurrent ? (
                      <span className="w-3.5 h-3.5 rounded-full bg-blue-600 animate-ping shrink-0" />
                    ) : (
                      <span className="w-3.5 h-3.5 rounded-full bg-slate-300 shrink-0" />
                    )}
                    <span className="text-[11px] font-bold text-slate-900 leading-tight">
                      {step.label}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-500 leading-tight">{step.desc}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Delivery Destination & Courier Details */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-slate-100 text-xs">
          <div className="space-y-1">
            <span className="text-slate-400 font-medium block">Destination Address</span>
            <span className="font-bold text-slate-800 block">{order.delivery_address}</span>
            <span className="text-slate-500">{order.delivery_city}</span>
          </div>

          <div className="space-y-1">
            <span className="text-slate-400 font-medium block">Delivery Courier</span>
            <span className="font-bold text-slate-800 block">
              {order.courier_name || 'Not assigned yet'}
            </span>
            <span className="text-slate-500 font-mono">
              {order.courier_phone || 'Pending dispatch'}
            </span>
          </div>

          <div className="space-y-1">
            <span className="text-slate-400 font-medium block">Payment Method</span>
            <span className="font-bold text-slate-800 block">{order.payment_method}</span>
            <span className="text-emerald-600 font-semibold">{order.payment_status}</span>
          </div>
        </div>

        {order.prescription_id && (
          <div className="p-3.5 rounded-xl bg-blue-50 border border-blue-200 text-xs text-blue-900 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-blue-600" />
              <span>
                Prescription Linked: <strong>{order.prescription_id}</strong> (Patient: {order.rx_patient}, Dr: {order.rx_doctor})
              </span>
            </div>
            <button
              onClick={() => onNavigate('prescriptions')}
              className="text-xs font-bold text-blue-700 hover:underline"
            >
              View Document →
            </button>
          </div>
        )}
      </div>

      {/* Role-Specific Action Controls */}
      {isPharmaOrAdmin && (
        <div className="p-6 rounded-3xl bg-slate-900 text-white shadow-xl space-y-4">
          <h3 className="text-sm font-bold text-amber-400 uppercase tracking-wider flex items-center gap-2">
            <Boxes className="w-4 h-4" />
            Pharmacy Fulfillment Controls
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Status changer */}
            <div className="space-y-2">
              <label className="text-xs text-slate-300 font-semibold block">Advance Order Status</label>
              <div className="flex flex-wrap gap-2">
                {['Processing', 'Ready for Dispatch', 'Delivered'].map(s => (
                  <button
                    key={s}
                    disabled={actionLoading}
                    onClick={() => handleUpdateStatus(s)}
                    className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 border border-slate-700 transition"
                  >
                    Set {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Courier Assignment */}
            <div className="space-y-2">
              <label className="text-xs text-slate-300 font-semibold block">Assign Delivery Courier Partner</label>
              <div className="flex items-center gap-2">
                <select
                  value={selectedCourierId}
                  onChange={e => setSelectedCourierId(e.target.value)}
                  className="flex-1 px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white"
                >
                  {couriers.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.full_name} ({c.city})
                    </option>
                  ))}
                </select>
                <button
                  onClick={handleAssignCourier}
                  disabled={actionLoading || !selectedCourierId}
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition shadow-xs disabled:opacity-50"
                >
                  Assign
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Courier Driver Controls */}
      {(isCourier || user?.role === 'admin') && (
        <div className="p-6 rounded-3xl bg-slate-900 text-white shadow-xl space-y-4">
          <h3 className="text-sm font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-2">
            <Truck className="w-4 h-4" />
            Courier Delivery Actions
          </h3>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => handleCourierStatus('picked_up')}
              disabled={actionLoading}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition"
            >
              1. Mark Picked Up from Hub
            </button>
            <button
              onClick={() => handleCourierStatus('in_transit')}
              disabled={actionLoading}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-xl text-xs font-bold transition"
            >
              2. Mark Out for Delivery
            </button>
            <button
              onClick={() => handleCourierStatus('delivered')}
              disabled={actionLoading}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition"
            >
              3. Confirm Delivered to Customer
            </button>
          </div>
        </div>
      )}

      {/* Ordered Items Table */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
        <h3 className="text-base font-bold text-slate-900">Ordered Medicines</h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100">
              <tr>
                <th className="py-2.5 px-3">Item</th>
                <th className="py-2.5 px-3">Quantity</th>
                <th className="py-2.5 px-3">Unit Price</th>
                <th className="py-2.5 px-3 text-right">Total Price</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {items.map(item => (
                <tr key={item.id} className="hover:bg-slate-50/50">
                  <td className="py-3 px-3 font-bold text-slate-900">{item.medicine_name}</td>
                  <td className="py-3 px-3 text-slate-700">{item.quantity} units</td>
                  <td className="py-3 px-3 text-slate-700 font-mono">₹{item.unit_price.toFixed(2)}</td>
                  <td className="py-3 px-3 text-right font-black text-slate-900 font-mono">
                    ₹{item.total_price.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="border-t border-slate-200 font-bold">
              <tr>
                <td colSpan={3} className="py-3 px-3 text-right text-slate-600">Total Amount:</td>
                <td className="py-3 px-3 text-right text-sm text-blue-700 font-black">
                  ₹{order.total_amount.toFixed(2)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
};
