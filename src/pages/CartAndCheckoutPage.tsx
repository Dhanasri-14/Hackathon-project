import React, { useState, useEffect } from 'react';
import {
  ShoppingCart,
  Trash2,
  Plus,
  Minus,
  ArrowRight,
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  FileText,
  CreditCard,
  Truck,
  MapPin,
  Phone,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';
import { useI18n } from '../i18n.tsx';
import { useCart } from '../context/CartContext.tsx';
import { apiRequest } from '../api.ts';
import { Prescription } from '../types.ts';

export const CartAndCheckoutPage: React.FC<{ onNavigate: (page: string) => void }> = ({ onNavigate }) => {
  const { user } = useAuth();
  const { t } = useI18n();
  const {
    items,
    updateQuantity,
    removeFromCart,
    clearCart,
    totalAmount,
    hasPrescriptionRequiredItems,
    attachedPrescriptionId,
    setAttachedPrescriptionId,
  } = useCart();

  const [deliveryAddress, setDeliveryAddress] = useState('Flat 4B, Lotus Apartments, 1st Cross Street, Adyar');
  const [deliveryCity, setDeliveryCity] = useState('Chennai');
  const [deliveryPhone, setDeliveryPhone] = useState(user?.phone || '+91 98406 78901');
  const [paymentMethod, setPaymentMethod] = useState('Simulated Online Transfer (UPI)');

  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [loadingRx, setLoadingRx] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      setLoadingRx(true);
      apiRequest<{ prescriptions: Prescription[] }>('/prescriptions')
        .then(res => {
          setPrescriptions(res.prescriptions);
          // If none attached and has approved prescription, auto-select first approved
          if (!attachedPrescriptionId) {
            const approved = res.prescriptions.find(p => p.status === 'Approved');
            if (approved) setAttachedPrescriptionId(approved.id);
          }
        })
        .catch(console.error)
        .finally(() => setLoadingRx(false));
    }
  }, [user]);

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!user) {
      onNavigate('login');
      return;
    }

    if (items.length === 0) {
      setError('Your shopping cart is empty.');
      return;
    }

    if (hasPrescriptionRequiredItems && !attachedPrescriptionId) {
      setError('One or more selected items require a valid doctor prescription. Please attach an approved prescription below or upload one.');
      return;
    }

    setSubmitting(true);
    try {
      const orderPayload = {
        items: items.map(i => ({
          medicine_id: i.medicine.id,
          quantity: i.quantity,
        })),
        prescription_id: hasPrescriptionRequiredItems ? attachedPrescriptionId : null,
        delivery_address: deliveryAddress,
        delivery_city: deliveryCity,
        delivery_phone: deliveryPhone,
        payment_method: paymentMethod,
      };

      const res = await apiRequest<{ orderId: string; status: string }>('/orders', {
        method: 'POST',
        body: JSON.stringify(orderPayload),
      });

      clearCart();
      onNavigate(`orders/${res.orderId}`);
    } catch (err: any) {
      setError(err.message || 'Checkout failed');
    } finally {
      setSubmitting(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="max-w-2xl mx-auto py-16 text-center space-y-4">
        <div className="w-16 h-16 rounded-3xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
          <ShoppingCart className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">Your Medicine Cart is Empty</h2>
        <p className="text-xs text-slate-500 max-w-sm mx-auto">
          Browse our pharmaceutical catalogue to add required medications, antibiotics, and first-aid supplies.
        </p>
        <button
          onClick={() => onNavigate('medicines')}
          className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition inline-flex items-center gap-2 shadow-xs"
        >
          <span>Explore Medicine Catalogue</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-16">
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900">
          Shopping Cart & Order Checkout
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Review medications, attach required prescription, and confirm delivery address.
        </p>
      </div>

      {error && (
        <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2 font-medium">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Prescription Requirement Alert */}
      {hasPrescriptionRequiredItems && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-300 text-amber-900 text-xs flex items-start gap-3">
          <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <strong className="font-bold">Medical Prescription Required:</strong>
            <p className="leading-relaxed">
              Your cart contains Schedule H medicines (e.g., Antibiotics, Insulin, or Cardiac therapy). In compliance with medical regulatory guidelines, an approved doctor prescription must be linked to complete this order.
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Items List */}
        <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h2 className="text-base font-bold text-slate-900">Cart Items ({items.length})</h2>
            <button
              onClick={clearCart}
              className="text-xs text-slate-400 hover:text-rose-600 transition"
            >
              Clear Cart
            </button>
          </div>

          <div className="divide-y divide-slate-100">
            {items.map(item => (
              <div key={item.medicine.id} className="py-4 flex items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-900">{item.medicine.name}</span>
                    {item.medicine.prescription_required === 1 && (
                      <span className="px-1.5 py-0.2 rounded text-[9px] font-black uppercase bg-red-100 text-red-700">
                        Rx Required
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500">
                    {item.medicine.strength} • ₹{item.medicine.price_inr.toFixed(2)} each
                  </p>
                </div>

                <div className="flex items-center gap-4">
                  {/* Quantity Stepper */}
                  <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden bg-white">
                    <button
                      onClick={() => updateQuantity(item.medicine.id, item.quantity - 1)}
                      className="p-1.5 text-slate-500 hover:bg-slate-100"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="px-2 text-xs font-bold text-slate-800">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.medicine.id, item.quantity + 1)}
                      className="p-1.5 text-slate-500 hover:bg-slate-100"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>

                  <span className="text-xs font-black text-slate-900 min-w-[60px] text-right">
                    ₹{(item.medicine.price_inr * item.quantity).toFixed(2)}
                  </span>

                  <button
                    onClick={() => removeFromCart(item.medicine.id)}
                    className="p-1.5 text-slate-300 hover:text-rose-600 rounded transition"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Prescription Attachment Section if needed */}
          {hasPrescriptionRequiredItems && (
            <div className="pt-4 border-t border-slate-100 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-blue-600" />
                  <span>Attach Approved Prescription *</span>
                </label>
                <button
                  type="button"
                  onClick={() => onNavigate('prescriptions')}
                  className="text-xs font-bold text-blue-600 hover:underline"
                >
                  + Upload New Rx
                </button>
              </div>

              {prescriptions.length === 0 ? (
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-center space-y-2">
                  <p className="text-xs text-slate-600">No prescriptions found on your account.</p>
                  <button
                    onClick={() => onNavigate('prescriptions')}
                    className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-bold"
                  >
                    Upload Prescription Now
                  </button>
                </div>
              ) : (
                <select
                  value={attachedPrescriptionId || ''}
                  onChange={e => setAttachedPrescriptionId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold bg-white"
                >
                  <option value="">-- Choose an Approved Prescription --</option>
                  {prescriptions.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.id} - {p.patient_name} ({p.doctor_name}) [{p.status}]
                    </option>
                  ))}
                </select>
              )}
            </div>
          )}
        </div>

        {/* Right Column: Delivery Details & Payment */}
        <div className="lg:col-span-5 bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-5">
          <h2 className="text-base font-bold text-slate-900 pb-3 border-b border-slate-100">
            Delivery & Payment Details
          </h2>

          <form onSubmit={handleCheckout} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Delivery Address *
              </label>
              <textarea
                rows={2}
                required
                value={deliveryAddress}
                onChange={e => setDeliveryAddress(e.target.value)}
                placeholder="Door/Flat No, Apartment, Street, Area"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">City / Hub *</label>
                <input
                  type="text"
                  required
                  value={deliveryCity}
                  onChange={e => setDeliveryCity(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Phone *</label>
                <input
                  type="text"
                  required
                  value={deliveryPhone}
                  onChange={e => setDeliveryPhone(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Payment Mode</label>
              <select
                value={paymentMethod}
                onChange={e => setPaymentMethod(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold bg-white"
              >
                <option value="Simulated Online Transfer (UPI)">Simulated Online Transfer (UPI / NetBanking)</option>
                <option value="Demo Cash on Delivery">Demo Cash on Delivery (COD)</option>
              </select>
            </div>

            {/* Price Summary */}
            <div className="pt-3 border-t border-slate-100 space-y-2 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal ({items.length} items)</span>
                <span>₹{totalAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Medical Packing & Delivery</span>
                <span className="text-emerald-600 font-bold">FREE (Demo)</span>
              </div>
              <div className="flex justify-between text-sm font-black text-slate-900 pt-2 border-t border-slate-100">
                <span>Total Amount</span>
                <span className="text-blue-700">₹{totalAmount.toFixed(2)}</span>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {submitting ? 'Verifying & Submitting Order...' : 'Place Medicine Order'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
