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
  ShieldCheck,
  Building2,
  Stethoscope,
  Phone,
  MessageSquare,
  Clock,
  RotateCw,
  X,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';
import { useI18n } from '../i18n.tsx';
import { useCart } from '../context/CartContext.tsx';
import { apiRequest } from '../api.ts';
import { Medicine } from '../types.ts';

const CLINICAL_FORMULARY_CLASSES = [
  'All Formulary',
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
  const [selectedCategory, setSelectedCategory] = useState('All Formulary');
  const [rxFilter, setRxFilter] = useState('');
  const [stockFilter, setStockFilter] = useState('All');
  const [addedToast, setAddedToast] = useState<string | null>(null);
  const [consultModalMed, setConsultModalMed] = useState<Medicine | null>(null);
  const [consultNote, setConsultNote] = useState('');
  const [consultSent, setConsultSent] = useState(false);

  const fetchMedicines = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (selectedCategory !== 'All Formulary') params.append('category', selectedCategory);
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

  const handleDispenseRequest = (med: Medicine) => {
    if (med.stock_quantity <= 0) return;
    addToCart(med, 1);
    setAddedToast(`Added ${med.name} (${med.strength}) to clinical dispensing list.`);
    setTimeout(() => setAddedToast(null), 3000);
  };

  const handleSendConsult = (e: React.FormEvent) => {
    e.preventDefault();
    setConsultSent(true);
    setTimeout(() => {
      setConsultSent(false);
      setConsultModalMed(null);
      setConsultNote('');
    }, 2500);
  };

  const getFormularyStockBadge = (status: string, stock: number) => {
    switch (status) {
      case 'out_of_stock':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-red-100 text-red-800">Depleted / Reordering</span>;
      case 'low_stock':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-amber-100 text-amber-900">Hospital Reserve ({stock} units)</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800">Formulary Available ({stock})</span>;
    }
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 sm:p-8 rounded-3xl bg-slate-900 text-white shadow-xl border border-slate-800">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-black text-emerald-400 uppercase tracking-wider">
              Licensed Clinical Pharmacy Formulary & Dispensing Portal
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white">
            Official Pharmaceutical Formulary
          </h1>
          <p className="text-xs text-slate-400 max-w-2xl">
            Authorized hospital and community dispensing directory. Review active pharmaceutical ingredients, Schedule H prescription mandates, and clinical storage requirements.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => onNavigate('prescriptions')}
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-xs transition flex items-center gap-2"
          >
            <FileText className="w-4 h-4 text-blue-400" />
            <span>Upload Doctor Rx</span>
          </button>
          <button
            onClick={() => onNavigate('cart')}
            className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition flex items-center gap-2 shadow-lg shadow-blue-600/30"
          >
            <ShoppingCart className="w-4 h-4" />
            <span>Dispensing Order List ({cartItems.length})</span>
          </button>
        </div>
      </div>

      {addedToast && (
        <div className="fixed bottom-6 right-6 z-50 p-4 rounded-2xl bg-slate-900 text-white shadow-2xl border border-slate-800 flex items-center gap-3 text-xs font-bold animate-in fade-in slide-in-from-bottom-4">
          <Check className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{addedToast}</span>
          <button
            onClick={() => onNavigate('cart')}
            className="ml-2 px-3 py-1 rounded-lg bg-blue-600 text-white text-[11px] hover:bg-blue-500 font-bold"
          >
            Review Order →
          </button>
        </div>
      )}

      {/* Therapeutic Formulary Class Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none">
        {CLINICAL_FORMULARY_CLASSES.map(cat => (
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

      {/* Filter & Search Bar */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2 flex-1">
          <div className="relative min-w-[220px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search active salt, molecule, trade name..."
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
            <option value="">All Mandates (OTC & Schedule H Rx)</option>
            <option value="1">Schedule H Prescription Required (Rx)</option>
            <option value="0">Clinical OTC Dispensing</option>
          </select>

          <select
            value={stockFilter}
            onChange={e => setStockFilter(e.target.value)}
            className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold bg-white"
          >
            <option value="All">All Storage Levels</option>
            <option value="in_stock">Available in Stock</option>
            <option value="low_stock">Hospital Reserve Only</option>
            <option value="out_of_stock">Depleted</option>
          </select>
        </div>

        <div className="text-xs text-slate-500 font-medium">
          Formulary Entries: <strong>{medicines.length}</strong> active monographs
        </div>
      </div>

      {/* Formulary List Grid */}
      {loading ? (
        <div className="p-12 text-center text-xs text-slate-500">
          <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          Querying licensed pharmacy formulary records...
        </div>
      ) : medicines.length === 0 ? (
        <div className="p-12 rounded-3xl bg-white border border-slate-200 text-center space-y-2">
          <Pill className="w-10 h-10 text-slate-300 mx-auto" />
          <h4 className="font-bold text-slate-700 text-sm">No pharmaceutical monographs match query</h4>
          <p className="text-xs text-slate-500">Try adjusting therapeutic class or active molecule name.</p>
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
                  {/* Category & Mandate Badges */}
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                      {med.category}
                    </span>
                    <div className="flex items-center gap-1.5">
                      {med.prescription_required === 1 ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-red-100 text-red-800 border border-red-200 flex items-center gap-1">
                          <FileText className="w-3 h-3 text-red-600" />
                          <span>Schedule H Rx</span>
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-50 text-emerald-800 border border-emerald-200">
                          OTC Dispensing
                        </span>
                      )}
                      {getFormularyStockBadge(med.status, med.stock_quantity)}
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
                      Molecule: <strong>{med.strength}</strong> • Form: <strong>{med.dosage_form}</strong> • Mfg: {med.manufacturer}
                    </p>
                  </div>

                  {/* Description & Storage */}
                  {med.description && (
                    <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                      {med.description}
                    </p>
                  )}

                  {med.storage_instructions && (
                    <div className="text-[10px] text-slate-500 font-mono bg-slate-50 p-2 rounded-xl border border-slate-100">
                      Storage: {med.storage_instructions}
                    </div>
                  )}
                </div>

                {/* Price and Dispense Actions */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  <div>
                    <span className="text-[10px] text-slate-400 block font-medium">Government Approved MRP</span>
                    <span className="text-base font-black text-slate-900">
                      ₹{med.price_inr.toFixed(2)}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setConsultModalMed(med)}
                      className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition"
                      title="Consult Pharmacist for Dosage & Contraindications"
                    >
                      <Stethoscope className="w-4 h-4 text-blue-600" />
                    </button>

                    <button
                      onClick={() => handleDispenseRequest(med)}
                      disabled={isOutOfStock}
                      className={`px-3.5 py-2 rounded-xl font-bold text-xs transition flex items-center gap-1.5 shadow-xs ${
                        isOutOfStock
                          ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                          : inCart
                          ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                          : 'bg-slate-900 text-white hover:bg-slate-800'
                      }`}
                    >
                      <span>{isOutOfStock ? 'Depleted' : inCart ? `Listed (${inCart.quantity})` : 'Request Dispensing'}</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Duty Pharmacist Consultation Modal */}
      {consultModalMed && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-blue-100 text-blue-700">
                  <Stethoscope className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Duty Pharmacist Consultation</h3>
                  <p className="text-xs text-slate-500">Chief Pharmacist Anandhan Selvaraj (Reg No: TN-PR-88210)</p>
                </div>
              </div>
              <button
                onClick={() => setConsultModalMed(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-1">
              <div className="font-bold text-slate-900">{consultModalMed.name} ({consultModalMed.strength})</div>
              <div className="text-slate-600">Category: {consultModalMed.category} • {consultModalMed.dosage_form}</div>
              <div className="text-rose-600 font-semibold">Side Effects: {consultModalMed.side_effects || 'Standard clinical monitor required'}</div>
            </div>

            {consultSent ? (
              <div className="p-4 rounded-2xl bg-emerald-50 text-emerald-800 text-xs font-bold flex items-center gap-2">
                <Check className="w-5 h-5 text-emerald-600" />
                <span>Consultation request submitted to pharmacy desk. Pharmacist will call you shortly.</span>
              </div>
            ) : (
              <form onSubmit={handleSendConsult} className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Describe your clinical query or dosage question:
                  </label>
                  <textarea
                    rows={3}
                    value={consultNote}
                    onChange={e => setConsultNote(e.target.value)}
                    placeholder="e.g. Can this medicine be taken alongside blood pressure tablets? Is food required?"
                    className="w-full p-3 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                    required
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setConsultModalMed(null)}
                    className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold hover:bg-slate-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 transition flex items-center gap-1.5"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>Submit Query</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
