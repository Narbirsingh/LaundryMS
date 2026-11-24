'use client';

import { useEffect, useState } from 'react';
import { Plus, Edit2, Trash2, Tag } from 'lucide-react';
import { servicesApi } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';

export default function ServicesPage() {
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({ name: '', category: 'WASH_FOLD', pricingMethod: 'PER_KG', basePrice: 0, expressPrice: 0, gstRate: 18, processingHours: 24, description: '' });
  const [saving, setSaving] = useState(false);

  const fetch = () => {
    setLoading(true);
    servicesApi.list({ activeOnly: 'false' })
      .then((r: any) => setServices(Array.isArray(r) ? r : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetch(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editing) {
        await servicesApi.update(editing.id, form);
      } else {
        await servicesApi.create(form);
      }
      setShowForm(false); setEditing(null);
      setForm({ name: '', category: 'WASH_FOLD', pricingMethod: 'PER_KG', basePrice: 0, expressPrice: 0, gstRate: 18, processingHours: 24, description: '' });
      fetch();
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Failed to save service');
    } finally { setSaving(false); }
  };

  const handleEdit = (svc: any) => {
    setEditing(svc);
    setForm({ name: svc.name, category: svc.category, pricingMethod: svc.pricingMethod, basePrice: svc.basePrice, expressPrice: svc.expressPrice || 0, gstRate: svc.gstRate, processingHours: svc.processingHours, description: svc.description || '' });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this service?')) return;
    await servicesApi.remove(id);
    fetch();
  };

  const categoryColors: Record<string, string> = {
    WASH_FOLD: 'bg-maroon-100 text-maroon-700',
    WASH_IRON: 'bg-indigo-100 text-indigo-700',
    DRY_CLEANING: 'bg-purple-100 text-purple-700',
    IRONING: 'bg-yellow-100 text-yellow-700',
    STEAM_PRESS: 'bg-orange-100 text-orange-700',
    STAIN_REMOVAL: 'bg-red-100 text-red-700',
    SHOE_CLEANING: 'bg-teal-100 text-teal-700',
    CARPET_CLEANING: 'bg-green-100 text-green-700',
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Services & Pricing</h2>
          <p className="text-sm text-gray-500">{services.length} services configured</p>
        </div>
        <button onClick={() => { setEditing(null); setShowForm(true); }}
          className="flex items-center gap-2 bg-maroon-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-maroon-700">
          <Plus size={16} /> Add Service
        </button>
      </div>

      {/* Form modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6">
            <h3 className="font-semibold text-gray-900 mb-4">{editing ? 'Edit Service' : 'New Service'}</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                  <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-maroon-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-maroon-500">
                    {['WASH_FOLD','WASH_IRON','DRY_CLEANING','IRONING','STEAM_PRESS','STAIN_REMOVAL','SHOE_CLEANING','CARPET_CLEANING','CURTAIN_CLEANING','BLANKET_CLEANING','OTHER'].map((c) => (
                      <option key={c} value={c}>{c.replace(/_/g, ' ')}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Pricing Method</label>
                  <select value={form.pricingMethod} onChange={(e) => setForm({ ...form, pricingMethod: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-maroon-500">
                    {['PER_PIECE','PER_KG','PER_SQFT','FLAT_RATE'].map((m) => (
                      <option key={m} value={m}>{m.replace(/_/g, ' ')}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Base Price ₹ *</label>
                  <input required type="number" min={0} value={form.basePrice} onChange={(e) => setForm({ ...form, basePrice: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-maroon-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Express Price ₹</label>
                  <input type="number" min={0} value={form.expressPrice} onChange={(e) => setForm({ ...form, expressPrice: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-maroon-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">GST %</label>
                  <input type="number" min={0} max={28} value={form.gstRate} onChange={(e) => setForm({ ...form, gstRate: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-maroon-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Processing Hours</label>
                  <input type="number" min={1} value={form.processingHours} onChange={(e) => setForm({ ...form, processingHours: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-maroon-500" />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-maroon-500 resize-none" />
                </div>
              </div>
              <div className="flex gap-3 justify-end pt-2">
                <button type="button" onClick={() => { setShowForm(false); setEditing(null); }}
                  className="px-4 py-2 text-sm text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50">Cancel</button>
                <button type="submit" disabled={saving}
                  className="px-4 py-2 text-sm text-white bg-maroon-600 rounded-lg hover:bg-maroon-700 disabled:opacity-50">
                  {saving ? 'Saving...' : editing ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Services grid */}
      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="animate-spin w-6 h-6 border-4 border-maroon-600 border-t-transparent rounded-full" />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {services.map((svc) => (
            <div key={svc.id} className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-sm transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h4 className="font-medium text-gray-900">{svc.name}</h4>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium mt-1 inline-block ${categoryColors[svc.category] || 'bg-gray-100 text-gray-600'}`}>
                    {svc.category?.replace(/_/g, ' ')}
                  </span>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => handleEdit(svc)} className="p-1.5 text-gray-400 hover:text-maroon-600 hover:bg-maroon-50 rounded">
                    <Edit2 size={13} />
                  </button>
                  <button onClick={() => handleDelete(svc.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded">
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Base Price</span>
                  <span className="font-semibold text-gray-900">{formatCurrency(svc.basePrice)}</span>
                </div>
                {svc.expressPrice > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Express</span>
                    <span className="text-orange-600">{formatCurrency(svc.expressPrice)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-500">Method</span>
                  <span className="text-gray-700">{svc.pricingMethod?.replace(/_/g, ' ')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">GST</span>
                  <span className="text-gray-700">{svc.gstRate}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Lead time</span>
                  <span className="text-gray-700">{svc.processingHours}h</span>
                </div>
              </div>
              {!svc.isActive && (
                <div className="mt-2 text-xs text-red-500 bg-red-50 px-2 py-1 rounded">Inactive</div>
              )}
            </div>
          ))}
          {services.length === 0 && (
            <div className="col-span-3 text-center py-16 text-gray-400">
              <Tag size={32} className="mx-auto mb-2 opacity-30" />
              <p>No services yet. Add your first service.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
