'use client';

import { useEffect, useState } from 'react';
import {
  ShoppingBag, Users, TrendingUp, AlertCircle, CheckCircle,
  Clock, DollarSign, Truck, XCircle, BarChart3,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, Legend,
} from 'recharts';
import StatsCard from '@/components/ui/StatsCard';
import { ordersApi } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';

const COLORS = ['#800000', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

const WEEKLY_DATA = [
  { day: 'Mon', orders: 24, revenue: 18400 },
  { day: 'Tue', orders: 31, revenue: 23100 },
  { day: 'Wed', orders: 28, revenue: 21000 },
  { day: 'Thu', orders: 42, revenue: 31500 },
  { day: 'Fri', orders: 38, revenue: 28500 },
  { day: 'Sat', orders: 55, revenue: 41250 },
  { day: 'Sun', orders: 19, revenue: 14250 },
];

const SERVICE_DATA = [
  { name: 'Wash & Iron', value: 35 },
  { name: 'Dry Cleaning', value: 25 },
  { name: 'Wash & Fold', value: 20 },
  { name: 'Ironing', value: 12 },
  { name: 'Others', value: 8 },
];

export default function DashboardPage() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    ordersApi.getDashboard()
      .then(setStats)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-maroon-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Total Orders"
          value={stats?.totalOrders || 0}
          icon={ShoppingBag}
          color="maroon"
          trend={{ value: 12, label: 'vs last month' }}
        />
        <StatsCard
          title="Today's Orders"
          value={stats?.newOrdersToday || 0}
          icon={Clock}
          color="orange"
        />
        <StatsCard
          title="Total Sales"
          value={formatCurrency(stats?.totalSales || 0)}
          icon={TrendingUp}
          color="green"
          trend={{ value: 8, label: 'vs last month' }}
        />
        <StatsCard
          title="Outstanding"
          value={formatCurrency(stats?.totalOutstanding || 0)}
          icon={DollarSign}
          color="red"
        />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Completed"
          value={stats?.completedOrders || 0}
          icon={CheckCircle}
          color="green"
        />
        <StatsCard
          title="In Progress"
          value={stats?.pendingOrders || 0}
          icon={Truck}
          color="purple"
        />
        <StatsCard
          title="Delayed"
          value={stats?.delayedOrders || 0}
          icon={AlertCircle}
          color="orange"
        />
        <StatsCard
          title="Cancelled"
          value={stats?.cancelledOrders || 0}
          icon={XCircle}
          color="red"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <h3 className="font-semibold text-gray-900 mb-4">Weekly Orders & Revenue</h3>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={WEEKLY_DATA}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="day" tick={{ fontSize: 12 }} />
              <YAxis yAxisId="left" tick={{ fontSize: 12 }} />
              <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar yAxisId="left" dataKey="orders" fill="#800000" radius={[4, 4, 0, 0]} name="Orders" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <h3 className="font-semibold text-gray-900 mb-4">Services Breakdown</h3>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie
                data={SERVICE_DATA}
                cx="50%"
                cy="50%"
                outerRadius={80}
                dataKey="value"
                label={({ name, percent }: any) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                labelLine={false}
              >
                {SERVICE_DATA.map((_, index) => (
                  <Cell key={index} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Revenue trend */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
        <h3 className="font-semibold text-gray-900 mb-4">Revenue Trend (This Week)</h3>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={WEEKLY_DATA}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="day" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
            <Tooltip formatter={(v: any) => [`₹${v.toLocaleString('en-IN')}`, 'Revenue']} />
            <Line
              type="monotone"
              dataKey="revenue"
              stroke="#10b981"
              strokeWidth={2}
              dot={{ r: 4, fill: '#10b981' }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Quick actions */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
        <h3 className="font-semibold text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'New Order', href: '/orders/new', icon: ShoppingBag, color: 'bg-maroon-600' },
            { label: 'Add Customer', href: '/customers/new', icon: Users, color: 'bg-green-600' },
            { label: 'View Reports', href: '/reports', icon: BarChart3, color: 'bg-purple-600' },
            { label: 'CA Dashboard', href: '/ca', icon: TrendingUp, color: 'bg-indigo-600' },
          ].map((action) => {
            const Icon = action.icon;
            return (
              <a
                key={action.href}
                href={action.href}
                className={`${action.color} text-white rounded-lg p-4 flex flex-col items-center gap-2 hover:opacity-90 transition-opacity`}
              >
                <Icon size={20} />
                <span className="text-sm font-medium">{action.label}</span>
              </a>
            );
          })}
        </div>
      </div>
    </div>
  );
}
