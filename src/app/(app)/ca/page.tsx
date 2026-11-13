'use client';

import { useEffect, useState } from 'react';
import { Users, FileText, CheckCircle, Send, AlertCircle, Clock } from 'lucide-react';
import StatsCard from '@/components/ui/StatsCard';
import { caApi } from '@/lib/api';
import { ITR_STATUS_LABELS } from '@/lib/constants';

export default function CADashboardPage() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    caApi.getDashboard()
      .then(setStats)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  const DEADLINES = [
    { label: 'ITR Filing (Individuals)', date: '31 July 2025', urgent: false },
    { label: 'ITR Filing (Audit cases)', date: '31 Oct 2025', urgent: false },
    { label: 'TDS Return Q1', date: '31 Jul 2025', urgent: true },
    { label: 'GST Annual Return', date: '31 Dec 2025', urgent: false },
  ];

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl p-6 text-white">
        <h2 className="text-xl font-bold">CA Workspace</h2>
        <p className="text-indigo-100 text-sm mt-1">
          Chartered Accountant & ITR Management Platform — Assessment Year 2024-25
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard title="Total Clients" value={stats?.totalClients || 0} icon={Users} color="maroon" />
        <StatsCard title="Active Clients" value={stats?.activeClients || 0} icon={CheckCircle} color="green" />
        <StatsCard title="Pending Docs" value={stats?.pendingDocumentation || 0} icon={FileText} color="orange" />
        <StatsCard title="Filed Returns" value={stats?.filedReturns || 0} icon={Send} color="purple" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pipeline */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <h3 className="font-semibold text-gray-900 mb-4">ITR Pipeline</h3>
          <div className="space-y-3">
            {[
              { label: 'Document Collection', count: stats?.pendingDocumentation || 0, color: 'bg-maroon-500' },
              { label: 'Reconciliation', count: stats?.reconciliationPending || 0, color: 'bg-cyan-500' },
              { label: 'Tax Computation', count: stats?.itrPreparationPending || 0, color: 'bg-violet-500' },
              { label: 'CA Review', count: stats?.readyForCaReview || 0, color: 'bg-amber-500' },
              { label: 'Client Approval', count: stats?.readyForClientApproval || 0, color: 'bg-orange-500' },
              { label: 'Filed', count: stats?.filedReturns || 0, color: 'bg-green-500' },
              { label: 'Pending E-Verification', count: stats?.pendingEVerification || 0, color: 'bg-teal-500' },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-3">
                <div className={`w-2 h-2 rounded-full ${item.color}`} />
                <span className="flex-1 text-sm text-gray-700">{item.label}</span>
                <span className="text-sm font-semibold text-gray-900 bg-gray-100 px-2 py-0.5 rounded-full">
                  {item.count}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Deadlines */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <h3 className="font-semibold text-gray-900 mb-4">Upcoming Deadlines</h3>
          <div className="space-y-3">
            {DEADLINES.map((d) => (
              <div key={d.label} className="flex items-start gap-3 p-3 rounded-lg bg-gray-50">
                <div className={`mt-0.5 w-2 h-2 rounded-full flex-shrink-0 ${d.urgent ? 'bg-red-500' : 'bg-green-500'}`} />
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{d.label}</p>
                  <p className={`text-xs mt-0.5 ${d.urgent ? 'text-red-600 font-medium' : 'text-gray-500'}`}>
                    Due: {d.date}
                    {d.urgent && ' — Urgent'}
                  </p>
                </div>
                <AlertCircle size={14} className={d.urgent ? 'text-red-500' : 'text-gray-300'} />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Add Client', href: '/ca/clients/new', icon: Users, bg: 'bg-indigo-600' },
          { label: 'Manage Documents', href: '/ca/documents', icon: FileText, bg: 'bg-maroon-600' },
          { label: 'Check Readiness', href: '/ca/readiness', icon: CheckCircle, bg: 'bg-green-600' },
          { label: 'Filing Status', href: '/ca/filing', icon: Send, bg: 'bg-purple-600' },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <a
              key={item.href}
              href={item.href}
              className={`${item.bg} text-white rounded-xl p-4 flex flex-col items-center gap-2 hover:opacity-90 transition-opacity`}
            >
              <Icon size={22} />
              <span className="text-sm font-medium">{item.label}</span>
            </a>
          );
        })}
      </div>
    </div>
  );
}
