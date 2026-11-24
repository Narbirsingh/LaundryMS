'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { ArrowLeft, Plus, CheckCircle, Clock, FileText, AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import { caApi } from '@/lib/api';
import { formatDate, formatCurrency } from '@/lib/utils';

const ITR_STATUS_ORDER = [
  'DOCUMENT_COLLECTION', 'UNDER_REVIEW', 'COMPUTATION', 'CLIENT_APPROVAL',
  'FILED', 'ACKNOWLEDGED', 'E_VERIFIED',
];

const ITR_STATUS_COLORS: Record<string, string> = {
  DOCUMENT_COLLECTION: 'bg-gray-100 text-gray-600',
  UNDER_REVIEW: 'bg-maroon-100 text-maroon-700',
  COMPUTATION: 'bg-indigo-100 text-indigo-700',
  CLIENT_APPROVAL: 'bg-yellow-100 text-yellow-700',
  FILED: 'bg-green-100 text-green-700',
  ACKNOWLEDGED: 'bg-teal-100 text-teal-700',
  E_VERIFIED: 'bg-purple-100 text-purple-700',
};

export default function CaClientDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [client, setClient] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showItrForm, setShowItrForm] = useState(false);
  const [itrForm, setItrForm] = useState({ assessmentYear: '2025-26', financialYear: '2024-25', itrForm: '', taxRegime: 'OLD' });
  const [savingItr, setSavingItr] = useState(false);
  const [selectedItr, setSelectedItr] = useState<any>(null);
  const [readiness, setReadiness] = useState<any>(null);

  const fetchClient = async () => {
    setLoading(true);
    try {
      const data: any = await caApi.getClient(id);
      setClient(data);
    } catch {}
    setLoading(false);
  };

  useEffect(() => { fetchClient(); }, [id]);

  const handleCreateItr = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingItr(true);
    try {
      await caApi.createItr(id, itrForm);
      setShowItrForm(false);
      fetchClient();
    } catch (err: any) { alert(err?.response?.data?.message || 'Failed'); }
    finally { setSavingItr(false); }
  };

  const handleAdvanceStatus = async (itrId: string, currentStatus: string) => {
    const idx = ITR_STATUS_ORDER.indexOf(currentStatus);
    if (idx < 0 || idx >= ITR_STATUS_ORDER.length - 1) return;
    const nextStatus = ITR_STATUS_ORDER[idx + 1];
    await caApi.updateItrStatus(itrId, { status: nextStatus });
    fetchClient();
  };

  const handleCheckReadiness = async (itrId: string) => {
    const data: any = await caApi.checkReadiness(itrId);
    setReadiness({ itrId, ...data });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-maroon-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!client) {
    return <div className="text-center py-16 text-gray-400">Client not found</div>;
  }

  return (
    <div className="space-y-5 max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/ca/clients" className="p-2 hover:bg-gray-100 rounded-lg">
          <ArrowLeft size={16} className="text-gray-500" />
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold text-gray-900">{client.legalName}</h2>
            <span className="text-xs bg-maroon-100 text-maroon-700 px-2 py-0.5 rounded-full">{client.taxpayerType}</span>
            {!client.isActive && <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full">Inactive</span>}
          </div>
          <p className="text-sm text-gray-500">{client.clientCode} · PAN: {client.panMasked || client.pan}</p>
        </div>
        <button onClick={() => setShowItrForm(true)}
          className="flex items-center gap-2 bg-maroon-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-maroon-700">
          <Plus size={15} /> New ITR
        </button>
      </div>

      {/* Client Info */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Contact & Address</h3>
          <div className="space-y-2 text-sm">
            {[
              ['Phone', client.phone],
              ['Email', client.email],
              ['City', client.city],
              ['State', client.state],
              ['GSTIN', client.gstin],
            ].filter(([, v]) => v).map(([label, value]) => (
              <div key={label as string} className="flex gap-2">
                <span className="text-gray-500 w-20 shrink-0">{label}</span>
                <span className="text-gray-900">{value}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Tax Profile</h3>
          <div className="space-y-2 text-sm">
            {[
              ['Regime', client.taxRegime],
              ['Residential', client.residentialStatus],
              ['Business', client.businessActivity],
              ['DOB', client.dateOfBirth ? formatDate(client.dateOfBirth) : null],
            ].filter(([, v]) => v).map(([label, value]) => (
              <div key={label as string} className="flex gap-2">
                <span className="text-gray-500 w-24 shrink-0">{label}</span>
                <span className="text-gray-900">{value}</span>
              </div>
            ))}
            {client.notes && <p className="text-xs text-gray-500 mt-2 italic">{client.notes}</p>}
          </div>
        </div>
      </div>

      {/* ITR Records */}
      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-3">ITR Records</h3>
        {client.itrRecords?.length > 0 ? (
          <div className="space-y-3">
            {client.itrRecords.map((itr: any) => {
              const statusIdx = ITR_STATUS_ORDER.indexOf(itr.status);
              const isComplete = itr.status === 'E_VERIFIED';
              return (
                <div key={itr.id} className="bg-white rounded-xl border border-gray-200 p-5">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-gray-900">AY {itr.assessmentYear}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${ITR_STATUS_COLORS[itr.status] || 'bg-gray-100 text-gray-600'}`}>
                          {itr.status?.replace(/_/g, ' ')}
                        </span>
                        {itr.itrForm && <span className="text-xs text-gray-500">{itr.itrForm}</span>}
                      </div>
                      <p className="text-xs text-gray-500 mt-1">FY {itr.financialYear} · {itr.taxRegime} Regime</p>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => handleCheckReadiness(itr.id)}
                        className="text-xs text-purple-600 hover:text-purple-800 px-2 py-1 border border-purple-100 rounded hover:bg-purple-50">
                        Check Readiness
                      </button>
                      {!isComplete && (
                        <button onClick={() => handleAdvanceStatus(itr.id, itr.status)}
                          className="text-xs text-maroon-600 hover:text-maroon-800 px-2 py-1 border border-maroon-100 rounded hover:bg-maroon-50">
                          Advance Status →
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="mt-4">
                    <div className="flex gap-1">
                      {ITR_STATUS_ORDER.map((s, i) => (
                        <div key={s} title={s.replace(/_/g, ' ')}
                          className={`h-1.5 flex-1 rounded-full transition-colors ${i <= statusIdx ? 'bg-maroon-500' : 'bg-gray-200'}`} />
                      ))}
                    </div>
                    <p className="text-xs text-gray-400 mt-1">{statusIdx + 1} / {ITR_STATUS_ORDER.length} steps</p>
                  </div>

                  {/* Tax summary if available */}
                  {itr.taxableIncome && (
                    <div className="mt-4 grid grid-cols-4 gap-3">
                      {[
                        ['Gross Income', formatCurrency(itr.grossTotalIncome ?? 0)],
                        ['Deductions', formatCurrency(itr.totalDeductions ?? 0)],
                        ['Tax Liability', formatCurrency(itr.taxLiability ?? 0)],
                        ['Refund/Payable', formatCurrency(itr.taxRefund ?? itr.taxPayable ?? 0)],
                      ].map(([label, value]) => (
                        <div key={label as string} className="bg-gray-50 rounded-lg p-2">
                          <div className="text-xs text-gray-500">{label}</div>
                          <div className="text-sm font-semibold text-gray-900 mt-0.5">{value}</div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Readiness report inline */}
                  {readiness?.itrId === itr.id && (
                    <div className="mt-4 bg-purple-50 rounded-lg p-3">
                      <p className="text-xs font-semibold text-purple-800 mb-2">Readiness Report</p>
                      <div className="space-y-1">
                        {readiness.checks?.map((check: any, i: number) => (
                          <div key={i} className="flex items-center gap-2 text-xs">
                            {check.passed ? <CheckCircle size={12} className="text-green-500" /> : <AlertTriangle size={12} className="text-orange-500" />}
                            <span className={check.passed ? 'text-gray-700' : 'text-orange-700'}>{check.label}</span>
                          </div>
                        ))}
                        {!readiness.checks && <p className="text-xs text-gray-500">{JSON.stringify(readiness)}</p>}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 p-10 text-center text-gray-400">
            <FileText size={28} className="mx-auto mb-2 opacity-30" />
            <p>No ITR records yet</p>
            <button onClick={() => setShowItrForm(true)} className="text-maroon-600 hover:underline text-sm mt-1">Create first ITR</button>
          </div>
        )}
      </div>

      {/* New ITR Modal */}
      {showItrForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <h3 className="font-semibold text-gray-900 mb-4">New ITR Record</h3>
            <form onSubmit={handleCreateItr} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Assessment Year *</label>
                  <input required value={itrForm.assessmentYear} onChange={(e) => setItrForm({ ...itrForm, assessmentYear: e.target.value })}
                    placeholder="2025-26"
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-maroon-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Financial Year *</label>
                  <input required value={itrForm.financialYear} onChange={(e) => setItrForm({ ...itrForm, financialYear: e.target.value })}
                    placeholder="2024-25"
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-maroon-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">ITR Form</label>
                  <select value={itrForm.itrForm} onChange={(e) => setItrForm({ ...itrForm, itrForm: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-maroon-500">
                    <option value="">Select...</option>
                    {['ITR-1', 'ITR-2', 'ITR-3', 'ITR-4', 'ITR-5', 'ITR-6', 'ITR-7'].map((f) => <option key={f} value={f}>{f}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tax Regime</label>
                  <select value={itrForm.taxRegime} onChange={(e) => setItrForm({ ...itrForm, taxRegime: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-maroon-500">
                    <option value="OLD">OLD</option>
                    <option value="NEW">NEW</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-3 justify-end pt-2">
                <button type="button" onClick={() => setShowItrForm(false)}
                  className="px-4 py-2 text-sm text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50">Cancel</button>
                <button type="submit" disabled={savingItr}
                  className="px-4 py-2 text-sm text-white bg-maroon-600 rounded-lg hover:bg-maroon-700 disabled:opacity-50">
                  {savingItr ? 'Creating...' : 'Create ITR'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
