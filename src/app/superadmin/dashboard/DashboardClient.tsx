'use client';

import { useEffect, useState } from 'react';
import { platformApi } from '@/lib/api';
import {
  Building2, CheckCircle, Clock, AlertTriangle, ShoppingBag, TrendingUp, Ban, PowerOff,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';

interface Stats {
  totalLaundries: number;
  activeLaundries: number;
  pendingLaundries: number;
  suspendedLaundries: number;
  blockedLaundries: number;
  inactiveLaundries: number;
  totalOrders: number;
  totalPlatformRevenue: number;
}

interface RevenueRow { orgId: string; businessName: string; revenue: string }
interface RegRow { month: string; count: string }
interface DistRow { status: string; count: string }

const STATUS_COLORS: Record<string, string> = {
  ACTIVE:    'bg-emerald-500',
  PENDING:   'bg-amber-400',
  BLOCKED:   'bg-red-500',
  SUSPENDED: 'bg-orange-400',
  REJECTED:  'bg-gray-400',
  INACTIVE:  'bg-gray-300',
};

function StatCard({
  label, value, icon: Icon, color, sub, href,
}: {
  label: string; value: number | string; icon: any;
  color: string; sub?: string; href?: string;
}) {
  const content = (
    <div className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-sm transition-shadow">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm text-gray-500">{label}</span>
        <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center', color)}>
          <Icon size={18} className="text-white" />
        </div>
      </div>
      <div className="text-2xl font-bold text-gray-900">{value}</div>
      {sub && <div className="text-xs text-gray-400 mt-0.5">{sub}</div>}
    </div>
  );
  return href ? <Link href={href}>{content}</Link> : content;
}

export default function SuperAdminDashboardClient() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [revenue, setRevenue] = useState<RevenueRow[]>([]);
  const [regs, setRegs] = useState<RegRow[]>([]);
  const [dist, setDist] = useState<DistRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      platformApi.getStats(),
      platformApi.getRevenueByOrg(),
      platformApi.getMonthlyRegistrations(),
      platformApi.getStatusDistribution(),
    ])
      .then(([s, r, reg, d]) => {
        setStats(s);
        setRevenue(r || []);
        setRegs(reg || []);
        setDist(d || []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  const fmt = (n: number) =>
    n >= 100000 ? `₹${(n / 100000).toFixed(1)}L` : n >= 1000 ? `₹${(n / 1000).toFixed(1)}K` : `₹${n.toFixed(0)}`;

  const maxRev = Math.max(...revenue.map((r) => parseFloat(r.revenue) || 0), 1);
  const totalDistCount = dist.reduce((s, d) => s + parseInt(d.count), 0) || 1;

  return (
    <div className="space-y-6">
      {/* Stats grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Total Laundries" value={stats?.totalLaundries ?? 0} icon={Building2} color="bg-purple-600" href="/superadmin/laundries" />
        <StatCard label="Active" value={stats?.activeLaundries ?? 0} icon={CheckCircle} color="bg-emerald-500" href="/superadmin/laundries?status=ACTIVE" />
        <StatCard label="Pending Approval" value={stats?.pendingLaundries ?? 0} icon={Clock} color="bg-amber-500" href="/superadmin/laundries?status=PENDING" />
        <StatCard label="Blocked" value={stats?.blockedLaundries ?? 0} icon={Ban} color="bg-red-500" href="/superadmin/laundries?status=BLOCKED" />
        <StatCard label="Suspended" value={stats?.suspendedLaundries ?? 0} icon={AlertTriangle} color="bg-orange-400" href="/superadmin/laundries?status=SUSPENDED" />
        <StatCard label="Inactive" value={stats?.inactiveLaundries ?? 0} icon={PowerOff} color="bg-gray-500" href="/superadmin/laundries?status=INACTIVE" />
        <StatCard label="Total Orders" value={stats?.totalOrders ?? 0} icon={ShoppingBag} color="bg-blue-500" />
        <StatCard label="Platform Revenue" value={fmt(stats?.totalPlatformRevenue ?? 0)} icon={TrendingUp} color="bg-indigo-600" sub="All laundries combined" />
      </div>

      {/* Pending alert */}
      {(stats?.pendingLaundries ?? 0) > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center gap-3">
          <Clock size={18} className="text-amber-600 flex-shrink-0" />
          <div className="flex-1 text-sm font-medium text-amber-800">
            {stats!.pendingLaundries} laundries awaiting approval
          </div>
          <Link
            href="/superadmin/laundries?status=PENDING"
            className="text-sm text-amber-700 hover:text-amber-900 font-medium underline"
          >
            Review →
          </Link>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Status distribution */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">Status Distribution</h2>
          {dist.length === 0 ? (
            <div className="text-center text-gray-400 py-8 text-sm">No data</div>
          ) : (
            <>
              {/* Stacked bar */}
              <div className="flex h-4 rounded-full overflow-hidden mb-4 gap-0.5">
                {dist.map((d) => {
                  const pct = (parseInt(d.count) / totalDistCount) * 100;
                  return (
                    <div
                      key={d.status}
                      className={cn('h-full', STATUS_COLORS[d.status] || 'bg-gray-300')}
                      style={{ width: `${pct}%` }}
                      title={`${d.status}: ${d.count}`}
                    />
                  );
                })}
              </div>
              <div className="space-y-2">
                {dist.map((d) => (
                  <div key={d.status} className="flex items-center gap-2">
                    <div className={cn('w-2.5 h-2.5 rounded-full flex-shrink-0', STATUS_COLORS[d.status] || 'bg-gray-300')} />
                    <span className="text-xs text-gray-600 flex-1 capitalize">{d.status.toLowerCase()}</span>
                    <span className="text-xs font-semibold text-gray-800">{d.count}</span>
                    <span className="text-xs text-gray-400">
                      {((parseInt(d.count) / totalDistCount) * 100).toFixed(0)}%
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Monthly registrations */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">Monthly Registrations</h2>
          {regs.length === 0 ? (
            <div className="text-center text-gray-400 py-8 text-sm">No data yet</div>
          ) : (
            <div className="space-y-2">
              {regs.map((r) => {
                const d = new Date(r.month);
                const label = d.toLocaleString('default', { month: 'short', year: '2-digit' });
                const count = parseInt(r.count) || 0;
                const maxCount = Math.max(...regs.map((x) => parseInt(x.count) || 0), 1);
                return (
                  <div key={r.month} className="flex items-center gap-2">
                    <span className="text-xs text-gray-500 w-12 flex-shrink-0">{label}</span>
                    <div className="flex-1 bg-gray-100 rounded-full h-2">
                      <div
                        className="bg-purple-500 h-2 rounded-full"
                        style={{ width: `${(count / maxCount) * 100}%` }}
                      />
                    </div>
                    <span className="text-xs font-medium text-gray-700 w-5 text-right">{count}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Revenue by org */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">Top Laundries by Revenue</h2>
          {revenue.length === 0 ? (
            <div className="text-center text-gray-400 py-8 text-sm">No revenue data yet</div>
          ) : (
            <div className="space-y-3">
              {revenue.slice(0, 7).map((r) => {
                const rev = parseFloat(r.revenue) || 0;
                return (
                  <div key={r.orgId} className="flex items-center gap-2">
                    <span className="text-xs text-gray-600 flex-1 truncate">{r.businessName || 'Unknown'}</span>
                    <div className="w-20 bg-gray-100 rounded-full h-2 flex-shrink-0">
                      <div
                        className="bg-indigo-500 h-2 rounded-full"
                        style={{ width: `${(rev / maxRev) * 100}%` }}
                      />
                    </div>
                    <span className="text-xs font-medium text-gray-700 w-14 text-right flex-shrink-0">
                      {fmt(rev)}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
