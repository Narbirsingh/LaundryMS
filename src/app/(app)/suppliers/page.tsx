'use client';

import { useState, useEffect } from 'react';
import { Truck, Package, Plus, Phone, Mail, MapPin, Edit2, Star, ShoppingCart, AlertTriangle } from 'lucide-react';
import apiClient, { unwrap } from '@/lib/api';
import MobileInput from '@/components/ui/MobileInput';
import { getMobileError } from '@/lib/utils';

const suppliersApi = {
  listVendors: () => apiClient.get('/inventory/vendors').then(unwrap),
  createVendor: (data: any) => apiClient.post('/inventory/vendors', data).then(unwrap),
  updateVendor: (id: string, data: any) => apiClient.patch(`/inventory/vendors/${id}`, data).then(unwrap),
  getLowStock: () => apiClient.get('/inventory/low-stock').then(unwrap),
  listItems: () => apiClient.get('/inventory/items').then(unwrap),
};

const emptyForm = { name: '', code: '', contactPerson: '', phone: '', email: '', address: '', city: '', gstin: '', paymentTerms: '' };

export default function SuppliersPage() {
  const [tab, setTab] = useState<'suppliers' | 'lowstock'>('suppliers');
  const [vendors, setVendors] = useState<any[]>([]);
  const [lowStock, setLowStock] = useState<any[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState(emptyForm);

  const toArray = (v: any): any[] => {
    if (Array.isArray(v)) return v;
    if (v && Array.isArray(v.data)) return v.data;
    if (v && Array.isArray(v.items)) return v.items;
    return [];
  };

  const load = async () => {
    try {
      const [v, l] = await Promise.all([suppliersApi.listVendors(), suppliersApi.getLowStock()]);
      setVendors(toArray(v));
      setLowStock(toArray(l));
    } catch { /* auth redirect handled by interceptor */ }
  };

  useEffect(() => { load(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const mobileErr = getMobileError(form.phone, false, 'Mobile');
    if (mobileErr) { alert(mobileErr); return; }
    if (editing) await suppliersApi.updateVendor(editing.id, form);
    else await suppliersApi.createVendor(form);
    setShowAdd(false); setEditing(null); load();
  };

  const openEdit = (v: any) => {
    setForm({ name: v.name || '', code: v.code || '', contactPerson: v.contactPerson || '', phone: v.phone || '', email: v.email || '', address: v.address || '', city: v.city || '', gstin: v.gstin || '', paymentTerms: v.paymentTerms || '' });
    setEditing(v); setShowAdd(true);
  };

  const set = (k: keyof typeof emptyForm) => (e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, [k]: e.target.value });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Suppliers & Vendors</h1>
          <p className="text-sm text-gray-500 mt-1">Manage your chemical, packaging and equipment vendors</p>
        </div>
        <button onClick={() => { setForm(emptyForm); setEditing(null); setShowAdd(true); }} className="flex items-center gap-2 bg-maroon-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-maroon-700">
          <Plus size={16} /> Add Supplier
        </button>
      </div>

      <div className="border-b border-gray-200">
        <div className="flex gap-6">
          {(['suppliers', 'lowstock'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)} className={`pb-3 text-sm font-medium border-b-2 transition-colors ${tab === t ? 'border-maroon-600 text-maroon-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
              {t === 'suppliers' ? `Suppliers (${vendors.length})` : `Low Stock Alerts (${lowStock.length})`}
            </button>
          ))}
        </div>
      </div>

      {/* Suppliers */}
      {tab === 'suppliers' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {vendors.length === 0 ? (
            <div className="col-span-3 text-center py-16 text-gray-400">
              <Truck size={40} className="mx-auto mb-3 opacity-30" />
              <p>No suppliers added yet</p>
            </div>
          ) : vendors.map(v => (
            <div key={v.id} className="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
                    <Truck size={18} className="text-orange-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{v.name}</p>
                    {v.code && <p className="text-xs font-mono text-gray-400">{v.code}</p>}
                  </div>
                </div>
                <button onClick={() => openEdit(v)} className="p-1.5 text-gray-400 hover:text-maroon-600 hover:bg-maroon-50 rounded-lg">
                  <Edit2 size={14} />
                </button>
              </div>
              {v.contactPerson && <p className="text-sm text-gray-600 font-medium">{v.contactPerson}</p>}
              {v.phone && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Phone size={13} className="text-gray-400" />
                  <a href={`tel:${v.phone}`} className="text-maroon-600 hover:underline">{v.phone}</a>
                </div>
              )}
              {v.email && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Mail size={13} className="text-gray-400" />
                  <span>{v.email}</span>
                </div>
              )}
              {v.city && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <MapPin size={13} className="text-gray-400" />
                  <span>{v.city}</span>
                </div>
              )}
              {v.gstin && <p className="text-xs text-gray-400 font-mono">GST: {v.gstin}</p>}
              {v.paymentTerms && <p className="text-xs bg-maroon-50 text-maroon-700 px-2 py-1 rounded-lg">Terms: {v.paymentTerms}</p>}
            </div>
          ))}
        </div>
      )}

      {/* Low Stock */}
      {tab === 'lowstock' && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {lowStock.length > 0 && (
            <div className="bg-red-50 border-b border-red-100 px-4 py-3 flex items-center gap-2">
              <AlertTriangle size={16} className="text-red-500" />
              <span className="text-sm font-medium text-red-700">{lowStock.length} items below reorder level — place orders now</span>
            </div>
          )}
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Item</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Category</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">In Stock</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Reorder Level</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Supplier</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {lowStock.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-10 text-gray-400">All inventory is well-stocked</td></tr>
              ) : lowStock.map((item: any) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900">{item.name}</p>
                    {item.sku && <p className="text-xs text-gray-400 font-mono">{item.sku}</p>}
                  </td>
                  <td className="px-4 py-3 text-gray-600">{item.category}</td>
                  <td className="px-4 py-3">
                    <span className="text-red-600 font-semibold">{item.currentStock}</span>
                    <span className="text-gray-400 text-xs"> {item.unit}</span>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{item.reorderLevel} {item.unit}</td>
                  <td className="px-4 py-3 text-gray-600">{item.vendor?.name || item.vendorId || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">{editing ? 'Edit Supplier' : 'Add Supplier'}</h2>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Company Name *</label>
                  <input required value={form.name} onChange={set('name')} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-maroon-500" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Vendor Code</label>
                  <input value={form.code} onChange={set('code')} placeholder="VND-001" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-maroon-500" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Contact Person</label>
                <input value={form.contactPerson} onChange={set('contactPerson')} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-maroon-500" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Mobile</label>
                  <MobileInput label="Mobile" value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-maroon-500" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Email</label>
                  <input type="email" value={form.email} onChange={set('email')} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-maroon-500" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">City</label>
                  <input value={form.city} onChange={set('city')} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-maroon-500" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">GSTIN</label>
                  <input value={form.gstin} onChange={set('gstin')} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-maroon-500" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Payment Terms</label>
                <input value={form.paymentTerms} onChange={set('paymentTerms')} placeholder="Net 30, Advance, etc." className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-maroon-500" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowAdd(false)} className="flex-1 border border-gray-200 text-gray-600 py-2 rounded-lg text-sm">Cancel</button>
                <button type="submit" className="flex-1 bg-maroon-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-maroon-700">{editing ? 'Update' : 'Add Supplier'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
