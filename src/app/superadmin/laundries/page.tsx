'use client';

import { Suspense, useEffect, useState, useCallback, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { platformApi } from '@/lib/api';
import {
  Search, Plus, ExternalLink, CheckCircle, XCircle, PauseCircle,
  Trash2, KeyRound, Ban, ChevronDown, Calendar, Filter,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import ConfirmModal from '@/components/ui/ConfirmModal';

const ALL_STATUSES = ['PENDING', 'ACTIVE', 'BLOCKED', 'SUSPENDED', 'REJECTED', 'INACTIVE'] as const;
type OrgStatus = typeof ALL_STATUSES[number];

const STATUS_BADGE: Record<OrgStatus, { label: string; cls: string }> = {
  PENDING:   { label: 'Pending',   cls: 'bg-amber-100 text-amber-700 border-amber-200' },
  ACTIVE:    { label: 'Active',    cls: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  BLOCKED:   { label: 'Blocked',   cls: 'bg-red-100 text-red-700 border-red-200' },
  SUSPENDED: { label: 'Suspended', cls: 'bg-orange-100 text-orange-700 border-orange-200' },
  REJECTED:  { label: 'Rejected',  cls: 'bg-gray-100 text-gray-500 border-gray-200' },
  INACTIVE:  { label: 'Inactive',  cls: 'bg-gray-100 text-gray-400 border-gray-200' },
};

const SORT_OPTIONS = [
  { value: 'newest',    label: 'Newest first' },
  { value: 'oldest',   label: 'Oldest first' },
  { value: 'name_asc', label: 'Name A→Z' },
  { value: 'name_desc',label: 'Name Z→A' },
  { value: 'status',   label: 'By status' },
];

interface Org {
  id: string;
  businessName: string;
  ownerName?: string;
  email: string;
  phone: string;
  city?: string;
  state?: string;
  status: OrgStatus;
  subscriptionPlan: string;
  createdAt: string;
}

type ModalState =
  | { type: 'none' }
  | { type: 'status'; org: Org; newStatus: OrgStatus }
  | { type: 'delete'; org: Org }
  | { type: 'reset'; org: Org };

function LaundriesContent() {
  const sp = useSearchParams();
  const router = useRouter();

  const [orgs, setOrgs] = useState<Org[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<string>(sp.get('status') || '');
  const [sort, setSort] = useState('newest');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [modal, setModal] = useState<ModalState>({ type: 'none' });
  const [modalLoading, setModalLoading] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [blockReason, setBlockReason] = useState('');
  const [actionOrgId, setActionOrgId] = useState<string | null>(null);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const load = useCallback(async (p?: number) => {
    const pg = p ?? page;
    setLoading(true);
    try {
      const res = await platformApi.listOrganizations({
        search: search || undefined,
        status: status || undefined,
        sort,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
        page: pg,
        limit: 20,
      });
      setOrgs(res.data || []);
      setTotal(res.total || 0);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [search, status, sort, dateFrom, dateTo, page]);

  useEffect(() => { load(); }, [load]);

  const handleSearchChange = (v: string) => {
    setSearch(v);
    setPage(1);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => load(1), 400);
  };

  const confirmStatusChange = async () => {
    if (modal.type !== 'status') return;
    setModalLoading(true);
    try {
      await platformApi.updateStatus(modal.org.id, {
        status: modal.newStatus,
        reason: modal.newStatus === 'BLOCKED' ? blockReason : undefined,
      });
      setModal({ type: 'none' });
      setBlockReason('');
      load();
    } finally {
      setModalLoading(false);
    }
  };

  const confirmDelete = async () => {
    if (modal.type !== 'delete') return;
    setModalLoading(true);
    try {
      await platformApi.deleteOrganization(modal.org.id);
      setModal({ type: 'none' });
      load();
    } finally {
      setModalLoading(false);
    }
  };

  const confirmResetPassword = async () => {
    if (modal.type !== 'reset' || !newPassword) return;
    setModalLoading(true);
    try {
      await platformApi.resetPassword(modal.org.id, newPassword);
      setModal({ type: 'none' });
      setNewPassword('');
      alert('Password reset successfully.');
    } finally {
      setModalLoading(false);
    }
  };

  const enterContext = async (org: Org) => {
    setActionOrgId(org.id);
    try {
      const res = await platformApi.switchContext(org.id);
      localStorage.setItem('contextToken', res.accessToken);
      localStorage.setItem('contextOrgName', org.businessName);
      router.push('/dashboard');
    } finally {
      setActionOrgId(null);
    }
  };

  const totalPages = Math.ceil(total / 20);

  const statusModalConfig = modal.type === 'status' ? (() => {
    const s = modal.newStatus;
    if (s === 'ACTIVE')    return { title: 'Activate Laundry', variant: 'default' as const, label: 'Activate' };
    if (s === 'BLOCKED')   return { title: 'Block Laundry', variant: 'danger' as const, label: 'Block' };
    if (s === 'SUSPENDED') return { title: 'Suspend Laundry', variant: 'warning' as const, label: 'Suspend' };
    if (s === 'REJECTED')  return { title: 'Reject Application', variant: 'danger' as const, label: 'Reject' };
    if (s === 'INACTIVE')  return { title: 'Deactivate Laundry', variant: 'danger' as const, label: 'Deactivate' };
    return { title: 'Change Status', variant: 'default' as const, label: 'Confirm' };
  })() : null;

  return (
    <div className="space-y-4">
      {/* Top toolbar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name, owner, email, phone, ID…"
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-purple-500 bg-white"
          />
        </div>
        <select
          value={status}
          onChange={(e) => { setStatus(e.target.value); setPage(1); }}
          className="px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white outline-none focus:ring-2 focus:ring-purple-500"
        >
          <option value="">All Statuses</option>
          {ALL_STATUSES.map((s) => (
            <option key={s} value={s}>{STATUS_BADGE[s].label}</option>
          ))}
        </select>
        <button
          onClick={() => setShowFilters((v) => !v)}
          className={cn(
            'flex items-center gap-2 px-3 py-2 text-sm border rounded-lg transition-colors',
            showFilters ? 'border-purple-500 bg-purple-50 text-purple-700' : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50',
          )}
        >
          <Filter size={14} />
          Filters
        </button>
        <Link
          href="/superadmin/laundries/new"
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white text-sm rounded-lg hover:bg-purple-700 transition-colors whitespace-nowrap"
        >
          <Plus size={15} />
          Register Laundry
        </Link>
      </div>

      {/* Expanded filters */}
      {showFilters && (
        <div className="bg-white border border-gray-200 rounded-xl p-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Sort by</label>
            <select
              value={sort}
              onChange={(e) => { setSort(e.target.value); setPage(1); }}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white outline-none focus:ring-2 focus:ring-purple-500"
            >
              {SORT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">From date</label>
            <input
              type="date" value={dateFrom}
              onChange={(e) => { setDateFrom(e.target.value); setPage(1); }}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">To date</label>
            <input
              type="date" value={dateTo}
              onChange={(e) => { setDateTo(e.target.value); setPage(1); }}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
        </div>
      )}

      <div className="text-sm text-gray-500">{total} laundries</div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="animate-spin w-7 h-7 border-4 border-purple-600 border-t-transparent rounded-full" />
          </div>
        ) : orgs.length === 0 ? (
          <div className="text-center py-16 text-gray-400 text-sm">No laundries found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200 text-xs">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-gray-500 uppercase tracking-wide">Laundry</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500 uppercase tracking-wide hidden lg:table-cell">Owner</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500 uppercase tracking-wide hidden sm:table-cell">Contact</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500 uppercase tracking-wide hidden md:table-cell">Location</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500 uppercase tracking-wide">Status</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500 uppercase tracking-wide hidden md:table-cell">Plan</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500 uppercase tracking-wide hidden lg:table-cell">Joined</th>
                  <th className="px-4 py-3 text-right font-medium text-gray-500 uppercase tracking-wide">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {orgs.map((org) => {
                  const badge = STATUS_BADGE[org.status] || STATUS_BADGE.INACTIVE;
                  const busy = actionOrgId === org.id;
                  return (
                    <tr key={org.id} className="hover:bg-gray-50 transition-colors group">
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-900">{org.businessName}</div>
                        <div className="text-xs text-gray-400 font-mono mt-0.5">{org.id.slice(0, 8)}…</div>
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell text-gray-700">
                        {org.ownerName || '—'}
                      </td>
                      <td className="px-4 py-3 hidden sm:table-cell">
                        <div className="text-gray-700">{org.email}</div>
                        <div className="text-xs text-gray-400">{org.phone}</div>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell text-gray-600">
                        {[org.city, org.state].filter(Boolean).join(', ') || '—'}
                      </td>
                      <td className="px-4 py-3">
                        <span className={cn('inline-flex px-2 py-0.5 rounded-full text-xs font-medium border', badge.cls)}>
                          {badge.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell text-gray-600 capitalize">
                        {org.subscriptionPlan?.toLowerCase() || '—'}
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell text-gray-500 text-xs">
                        {new Date(org.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          {/* View */}
                          <Link
                            href={`/superadmin/laundries/${org.id}`}
                            className="p-1.5 text-gray-400 hover:text-purple-700 hover:bg-purple-50 rounded-lg"
                            title="View details"
                          >
                            <ExternalLink size={14} />
                          </Link>

                          {/* Edit */}
                          <Link
                            href={`/superadmin/laundries/${org.id}/edit`}
                            className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                            title="Edit"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </Link>

                          {/* Status-specific actions */}
                          {org.status === 'PENDING' && (
                            <>
                              <button
                                onClick={() => setModal({ type: 'status', org, newStatus: 'ACTIVE' })}
                                className="p-1.5 text-emerald-500 hover:bg-emerald-50 rounded-lg"
                                title="Approve"
                              >
                                <CheckCircle size={14} />
                              </button>
                              <button
                                onClick={() => setModal({ type: 'status', org, newStatus: 'REJECTED' })}
                                className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg"
                                title="Reject"
                              >
                                <XCircle size={14} />
                              </button>
                            </>
                          )}
                          {org.status === 'ACTIVE' && (
                            <>
                              <button
                                onClick={() => setModal({ type: 'status', org, newStatus: 'SUSPENDED' })}
                                className="p-1.5 text-amber-500 hover:bg-amber-50 rounded-lg"
                                title="Suspend"
                              >
                                <PauseCircle size={14} />
                              </button>
                              <button
                                onClick={() => { setBlockReason(''); setModal({ type: 'status', org, newStatus: 'BLOCKED' }); }}
                                className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg"
                                title="Block"
                              >
                                <Ban size={14} />
                              </button>
                            </>
                          )}
                          {(org.status === 'SUSPENDED' || org.status === 'BLOCKED') && (
                            <button
                              onClick={() => setModal({ type: 'status', org, newStatus: 'ACTIVE' })}
                              className="p-1.5 text-emerald-500 hover:bg-emerald-50 rounded-lg"
                              title="Reactivate"
                            >
                              <CheckCircle size={14} />
                            </button>
                          )}

                          {/* Reset password */}
                          <button
                            onClick={() => { setNewPassword(''); setModal({ type: 'reset', org }); }}
                            className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg"
                            title="Reset admin password"
                          >
                            <KeyRound size={14} />
                          </button>

                          {/* Enter dashboard */}
                          {org.status === 'ACTIVE' && (
                            <button
                              onClick={() => enterContext(org)}
                              disabled={busy}
                              className="p-1.5 text-purple-500 hover:bg-purple-50 rounded-lg disabled:opacity-40"
                              title="Enter laundry dashboard"
                            >
                              {busy ? (
                                <div className="w-3.5 h-3.5 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
                              ) : (
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                                </svg>
                              )}
                            </button>
                          )}

                          {/* Delete */}
                          <button
                            onClick={() => setModal({ type: 'delete', org })}
                            className="p-1.5 text-gray-300 hover:text-red-600 hover:bg-red-50 rounded-lg"
                            title="Delete"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-500">Page {page} of {totalPages} · {total} records</span>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1.5 border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50"
            >
              Prev
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-3 py-1.5 border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Status change modal */}
      {modal.type === 'status' && statusModalConfig && (
        <ConfirmModal
          open
          title={statusModalConfig.title}
          message={`Are you sure you want to change "${modal.org.businessName}" status to ${modal.newStatus}?`}
          confirmLabel={statusModalConfig.label}
          variant={statusModalConfig.variant}
          loading={modalLoading}
          onConfirm={confirmStatusChange}
          onCancel={() => setModal({ type: 'none' })}
        >
          {modal.newStatus === 'BLOCKED' && (
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Block reason (optional)</label>
              <textarea
                value={blockReason}
                onChange={(e) => setBlockReason(e.target.value)}
                rows={2}
                placeholder="Enter reason for blocking…"
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-red-400 resize-none"
              />
            </div>
          )}
        </ConfirmModal>
      )}

      {/* Delete modal */}
      {modal.type === 'delete' && (
        <ConfirmModal
          open
          title="Delete Laundry"
          message={`This will deactivate "${modal.org.businessName}". If the laundry has no orders it will be permanently removed. This action cannot be undone.`}
          confirmLabel="Delete"
          variant="danger"
          loading={modalLoading}
          onConfirm={confirmDelete}
          onCancel={() => setModal({ type: 'none' })}
        />
      )}

      {/* Reset password modal */}
      {modal.type === 'reset' && (
        <ConfirmModal
          open
          title="Reset Admin Password"
          message={`Set a new password for the admin account of "${modal.org.businessName}".`}
          confirmLabel="Reset Password"
          variant="warning"
          loading={modalLoading}
          onConfirm={confirmResetPassword}
          onCancel={() => setModal({ type: 'none' })}
        >
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">New password</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Min 6 characters"
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-purple-400"
            />
          </div>
        </ConfirmModal>
      )}
    </div>
  );
}

export default function LaundriesPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-48 items-center justify-center">
          <div className="animate-spin w-7 h-7 border-4 border-purple-600 border-t-transparent rounded-full" />
        </div>
      }
    >
      <LaundriesContent />
    </Suspense>
  );
}
