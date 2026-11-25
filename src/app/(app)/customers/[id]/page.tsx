'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, ShoppingBag, Edit2, Save, X } from 'lucide-react';
import StatusBadge from '@/components/ui/StatusBadge';
import StatsCard from '@/components/ui/StatsCard';
import { customersApi, ordersApi } from '@/lib/api';
import { formatCurrency, formatDate, getMobileError } from '@/lib/utils';
import MobileInput from '@/components/ui/MobileInput';

export default function CustomerDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [customer, setCustomer] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<any>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.all([
      customersApi.get(id as string),
      ordersApi.list({ customerId: id, limit: 10 }),
    ]).then(([cust, orderRes]) => {
      setCustomer(cust);
      setForm({ name: (cust as any).name, mobile: (cust as any).mobile, email: (cust as any).email, notes: (cust as any).notes });
      setOrders((orderRes as any).data || []);
    }).catch(() => router.push('/customers'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleSave = async () => {
    const mobileErr = getMobileError(form.mobile || '', true, 'Mobile');
    if (mobileErr) { alert(mobileErr); return; }
    setSaving(true);
    try {
      const updated = await customersApi.update(id as string, form);
      setCustomer(updated);
      setEditing(false);
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Failed to update');
    } finally { setSaving(false); }
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin w-8 h-8 border-4 border-maroon-600 border-t-transparent rounded-full" /></div>;
  if (!customer) return null;

  const typeBadge: Record<string, string> = {
    INDIVIDUAL: 'bg-maroon-100 text-maroon-700',
    CORPORATE: 'bg-purple-100 text-purple-700',
    HOTEL: 'bg-amber-100 text-amber-700',
    HOSPITAL: 'bg-green-100 text-green-700',
    RESTAURANT: 'bg-orange-100 text-orange-700',
  };

  return (
    <div className="max-w-5xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="p-2 hover:bg-gray-100 rounded-lg"><ArrowLeft size={18} /></button>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold text-gray-900">{customer.name}</h2>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${typeBadge[customer.type] || 'bg-gray-100 text-gray-700'}`}>
                {customer.type}
              </span>
            </div>
            <p className="text-sm text-gray-500">{customer.customerCode}</p>
          </div>
        </div>
        {!editing ? (
          <button onClick={() => setEditing(true)}
            className="flex items-center gap-2 px-3 py-1.5 text-sm border border-gray-200 rounded-lg hover:bg-gray-50">
            <Edit2 size={14} /> Edit
          </button>
        ) : (
          <div className="flex gap-2">
            <button onClick={() => setEditing(false)}
              className="flex items-center gap-1 px-3 py-1.5 text-sm border border-gray-200 rounded-lg hover:bg-gray-50">
              <X size={14} /> Cancel
            </button>
            <button onClick={handleSave} disabled={saving}
              className="flex items-center gap-1 px-3 py-1.5 text-sm text-white bg-maroon-600 rounded-lg hover:bg-maroon-700 disabled:opacity-50">
              <Save size={14} /> {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard title="Total Orders" value={customer.totalOrders || 0} icon={ShoppingBag} color="maroon" />
        <StatsCard title="Total Spent" value={formatCurrency(customer.totalSpent || 0)} icon={ShoppingBag} color="green" />
        <StatsCard title="Loyalty Points" value={customer.loyaltyPoints || 0} icon={ShoppingBag} color="purple" />
        <StatsCard title="Outstanding" value={formatCurrency(customer.outstandingBalance || 0)} icon={ShoppingBag} color="red" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Profile */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
          <h3 className="font-medium text-gray-900">Profile</h3>
          {editing ? (
            <div className="space-y-3">
              {[['Name', 'name'], ['Mobile *', 'mobile'], ['Email', 'email']].map(([label, field]) => field === 'mobile' ? (
                <div key={field}>
                  <label className="block text-xs text-gray-500 mb-1">{label}</label>
                  <MobileInput value={form.mobile || ''} onChange={(v) => setForm((f: any) => ({ ...f, mobile: v }))} required label="Mobile"
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-maroon-500" />
                </div>
              ) : (
                <div key={field}>
                  <label className="block text-xs text-gray-500 mb-1">{label}</label>
                  <input value={form[field] || ''} onChange={(e) => setForm((f: any) => ({ ...f, [field]: e.target.value }))}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-maroon-500" />
                </div>
              ))}
              <div>
                <label className="block text-xs text-gray-500 mb-1">Notes</label>
                <textarea value={form.notes || ''} rows={3}
                  onChange={(e) => setForm((f: any) => ({ ...f, notes: e.target.value }))}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-maroon-500 resize-none" />
              </div>
            </div>
          ) : (
            <div className="space-y-3 text-sm">
              {[
                ['Mobile', customer.mobile],
                ['Email', customer.email || '—'],
                ['City', customer.city || '—'],
                ['Wallet', formatCurrency(customer.walletBalance || 0)],
                ['Member Since', formatDate(customer.createdAt)],
              ].map(([label, value]) => (
                <div key={label as string} className="flex justify-between">
                  <span className="text-gray-500">{label}</span>
                  <span className="text-gray-900 font-medium">{value}</span>
                </div>
              ))}
              {customer.notes && <p className="text-gray-500 text-xs border-t pt-2 mt-2">{customer.notes}</p>}
            </div>
          )}
        </div>

        {/* Orders */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-medium text-gray-900">Recent Orders</h3>
            <button onClick={() => router.push(`/orders/new?customerId=${id}`)}
              className="text-sm text-maroon-600 hover:underline">+ New Order</button>
          </div>
          {orders.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-8">No orders yet</p>
          ) : (
            <div className="space-y-2">
              {orders.map((order: any) => (
                <div key={order.id} onClick={() => router.push(`/orders/${order.id}`)}
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 cursor-pointer border border-gray-100">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{order.orderNumber}</p>
                    <p className="text-xs text-gray-500">{formatDate(order.orderDate)}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <StatusBadge status={order.status} />
                    <span className="text-sm font-medium text-gray-900">{formatCurrency(order.totalAmount)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
