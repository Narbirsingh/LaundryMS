'use client';

import { useEffect, useState } from 'react';
import { Plus, CheckCircle, XCircle } from 'lucide-react';
import { expensesApi } from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/utils';

const CATEGORIES = ['RENT','UTILITIES','CHEMICALS','EQUIPMENT','SALARY','MAINTENANCE','MARKETING','TRANSPORT','MISCELLANEOUS'];

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ category: 'UTILITIES', description: '', amount: 0, expenseDate: '', vendorName: '', paymentMethod: 'CASH', billNumber: '' });
  const [saving, setSaving] = useState(false);
  const [filterStatus, setFilterStatus] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      const [data, statsData] = await Promise.all([
        expensesApi.list({ approvalStatus: filterStatus || undefined }),
        expensesApi.getStats(),
      ]);
      setExpenses((data as any).data || []);
      setStats(statsData);
    } catch {}
    setLoading(false);
  };

  useEffect(() => { setForm(prev => ({ ...prev, expenseDate: new Date().toISOString().slice(0, 10) })); }, []);

  useEffect(() => { fetchData(); }, [filterStatus]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await expensesApi.create({ ...form, amount: Number(form.amount) });
      setShowForm(false);
      fetchData();
    } catch (err: any) { alert(err?.response?.data?.message || 'Failed'); }
    finally { setSaving(false); }
  };

  const handleApprove = async (id: string) => {
    await expensesApi.approve(id);
    fetchData();
  };

  const handleReject = async (id: string) => {
    if (!confirm('Reject this expense?')) return;
    await expensesApi.reject(id);
    fetchData();
  };

  const statusBadge: Record<string, string> = {
    PENDING: 'bg-yellow-100 text-yellow-700',
    APPROVED: 'bg-green-100 text-green-700',
    REJECTED: 'bg-red-100 text-red-700',
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Expenses</h2>
          <p className="text-sm text-gray-500">Track and approve business expenses</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-maroon-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-maroon-700">
          <Plus size={16} /> Add Expense
        </button>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="text-2xl font-bold text-maroon-600">{formatCurrency(stats.totalExpenses)}</div>
            <div className="text-sm text-gray-500">Total Expenses</div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="text-2xl font-bold text-orange-600">{stats.pendingApproval}</div>
            <div className="text-sm text-gray-500">Pending Approval</div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="text-2xl font-bold text-green-600">{stats.totalCount}</div>
            <div className="text-sm text-gray-500">Total Records</div>
          </div>
        </div>
      )}

      {/* Filter */}
      <div className="flex gap-2">
        {(['', 'PENDING', 'APPROVED', 'REJECTED']).map((s) => (
          <button key={s} onClick={() => setFilterStatus(s)}
            className={`px-3 py-1.5 text-sm rounded-lg font-medium transition-colors ${filterStatus === s ? 'bg-maroon-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
            {s || 'All'}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="animate-spin w-6 h-6 border-4 border-maroon-600 border-t-transparent rounded-full" />
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Description</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Category</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Date</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Vendor</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Amount</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Status</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody>
              {expenses.map((exp) => (
                <tr key={exp.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{exp.description}</td>
                  <td className="px-4 py-3">
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{exp.category}</span>
                  </td>
                  <td className="px-4 py-3 text-gray-500">{formatDate(exp.expenseDate)}</td>
                  <td className="px-4 py-3 text-gray-500">{exp.vendorName || '—'}</td>
                  <td className="px-4 py-3 text-right font-semibold text-gray-900">{formatCurrency(exp.amount)}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusBadge[exp.approvalStatus] || 'bg-gray-100 text-gray-600'}`}>
                      {exp.approvalStatus}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    {exp.approvalStatus === 'PENDING' && (
                      <div className="flex justify-end gap-2">
                        <button onClick={() => handleApprove(exp.id)} className="p-1 text-green-500 hover:text-green-700">
                          <CheckCircle size={15} />
                        </button>
                        <button onClick={() => handleReject(exp.id)} className="p-1 text-red-500 hover:text-red-700">
                          <XCircle size={15} />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
              {expenses.length === 0 && (
                <tr><td colSpan={7} className="text-center py-16 text-gray-400">No expenses found</td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Add Expense Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Add Expense</h3>
            <form onSubmit={handleCreate} className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-maroon-500">
                  {CATEGORIES.map((c) => <option key={c} value={c}>{c.replace(/_/g, ' ')}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
                <input required value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-maroon-500" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Amount ₹ *</label>
                  <input required type="number" min={0.01} step={0.01} value={form.amount}
                    onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-maroon-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                  <input type="date" value={form.expenseDate} onChange={(e) => setForm({ ...form, expenseDate: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-maroon-500" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Vendor</label>
                  <input value={form.vendorName} onChange={(e) => setForm({ ...form, vendorName: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-maroon-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Bill #</label>
                  <input value={form.billNumber} onChange={(e) => setForm({ ...form, billNumber: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-maroon-500" />
                </div>
              </div>
              <div className="flex gap-3 justify-end pt-2">
                <button type="button" onClick={() => setShowForm(false)}
                  className="px-4 py-2 text-sm text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50">Cancel</button>
                <button type="submit" disabled={saving}
                  className="px-4 py-2 text-sm text-white bg-maroon-600 rounded-lg hover:bg-maroon-700 disabled:opacity-50">
                  {saving ? 'Adding...' : 'Add Expense'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
