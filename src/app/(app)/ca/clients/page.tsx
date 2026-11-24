'use client';

import { useEffect, useState } from 'react';
import { Plus, Search, User, FileText } from 'lucide-react';
import Link from 'next/link';
import { caApi } from '@/lib/api';
import { formatDate } from '@/lib/utils';

const ITR_STATUS_COLORS: Record<string, string> = {
  DOCUMENT_COLLECTION: 'bg-gray-100 text-gray-600',
  UNDER_REVIEW: 'bg-maroon-100 text-maroon-700',
  COMPUTATION: 'bg-indigo-100 text-indigo-700',
  CLIENT_APPROVAL: 'bg-yellow-100 text-yellow-700',
  FILED: 'bg-green-100 text-green-700',
  ACKNOWLEDGED: 'bg-teal-100 text-teal-700',
  E_VERIFIED: 'bg-purple-100 text-purple-700',
};

const TAXPAYER_TYPE_COLORS: Record<string, string> = {
  INDIVIDUAL: 'bg-maroon-50 text-maroon-600',
  HUF: 'bg-teal-50 text-teal-600',
  PARTNERSHIP: 'bg-orange-50 text-orange-600',
  LLP: 'bg-purple-50 text-purple-600',
  COMPANY: 'bg-indigo-50 text-indigo-600',
  TRUST: 'bg-yellow-50 text-yellow-600',
};

export default function CaClientsPage() {
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    setLoading(true);
    caApi.listClients({ search: search || undefined })
      .then((data: any) => setClients(Array.isArray(data) ? data : data?.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [search]);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">CA Clients</h2>
          <p className="text-sm text-gray-500">ITR filing management and client pipeline</p>
        </div>
        <Link href="/ca/clients/new"
          className="flex items-center gap-2 bg-maroon-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-maroon-700">
          <Plus size={16} /> New Client
        </Link>
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl border border-gray-200 p-3 flex items-center gap-2">
        <Search size={15} className="text-gray-400" />
        <input value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, PAN, phone..."
          className="flex-1 text-sm outline-none placeholder-gray-400" />
      </div>

      {/* Client table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="animate-spin w-6 h-6 border-4 border-maroon-600 border-t-transparent rounded-full" />
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Client</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Type</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">PAN</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">City</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Status</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Action</th>
              </tr>
            </thead>
            <tbody>
              {clients.map((c) => (
                <tr key={c.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-900">{c.legalName}</div>
                    <div className="text-xs text-gray-500">{c.clientCode} · {c.phone || c.email || '—'}</div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${TAXPAYER_TYPE_COLORS[c.taxpayerType] || 'bg-gray-100 text-gray-600'}`}>
                      {c.taxpayerType}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-gray-700">{c.panMasked || c.pan}</td>
                  <td className="px-4 py-3 text-gray-500">{c.city || '—'}</td>
                  <td className="px-4 py-3">
                    {c.isActive ? (
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Active</span>
                    ) : (
                      <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full">Inactive</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link href={`/ca/clients/${c.id}`}
                      className="text-maroon-600 hover:text-maroon-800 text-xs font-medium">
                      View →
                    </Link>
                  </td>
                </tr>
              ))}
              {clients.length === 0 && (
                <tr><td colSpan={6} className="text-center py-16 text-gray-400">
                  <User size={28} className="mx-auto mb-2 opacity-30" />
                  <p>No CA clients yet</p>
                  <Link href="/ca/clients/new" className="text-maroon-600 hover:underline text-sm mt-1 inline-block">Add your first client</Link>
                </td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
