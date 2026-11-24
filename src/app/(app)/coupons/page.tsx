'use client';

import { useState, useEffect } from 'react';
import { Ticket, Plus, Percent, IndianRupee, Calendar, Users, TrendingDown, Copy, CheckCircle } from 'lucide-react';
import apiClient, { unwrap } from '@/lib/api';

const couponsApi = {
  getStats: () => apiClient.get('/coupons/stats').then(unwrap),
  list: () => apiClient.get('/coupons').then(unwrap),
  create: (data: any) => apiClient.post('/coupons', data).then(unwrap),
  update: (id: string, data: any) => apiClient.patch(`/coupons/${id}`, data).then(unwrap),
  deactivate: (id: string) => apiClient.patch(`/coupons/${id}/deactivate`).then(unwrap),
};

const TYPE_ICON: Record<string, any> = { PERCENTAGE: Percent, FLAT: IndianRupee, FREE_PICKUP: CheckCircle, FREE_SERVICE: CheckCircle };
const TYPE_COLOR: Record<string, string> = {
  PERCENTAGE: 'bg-maroon-100 text-maroon-700',
  FLAT: 'bg-green-100 text-green-700',
  FREE_PICKUP: 'bg-purple-100 text-purple-700',
  FREE_SERVICE: 'bg-orange-100 text-orange-700',
};

const emptyForm = { code: '', name: '', description: '', type: 'PERCENTAGE', value: '', minOrderValue: '0', maxDiscount: '', validFrom: '', validUntil: '', usageLimit: '', usagePerCustomer: '1' };

const toArray = (v: any): any[] => {
  if (Array.isArray(v)) return v;
  if (v && Array.isArray(v.data)) return v.data;
  if (v && Array.isArray(v.items)) return v.items;
  return [];
};

export default function CouponsPage() {
  const [coupons, setCoupons] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [copied, setCopied] = useState('');

  const load = async () => {
    try {
      const [c, s] = await Promise.all([couponsApi.list(), couponsApi.getStats()]);
      setCoupons(toArray(c)); setStats(s);
    } catch { /* auth redirect handled by interceptor */ }
  };

  useEffect(() => { load(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await couponsApi.create({ ...form, value: parseFloat(form.value), minOrderValue: parseFloat(form.minOrderValue), maxDiscount: form.maxDiscount ? parseFloat(form.maxDiscount) : undefined, usageLimit: form.usageLimit ? parseInt(form.usageLimit) : undefined, usagePerCustomer: parseInt(form.usagePerCustomer) });
    setShowAdd(false); load();
  };

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopied(code);
    setTimeout(() => setCopied(''), 2000);
  };

  const set = (k: keyof typeof emptyForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setForm({ ...form, [k]: e.target.value });

  const active = coupons.filter(c => c.isActive);
  const expired = coupons.filter(c => !c.isActive || new Date(c.validUntil) < new Date());

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Coupons & Discounts</h1>
          <p className="text-sm text-gray-500 mt-1">Create and manage promo codes</p>
        </div>
        <button onClick={() => { setForm(emptyForm); setShowAdd(true); }} className="flex items-center gap-2 bg-maroon-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-maroon-700">
          <Plus size={16} /> New Coupon
        </button>
      </div>

      {stats && (
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-white rounded-xl border border-gray-200 p-4 text-center"><p className="text-2xl font-bold text-gray-900">{stats.total}</p><p className="text-xs text-gray-500 mt-1">Total Coupons</p></div>
          <div className="bg-white rounded-xl border border-gray-200 p-4 text-center"><p className="text-2xl font-bold text-green-600">{stats.active}</p><p className="text-xs text-gray-500 mt-1">Active</p></div>
          <div className="bg-white rounded-xl border border-gray-200 p-4 text-center"><p className="text-2xl font-bold text-maroon-600">{stats.totalUsages}</p><p className="text-xs text-gray-500 mt-1">Times Used</p></div>
          <div className="bg-white rounded-xl border border-gray-200 p-4 text-center"><p className="text-2xl font-bold text-red-500">₹{Number(stats.totalDiscount || 0).toLocaleString('en-IN')}</p><p className="text-xs text-gray-500 mt-1">Total Discounts Given</p></div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {coupons.length === 0 ? (
          <div className="col-span-3 text-center py-16 text-gray-400">
            <Ticket size={40} className="mx-auto mb-3 opacity-30" />
            <p>No coupons created yet.</p>
          </div>
        ) : coupons.map(c => {
          const Icon = TYPE_ICON[c.type] || Percent;
          const isExpired = new Date(c.validUntil) < new Date();
          return (
            <div key={c.id} className={`bg-white rounded-xl border p-5 space-y-3 ${!c.isActive || isExpired ? 'opacity-60 border-gray-100' : 'border-gray-200'}`}>
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${TYPE_COLOR[c.type]}`}>
                      <span className="flex items-center gap-1"><Icon size={10} /> {c.type.replace(/_/g, ' ')}</span>
                    </span>
                    {isExpired && <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-600">Expired</span>}
                  </div>
                  <p className="font-semibold text-gray-900">{c.name}</p>
                </div>
                <div className="text-2xl font-bold text-gray-900">
                  {c.type === 'PERCENTAGE' ? `${c.value}%` : `₹${c.value}`}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <code className="bg-gray-100 px-3 py-1 rounded-lg text-sm font-mono font-semibold text-gray-800 flex-1 text-center">{c.code}</code>
                <button onClick={() => handleCopy(c.code)} className="p-2 text-gray-400 hover:text-maroon-600 hover:bg-maroon-50 rounded-lg">
                  {copied === c.code ? <CheckCircle size={16} className="text-green-500" /> : <Copy size={16} />}
                </button>
              </div>
              <div className="text-xs text-gray-500 space-y-1">
                <div className="flex justify-between"><span>Min order</span><span className="font-medium text-gray-700">₹{c.minOrderValue}</span></div>
                {c.maxDiscount && <div className="flex justify-between"><span>Max discount</span><span className="font-medium text-gray-700">₹{c.maxDiscount}</span></div>}
                <div className="flex justify-between"><span>Used</span><span className="font-medium text-gray-700">{c.timesUsed}{c.usageLimit ? ` / ${c.usageLimit}` : ''}</span></div>
                <div className="flex justify-between"><span>Valid until</span><span className="font-medium text-gray-700">{new Date(c.validUntil).toLocaleDateString('en-IN')}</span></div>
              </div>
              {c.isActive && !isExpired && (
                <button onClick={() => couponsApi.deactivate(c.id).then(load)} className="w-full text-xs text-red-500 hover:text-red-700 border border-red-100 hover:border-red-300 rounded-lg py-1.5">
                  Deactivate
                </button>
              )}
            </div>
          );
        })}
      </div>

      {showAdd && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">New Coupon</h2>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Coupon Code</label>
                  <input value={form.code} onChange={set('code')} placeholder="SAVE20 (auto if blank)" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-maroon-500 uppercase" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Name *</label>
                  <input required value={form.name} onChange={set('name')} placeholder="Summer Sale" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-maroon-500" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Type</label>
                  <select value={form.type} onChange={set('type')} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none">
                    <option value="PERCENTAGE">Percentage %</option>
                    <option value="FLAT">Flat Amount ₹</option>
                    <option value="FREE_PICKUP">Free Pickup</option>
                    <option value="FREE_SERVICE">Free Service</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Value *</label>
                  <input required type="number" step="0.01" value={form.value} onChange={set('value')} placeholder="20" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-maroon-500" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Min Order Value (₹)</label>
                  <input type="number" value={form.minOrderValue} onChange={set('minOrderValue')} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-maroon-500" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Max Discount (₹)</label>
                  <input type="number" value={form.maxDiscount} onChange={set('maxDiscount')} placeholder="Unlimited" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-maroon-500" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Valid From *</label>
                  <input required type="date" value={form.validFrom} onChange={set('validFrom')} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-maroon-500" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Valid Until *</label>
                  <input required type="date" value={form.validUntil} onChange={set('validUntil')} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-maroon-500" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Total Usage Limit</label>
                  <input type="number" value={form.usageLimit} onChange={set('usageLimit')} placeholder="Unlimited" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-maroon-500" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Per Customer Limit</label>
                  <input type="number" value={form.usagePerCustomer} onChange={set('usagePerCustomer')} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-maroon-500" />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowAdd(false)} className="flex-1 border border-gray-200 text-gray-600 py-2 rounded-lg text-sm">Cancel</button>
                <button type="submit" className="flex-1 bg-maroon-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-maroon-700">Create Coupon</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
