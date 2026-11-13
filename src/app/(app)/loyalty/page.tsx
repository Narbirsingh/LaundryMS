'use client';

import { useState, useEffect } from 'react';
import { Star, Gift, Users, TrendingUp, Plus, Edit2, Crown, Award } from 'lucide-react';
import apiClient, { unwrap } from '@/lib/api';

const loyaltyApi = {
  getStats: () => apiClient.get('/loyalty/stats').then(unwrap),
  listPlans: () => apiClient.get('/loyalty/plans').then(unwrap),
  createPlan: (data: any) => apiClient.post('/loyalty/plans', data).then(unwrap),
  updatePlan: (id: string, data: any) => apiClient.patch(`/loyalty/plans/${id}`, data).then(unwrap),
  listSubscriptions: () => apiClient.get('/loyalty/subscriptions').then(unwrap),
};

const TIER_COLOR: Record<string, string> = {
  SILVER: 'bg-gray-100 text-gray-700',
  GOLD: 'bg-yellow-100 text-yellow-700',
  PLATINUM: 'bg-purple-100 text-purple-700',
};

const emptyPlan = { name: '', description: '', price: '', validityDays: '30', pointsMultiplier: '1', discountPercent: '0', freePickups: '0', maxOrders: '' };

const toArray = (v: any): any[] => {
  if (Array.isArray(v)) return v;
  if (v && Array.isArray(v.data)) return v.data;
  if (v && Array.isArray(v.items)) return v.items;
  return [];
};

export default function LoyaltyPage() {
  const [tab, setTab] = useState<'plans' | 'subscriptions'>('plans');
  const [stats, setStats] = useState<any>(null);
  const [plans, setPlans] = useState<any[]>([]);
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState(emptyPlan);

  const load = async () => {
    try {
      const [s, p, sub] = await Promise.all([
        loyaltyApi.getStats(),
        loyaltyApi.listPlans(),
        loyaltyApi.listSubscriptions(),
      ]);
      setStats(s); setPlans(toArray(p)); setSubscriptions(toArray(sub));
    } catch { /* auth redirect handled by interceptor */ }
  };

  useEffect(() => { load(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const data = { ...form, price: parseFloat(form.price), validityDays: parseInt(form.validityDays), pointsMultiplier: parseFloat(form.pointsMultiplier), discountPercent: parseFloat(form.discountPercent), freePickups: parseInt(form.freePickups), maxOrders: form.maxOrders ? parseInt(form.maxOrders) : undefined };
    if (editing) await loyaltyApi.updatePlan(editing.id, data);
    else await loyaltyApi.createPlan(data);
    setShowAdd(false); setEditing(null); load();
  };

  const openEdit = (p: any) => {
    setForm({ name: p.name, description: p.description || '', price: p.price, validityDays: p.validityDays, pointsMultiplier: p.pointsMultiplier, discountPercent: p.discountPercent, freePickups: p.freePickups, maxOrders: p.maxOrders || '' });
    setEditing(p); setShowAdd(true);
  };

  const set = (k: keyof typeof emptyPlan) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setForm({ ...form, [k]: e.target.value });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Loyalty & Memberships</h1>
          <p className="text-sm text-gray-500 mt-1">Reward customers and drive repeat visits</p>
        </div>
        <button onClick={() => { setForm(emptyPlan); setEditing(null); setShowAdd(true); }} className="flex items-center gap-2 bg-maroon-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-maroon-700">
          <Plus size={16} /> New Plan
        </button>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-4">
            <div className="w-10 h-10 bg-yellow-100 rounded-xl flex items-center justify-center"><Star size={18} className="text-yellow-600" /></div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.totalAccounts}</p>
              <p className="text-xs text-gray-500">Loyalty Members</p>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-4">
            <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center"><Crown size={18} className="text-purple-600" /></div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.activeSubs}</p>
              <p className="text-xs text-gray-500">Active Subscriptions</p>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-4">
            <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center"><TrendingUp size={18} className="text-green-600" /></div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{Math.round(stats.totalPointsAwarded || 0).toLocaleString()}</p>
              <p className="text-xs text-gray-500">Points Awarded</p>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <div className="flex gap-6">
          {(['plans', 'subscriptions'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)} className={`pb-3 text-sm font-medium capitalize border-b-2 transition-colors ${tab === t ? 'border-maroon-600 text-maroon-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
              {t === 'plans' ? 'Membership Plans' : 'Active Members'}
            </button>
          ))}
        </div>
      </div>

      {/* Plans */}
      {tab === 'plans' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {plans.length === 0 ? (
            <div className="col-span-3 text-center py-16 text-gray-400">
              <Gift size={40} className="mx-auto mb-3 opacity-30" />
              <p>No membership plans yet. Create one to get started.</p>
            </div>
          ) : plans.map(p => (
            <div key={p.id} className="bg-white rounded-xl border border-gray-200 p-5 space-y-3 relative">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-semibold text-gray-900 text-lg">{p.name}</p>
                  {p.description && <p className="text-xs text-gray-500 mt-0.5">{p.description}</p>}
                </div>
                <button onClick={() => openEdit(p)} className="p-1.5 text-gray-400 hover:text-maroon-600 hover:bg-maroon-50 rounded-lg"><Edit2 size={14} /></button>
              </div>
              <div className="text-3xl font-bold text-gray-900">₹{Number(p.price).toLocaleString('en-IN')} <span className="text-sm font-normal text-gray-400">/ {p.validityDays} days</span></div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-maroon-50 rounded-lg p-2 text-center">
                  <p className="font-semibold text-maroon-700">{p.discountPercent}%</p>
                  <p className="text-maroon-500">Discount</p>
                </div>
                <div className="bg-green-50 rounded-lg p-2 text-center">
                  <p className="font-semibold text-green-700">{p.pointsMultiplier}x</p>
                  <p className="text-green-500">Points</p>
                </div>
                <div className="bg-purple-50 rounded-lg p-2 text-center">
                  <p className="font-semibold text-purple-700">{p.freePickups}</p>
                  <p className="text-purple-500">Free Pickups</p>
                </div>
                <div className="bg-orange-50 rounded-lg p-2 text-center">
                  <p className="font-semibold text-orange-700">{p.maxOrders || '∞'}</p>
                  <p className="text-orange-500">Max Orders</p>
                </div>
              </div>
              <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${p.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                {p.isActive ? 'Active' : 'Inactive'}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Subscriptions */}
      {tab === 'subscriptions' && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Customer</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Plan</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Valid Until</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Paid</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {subscriptions.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-10 text-gray-400">No active subscriptions</td></tr>
              ) : subscriptions.map(s => (
                <tr key={s.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{s.customer?.name || s.customerId}</td>
                  <td className="px-4 py-3 text-gray-600">{s.plan?.name || s.planId}</td>
                  <td className="px-4 py-3 text-gray-600">{s.endDate ? new Date(s.endDate).toLocaleDateString('en-IN') : '-'}</td>
                  <td className="px-4 py-3 text-gray-900 font-medium">₹{Number(s.amountPaid).toLocaleString('en-IN')}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${s.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {s.isActive ? 'Active' : 'Expired'}
                    </span>
                  </td>
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
            <h2 className="text-lg font-semibold text-gray-900 mb-4">{editing ? 'Edit Plan' : 'New Membership Plan'}</h2>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Plan Name *</label>
                <input required value={form.name} onChange={set('name')} placeholder="Gold, Premium…" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-maroon-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Description</label>
                <input value={form.description} onChange={set('description')} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-maroon-500" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Price (₹) *</label>
                  <input required type="number" value={form.price} onChange={set('price')} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-maroon-500" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Validity (days)</label>
                  <input type="number" value={form.validityDays} onChange={set('validityDays')} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-maroon-500" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Discount %</label>
                  <input type="number" step="0.01" value={form.discountPercent} onChange={set('discountPercent')} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-maroon-500" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Points Multiplier</label>
                  <input type="number" step="0.01" value={form.pointsMultiplier} onChange={set('pointsMultiplier')} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-maroon-500" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Free Pickups</label>
                  <input type="number" value={form.freePickups} onChange={set('freePickups')} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-maroon-500" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Max Orders</label>
                  <input type="number" value={form.maxOrders} onChange={set('maxOrders')} placeholder="Unlimited" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-maroon-500" />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowAdd(false)} className="flex-1 border border-gray-200 text-gray-600 py-2 rounded-lg text-sm">Cancel</button>
                <button type="submit" className="flex-1 bg-maroon-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-maroon-700">Save Plan</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
