'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus, Search, RefreshCw, Clock, AlertCircle, List } from 'lucide-react';
import StatusBadge from '@/components/ui/StatusBadge';
import { ordersApi } from '@/lib/api';
import { formatCurrency, formatDateTime } from '@/lib/utils';

type QuickFilter = 'all' | 'today' | 'delayed';

const QUICK_FILTERS: { key: QuickFilter; label: string; icon: any; activeBg: string; activeText: string }[] = [
  { key: 'all', label: 'All Orders', icon: List, activeBg: 'bg-gray-900', activeText: 'text-white' },
  { key: 'today', label: 'Today', icon: Clock, activeBg: 'bg-blue-600', activeText: 'text-white' },
  { key: 'delayed', label: 'Delayed / Overdue', icon: AlertCircle, activeBg: 'bg-red-600', activeText: 'text-white' },
];

export default function OrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [quickFilter, setQuickFilter] = useState<QuickFilter>('all');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const params: any = { search, status: status || undefined, page, limit: 20 };

      if (quickFilter === 'today') {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        params.fromDate = today.toISOString();
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        params.toDate = tomorrow.toISOString();
      } else if (quickFilter === 'delayed') {
        params.delayed = true;
      }

      const res = await ordersApi.list(params) as any;
      setOrders(res.data || []);
      setTotal(res.total || 0);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [search, status, quickFilter, page]);

  const handleQuickFilter = (key: QuickFilter) => {
    setQuickFilter(key);
    setStatus('');
    setPage(1);
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Orders</h2>
          <p className="text-sm text-gray-500">
            {total} {quickFilter === 'today' ? "today's" : quickFilter === 'delayed' ? 'delayed' : 'total'} orders
          </p>
        </div>
        <Link
          href="/orders/new"
          className="inline-flex items-center gap-2 bg-maroon-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-maroon-700 transition-colors"
        >
          <Plus size={16} />
          New Order
        </Link>
      </div>

      {/* Quick Filter Tabs */}
      <div className="flex gap-2 flex-wrap">
        {QUICK_FILTERS.map(({ key, label, icon: Icon, activeBg, activeText }) => (
          <button
            key={key}
            onClick={() => handleQuickFilter(key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all border ${
              quickFilter === key
                ? `${activeBg} ${activeText} border-transparent shadow-sm`
                : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
            }`}
          >
            <Icon size={14} />
            {label}
            {quickFilter === key && total > 0 && (
              <span className="ml-1 text-xs px-1.5 py-0.5 rounded-full bg-white/20 font-semibold">
                {total}
              </span>
            )}
          </button>
        ))}
      </div>

      {quickFilter === 'delayed' && (
        <div className="flex items-center gap-3 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
          <AlertCircle size={16} className="shrink-0" />
          <span>These orders have passed their expected delivery date and are not yet closed, delivered, or cancelled.</span>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            type="text"
            placeholder="Search by order number, customer..."
            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-maroon-500 outline-none"
          />
        </div>
        <select
          value={status}
          onChange={(e) => { setStatus(e.target.value); setPage(1); }}
          className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-maroon-500 outline-none"
        >
          <option value="">All Statuses</option>
          <option value="ORDER_CREATED">Order Created</option>
          <option value="RECEIVED_AT_FACILITY">Received at Facility</option>
          <option value="WASHING_IN_PROGRESS">Washing</option>
          <option value="QUALITY_INSPECTION">Quality Inspection</option>
          <option value="READY_FOR_DISPATCH">Ready for Dispatch</option>
          <option value="OUT_FOR_DELIVERY">Out for Delivery</option>
          <option value="DELIVERED">Delivered</option>
          <option value="ORDER_CLOSED">Closed</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
        <button
          onClick={fetchOrders}
          className="p-2 text-gray-500 hover:text-gray-900 border border-gray-200 rounded-lg"
        >
          <RefreshCw size={16} />
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="animate-spin w-6 h-6 border-4 border-maroon-600 border-t-transparent rounded-full" />
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-gray-400 text-sm">
              {quickFilter === 'today' ? 'No orders created today' : quickFilter === 'delayed' ? 'No delayed orders — all caught up! ✓' : 'No orders found'}
            </p>
            {quickFilter === 'all' && (
              <Link
                href="/orders/new"
                className="mt-3 inline-flex items-center gap-2 text-maroon-600 text-sm font-medium"
              >
                <Plus size={14} />
                Create first order
              </Link>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Order #</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Customer</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Amount</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Payment</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Date</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Action</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.id} className={`border-b border-gray-50 hover:bg-gray-50 transition-colors ${quickFilter === 'delayed' ? 'bg-red-50/30' : ''}`}>
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900">{order.orderNumber}</div>
                      {order.isExpress && (
                        <span className="text-xs bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded">Express</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-gray-900">{order.customer?.name || '—'}</div>
                      <div className="text-xs text-gray-400">{order.customer?.mobile}</div>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={order.status} />
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-900">
                      {formatCurrency(order.totalAmount)}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={order.paymentStatus} type="payment" />
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs">
                      {formatDateTime(order.orderDate)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/orders/${order.id}`}
                        className="text-maroon-600 hover:text-maroon-800 font-medium text-xs"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {total > 20 && (
          <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between">
            <span className="text-sm text-gray-500">
              Showing {(page - 1) * 20 + 1}–{Math.min(page * 20, total)} of {total}
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg disabled:opacity-50 hover:bg-gray-50"
              >
                Previous
              </button>
              <button
                onClick={() => setPage((p) => p + 1)}
                disabled={page * 20 >= total}
                className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg disabled:opacity-50 hover:bg-gray-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
