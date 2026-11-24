'use client';

import { useState, useEffect } from 'react';
import { ShieldCheck, CheckCircle, XCircle, AlertTriangle, ClipboardList, RotateCcw, Search } from 'lucide-react';
import apiClient, { unwrap } from '@/lib/api';

const qualityApi = {
  listGarments: (params?: any) => apiClient.get('/garments', { params }).then(unwrap),
  recordQuality: (id: string, data: any) => apiClient.post(`/garments/${id}/quality`, data).then(unwrap),
  getStats: () => apiClient.get('/garments/stats').then(unwrap),
};

const CHECKLIST = [
  { key: 'stains_removed', label: 'All stains removed' },
  { key: 'no_damage', label: 'No new damage / tears' },
  { key: 'properly_dried', label: 'Properly dried, no dampness' },
  { key: 'ironed_pressed', label: 'Ironed / pressed as requested' },
  { key: 'correct_folding', label: 'Correctly folded / hung' },
  { key: 'correct_packaging', label: 'Correct packaging / bag' },
  { key: 'tag_intact', label: 'Garment tag intact' },
];

const toArray = (v: any): any[] => {
  if (Array.isArray(v)) return v;
  if (v && Array.isArray(v.data)) return v.data;
  if (v && Array.isArray(v.items)) return v.items;
  return [];
};

export default function QualityPage() {
  const [garments, setGarments] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [search, setSearch] = useState('');
  const [inspecting, setInspecting] = useState<any>(null);
  const [checklist, setChecklist] = useState<Record<string, boolean>>({});
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const [g, s] = await Promise.all([
        qualityApi.listGarments({ status: 'IN_PROCESSING' }),
        qualityApi.getStats(),
      ]);
      setGarments(toArray(g)); setStats(s);
    } catch { /* auth redirect handled by interceptor */ }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const startInspect = (g: any) => {
    setInspecting(g);
    setChecklist(Object.fromEntries(CHECKLIST.map(c => [c.key, false])));
    setNotes('');
  };

  const handleSubmit = async (result: 'PASS' | 'FAIL' | 'REWORK') => {
    if (!inspecting) return;
    await qualityApi.recordQuality(inspecting.id, {
      orderId: inspecting.orderId,
      inspectorId: 'self',
      checklistResults: checklist,
      result,
      notes,
    });
    setInspecting(null);
    load();
  };

  const allPassed = Object.values(checklist).every(Boolean);
  const failedItems = CHECKLIST.filter(c => !checklist[c.key]);

  const filtered = garments.filter(g =>
    !search || g.tagId?.toLowerCase().includes(search.toLowerCase()) || g.name?.toLowerCase().includes(search.toLowerCase())
  );

  const passCount = stats?.byStatus?.find((s: any) => s.status === 'QUALITY_PASSED')?.count || 0;
  const failCount = stats?.byStatus?.find((s: any) => s.status === 'QUALITY_FAILED')?.count || 0;
  const pendingCount = stats?.byStatus?.find((s: any) => s.status === 'IN_PROCESSING')?.count || 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Quality Control</h1>
        <p className="text-sm text-gray-500 mt-1">Inspect garments before dispatch</p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3">
          <div className="w-10 h-10 bg-yellow-100 rounded-xl flex items-center justify-center"><ClipboardList size={18} className="text-yellow-600" /></div>
          <div><p className="text-2xl font-bold text-gray-900">{pendingCount}</p><p className="text-xs text-gray-500">Pending Inspection</p></div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3">
          <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center"><CheckCircle size={18} className="text-green-600" /></div>
          <div><p className="text-2xl font-bold text-gray-900">{passCount}</p><p className="text-xs text-gray-500">Passed</p></div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3">
          <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center"><XCircle size={18} className="text-red-600" /></div>
          <div><p className="text-2xl font-bold text-gray-900">{failCount}</p><p className="text-xs text-gray-500">Failed / Rework</p></div>
        </div>
      </div>

      {/* Search + List */}
      <div className="flex gap-3 items-center">
        <div className="relative flex-1 max-w-xs">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search tag ID or garment…" className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-maroon-500 outline-none" />
        </div>
        <span className="text-sm text-gray-500">{filtered.length} pending</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <div className="col-span-3 text-center py-16 text-gray-400">Loading…</div>
        ) : filtered.length === 0 ? (
          <div className="col-span-3 text-center py-16 text-gray-400">
            <ShieldCheck size={40} className="mx-auto mb-3 opacity-30" />
            <p>No garments pending quality inspection</p>
          </div>
        ) : filtered.map(g => (
          <div key={g.id} className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-gray-900">{g.name}</p>
                <p className="text-xs text-gray-400">{g.category} {g.color && `· ${g.color}`}</p>
              </div>
              <code className="bg-maroon-50 text-maroon-700 text-xs font-mono px-2 py-1 rounded">{g.tagId}</code>
            </div>
            <p className="text-xs text-gray-500">Service: {g.serviceName}</p>
            {(g.stainDescription || g.existingDamage) && (
              <div className="flex items-start gap-1 text-xs text-orange-600 bg-orange-50 rounded-lg p-2">
                <AlertTriangle size={12} className="mt-0.5 flex-shrink-0" />
                <span>{g.stainDescription || g.existingDamage}</span>
              </div>
            )}
            <button onClick={() => startInspect(g)} className="w-full flex items-center justify-center gap-2 bg-maroon-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-maroon-700">
              <ShieldCheck size={14} /> Inspect
            </button>
          </div>
        ))}
      </div>

      {/* Inspection Modal */}
      {inspecting && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Quality Inspection</h2>
                <p className="text-sm text-gray-500">{inspecting.name} · <code className="font-mono text-xs">{inspecting.tagId}</code></p>
              </div>
            </div>

            <div className="space-y-3 mb-5">
              {CHECKLIST.map(item => (
                <label key={item.key} className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${checklist[item.key] ? 'border-green-200 bg-green-50' : 'border-gray-200 hover:bg-gray-50'}`}>
                  <input
                    type="checkbox"
                    checked={checklist[item.key] || false}
                    onChange={e => setChecklist({ ...checklist, [item.key]: e.target.checked })}
                    className="w-4 h-4 accent-green-500"
                  />
                  <span className={`text-sm ${checklist[item.key] ? 'text-green-700 line-through' : 'text-gray-700'}`}>{item.label}</span>
                  {checklist[item.key] && <CheckCircle size={14} className="text-green-500 ml-auto" />}
                </label>
              ))}
            </div>

            {!allPassed && Object.keys(checklist).some(k => !checklist[k]) && (
              <div className="bg-red-50 border border-red-100 rounded-xl p-3 mb-4">
                <p className="text-xs font-medium text-red-700 mb-2">Issues found:</p>
                {failedItems.map(c => (
                  <p key={c.key} className="text-xs text-red-600 flex items-center gap-1"><XCircle size={10} /> {c.label}</p>
                ))}
              </div>
            )}

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Inspector Notes</label>
              <textarea rows={2} value={notes} onChange={e => setNotes(e.target.value)} placeholder="Optional notes…" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-maroon-500 resize-none" />
            </div>

            <div className="grid grid-cols-3 gap-2">
              <button onClick={() => handleSubmit('FAIL')} className="flex items-center justify-center gap-1 bg-red-500 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-red-600">
                <XCircle size={14} /> Fail
              </button>
              <button onClick={() => handleSubmit('REWORK')} className="flex items-center justify-center gap-1 bg-orange-500 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-orange-600">
                <RotateCcw size={14} /> Rework
              </button>
              <button onClick={() => handleSubmit('PASS')} disabled={!allPassed} className="flex items-center justify-center gap-1 bg-green-600 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-40">
                <CheckCircle size={14} /> Pass
              </button>
            </div>
            <button onClick={() => setInspecting(null)} className="w-full mt-2 text-sm text-gray-400 hover:text-gray-600">Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}
