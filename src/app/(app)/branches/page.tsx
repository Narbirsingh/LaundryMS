'use client';

import { useState, useEffect } from 'react';
import { Building2, Plus, MapPin, Phone, Mail, Users, Edit2, ToggleLeft } from 'lucide-react';
import apiClient, { unwrap } from '@/lib/api';

const branchesApi = {
  list: () => apiClient.get('/branches').then(unwrap),
  create: (data: any) => apiClient.post('/branches', data).then(unwrap),
  update: (id: string, data: any) => apiClient.patch(`/branches/${id}`, data).then(unwrap),
  deactivate: (id: string) => apiClient.patch(`/branches/${id}/deactivate`).then(unwrap),
};

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

const emptyForm = {
  name: '', code: '', address: '', city: '', state: '', pincode: '',
  phone: '', email: '', latitude: '', longitude: '',
};

const toArray = (v: any): any[] => {
  if (Array.isArray(v)) return v;
  if (v && Array.isArray(v.data)) return v.data;
  if (v && Array.isArray(v.items)) return v.items;
  return [];
};

export default function BranchesPage() {
  const [branches, setBranches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState(emptyForm);

  const load = () => {
    setLoading(true);
    branchesApi.list().then(r => setBranches(toArray(r))).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const openAdd = () => { setForm(emptyForm); setEditing(null); setShowAdd(true); };
  const openEdit = (b: any) => {
    setForm({ name: b.name, code: b.code || '', address: b.address || '', city: b.city || '', state: b.state || '', pincode: b.pincode || '', phone: b.phone || '', email: b.email || '', latitude: b.latitude || '', longitude: b.longitude || '' });
    setEditing(b);
    setShowAdd(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = { ...form, latitude: form.latitude ? parseFloat(form.latitude) : undefined, longitude: form.longitude ? parseFloat(form.longitude) : undefined };
    if (editing) await branchesApi.update(editing.id, payload);
    else await branchesApi.create(payload);
    setShowAdd(false);
    load();
  };

  const set = (k: keyof typeof emptyForm) => (e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, [k]: e.target.value });

  const active = branches.filter(b => b.isActive);
  const inactive = branches.filter(b => !b.isActive);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Branches</h1>
          <p className="text-sm text-gray-500 mt-1">Manage all your store locations</p>
        </div>
        <button onClick={openAdd} className="flex items-center gap-2 bg-maroon-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-maroon-700">
          <Plus size={16} /> Add Branch
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
          <p className="text-3xl font-bold text-gray-900">{branches.length}</p>
          <p className="text-sm text-gray-500 mt-1">Total Branches</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
          <p className="text-3xl font-bold text-green-600">{active.length}</p>
          <p className="text-sm text-gray-500 mt-1">Active</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
          <p className="text-3xl font-bold text-red-500">{inactive.length}</p>
          <p className="text-sm text-gray-500 mt-1">Inactive</p>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-16 text-gray-400">Loading branches…</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {branches.map(b => (
            <div key={b.id} className={`bg-white rounded-xl border p-5 space-y-3 ${b.isActive ? 'border-gray-200' : 'border-gray-100 opacity-60'}`}>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-maroon-100 rounded-xl flex items-center justify-center">
                    <Building2 size={18} className="text-maroon-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{b.name}</p>
                    {b.code && <p className="text-xs text-gray-400 font-mono">{b.code}</p>}
                  </div>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => openEdit(b)} className="p-1.5 text-gray-400 hover:text-maroon-600 hover:bg-maroon-50 rounded-lg">
                    <Edit2 size={14} />
                  </button>
                  {b.isActive && (
                    <button onClick={() => { branchesApi.deactivate(b.id).then(load); }} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg">
                      <ToggleLeft size={14} />
                    </button>
                  )}
                </div>
              </div>
              {b.address && (
                <div className="flex items-start gap-2 text-sm text-gray-600">
                  <MapPin size={14} className="text-gray-400 mt-0.5 flex-shrink-0" />
                  <span>{b.address}{b.city && `, ${b.city}`}{b.state && `, ${b.state}`} {b.pincode}</span>
                </div>
              )}
              {b.phone && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Phone size={14} className="text-gray-400" />
                  <span>{b.phone}</span>
                </div>
              )}
              {b.email && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Mail size={14} className="text-gray-400" />
                  <span>{b.email}</span>
                </div>
              )}
              <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${b.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                {b.isActive ? 'Active' : 'Inactive'}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">{editing ? 'Edit Branch' : 'Add Branch'}</h2>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Branch Name *</label>
                  <input required value={form.name} onChange={set('name')} placeholder="Main Store" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-maroon-500" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Branch Code</label>
                  <input value={form.code} onChange={set('code')} placeholder="BR-001" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-maroon-500" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Address</label>
                <input value={form.address} onChange={set('address')} placeholder="Street address" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-maroon-500" />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">City</label>
                  <input value={form.city} onChange={set('city')} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-maroon-500" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">State</label>
                  <input value={form.state} onChange={set('state')} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-maroon-500" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Pincode</label>
                  <input value={form.pincode} onChange={set('pincode')} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-maroon-500" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Phone</label>
                  <input value={form.phone} onChange={set('phone')} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-maroon-500" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Email</label>
                  <input type="email" value={form.email} onChange={set('email')} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-maroon-500" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Latitude</label>
                  <input type="number" step="any" value={form.latitude} onChange={set('latitude')} placeholder="28.6139" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-maroon-500" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Longitude</label>
                  <input type="number" step="any" value={form.longitude} onChange={set('longitude')} placeholder="77.2090" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-maroon-500" />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowAdd(false)} className="flex-1 border border-gray-200 text-gray-600 py-2 rounded-lg text-sm font-medium hover:bg-gray-50">Cancel</button>
                <button type="submit" className="flex-1 bg-maroon-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-maroon-700">{editing ? 'Update' : 'Create Branch'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
