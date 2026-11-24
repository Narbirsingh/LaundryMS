'use client';

import { useState, useEffect, useRef } from 'react';
import { Tag, QrCode, Search, Plus, CheckCircle, XCircle, Package, Printer, AlertTriangle } from 'lucide-react';
import apiClient, { unwrap } from '@/lib/api';

const garmentApi = {
  list: (params?: any) => apiClient.get('/garments', { params }).then(unwrap),
  getStats: () => apiClient.get('/garments/stats').then(unwrap),
  create: (data: any) => apiClient.post('/garments', data).then(unwrap),
  updateStatus: (id: string, status: string) => apiClient.patch(`/garments/${id}/status`, { status }).then(unwrap),
  findByTag: (tagId: string) => apiClient.get(`/garments/tag/${tagId}`).then(unwrap),
};

const STATUS_COLOR: Record<string, string> = {
  RECEIVED: 'bg-gray-100 text-gray-700',
  INSPECTED: 'bg-maroon-100 text-maroon-700',
  TAGGED: 'bg-indigo-100 text-indigo-700',
  IN_PROCESSING: 'bg-yellow-100 text-yellow-700',
  QUALITY_PASSED: 'bg-green-100 text-green-700',
  QUALITY_FAILED: 'bg-red-100 text-red-700',
  REPROCESSING: 'bg-orange-100 text-orange-700',
  PACKED: 'bg-purple-100 text-purple-700',
  DELIVERED: 'bg-teal-100 text-teal-700',
};

const toArray = (v: any): any[] => {
  if (Array.isArray(v)) return v;
  if (v && Array.isArray(v.data)) return v.data;
  if (v && Array.isArray(v.items)) return v.items;
  return [];
};

export default function GarmentsPage() {
  const [garments, setGarments] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [printGarment, setPrintGarment] = useState<any>(null);
  const [form, setForm] = useState({ orderId: '', name: '', category: '', color: '', serviceId: '', serviceName: '', price: '', stainDescription: '', existingDamage: '' });
  const printRef = useRef<HTMLDivElement>(null);

  const load = () => {
    setLoading(true);
    Promise.all([
      garmentApi.list({ status: statusFilter || undefined }),
      garmentApi.getStats(),
    ]).then(([g, s]) => { setGarments(toArray(g)); setStats(s); }).catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [statusFilter]);

  const filtered = garments.filter(g =>
    !search || g.tagId?.toLowerCase().includes(search.toLowerCase()) || g.name?.toLowerCase().includes(search.toLowerCase())
  );

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    await garmentApi.create({ ...form, price: parseFloat(form.price) });
    setShowAdd(false);
    setForm({ orderId: '', name: '', category: '', color: '', serviceId: '', serviceName: '', price: '', stainDescription: '', existingDamage: '' });
    load();
  };

  const handlePrint = (g: any) => {
    setPrintGarment(g);
    setTimeout(() => window.print(), 300);
  };

  return (
    <div className="space-y-6">
      {/* Print area — hidden on screen, shown on print */}
      {printGarment && (
        <div ref={printRef} className="hidden print:block p-6 text-center border-2 border-black w-64 mx-auto">
          <p className="font-bold text-lg">LaundryMS</p>
          <p className="text-sm mt-1">{printGarment.name}</p>
          <p className="text-xs text-gray-500">{printGarment.category} · {printGarment.color}</p>
          <div className="my-3 flex items-center justify-center">
            <div className="border-2 border-black p-2 font-mono text-2xl tracking-widest">{printGarment.tagId}</div>
          </div>
          <p className="text-xs">{printGarment.serviceName}</p>
          <p className="text-xs text-gray-400">{new Date().toLocaleDateString('en-IN')}</p>
        </div>
      )}

      <div className="print:hidden">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Garment Tracking</h1>
            <p className="text-sm text-gray-500 mt-1">Track individual garments through each processing stage</p>
          </div>
          <button
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-2 bg-maroon-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-maroon-700 transition-colors"
          >
            <Plus size={16} /> Add Garment
          </button>
        </div>

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <div className="flex items-center gap-2 text-gray-500 text-sm mb-1"><Package size={14} /> Total</div>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
            {stats.byStatus?.slice(0, 3).map((s: any) => (
              <div key={s.status} className="bg-white rounded-xl border border-gray-200 p-4">
                <div className="text-xs text-gray-400 mb-1">{s.status.replace(/_/g, ' ')}</div>
                <p className="text-2xl font-bold text-gray-900">{s.count}</p>
              </div>
            ))}
          </div>
        )}

        {/* Filters */}
        <div className="flex gap-3 items-center">
          <div className="relative flex-1 max-w-xs">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search tag ID or garment name..."
              className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-maroon-500 outline-none"
            />
          </div>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-maroon-500"
          >
            <option value="">All Statuses</option>
            {Object.keys(STATUS_COLOR).map(s => (
              <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
            ))}
          </select>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Tag ID</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Garment</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Service</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Stain / Damage</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan={6} className="text-center py-12 text-gray-400">Loading...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-12 text-gray-400">No garments found</td></tr>
              ) : filtered.map(g => (
                <tr key={g.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Tag size={14} className="text-gray-400" />
                      <span className="font-mono text-xs font-semibold text-maroon-700">{g.tagId}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900">{g.name}</p>
                    <p className="text-xs text-gray-400">{g.category} {g.color && `· ${g.color}`}</p>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{g.serviceName}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLOR[g.status] || 'bg-gray-100 text-gray-600'}`}>
                      {g.status?.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {g.stainDescription || g.existingDamage ? (
                      <div className="flex items-center gap-1 text-orange-600 text-xs">
                        <AlertTriangle size={12} />
                        {g.stainDescription || g.existingDamage}
                      </div>
                    ) : <span className="text-gray-300 text-xs">None</span>}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => handlePrint(g)}
                      className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-maroon-600 border border-gray-200 rounded px-2 py-1 hover:border-maroon-300"
                    >
                      <Printer size={12} /> Print Tag
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Garment Modal */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Add Garment</h2>
            <form onSubmit={handleAdd} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Order ID *</label>
                  <input required value={form.orderId} onChange={e => setForm({...form, orderId: e.target.value})} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-maroon-500" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Garment Name *</label>
                  <input required value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="Shirt, Trouser…" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-maroon-500" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Category</label>
                  <input value={form.category} onChange={e => setForm({...form, category: e.target.value})} placeholder="Formal, Casual…" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-maroon-500" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Color</label>
                  <input value={form.color} onChange={e => setForm({...form, color: e.target.value})} placeholder="White, Blue…" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-maroon-500" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Service Name *</label>
                  <input required value={form.serviceName} onChange={e => setForm({...form, serviceName: e.target.value})} placeholder="Dry Cleaning…" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-maroon-500" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Price (₹) *</label>
                  <input required type="number" value={form.price} onChange={e => setForm({...form, price: e.target.value})} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-maroon-500" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Stain Description</label>
                <input value={form.stainDescription} onChange={e => setForm({...form, stainDescription: e.target.value})} placeholder="Describe stains if any…" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-maroon-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Existing Damage</label>
                <input value={form.existingDamage} onChange={e => setForm({...form, existingDamage: e.target.value})} placeholder="Torn collar, missing button…" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-maroon-500" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowAdd(false)} className="flex-1 border border-gray-200 text-gray-600 py-2 rounded-lg text-sm font-medium hover:bg-gray-50">Cancel</button>
                <button type="submit" className="flex-1 bg-maroon-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-maroon-700">Add Garment</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
