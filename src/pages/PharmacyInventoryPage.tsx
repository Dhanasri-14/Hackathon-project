import React, { useState, useEffect } from 'react';
import {
  Boxes,
  Search,
  PlusCircle,
  AlertTriangle,
  CheckCircle2,
  Edit2,
  Save,
  X,
  Filter,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';
import { useI18n } from '../i18n.tsx';
import { apiRequest } from '../api.ts';
import { Medicine } from '../types.ts';

export const PharmacyInventoryPage: React.FC<{ onNavigate: (page: string) => void }> = ({ onNavigate }) => {
  const { user } = useAuth();
  const { t } = useI18n();

  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [stockFilter, setStockFilter] = useState('All');

  // Editing stock state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editStockQty, setEditStockQty] = useState<number>(0);
  const [editPrice, setEditPrice] = useState<number>(0);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  // New Medicine Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newCategory, setNewCategory] = useState('Antibiotics');
  const [newStrength, setNewStrength] = useState('500mg');
  const [newDosage, setNewDosage] = useState('Tablet');
  const [newManufacturer, setNewManufacturer] = useState('TamilNadu BioPharm');
  const [newStock, setNewStock] = useState(100);
  const [newPrice, setNewPrice] = useState(120.0);
  const [newRxRequired, setNewRxRequired] = useState(true);
  const [newDesc, setNewDesc] = useState('');

  const fetchInventory = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (categoryFilter !== 'All') params.append('category', categoryFilter);
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
    fetchInventory();
  }, [search, categoryFilter, stockFilter]);

  const handleStartEdit = (med: Medicine) => {
    setEditingId(med.id);
    setEditStockQty(med.stock_quantity);
    setEditPrice(med.price_inr);
  };

  const handleSaveStock = async (medId: string) => {
    setSaving(true);
    try {
      await apiRequest(`/pharmacy/medicines/${medId}/stock`, {
        method: 'PUT',
        body: JSON.stringify({
          stock_quantity: editStockQty,
          price_inr: editPrice,
        }),
      });
      setToast('Inventory stock and pricing updated!');
      setEditingId(null);
      await fetchInventory();
    } catch (err: any) {
      alert(err.message || 'Update failed');
    } finally {
      setSaving(false);
    }
  };

  const handleCreateMedicine = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await apiRequest('/pharmacy/medicines', {
        method: 'POST',
        body: JSON.stringify({
          name: newName,
          category: newCategory,
          strength: newStrength,
          dosage_form: newDosage,
          manufacturer: newManufacturer,
          stock_quantity: newStock,
          price_inr: newPrice,
          prescription_required: newRxRequired,
          description: newDesc,
        }),
      });

      setIsAddModalOpen(false);
      setToast(`Created ${newName} in pharmacy inventory!`);
      // Reset
      setNewName('');
      await fetchInventory();
    } catch (err: any) {
      alert(err.message || 'Create failed');
    } finally {
      setSaving(false);
    }
  };

  const lowStockTotal = medicines.filter(m => m.status === 'low_stock' || m.status === 'out_of_stock').length;

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-blue-600 uppercase tracking-wider">
            <Boxes className="w-4 h-4" />
            Central Pharmacy Distribution
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">
            {t('nav.pharmacy_inventory')}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time stock control, re-order thresholds, and catalogue updates.
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition flex items-center justify-center gap-2 shadow-xs"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Add New Medicine</span>
        </button>
      </div>

      {toast && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{toast}</span>
        </div>
      )}

      {lowStockTotal > 0 && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
          <span>
            <strong>Attention Pharmacist:</strong> There are currently <strong>{lowStockTotal}</strong> items at or below their re-order threshold. Ensure distributor batches are allocated.
          </span>
        </div>
      )}

      {/* Filter Toolbar */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2 flex-1">
          <div className="relative min-w-[200px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search inventory..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
            />
          </div>

          <select
            value={categoryFilter}
            onChange={e => setCategoryFilter(e.target.value)}
            className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold bg-white"
          >
            <option value="All">All Categories</option>
            {['Antibiotics', 'Analgesics', 'Cardiac', 'Diabetes', 'Respiratory', 'Gastrointestinal', 'Emergency', 'Vitamins'].map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>

          <select
            value={stockFilter}
            onChange={e => setStockFilter(e.target.value)}
            className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold bg-white"
          >
            <option value="All">All Statuses</option>
            <option value="in_stock">In Stock</option>
            <option value="low_stock">Low Stock Alerts</option>
            <option value="out_of_stock">Out of Stock</option>
          </select>
        </div>

        <div className="text-xs text-slate-500 font-medium">
          Total items: <strong>{medicines.length}</strong>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Item ID</th>
                <th className="py-3 px-4">Medicine Name</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Strength & Form</th>
                <th className="py-3 px-4">Stock Quantity</th>
                <th className="py-3 px-4">Price (INR)</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {medicines.map(med => {
                const isEditing = editingId === med.id;

                return (
                  <tr key={med.id} className="hover:bg-slate-50/60 transition">
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-500">{med.id}</td>
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900">{med.name}</div>
                      <div className="text-[10px] text-slate-400">{med.manufacturer}</div>
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-700">{med.category}</td>
                    <td className="py-3.5 px-4 text-slate-600">{med.strength} • {med.dosage_form}</td>

                    <td className="py-3.5 px-4">
                      {isEditing ? (
                        <input
                          type="number"
                          value={editStockQty}
                          onChange={e => setEditStockQty(Number(e.target.value))}
                          className="w-20 px-2 py-1 rounded border border-blue-400 text-xs font-bold"
                        />
                      ) : (
                        <span className={`font-black ${med.stock_quantity <= med.min_threshold ? 'text-amber-600' : 'text-slate-900'}`}>
                          {med.stock_quantity} units
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 font-mono">
                      {isEditing ? (
                        <input
                          type="number"
                          step="0.5"
                          value={editPrice}
                          onChange={e => setEditPrice(Number(e.target.value))}
                          className="w-20 px-2 py-1 rounded border border-blue-400 text-xs font-bold"
                        />
                      ) : (
                        <span className="font-bold text-slate-800">₹{med.price_inr.toFixed(2)}</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          med.status === 'in_stock'
                            ? 'bg-emerald-100 text-emerald-800'
                            : med.status === 'low_stock'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {med.status.replace('_', ' ')}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      {isEditing ? (
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleSaveStock(med.id)}
                            disabled={saving}
                            className="p-1.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
                            title="Save"
                          >
                            <Save className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setEditingId(null)}
                            className="p-1.5 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300"
                            title="Cancel"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleStartEdit(med)}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                          title="Edit Stock / Price"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Add New Medicine */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl shadow-2xl max-w-xl w-full max-h-[90vh] flex flex-col overflow-hidden border border-slate-200">
            <div className="p-5 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-blue-600 rounded-lg">
                  <Boxes className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-base font-bold">Add Medicine to Catalogue</h3>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateMedicine} className="p-6 overflow-y-auto space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Medicine Name *</label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  placeholder="e.g. Ciprofloxacin (Ciplox)"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Category *</label>
                  <select
                    value={newCategory}
                    onChange={e => setNewCategory(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white font-semibold"
                  >
                    {['Antibiotics', 'Analgesics', 'Cardiac', 'Diabetes', 'Respiratory', 'Gastrointestinal', 'Emergency', 'Vitamins'].map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Strength *</label>
                  <input
                    type="text"
                    required
                    value={newStrength}
                    onChange={e => setNewStrength(e.target.value)}
                    placeholder="e.g. 500mg"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Dosage Form *</label>
                  <select
                    value={newDosage}
                    onChange={e => setNewDosage(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white"
                  >
                    <option value="Tablet">Tablet</option>
                    <option value="Capsule">Capsule</option>
                    <option value="Syrup">Syrup</option>
                    <option value="Injection">Injection</option>
                    <option value="Inhaler">Inhaler</option>
                    <option value="Ointment">Ointment</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Manufacturer</label>
                  <input
                    type="text"
                    value={newManufacturer}
                    onChange={e => setNewManufacturer(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Initial Stock (Units) *</label>
                  <input
                    type="number"
                    min={0}
                    required
                    value={newStock}
                    onChange={e => setNewStock(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Price in INR (₹) *</label>
                  <input
                    type="number"
                    step="0.5"
                    min={1}
                    required
                    value={newPrice}
                    onChange={e => setNewPrice(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newRxRequired}
                    onChange={e => setNewRxRequired(e.target.checked)}
                    className="rounded text-blue-600 focus:ring-blue-500"
                  />
                  <span>Schedule H Medicine: Doctor Prescription Strictly Required</span>
                </label>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Description</label>
                <textarea
                  rows={2}
                  value={newDesc}
                  onChange={e => setNewDesc(e.target.value)}
                  placeholder="Therapeutic uses and pharmacological indications"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Add Medicine'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
