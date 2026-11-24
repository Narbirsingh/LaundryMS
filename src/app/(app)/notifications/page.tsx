'use client';

import { useState, useEffect } from 'react';
import { Bell, MessageSquare, Smartphone, Mail, CheckCircle, XCircle, Plus, Send, Zap, Settings } from 'lucide-react';
import apiClient, { unwrap } from '@/lib/api';

const notificationsApi = {
  getStats: () => apiClient.get('/notifications/stats').then(unwrap),
  listTemplates: () => apiClient.get('/notifications/templates').then(unwrap),
  createTemplate: (data: any) => apiClient.post('/notifications/templates', data).then(unwrap),
  updateTemplate: (id: string, data: any) => apiClient.patch(`/notifications/templates/${id}`, data).then(unwrap),
  seedDefaults: () => apiClient.post('/notifications/templates/seed').then(unwrap),
  listLogs: (params?: any) => apiClient.get('/notifications/logs', { params }).then(unwrap),
  send: (data: any) => apiClient.post('/notifications/send', data).then(unwrap),
};

const CHANNEL_ICON: Record<string, any> = {
  SMS: Smartphone,
  WHATSAPP: MessageSquare,
  EMAIL: Mail,
  PUSH: Bell,
};

const CHANNEL_COLOR: Record<string, string> = {
  SMS: 'bg-maroon-100 text-maroon-700',
  WHATSAPP: 'bg-green-100 text-green-700',
  EMAIL: 'bg-purple-100 text-purple-700',
  PUSH: 'bg-orange-100 text-orange-700',
};

const EVENT_TYPES = [
  'ORDER_CREATED', 'PICKUP_SCHEDULED', 'GARMENTS_COLLECTED',
  'READY_FOR_DISPATCH', 'OUT_FOR_DELIVERY', 'DELIVERED', 'PAYMENT_COMPLETED',
];

const toArray = (v: any): any[] => {
  if (Array.isArray(v)) return v;
  if (v && Array.isArray(v.data)) return v.data;
  if (v && Array.isArray(v.items)) return v.items;
  return [];
};

export default function NotificationsPage() {
  const [tab, setTab] = useState<'templates' | 'logs' | 'send'>('templates');
  const [stats, setStats] = useState<any>(null);
  const [templates, setTemplates] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [editTemplate, setEditTemplate] = useState<any>(null);
  const [form, setForm] = useState({ name: '', eventType: '', channel: 'SMS', subject: '', body: '' });
  const [sendForm, setSendForm] = useState({ recipientContact: '', channel: 'SMS', eventType: '', body: '' });

  const load = async () => {
    setLoading(true);
    try {
      const [s, t, l] = await Promise.all([
        notificationsApi.getStats(),
        notificationsApi.listTemplates(),
        notificationsApi.listLogs(),
      ]);
      setStats(s); setTemplates(toArray(t)); setLogs(toArray(l));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleSeed = async () => {
    await notificationsApi.seedDefaults();
    load();
  };

  const handleSaveTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editTemplate) await notificationsApi.updateTemplate(editTemplate.id, form);
    else await notificationsApi.createTemplate(form);
    setShowAdd(false); setEditTemplate(null);
    load();
  };

  const openEdit = (t: any) => {
    setForm({ name: t.name, eventType: t.eventType, channel: t.channel, subject: t.subject || '', body: t.body });
    setEditTemplate(t); setShowAdd(true);
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    await notificationsApi.send(sendForm);
    setSendForm({ recipientContact: '', channel: 'SMS', eventType: '', body: '' });
    load();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
          <p className="text-sm text-gray-500 mt-1">SMS, WhatsApp & email alerts for customers</p>
        </div>
        <div className="flex gap-2">
          <button onClick={handleSeed} className="flex items-center gap-2 border border-gray-200 text-gray-600 px-4 py-2 rounded-lg text-sm hover:bg-gray-50">
            <Zap size={16} /> Seed Defaults
          </button>
          <button onClick={() => { setForm({ name: '', eventType: '', channel: 'SMS', subject: '', body: '' }); setEditTemplate(null); setShowAdd(true); }} className="flex items-center gap-2 bg-maroon-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-maroon-700">
            <Plus size={16} /> New Template
          </button>
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
            <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
            <p className="text-sm text-gray-500 mt-1">Total Sent</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
            <p className="text-3xl font-bold text-green-600">{stats.sent}</p>
            <p className="text-sm text-gray-500 mt-1">Delivered</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
            <p className="text-3xl font-bold text-red-500">{stats.failed}</p>
            <p className="text-sm text-gray-500 mt-1">Failed</p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <div className="flex gap-6">
          {(['templates', 'logs', 'send'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`pb-3 text-sm font-medium capitalize border-b-2 transition-colors ${tab === t ? 'border-maroon-600 text-maroon-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
            >
              {t === 'templates' ? 'Message Templates' : t === 'logs' ? 'Delivery Logs' : 'Send Notification'}
            </button>
          ))}
        </div>
      </div>

      {/* Templates */}
      {tab === 'templates' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {loading ? <div className="col-span-2 text-center py-10 text-gray-400">Loading…</div> :
           templates.length === 0 ? (
            <div className="col-span-2 text-center py-16 text-gray-400">
              <Bell size={40} className="mx-auto mb-3 opacity-30" />
              <p>No templates yet. Click &quot;Seed Defaults&quot; to add starter templates.</p>
            </div>
          ) : templates.map(t => {
            const Icon = CHANNEL_ICON[t.channel] || Bell;
            return (
              <div key={t.id} className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${CHANNEL_COLOR[t.channel] || 'bg-gray-100 text-gray-600'}`}>
                      <span className="flex items-center gap-1"><Icon size={10} /> {t.channel}</span>
                    </span>
                    <span className="text-xs text-gray-400">{t.eventType.replace(/_/g, ' ')}</span>
                  </div>
                  <button onClick={() => openEdit(t)} className="text-xs text-maroon-600 hover:underline">Edit</button>
                </div>
                <p className="font-medium text-sm text-gray-900">{t.name}</p>
                <p className="text-xs text-gray-600 bg-gray-50 rounded-lg p-3 font-mono leading-relaxed">{t.body}</p>
                <div className="flex items-center gap-1">
                  {t.isActive ? <CheckCircle size={12} className="text-green-500" /> : <XCircle size={12} className="text-red-400" />}
                  <span className="text-xs text-gray-400">{t.isActive ? 'Active' : 'Disabled'}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Logs */}
      {tab === 'logs' && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Recipient</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Channel</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Event</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Sent</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {logs.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-10 text-gray-400">No logs yet</td></tr>
              ) : logs.map(l => (
                <tr key={l.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900">{l.recipientName || '-'}</p>
                    <p className="text-xs text-gray-400">{l.recipientContact}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${CHANNEL_COLOR[l.channel] || 'bg-gray-100 text-gray-600'}`}>{l.channel}</span>
                  </td>
                  <td className="px-4 py-3 text-gray-600 text-xs">{l.eventType.replace(/_/g, ' ')}</td>
                  <td className="px-4 py-3">
                    <span className={`flex items-center gap-1 text-xs ${l.status === 'SENT' ? 'text-green-600' : 'text-red-500'}`}>
                      {l.status === 'SENT' ? <CheckCircle size={12} /> : <XCircle size={12} />}
                      {l.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-400">
                    {l.sentAt ? new Date(l.sentAt).toLocaleDateString('en-IN') : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Send */}
      {tab === 'send' && (
        <div className="max-w-lg">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Send a Notification</h3>
            <form onSubmit={handleSend} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Channel</label>
                <select value={sendForm.channel} onChange={e => setSendForm({...sendForm, channel: e.target.value})} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none">
                  <option value="SMS">SMS</option>
                  <option value="WHATSAPP">WhatsApp</option>
                  <option value="EMAIL">Email</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Recipient (phone / email)</label>
                <input required value={sendForm.recipientContact} onChange={e => setSendForm({...sendForm, recipientContact: e.target.value})} placeholder="+91 98765 43210" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-maroon-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Event Type</label>
                <select value={sendForm.eventType} onChange={e => setSendForm({...sendForm, eventType: e.target.value})} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none">
                  <option value="">— Select —</option>
                  {EVENT_TYPES.map(et => <option key={et} value={et}>{et.replace(/_/g, ' ')}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
                <textarea required rows={4} value={sendForm.body} onChange={e => setSendForm({...sendForm, body: e.target.value})} placeholder="Type your message…" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-maroon-500 resize-none" />
              </div>
              <button type="submit" className="w-full flex items-center justify-center gap-2 bg-maroon-600 text-white py-2.5 rounded-lg text-sm font-semibold hover:bg-maroon-700">
                <Send size={16} /> Send Now
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Template Modal */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">{editTemplate ? 'Edit Template' : 'New Template'}</h2>
            <form onSubmit={handleSaveTemplate} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Name *</label>
                <input required value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-maroon-500" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Channel</label>
                  <select value={form.channel} onChange={e => setForm({...form, channel: e.target.value})} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none">
                    <option value="SMS">SMS</option>
                    <option value="WHATSAPP">WhatsApp</option>
                    <option value="EMAIL">Email</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Event Trigger</label>
                  <select value={form.eventType} onChange={e => setForm({...form, eventType: e.target.value})} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none">
                    <option value="">— Select —</option>
                    {EVENT_TYPES.map(et => <option key={et} value={et}>{et.replace(/_/g, ' ')}</option>)}
                  </select>
                </div>
              </div>
              {form.channel === 'EMAIL' && (
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Subject</label>
                  <input value={form.subject} onChange={e => setForm({...form, subject: e.target.value})} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-maroon-500" />
                </div>
              )}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Message Body *</label>
                <textarea required rows={4} value={form.body} onChange={e => setForm({...form, body: e.target.value})} placeholder="Use {customerName}, {orderNumber}, {total} as variables" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-maroon-500 resize-none font-mono text-xs" />
              </div>
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setShowAdd(false)} className="flex-1 border border-gray-200 text-gray-600 py-2 rounded-lg text-sm">Cancel</button>
                <button type="submit" className="flex-1 bg-maroon-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-maroon-700">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
