'use client';

import { useEffect, useState } from 'react';
import { BarChart2, TrendingUp, DollarSign } from 'lucide-react';
import { reportsApi } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const PERIODS = ['today', 'week', 'month', 'quarter', 'year'] as const;
type Period = typeof PERIODS[number];

const PIE_COLORS = ['#800000', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#06b6d4', '#ec4899'];

export default function ReportsPage() {
  const [tab, setTab] = useState<'sales' | 'financial' | 'customers'>('sales');
  const [period, setPeriod] = useState<Period>('month');
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    setData(null);
    const fetcher = tab === 'sales' ? reportsApi.getSales({ period })
      : tab === 'financial' ? reportsApi.getFinancial({ period })
      : reportsApi.getCustomers();
    fetcher.then(setData).catch(() => {}).finally(() => setLoading(false));
  }, [tab, period]);

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Reports & Analytics</h2>
        <p className="text-sm text-gray-500">Business insights across sales, finance, and customers</p>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-1">
          {(['sales', 'financial', 'customers'] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-4 py-1.5 text-sm rounded-lg font-medium capitalize transition-colors ${tab === t ? 'bg-maroon-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
              {t}
            </button>
          ))}
        </div>
        <div className="flex gap-1">
          {PERIODS.map((p) => (
            <button key={p} onClick={() => setPeriod(p)}
              className={`px-3 py-1.5 text-xs rounded-lg font-medium capitalize transition-colors ${period === p ? 'bg-gray-800 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
              {p}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin w-8 h-8 border-4 border-maroon-600 border-t-transparent rounded-full" />
        </div>
      ) : !data ? (
        <div className="text-center py-16 text-gray-400">No data available</div>
      ) : tab === 'sales' ? (
        <div className="space-y-5">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Total Revenue', value: formatCurrency(data.summary?.totalRevenue ?? 0) },
              { label: 'Total Orders', value: data.summary?.totalOrders ?? 0 },
              { label: 'Collected', value: formatCurrency(data.summary?.totalCollected ?? 0) },
              { label: 'Avg Order Value', value: formatCurrency(data.summary?.avgOrderValue ?? 0) },
            ].map(({ label, value }) => (
              <div key={label} className="bg-white rounded-xl border border-gray-200 p-4">
                <div className="text-xl font-bold text-gray-900">{value}</div>
                <div className="text-sm text-gray-500">{label}</div>
              </div>
            ))}
          </div>
          {data.daily?.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h3 className="text-sm font-semibold text-gray-700 mb-4">Revenue Trend</h3>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={data.daily}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={(v) => v.slice(5)} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
                  <Tooltip formatter={(v: any) => formatCurrency(v)} />
                  <Bar dataKey="revenue" fill="#800000" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      ) : tab === 'financial' ? (
        <div className="space-y-5">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Total Income', value: formatCurrency(data.totalIncome ?? 0), color: 'text-green-600' },
              { label: 'Total Expenses', value: formatCurrency(data.totalExpenses ?? 0), color: 'text-red-500' },
              { label: 'Net Profit', value: formatCurrency(data.netProfit ?? 0), color: (data.netProfit ?? 0) >= 0 ? 'text-maroon-600' : 'text-red-600' },
              { label: 'Profit Margin', value: `${(data.profitMargin ?? 0).toFixed(1)}%`, color: 'text-purple-600' },
            ].map(({ label, value, color }) => (
              <div key={label} className="bg-white rounded-xl border border-gray-200 p-4">
                <div className={`text-xl font-bold ${color}`}>{value}</div>
                <div className="text-sm text-gray-500">{label}</div>
              </div>
            ))}
          </div>
          {data.expenseByCategory?.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h3 className="text-sm font-semibold text-gray-700 mb-4">Expenses by Category</h3>
              <div className="grid grid-cols-2 gap-4 items-center">
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={data.expenseByCategory} dataKey="total" nameKey="category" cx="50%" cy="50%" outerRadius={80}>
                      {data.expenseByCategory.map((_: any, i: number) => (
                        <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v: any) => formatCurrency(v)} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-2">
                  {data.expenseByCategory.map((item: any, i: number) => (
                    <div key={item.category} className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                        <span className="text-xs text-gray-600 truncate">{item.category}</span>
                      </div>
                      <span className="text-xs font-medium text-gray-900 shrink-0">{formatCurrency(item.total)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-5">
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: 'Total Customers', value: data.totalCustomers ?? 0 },
              { label: 'New This Month', value: data.newThisMonth ?? 0 },
              { label: 'Avg Spend', value: formatCurrency(data.averageSpend ?? 0) },
            ].map(({ label, value }) => (
              <div key={label} className="bg-white rounded-xl border border-gray-200 p-4">
                <div className="text-2xl font-bold text-maroon-600">{value}</div>
                <div className="text-sm text-gray-500">{label}</div>
              </div>
            ))}
          </div>
          {data.topCustomers?.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100">
                <h3 className="text-sm font-semibold text-gray-700">Top Customers by Spend</h3>
              </div>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50">
                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">#</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Customer</th>
                    <th className="text-right px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Total Spend</th>
                    <th className="text-right px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Orders</th>
                  </tr>
                </thead>
                <tbody>
                  {data.topCustomers.map((c: any, i: number) => (
                    <tr key={c.id} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="px-5 py-3 text-gray-400 text-xs">{i + 1}</td>
                      <td className="px-5 py-3">
                        <div className="font-medium text-gray-900">{c.name}</div>
                        <div className="text-xs text-gray-500">{c.mobile}</div>
                      </td>
                      <td className="px-5 py-3 text-right font-semibold text-gray-900">{formatCurrency(c.totalSpent)}</td>
                      <td className="px-5 py-3 text-right text-gray-600">{c.totalOrders}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
