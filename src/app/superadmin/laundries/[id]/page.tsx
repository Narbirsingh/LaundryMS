'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { platformApi } from '@/lib/api';
import {
  ArrowLeft, Building2, Mail, Phone, MapPin, CheckCircle, XCircle,
  PauseCircle, ExternalLink, Users, ShoppingBag, TrendingUp, GitBranch,
  Ban, Pencil, Trash2, KeyRound, PowerOff,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import ConfirmModal from '@/components/ui/ConfirmModal';

type OrgStatus = 'PENDING' | 'ACTIVE' | 'BLOCKED' | 'SUSPENDED' | 'REJECTED' | 'INACTIVE';

const STATUS_BADGE: Record<string, { label: string; cls: string }> = {
  PENDING:   { label: 'Pending',   cls: 'bg-amber-100 text-amber-700 border-amber-200' },
  ACTIVE:    { label: 'Active',    cls: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  BLOCKED:   { label: 'Blocked',   cls: 'bg-red-100 text-red-700 border-red-200' },
  SUSPENDED: { label: 'Suspended', cls: 'bg-orange-100 text-orange-700 border-orange-200' },
  REJECTED:  { label: 'Rejected',  cls: 'bg-gray-100 text-gray-500 border-gray-200' },
  INACTIVE:  { label: 'Inactive',  cls: 'bg-gray-100 text-gray-400 border-gray-200' },
};

type ModalState =
  | { type: 'none' }
  | { type: 'status'; newStatus: OrgStatus }
  | { type: 'delete' }
  | { type: 'reset' };

export default function LaundryDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [org, setOrg] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [configEdit, setConfigEdit] = useState(false);
  const [commission, setCommission] = useState('');
  const [plan, setPlan] = useState('');
  const [modal, setModal] = useState<ModalState>({ type: 'none' });
  const [blockReason, setBlockReason] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [resetDone, setResetDone] = useState<string | null>(null);

  const load = async () => {
    try {
      const data = await platformApi.getOrganization(id);
      setOrg(data);
      setCommission(String(data.commissionPercentage ?? 0));
      setPlan(data.subscriptionPlan ?? 'FREE');
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [id]);

  const confirmStatus = async () => {
    if (modal.type !== 'status') return;
    setActionLoading(true);
    try {
      await platformApi.updateStatus(id, {
        status: modal.newStatus,
        reason: modal.newStatus === 'BLOCKED' ? blockReason : undefined,
      });
      setModal({ type: 'none' });
      setBlockReason('');
      await load();
    } finally {
      setActionLoading(false);
    }
  };

  const confirmDelete = async () => {
    setActionLoading(true);
    try {
      await platformApi.deleteOrganization(id);
      router.push('/superadmin/laundries');
    } finally {
      setActionLoading(false);
    }
  };

  const confirmResetPassword = async () => {
    if (!newPassword) return;
    setActionLoading(true);
    try {
      const res = await platformApi.resetPassword(id, newPassword);
      setModal({ type: 'none' });
      setResetDone(res.adminEmail);
      setNewPassword('');
    } finally {
      setActionLoading(false);
    }
  };

  const handleConfigSave = async () => {
    setActionLoading(true);
    try {
      await platformApi.updateConfig(id, {
        commissionPercentage: parseFloat(commission) || 0,
        subscriptionPlan: plan,
      });
      setConfigEdit(false);
      await load();
    } finally {
      setActionLoading(false);
    }
  };

  const enterContext = async () => {
    setActionLoading(true);
    try {
      const res = await platformApi.switchContext(id);
      localStorage.setItem('contextToken', res.accessToken);
      localStorage.setItem('contextOrgName', org.businessName);
      router.push('/dashboard');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full" />
      </div>
    );
  }
  if (!org) return <div className="text-center py-16 text-gray-400">Laundry not found</div>;

  const badge = STATUS_BADGE[org.status] || STATUS_BADGE.INACTIVE;
  const statusModalConfig = modal.type === 'status' ? (() => {
    const s = modal.newStatus;
    if (s === 'ACTIVE')    return { title: 'Activate Laundry',    variant: 'default' as const, label: 'Activate' };
    if (s === 'BLOCKED')   return { title: 'Block Laundry',       variant: 'danger' as const,  label: 'Block' };
    if (s === 'SUSPENDED') return { title: 'Suspend Laundry',     variant: 'warning' as const, label: 'Suspend' };
    if (s === 'REJECTED')  return { title: 'Reject Application',  variant: 'danger' as const,  label: 'Reject' };
    if (s === 'INACTIVE')  return { title: 'Deactivate Laundry',  variant: 'danger' as const,  label: 'Deactivate' };
    return { title: 'Change Status', variant: 'default' as const, label: 'Confirm' };
  })() : null;

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <Link href="/superadmin/laundries" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900">
          <ArrowLeft size={14} /> Back to Laundries
        </Link>
        <div className="flex items-center gap-2">
          <Link
            href={`/superadmin/laundries/${id}/edit`}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm border border-gray-200 rounded-lg hover:bg-gray-50"
          >
            <Pencil size={13} /> Edit
          </Link>
          <button
            onClick={() => { setNewPassword(''); setModal({ type: 'reset' }); }}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm border border-gray-200 rounded-lg hover:bg-gray-50"
          >
            <KeyRound size={13} /> Reset Password
          </button>
          <button
            onClick={() => setModal({ type: 'delete' })}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm border border-red-200 text-red-600 rounded-lg hover:bg-red-50"
          >
            <Trash2 size={13} /> Delete
          </button>
        </div>
      </div>

      {/* Header */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <Building2 size={22} className="text-purple-600" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900">{org.businessName}</h1>
              {org.ownerName && <div className="text-sm text-gray-600 mt-0.5">Owner: {org.ownerName}</div>}
              <div className="flex flex-wrap items-center gap-3 mt-1 text-sm text-gray-500">
                <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border', badge.cls)}>
                  {badge.label}
                </span>
                <span className="capitalize">{org.subscriptionPlan?.toLowerCase()}</span>
                <span>Commission: {org.commissionPercentage}%</span>
              </div>
            </div>
          </div>
          <button
            onClick={enterContext}
            disabled={actionLoading || org.status !== 'ACTIVE'}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white text-sm rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors"
          >
            <ExternalLink size={14} /> Enter Dashboard
          </button>
        </div>

        <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm text-gray-600">
          <div className="flex items-center gap-2"><Mail size={14} className="text-gray-400" /> {org.email}</div>
          <div className="flex items-center gap-2"><Phone size={14} className="text-gray-400" /> {org.phone}</div>
          {(org.city || org.state) && (
            <div className="flex items-center gap-2">
              <MapPin size={14} className="text-gray-400" />
              {[org.city, org.state].filter(Boolean).join(', ')}
            </div>
          )}
        </div>
        {org.adminUser && (
          <div className="mt-3 pt-3 border-t border-gray-100 text-xs text-gray-500">
            Admin account: <strong>{org.adminUser.email}</strong>
          </div>
        )}
      </div>

      {/* Stats */}
      {org.stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Orders', value: org.stats.totalOrders, icon: ShoppingBag, color: 'text-blue-500' },
            { label: 'Revenue', value: `₹${Number(org.stats.totalRevenue).toLocaleString('en-IN')}`, icon: TrendingUp, color: 'text-emerald-500' },
            { label: 'Staff', value: org.stats.staffCount, icon: Users, color: 'text-indigo-500' },
            { label: 'Branches', value: org.stats.branchCount, icon: GitBranch, color: 'text-amber-500' },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="bg-white rounded-xl border border-gray-200 p-4">
              <div className="flex items-center gap-2 mb-1">
                <Icon size={14} className={color} />
                <span className="text-xs text-gray-500">{label}</span>
              </div>
              <div className="text-xl font-bold text-gray-900">{value}</div>
            </div>
          ))}
        </div>
      )}

      {/* Status actions */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h2 className="font-semibold text-gray-900 mb-4">Status Management</h2>
        <div className="flex flex-wrap gap-3">
          {org.status === 'PENDING' && (
            <>
              <button onClick={() => setModal({ type: 'status', newStatus: 'ACTIVE' })}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white text-sm rounded-lg hover:bg-emerald-700">
                <CheckCircle size={14} /> Approve
              </button>
              <button onClick={() => setModal({ type: 'status', newStatus: 'REJECTED' })}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700">
                <XCircle size={14} /> Reject
              </button>
            </>
          )}
          {org.status === 'ACTIVE' && (
            <>
              <button onClick={() => setModal({ type: 'status', newStatus: 'SUSPENDED' })}
                className="flex items-center gap-2 px-4 py-2 bg-amber-500 text-white text-sm rounded-lg hover:bg-amber-600">
                <PauseCircle size={14} /> Suspend
              </button>
              <button onClick={() => { setBlockReason(''); setModal({ type: 'status', newStatus: 'BLOCKED' }); }}
                className="flex items-center gap-2 px-4 py-2 bg-red-700 text-white text-sm rounded-lg hover:bg-red-800">
                <Ban size={14} /> Block
              </button>
              <button onClick={() => setModal({ type: 'status', newStatus: 'INACTIVE' })}
                className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white text-sm rounded-lg hover:bg-gray-700">
                <PowerOff size={14} /> Deactivate
              </button>
            </>
          )}
          {(org.status === 'SUSPENDED' || org.status === 'BLOCKED' || org.status === 'INACTIVE') && (
            <button onClick={() => setModal({ type: 'status', newStatus: 'ACTIVE' })}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white text-sm rounded-lg hover:bg-emerald-700">
              <CheckCircle size={14} /> Reactivate
            </button>
          )}
        </div>

        {org.blockReason && (
          <div className="mt-3 text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">
            Block reason: {org.blockReason}
          </div>
        )}
        {org.rejectionReason && (
          <div className="mt-3 text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">
            Rejection reason: {org.rejectionReason}
          </div>
        )}
      </div>

      {/* Config */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-900">Platform Configuration</h2>
          {!configEdit ? (
            <button onClick={() => setConfigEdit(true)} className="text-sm text-purple-600 hover:text-purple-800">Edit</button>
          ) : (
            <div className="flex gap-2">
              <button onClick={() => setConfigEdit(false)} className="text-sm text-gray-500 hover:text-gray-700">Cancel</button>
              <button onClick={handleConfigSave} disabled={actionLoading} className="text-sm text-purple-600 hover:text-purple-800 font-medium disabled:opacity-50">
                {actionLoading ? 'Saving…' : 'Save'}
              </button>
            </div>
          )}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Commission %</label>
            {configEdit ? (
              <input type="number" min="0" max="100" step="0.01" value={commission}
                onChange={(e) => setCommission(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-purple-500" />
            ) : (
              <div className="text-sm text-gray-900">{org.commissionPercentage}%</div>
            )}
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Subscription Plan</label>
            {configEdit ? (
              <select value={plan} onChange={(e) => setPlan(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-purple-500">
                {['FREE', 'BASIC', 'PROFESSIONAL', 'ENTERPRISE'].map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            ) : (
              <div className="text-sm text-gray-900 capitalize">{org.subscriptionPlan?.toLowerCase()}</div>
            )}
          </div>
        </div>
      </div>

      {/* Password reset success banner */}
      {resetDone && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 flex items-center gap-3">
          <CheckCircle size={16} className="text-emerald-600" />
          <span className="text-sm text-emerald-800">
            Password reset for <strong>{resetDone}</strong>. Share the new credentials securely.
          </span>
          <button onClick={() => setResetDone(null)} className="ml-auto text-emerald-500 hover:text-emerald-800 text-xs underline">Dismiss</button>
        </div>
      )}

      {/* Status modal */}
      {modal.type === 'status' && statusModalConfig && (
        <ConfirmModal
          open title={statusModalConfig.title}
          message={`Change "${org.businessName}" status to ${modal.newStatus}?`}
          confirmLabel={statusModalConfig.label}
          variant={statusModalConfig.variant}
          loading={actionLoading}
          onConfirm={confirmStatus}
          onCancel={() => setModal({ type: 'none' })}
        >
          {modal.newStatus === 'BLOCKED' && (
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Block reason (optional)</label>
              <textarea value={blockReason} onChange={(e) => setBlockReason(e.target.value)}
                rows={2} placeholder="Enter reason…"
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-red-400 resize-none" />
            </div>
          )}
        </ConfirmModal>
      )}

      {/* Delete modal */}
      {modal.type === 'delete' && (
        <ConfirmModal open title="Delete Laundry"
          message={`This will permanently remove "${org.businessName}" if it has no orders, or deactivate it otherwise. This cannot be undone.`}
          confirmLabel="Delete" variant="danger"
          loading={actionLoading}
          onConfirm={confirmDelete}
          onCancel={() => setModal({ type: 'none' })} />
      )}

      {/* Reset password modal */}
      {modal.type === 'reset' && (
        <ConfirmModal open title="Reset Admin Password"
          message={`Set a new password for the admin account of "${org.businessName}".`}
          confirmLabel="Reset Password" variant="warning"
          loading={actionLoading}
          onConfirm={confirmResetPassword}
          onCancel={() => setModal({ type: 'none' })}
        >
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">New password</label>
            <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Min 6 characters"
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-purple-400" />
          </div>
        </ConfirmModal>
      )}
    </div>
  );
}
