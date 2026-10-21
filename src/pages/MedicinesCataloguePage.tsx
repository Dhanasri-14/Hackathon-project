import React, { useState, useEffect } from 'react';
import {
  Pill,
  Search,
  Filter,
  ShoppingCart,
  Check,
  AlertTriangle,
  FileText,
  Plus,
  Minus,
  ArrowRight,
  Sparkles,
  Info,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';
import { useI18n } from '../i18n.tsx';
import { useCart } from '../context/CartContext.tsx';
import { apiRequest } from '../api.ts';
import { Medicine } from '../types.ts';

const CATEGORIES = [
  'All',
  'Antibiotics',
  'Analgesics',
  'Cardiac',
  'Diabetes',
  'Respiratory',
  'Gastrointestinal',
  'Emergency',
  'Vitamins',
];

export const MedicinesCataloguePage: React.FC<{ onNavigate: (page: string) => void }> = ({ onNavigate }) => {
  const { user } = useAuth();
  const { t } = useI18n();
  const { addToCart, items: cartItems } = useCart();

  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [rxFilter, setRxFilter] = useState('');
  const [stockFilter, setStockFilter] = useState('All');
  const [addedToast, setAddedToast] = useState<string | null>(null);

  const fetchMedicines = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (selectedCategory !== 'All') params.append('category', selectedCategory);
      if (rxFilter !== '') params.append('prescription_required', rxFilter);
      if (stockFilter !== 'All') params.append('stock_status', stockFilter);

      const res = await apiRequest<{ medicines: Medicine[] }>(`/pharmacy/medicines?${params.toString()}`);
      setMedicines(res.medicines);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMedicines();
  }, [search, selectedCategory, rxFilter, stockFilter]);

  const handleAddToCart = (med: Medicine) => {
    if (med.stock_quantity <= 0) return;
    addToCart(med, 1);
    setAddedToast(`Added ${med.name} to cart`);
    setTimeout(() => setAddedToast(null), 2500);
  };

  const getStockBadge = (status: string, stock: number) => {
    switch (status) {
      case 'out_of_stock':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-red-100 text-red-800">Out of Stock</span>;
      case 'low_stock':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-amber-100 text-amber-800">Low Stock ({stock})</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800">In Stock ({stock})</span>;
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-blue-600 uppercase tracking-wider">
            <Pill className="w-4 h-4" />
            Module B • Pharmacy Prescription & Delivery
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">
            {t('nav.medicines')}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Verified pharmaceutical medications with real-time stock validation and prescription matching.
          </p>
        </div>

        <button
          onClick={() => onNavigate('cart')}
          className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition flex items-center justify-center gap-2 shadow-xs"
        >
          <ShoppingCart className="w-4 h-4" />
          <span>View Cart & Checkout</span>
        </button>
      </div>

      {addedToast && (
        <div className="fixed bottom-6 right-6 z-50 p-4 rounded-2xl bg-slate-900 text-white shadow-2xl flex items-center gap-2.5 text-xs font-bold animate-in fade-in slide-in-from-bottom-4">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>{addedToast}</span>
          <button
            onClick={() => onNavigate('cart')}
            className="ml-3 text-blue-400 hover:underline"
          >
            Go to Cart →
          </button>
        </div>
      )}

      {/* Category Pills Bar */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none">
        {CATEGORIES.map(cat => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition ${
              selectedCategory === cat
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Search & Filter Bar */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2 flex-1">
          <div className="relative min-w-[200px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search medicine, salt, manufacturer..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
            />
          </div>

          <select
            value={rxFilter}
            onChange={e => setRxFilter(e.target.value)}
            className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold bg-white"
          >
            <option value="">All Types (OTC & Rx)</option>
            <option value="1">Prescription Required (Rx)</option>
            <option value="0">Over The Counter (OTC)</option>
          </select>

          <select
            value={stockFilter}
            onChange={e => setStockFilter(e.target.value)}
            className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold bg-white"
          >
            <option value="All">All Stock Levels</option>
            <option value="in_stock">In Stock</option>
            <option value="low_stock">Low Stock</option>
            <option value="out_of_stock">Out of Stock</option>
          </select>
        </div>

        <div className="text-xs text-slate-500 font-medium">
          Showing <strong>{medicines.length}</strong> medicines
        </div>
      </div>

      {/* Medicines Grid */}
      {loading ? (
        <div className="p-12 text-center text-xs text-slate-500">
          <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          Loading medicines inventory from database...
        </div>
      ) : medicines.length === 0 ? (
        <div className="p-12 rounded-3xl bg-white border border-slate-200 text-center space-y-2">
          <Pill className="w-10 h-10 text-slate-300 mx-auto" />
          <h4 className="font-bold text-slate-700 text-sm">No medicines found matching criteria</h4>
          <p className="text-xs text-slate-500">Try adjusting your category or search term.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {medicines.map(med => {
            const inCart = cartItems.find(i => i.medicine.id === med.id);
            const isOutOfStock = med.stock_quantity <= 0;

            return (
              <div
                key={med.id}
                className="p-5 rounded-3xl bg-white border border-slate-200 hover:border-blue-400 hover:shadow-md transition flex flex-col justify-between space-y-4 group"
              >
                <div className="space-y-3">
                  {/* Category & Badges */}
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                      {med.category}
                    </span>
                    <div className="flex items-center gap-1.5">
                      {med.prescription_required === 1 ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-red-100 text-red-700 border border-red-200">
                          Rx Required
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-50 text-emerald-700 border border-emerald-200">
                          OTC
                        </span>
                      )}
                      {getStockBadge(med.status, med.stock_quantity)}
                    </div>
                  </div>

                  {/* Title & Strength */}
                  <div>
                    <h3
                      onClick={() => onNavigate(`medicines/${med.id}`)}
                      className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition cursor-pointer"
                    >
                      {med.name}
                    </h3>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {med.strength} • {med.dosage_form} • {med.manufacturer}
                    </p>
                  </div>

                  {/* Therapeutic Description */}
                  {med.description && (
                    <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                      {med.description}
                    </p>
                  )}
                </div>

                {/* Price and Cart Action */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  <div>
                    <span className="text-[10px] text-slate-400 block font-medium">Price (INR)</span>
                    <span className="text-base font-black text-slate-900">
                      ₹{med.price_inr.toFixed(2)}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onNavigate(`medicines/${med.id}`)}
                      className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition"
                      title="View Details"
                    >
                      <Info className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleAddToCart(med)}
                      disabled={isOutOfStock}
                      className={`px-3 py-1.5 rounded-xl font-bold text-xs transition flex items-center gap-1.5 shadow-xs ${
                        isOutOfStock
                          ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                          : inCart
                          ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                          : 'bg-blue-600 text-white hover:bg-blue-700'
                      }`}
                    >
                      <ShoppingCart className="w-3.5 h-3.5" />
                      <span>{isOutOfStock ? 'Out of Stock' : inCart ? `In Cart (${inCart.quantity})` : 'Add to Cart'}</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
