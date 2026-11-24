'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus, Search, User } from 'lucide-react';
import { customersApi } from '@/lib/api';
import { formatCurrency, formatDate, getInitials } from '@/lib/utils';

const TYPE_COLORS: Record<string, string> = {
  INDIVIDUAL: 'bg-maroon-100 text-maroon-700',
  CORPORATE: 'bg-purple-100 text-purple-700',
  HOTEL: 'bg-amber-100 text-amber-700',
  HOSPITAL: 'bg-red-100 text-red-700',
  RESTAURANT: 'bg-green-100 text-green-700',
  OTHER: 'bg-gray-100 text-gray-700',
};

export default function CustomersPage() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [type, setType] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    setLoading(true);
    customersApi
      .list({ search, type: type || undefined, page, limit: 20 })
      .then((res: any) => {
        setCustomers(res.data || []);
        setTotal(res.total || 0);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [search, type, page]);

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Customers</h2>
          <p className="text-sm text-gray-500">{total} registered customers</p>
        </div>
        <Link
          href="/customers/new"
          className="inline-flex items-center gap-2 bg-maroon-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-maroon-700 transition-colors"
        >
          <Plus size={16} />
          Add Customer
        </Link>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            type="text"
            placeholder="Search by name, mobile, ID..."
            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-maroon-500 outline-none"
          />
        </div>
        <select
          value={type}
          onChange={(e) => { setType(e.target.value); setPage(1); }}
          className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-maroon-500 outline-none"
        >
          <option value="">All Types</option>
          <option value="INDIVIDUAL">Individual</option>
          <option value="CORPORATE">Corporate</option>
          <option value="HOTEL">Hotel</option>
          <option value="HOSPITAL">Hospital</option>
          <option value="RESTAURANT">Restaurant</option>
        </select>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="animate-spin w-6 h-6 border-4 border-maroon-600 border-t-transparent rounded-full" />
          </div>
        ) : customers.length === 0 ? (
          <div className="text-center py-16">
            <User size={40} className="mx-auto text-gray-300 mb-3" />
            <p className="text-gray-400 text-sm">No customers yet</p>
            <Link href="/customers/new" className="mt-3 inline-flex items-center gap-1 text-maroon-600 text-sm font-medium">
              <Plus size={14} /> Add first customer
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Customer</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Type</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Mobile</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Total Orders</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Total Spent</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Outstanding</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Action</th>
                </tr>
              </thead>
              <tbody>
                {customers.map((c) => (
                  <tr key={c.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-maroon-100 text-maroon-700 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">
                          {getInitials(c.name)}
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">{c.name}</div>
                          <div className="text-xs text-gray-400">{c.customerCode}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${TYPE_COLORS[c.type] || TYPE_COLORS.OTHER}`}>
                        {c.type}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-700">{c.mobile}</td>
                    <td className="px-4 py-3 text-gray-700">{c.totalOrders}</td>
                    <td className="px-4 py-3 font-medium text-gray-900">{formatCurrency(c.totalSpent)}</td>
                    <td className="px-4 py-3">
                      <span className={c.outstandingBalance > 0 ? 'text-red-600 font-medium' : 'text-gray-400'}>
                        {formatCurrency(c.outstandingBalance)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link href={`/customers/${c.id}`} className="text-maroon-600 hover:text-maroon-800 font-medium text-xs">
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
