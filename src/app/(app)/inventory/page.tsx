'use client';

import { useEffect, useState } from 'react';
import { Plus, AlertTriangle, Package } from 'lucide-react';
import { inventoryApi } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';

export default function InventoryPage() {
  const [items, setItems] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'all' | 'low'>('all');
  const [showForm, setShowForm] = useState(false);
  const [showAdjust, setShowAdjust] = useState<any>(null);
  const [form, setForm] = useState({ name: '', category: '', unit: 'kg', minimumStock: 0, unitCost: 0, branchId: '' });
  const [adjust, setAdjust] = useState({ transactionType: 'IN', quantity: 0, notes: '' });
  const [saving, setSaving] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [itemsData, statsData] = await Promise.all([
        inventoryApi.listItems({ lowStock: tab === 'low' ? 'true' : undefined }),
        inventoryApi.getStats(),
      ]);
      setItems(itemsData as any);
      setStats(statsData);
    } catch {}
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [tab]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await inventoryApi.createItem({ ...form, branchId: form.branchId || undefined });
      setShowForm(false);
      setForm({ name: '', category: '', unit: 'kg', minimumStock: 0, unitCost: 0, branchId: '' });
      fetchData();
    } catch (err: any) { alert(err?.response?.data?.message || 'Failed'); }
    finally { setSaving(false); }
  };

  const handleAdjust = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showAdjust) return;
    setSaving(true);
    try {
      await inventoryApi.adjustStock(showAdjust.id, adjust);
      setShowAdjust(null);
      setAdjust({ transactionType: 'IN', quantity: 0, notes: '' });
      fetchData();
    } catch (err: any) { alert(err?.response?.data?.message || 'Failed'); }
    finally { setSaving(false); }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Inventory</h2>
          <p className="text-sm text-gray-500">Track stock levels and suppliers</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-maroon-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-maroon-700">
          <Plus size={16} /> Add Item
        </button>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Total Items', value: stats.totalItems, color: 'text-maroon-600 bg-maroon-50' },
            { label: 'Low Stock Alerts', value: stats.lowStockItems, color: 'text-orange-600 bg-orange-50' },
            { label: 'Total Value', value: formatCurrency(stats.totalInventoryValue), color: 'text-green-600 bg-green-50' },
          ].map((s) => (
            <div key={s.label} className="bg-white rounded-xl border border-gray-200 p-4">
              <div className={`text-2xl font-bold ${s.color.split(' ')[0]} mb-1`}>{s.value}</div>
              <div className="text-sm text-gray-500">{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2">
        {(['all', 'low'] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-1.5 text-sm rounded-lg font-medium transition-colors ${tab === t ? 'bg-maroon-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
            {t === 'all' ? 'All Items' : '⚠️ Low Stock'}
          </button>
        ))}
      </div>

      {/* Items table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="animate-spin w-6 h-6 border-4 border-maroon-600 border-t-transparent rounded-full" />
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Item</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Category</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Stock</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Min Stock</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Unit Cost</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Value</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Action</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => {
                const isLow = Number(item.currentStock) <= Number(item.minimumStock);
                return (
                  <tr key={item.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {isLow && <AlertTriangle size={13} className="text-orange-500 shrink-0" />}
                        <span className="font-medium text-gray-900">{item.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-500">{item.category || '—'}</td>
                    <td className={`px-4 py-3 text-right font-semibold ${isLow ? 'text-orange-600' : 'text-gray-900'}`}>
                      {item.currentStock} {item.unit}
                    </td>
                    <td className="px-4 py-3 text-right text-gray-500">{item.minimumStock} {item.unit}</td>
                    <td className="px-4 py-3 text-right text-gray-700">{formatCurrency(item.unitCost)}</td>
                    <td className="px-4 py-3 text-right text-gray-700">
                      {formatCurrency(Number(item.currentStock) * Number(item.unitCost))}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => { setShowAdjust(item); setAdjust({ transactionType: 'IN', quantity: 0, notes: '' }); }}
                        className="text-maroon-600 hover:text-maroon-800 text-xs font-medium">
                        Adjust Stock
                      </button>
                    </td>
                  </tr>
                );
              })}
              {items.length === 0 && (
                <tr><td colSpan={7} className="text-center py-16 text-gray-400">
                  <Package size={28} className="mx-auto mb-2 opacity-30" />
                  <p>{tab === 'low' ? 'No low stock alerts' : 'No inventory items yet'}</p>
                </td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Add Item Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Add Inventory Item</h3>
            <form onSubmit={handleCreate} className="space-y-3">
              {[
                { label: 'Item Name *', field: 'name', required: true },
                { label: 'Category', field: 'category', placeholder: 'e.g. Chemicals, Equipment' },
                { label: 'Unit', field: 'unit', placeholder: 'e.g. kg, L, pcs' },
              ].map(({ label, field, placeholder, required }) => (
                <div key={field}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
                  <input required={required} value={(form as any)[field]} placeholder={placeholder}
                    onChange={(e) => setForm({ ...form, [field]: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-maroon-500" />
                </div>
              ))}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Min Stock</label>
                  <input type="number" min={0} value={form.minimumStock} onChange={(e) => setForm({ ...form, minimumStock: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-maroon-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Unit Cost ₹</label>
                  <input type="number" min={0} value={form.unitCost} onChange={(e) => setForm({ ...form, unitCost: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-maroon-500" />
                </div>
              </div>
              <div className="flex gap-3 justify-end pt-2">
                <button type="button" onClick={() => setShowForm(false)}
                  className="px-4 py-2 text-sm text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50">Cancel</button>
                <button type="submit" disabled={saving}
                  className="px-4 py-2 text-sm text-white bg-maroon-600 rounded-lg hover:bg-maroon-700 disabled:opacity-50">
                  {saving ? 'Adding...' : 'Add Item'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Adjust Stock Modal */}
      {showAdjust && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6">
            <h3 className="font-semibold text-gray-900 mb-1">Adjust Stock</h3>
            <p className="text-sm text-gray-500 mb-4">{showAdjust.name} — Current: {showAdjust.currentStock} {showAdjust.unit}</p>
            <form onSubmit={handleAdjust} className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Transaction Type</label>
                <select value={adjust.transactionType} onChange={(e) => setAdjust({ ...adjust, transactionType: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-maroon-500">
                  <option value="IN">Stock In (Received)</option>
                  <option value="OUT">Stock Out (Used)</option>
                  <option value="ADJUSTMENT">Manual Adjustment (Set)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {adjust.transactionType === 'ADJUSTMENT' ? 'New Stock Level' : 'Quantity'} *
                </label>
                <input required type="number" min={0} value={adjust.quantity}
                  onChange={(e) => setAdjust({ ...adjust, quantity: Number(e.target.value) })}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-maroon-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <input value={adjust.notes} onChange={(e) => setAdjust({ ...adjust, notes: e.target.value })}
                  placeholder="Reason for adjustment"
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-maroon-500" />
              </div>
              <div className="flex gap-3 justify-end pt-2">
                <button type="button" onClick={() => setShowAdjust(null)}
                  className="px-4 py-2 text-sm text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50">Cancel</button>
                <button type="submit" disabled={saving}
                  className="px-4 py-2 text-sm text-white bg-maroon-600 rounded-lg hover:bg-maroon-700 disabled:opacity-50">
                  {saving ? 'Saving...' : 'Adjust'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
