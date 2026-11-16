'use client';

import { useEffect, useState } from 'react';
import { platformApi } from '@/lib/api';

interface RegRow { month: string; count: string }
interface RevRow { orgId: string; businessName: string; revenue: string }

export default function AnalyticsPage() {
  const [regs, setRegs] = useState<RegRow[]>([]);
  const [revs, setRevs] = useState<RevRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      platformApi.getMonthlyRegistrations(),
      platformApi.getRevenueByOrg(),
    ])
      .then(([r, rv]) => { setRegs(r || []); setRevs(rv || []); })
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

  const maxRev = Math.max(...revs.map((r) => parseFloat(r.revenue) || 0), 1);
  const maxReg = Math.max(...regs.map((r) => parseInt(r.count) || 0), 1);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Registrations */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="font-semibold text-gray-900 mb-5">Monthly Registrations (Last 12 months)</h2>
          {regs.length === 0 ? (
            <div className="text-center py-12 text-gray-400 text-sm">No data yet</div>
          ) : (
            <div className="space-y-3">
              {regs.map((r) => {
                const d = new Date(r.month);
                const label = d.toLocaleString('default', { month: 'short', year: 'numeric' });
                const count = parseInt(r.count) || 0;
                return (
                  <div key={r.month} className="flex items-center gap-3">
                    <span className="text-xs text-gray-500 w-20 flex-shrink-0">{label}</span>
                    <div className="flex-1 bg-gray-100 rounded-full h-3">
                      <div
                        className="bg-purple-500 h-3 rounded-full"
                        style={{ width: `${(count / maxReg) * 100}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium text-gray-700 w-8 text-right">{count}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Revenue by org */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="font-semibold text-gray-900 mb-5">Revenue by Laundry (Top 10)</h2>
          {revs.length === 0 ? (
            <div className="text-center py-12 text-gray-400 text-sm">No revenue data yet</div>
          ) : (
            <div className="space-y-3">
              {revs.map((r) => {
                const rev = parseFloat(r.revenue) || 0;
                return (
                  <div key={r.orgId} className="flex items-center gap-3">
                    <span className="text-xs text-gray-600 w-32 flex-shrink-0 truncate">
                      {r.businessName || 'Unknown'}
                    </span>
                    <div className="flex-1 bg-gray-100 rounded-full h-3">
                      <div
                        className="bg-indigo-500 h-3 rounded-full"
                        style={{ width: `${(rev / maxRev) * 100}%` }}
                      />
                    </div>
                    <span className="text-xs font-medium text-gray-700 w-20 text-right flex-shrink-0">
                      ₹{rev.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
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
