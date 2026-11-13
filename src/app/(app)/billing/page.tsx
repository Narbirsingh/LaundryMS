'use client';

import { useEffect, useState } from 'react';
import { Plus, FileText, CreditCard } from 'lucide-react';
import StatusBadge from '@/components/ui/StatusBadge';
import StatsCard from '@/components/ui/StatsCard';
import { billingApi } from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/utils';

export default function BillingPage() {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'invoices' | 'payments'>('invoices');
  const [payments, setPayments] = useState<any[]>([]);
  const [showPayForm, setShowPayForm] = useState(false);
  const [payForm, setPayForm] = useState({ customerId: '', amount: 0, paymentMethod: 'CASH', notes: '', invoiceId: '' });
  const [saving, setSaving] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [inv, st, pay] = await Promise.all([
        billingApi.listInvoices({ page: 1, limit: 20 }),
        billingApi.getStats(),
        billingApi.listPayments({ page: 1, limit: 20 }),
      ]);
      setInvoices((inv as any).data || []);
      setStats(st);
      setPayments((pay as any).data || []);
    } catch {}
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await billingApi.recordPayment({ ...payForm, amount: Number(payForm.amount) });
      setShowPayForm(false);
      fetchData();
    } catch (err: any) { alert(err?.response?.data?.message || 'Failed'); }
    finally { setSaving(false); }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Billing & Payments</h2>
          <p className="text-sm text-gray-500">Invoices, collections, and payment tracking</p>
        </div>
        <button onClick={() => setShowPayForm(true)}
          className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700">
          <Plus size={16} /> Record Payment
        </button>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard title="Total Billed" value={formatCurrency(stats.totalBilled)} icon={FileText} color="maroon" />
          <StatsCard title="Collected" value={formatCurrency(stats.totalCollected)} icon={CreditCard} color="green" />
          <StatsCard title="Outstanding" value={formatCurrency(stats.totalOutstanding)} icon={FileText} color="red" />
          <StatsCard title="Invoices" value={stats.totalInvoices} icon={FileText} color="purple" />
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2">
        {(['invoices', 'payments'] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-1.5 text-sm rounded-lg font-medium transition-colors capitalize ${tab === t ? 'bg-maroon-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
            {t}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="animate-spin w-6 h-6 border-4 border-maroon-600 border-t-transparent rounded-full" />
          </div>
        ) : tab === 'invoices' ? (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Invoice #</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Customer</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Date</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Total</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Paid</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Due</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Status</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((inv) => (
                <tr key={inv.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{inv.invoiceNumber}</td>
                  <td className="px-4 py-3 text-gray-700">{inv.customer?.name || '—'}</td>
                  <td className="px-4 py-3 text-gray-500">{formatDate(inv.invoiceDate)}</td>
                  <td className="px-4 py-3 text-right font-medium text-gray-900">{formatCurrency(inv.totalAmount)}</td>
                  <td className="px-4 py-3 text-right text-green-600">{formatCurrency(inv.amountPaid)}</td>
                  <td className="px-4 py-3 text-right text-red-500">{formatCurrency(inv.amountDue)}</td>
                  <td className="px-4 py-3"><StatusBadge status={inv.paymentStatus} type="payment" /></td>
                </tr>
              ))}
              {invoices.length === 0 && (
                <tr><td colSpan={7} className="text-center py-16 text-gray-400">No invoices yet. Generate from an order.</td></tr>
              )}
            </tbody>
          </table>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Reference</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Date</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Method</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Amount</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Notes</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((p) => (
                <tr key={p.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{p.paymentReference}</td>
                  <td className="px-4 py-3 text-gray-500">{formatDate(p.paymentDate)}</td>
                  <td className="px-4 py-3 text-gray-700">{p.paymentMethod}</td>
                  <td className="px-4 py-3 text-right font-semibold text-green-600">{formatCurrency(p.amount)}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{p.notes || '—'}</td>
                </tr>
              ))}
              {payments.length === 0 && (
                <tr><td colSpan={5} className="text-center py-16 text-gray-400">No payments recorded yet.</td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Record Payment Modal */}
      {showPayForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Record Payment</h3>
            <form onSubmit={handlePayment} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Customer ID *</label>
                <input required value={payForm.customerId} onChange={(e) => setPayForm({ ...payForm, customerId: e.target.value })}
                  placeholder="Paste customer UUID"
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-maroon-500" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Amount ₹ *</label>
                  <input required type="number" min={0.01} step={0.01} value={payForm.amount}
                    onChange={(e) => setPayForm({ ...payForm, amount: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-maroon-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Method</label>
                  <select value={payForm.paymentMethod} onChange={(e) => setPayForm({ ...payForm, paymentMethod: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-maroon-500">
                    {['CASH','UPI','CARD','BANK_TRANSFER','CHEQUE','WALLET'].map((m) => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Invoice ID (optional)</label>
                <input value={payForm.invoiceId} onChange={(e) => setPayForm({ ...payForm, invoiceId: e.target.value })}
                  placeholder="Link to an invoice"
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-maroon-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <input value={payForm.notes} onChange={(e) => setPayForm({ ...payForm, notes: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-maroon-500" />
              </div>
              <div className="flex gap-3 justify-end pt-2">
                <button type="button" onClick={() => setShowPayForm(false)}
                  className="px-4 py-2 text-sm text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50">Cancel</button>
                <button type="submit" disabled={saving}
                  className="px-4 py-2 text-sm text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50">
                  {saving ? 'Recording...' : 'Record Payment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
