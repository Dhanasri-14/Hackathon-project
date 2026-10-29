import React, { useState, useEffect } from 'react';
import {
  Pill,
  ArrowLeft,
  ShoppingCart,
  AlertTriangle,
  ShieldCheck,
  Building2,
  Boxes,
  Check,
  Plus,
  Minus,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';
import { useI18n } from '../i18n.tsx';
import { useCart } from '../context/CartContext.tsx';
import { apiRequest } from '../api.ts';
import { Medicine } from '../types.ts';

interface MedicineDetailPageProps {
  medicineId: string;
  onNavigate: (page: string) => void;
}

export const MedicineDetailPage: React.FC<MedicineDetailPageProps> = ({ medicineId, onNavigate }) => {
  const { t } = useI18n();
  const { addToCart, items: cartItems } = useCart();

  const [medicine, setMedicine] = useState<Medicine | null>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    apiRequest<{ medicine: Medicine }>(`/pharmacy/medicines/${medicineId}`)
      .then(res => {
        setMedicine(res.medicine);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [medicineId]);

  if (loading) {
    return (
      <div className="p-16 text-center text-xs text-slate-500">
        <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        Loading medicine details...
      </div>
    );
  }

  if (!medicine) {
    return (
      <div className="p-8 text-center space-y-4">
        <p className="text-sm font-bold text-slate-700">Medicine record not found.</p>
        <button
          onClick={() => onNavigate('medicines')}
          className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold"
        >
          Back to Catalogue
        </button>
      </div>
    );
  }

  const handleAdd = () => {
    if (medicine.stock_quantity <= 0) return;
    addToCart(medicine, quantity);
    setToast(`Added ${quantity} x ${medicine.name} to cart`);
    setTimeout(() => setToast(null), 2500);
  };

  const inCart = cartItems.find(i => i.medicine.id === medicine.id);
  const isOutOfStock = medicine.stock_quantity <= 0;

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-16">
      <button
        onClick={() => onNavigate('medicines')}
        className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 transition"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Medicines Catalogue</span>
      </button>

      {toast && (
        <div className="p-3.5 rounded-xl bg-slate-900 text-white text-xs font-bold flex items-center justify-between">
          <span>{toast}</span>
          <button onClick={() => onNavigate('cart')} className="text-blue-400 hover:underline">
            View Cart →
          </button>
        </div>
      )}

      <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                {medicine.category}
              </span>
              {medicine.prescription_required === 1 ? (
                <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-red-100 text-red-700 border border-red-200">
                  Prescription Required (Schedule H)
                </span>
              ) : (
                <span className="text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                  Over The Counter (OTC)
                </span>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-slate-900">{medicine.name}</h1>
            <p className="text-xs text-slate-500">
              Dosage Form: <strong>{medicine.dosage_form}</strong> • Strength: <strong>{medicine.strength}</strong>
            </p>
          </div>

          <div className="text-left sm:text-right">
            <span className="text-xs text-slate-400 block font-medium">Price in Indian Rupees</span>
            <span className="text-3xl font-black text-slate-900">₹{medicine.price_inr.toFixed(2)}</span>
            <span className="text-[11px] text-slate-500 block mt-0.5">inclusive of all medical taxes</span>
          </div>
        </div>

        {/* Stock & Cart Bar */}
        <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-white text-slate-700 border border-slate-200 shadow-xs">
              <Boxes className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <span className="text-xs font-bold text-slate-900 block">
                Warehouse Stock: {medicine.stock_quantity} units available
              </span>
              <span className="text-[11px] text-slate-500">
                {medicine.stock_quantity <= medicine.min_threshold
                  ? 'Low stock warning active on central distribution hub'
                  : 'Sufficient inventory for instant dispatch'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center border border-slate-300 rounded-xl bg-white overflow-hidden">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="p-2 text-slate-600 hover:bg-slate-100"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <span className="px-3 text-xs font-bold text-slate-800">{quantity}</span>
              <button
                onClick={() => setQuantity(Math.min(medicine.stock_quantity, quantity + 1))}
                className="p-2 text-slate-600 hover:bg-slate-100"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>

            <button
              onClick={handleAdd}
              disabled={isOutOfStock}
              className={`px-5 py-2.5 rounded-xl font-bold text-xs transition flex items-center gap-2 shadow-xs ${
                isOutOfStock
                  ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              <ShoppingCart className="w-4 h-4" />
              <span>{isOutOfStock ? 'Out of Stock' : 'Add to Medicine Cart'}</span>
            </button>
          </div>
        </div>

        {/* Specifications Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-100 text-xs">
          <div className="space-y-4">
            <div>
              <h3 className="font-bold text-slate-900 mb-1">Therapeutic Indications & Description</h3>
              <p className="text-slate-600 leading-relaxed">
                {medicine.description || 'Verified pharmaceutical formulation manufactured under strict Good Manufacturing Practices (GMP).'}
              </p>
            </div>

            <div>
              <h3 className="font-bold text-slate-900 mb-1">Potential Side Effects & Precautions</h3>
              <p className="text-slate-600 leading-relaxed">
                {medicine.side_effects || 'May cause transient mild gastrointestinal discomfort. Consult physician if symptoms persist.'}
              </p>
            </div>
          </div>

          <div className="space-y-4 bg-slate-50 p-4 rounded-2xl border border-slate-200">
            <div>
              <span className="font-bold text-slate-700 block">Pharmaceutical Manufacturer</span>
              <span className="text-slate-900 font-semibold">{medicine.manufacturer}</span>
            </div>
            <div>
              <span className="font-bold text-slate-700 block">Storage Instructions</span>
              <span className="text-slate-900">{medicine.storage_instructions || 'Store below 25°C in a dry place protected from direct sunlight.'}</span>
            </div>
            <div>
              <span className="font-bold text-slate-700 block">Regulatory Schedule</span>
              <span className="text-slate-900">
                {medicine.prescription_required === 1
                  ? 'Drugs and Cosmetics Rules Schedule H (Medical Prescription Mandatory)'
                  : 'Over The Counter (Non-scheduled general sale formulation)'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
