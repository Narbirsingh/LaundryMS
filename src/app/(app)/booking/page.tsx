'use client';

import { useState, useEffect } from 'react';
import { Calendar, Clock, Package, Phone, CheckCircle, Copy, ExternalLink, RefreshCw, Plus, MapPin } from 'lucide-react';
import apiClient, { unwrap } from '@/lib/api';

const bookingApi = {
  listOrders: (params?: any) => apiClient.get('/orders', { params }).then(unwrap),
  createOrder: (data: any) => apiClient.post('/orders', data).then(unwrap),
  listServices: (params?: any) => apiClient.get('/services', { params }).then(unwrap),
  listCustomers: (params?: any) => apiClient.get('/customers', { params }).then(unwrap),
};

const toArray = (v: any): any[] => {
  if (Array.isArray(v)) return v;
  if (v && Array.isArray(v.data)) return v.data;
  if (v && Array.isArray(v.items)) return v.items;
  return [];
};

const FREQ_OPTS = ['DAILY', 'WEEKLY', 'BIWEEKLY', 'MONTHLY'];

const emptyForm = {
  customerId: '',
  serviceId: '',
  scheduledDate: '',
  pickupAddress: '',
  notes: '',
  isRecurring: false,
  recurringFreq: 'WEEKLY',
};

export default function BookingPage() {
  const [tab, setTab] = useState<'widget' | 'recurring' | 'portal'>('widget');
  const [orders, setOrders] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [copied, setCopied] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const widgetCode = `<!-- LaundryMS Booking Widget -->
<script src="https://laundryms.app/widget.js" data-org="YOUR_ORG_ID"></script>
<div id="laundryms-booking"></div>`;

  const load = async () => {
    try {
      const [o, s, c] = await Promise.all([
        bookingApi.listOrders({ limit: 50 }),
        bookingApi.listServices({ limit: 100 }),
        bookingApi.listCustomers({ limit: 100 }),
      ]);
      setOrders(toArray(o));
      setServices(toArray(s));
      setCustomers(toArray(c));
    } catch {
      // silently ignore auth errors — interceptor handles redirect
    }
  };

  useEffect(() => { load(); }, []);

  const handleCopy = () => {
    navigator.clipboard.writeText(widgetCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.customerId || !form.serviceId || !form.scheduledDate) return;
    setSubmitting(true);
    try {
      const selectedService = services.find(s => s.id === form.serviceId);
      await bookingApi.createOrder({
        customerId: form.customerId,
        isExpress: false,
        isPickup: true,
        isDelivery: false,
        pickupAddress: form.pickupAddress,
        specialInstructions: form.notes,
        source: 'APP',
        items: [{
          serviceId: form.serviceId,
          serviceName: selectedService?.name || '',
          quantity: 1,
          unitPrice: Number(selectedService?.basePrice || 0),
          gstRate: Number(selectedService?.gstRate || 0),
          discountAmount: 0,
          isExpress: false,
        }],
      });
      setShowNew(false);
      setForm(emptyForm);
      load();
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Failed to schedule pickup');
    } finally {
      setSubmitting(false);
    }
  };

  const setField = (k: keyof typeof emptyForm) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setForm(f => ({ ...f, [k]: e.target.value }));

  const recurringOrders = orders.filter(o => o.isRecurring);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Online Booking & Customer Portal</h1>
          <p className="text-sm text-gray-500 mt-1">Booking widget, recurring orders, and customer self-service</p>
        </div>
        <button
          onClick={() => { setForm(emptyForm); setShowNew(true); }}
          className="flex items-center gap-2 bg-maroon-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-maroon-700"
        >
          <Plus size={16} /> Schedule Pickup
        </button>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <div className="flex gap-6">
          {(['widget', 'recurring', 'portal'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`pb-3 text-sm font-medium border-b-2 transition-colors ${tab === t ? 'border-maroon-600 text-maroon-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
            >
              {t === 'widget' ? 'Booking Widget' : t === 'recurring' ? `Recurring Orders (${recurringOrders.length})` : 'Customer Portal'}
            </button>
          ))}
        </div>
      </div>

      {/* ── Widget tab ── */}
      {tab === 'widget' && (
        <div className="max-w-2xl space-y-5">
          <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
            <h3 className="font-semibold text-gray-900">Embed Booking Widget</h3>
            <p className="text-sm text-gray-600">Add this code snippet to your website or WhatsApp business page to let customers book pickups online.</p>
            <div className="relative">
              <pre className="bg-gray-900 text-green-400 text-xs rounded-xl p-4 overflow-x-auto font-mono leading-relaxed">{widgetCode}</pre>
              <button
                onClick={handleCopy}
                className={`absolute top-3 right-3 flex items-center gap-1 text-xs px-2 py-1 rounded-lg transition-colors ${copied ? 'bg-green-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
              >
                {copied ? <><CheckCircle size={12} /> Copied!</> : <><Copy size={12} /> Copy</>}
              </button>
            </div>
          </div>

          <div className="bg-maroon-50 rounded-xl border border-maroon-100 p-6 space-y-4">
            <h3 className="font-semibold text-maroon-900">Widget Preview</h3>
            <div className="bg-white rounded-xl border border-maroon-100 p-5 max-w-sm">
              <p className="font-semibold text-gray-900 mb-3">📦 Schedule a Pickup</p>
              <div className="space-y-3">
                {['Your Name', 'Phone Number', 'Pickup Address', 'Select Service', 'Preferred Date'].map(ph => (
                  <div key={ph} className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-400">{ph}</div>
                ))}
                <button className="w-full bg-maroon-600 text-white py-2.5 rounded-lg text-sm font-semibold">Book Pickup →</button>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-3">
            <h3 className="font-semibold text-gray-900">QR Code for Walk-ins</h3>
            <p className="text-sm text-gray-600">Print this QR and place it at your counter. Customers scan to self-register.</p>
            <div className="flex items-center gap-4">
              <div className="w-24 h-24 bg-gray-100 rounded-xl flex items-center justify-center border-2 border-dashed border-gray-300">
                <span className="text-gray-400 text-xs text-center">QR Code</span>
              </div>
              <div className="text-sm text-gray-600">
                <p className="font-medium text-gray-900 mb-1">Customer self-service portal</p>
                <p className="text-gray-500 font-mono text-xs">https://laundryms.app/book/YOUR_ORG</p>
                <button className="mt-2 flex items-center gap-1 text-maroon-600 hover:underline text-xs">
                  <ExternalLink size={12} /> Open Portal
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Recurring tab ── */}
      {tab === 'recurring' && (
        <div className="space-y-4">
          {recurringOrders.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <RefreshCw size={40} className="mx-auto mb-3 opacity-30" />
              <p>No recurring orders set up</p>
              <p className="text-sm mt-1">Schedule a pickup and tick &quot;Recurring&quot; to set up regular pickups</p>
              <button
                onClick={() => { setForm(emptyForm); setShowNew(true); }}
                className="mt-4 inline-flex items-center gap-2 bg-maroon-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-maroon-700"
              >
                <Plus size={14} /> Schedule Now
              </button>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Order #</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Customer</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Service</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Frequency</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Next Pickup</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {recurringOrders.map(o => (
                    <tr key={o.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-mono text-xs text-gray-700">#{o.orderNumber}</td>
                      <td className="px-4 py-3 font-medium text-gray-900">{o.customer?.name}</td>
                      <td className="px-4 py-3 text-gray-600">{o.items?.[0]?.serviceName || '—'}</td>
                      <td className="px-4 py-3">
                        <span className="bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full text-xs font-medium">
                          {o.recurringFrequency || 'WEEKLY'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {o.nextPickupDate ? new Date(o.nextPickupDate).toLocaleDateString('en-IN') : '—'}
                      </td>
                      <td className="px-4 py-3">
                        <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded-full text-xs">Active</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── Portal tab ── */}
      {tab === 'portal' && (
        <div className="max-w-2xl space-y-5">
          <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
            <h3 className="font-semibold text-gray-900">Customer Self-Service Portal</h3>
            <p className="text-sm text-gray-600">Share your portal link with customers so they can track their order status, view history, and raise complaints — no app needed.</p>
            <div className="bg-gray-50 rounded-xl p-4 space-y-3">
              {[
                { icon: Package, label: 'Live order tracking', desc: 'Customers see real-time status updates' },
                { icon: Clock, label: 'Order history', desc: 'Full list of past orders with invoices' },
                { icon: Phone, label: 'Raise complaint', desc: 'Damage or quality issue reporting' },
                { icon: Calendar, label: 'Book pickup', desc: 'Self-schedule a new pickup' },
              ].map(f => (
                <div key={f.label} className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-maroon-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <f.icon size={14} className="text-maroon-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{f.label}</p>
                    <p className="text-xs text-gray-500">{f.desc}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="border border-dashed border-gray-300 rounded-xl p-4 text-center">
              <p className="text-sm text-gray-600 mb-2">Portal URL</p>
              <p className="font-mono text-sm text-maroon-600">https://laundryms.app/portal/YOUR_ORG</p>
              <p className="text-xs text-gray-400 mt-2">Replace YOUR_ORG with your organization slug from Settings</p>
            </div>
          </div>
        </div>
      )}

      {/* ── Schedule Pickup Modal ── */}
      {showNew && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Schedule Pickup</h2>
            <form onSubmit={handleCreate} className="space-y-4">

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Customer *</label>
                <select
                  required
                  value={form.customerId}
                  onChange={setField('customerId')}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-maroon-500"
                >
                  <option value="">— Select customer —</option>
                  {customers.map((c: any) => (
                    <option key={c.id} value={c.id}>{c.name} · {c.mobile}</option>
                  ))}
                </select>
                {customers.length === 0 && (
                  <p className="text-xs text-amber-600 mt-1">No customers found — add a customer first</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Service *</label>
                <select
                  required
                  value={form.serviceId}
                  onChange={setField('serviceId')}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-maroon-500"
                >
                  <option value="">— Select service —</option>
                  {services.map((s: any) => (
                    <option key={s.id} value={s.id}>{s.name} {s.basePrice ? `· ₹${s.basePrice}` : ''}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Scheduled Pickup Date &amp; Time *</label>
                <input
                  required
                  type="datetime-local"
                  value={form.scheduledDate}
                  onChange={setField('scheduledDate')}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-maroon-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Pickup Address</label>
                <input
                  value={form.pickupAddress}
                  onChange={setField('pickupAddress')}
                  placeholder="Enter full pickup address"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-maroon-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Notes</label>
                <textarea
                  rows={2}
                  value={form.notes}
                  onChange={setField('notes')}
                  placeholder="Special instructions..."
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-maroon-500 resize-none"
                />
              </div>

              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                <input
                  type="checkbox"
                  id="recurring-check"
                  checked={form.isRecurring}
                  onChange={e => setForm(f => ({ ...f, isRecurring: e.target.checked }))}
                  className="w-4 h-4 accent-maroon-600"
                />
                <label htmlFor="recurring-check" className="text-sm text-gray-700 flex-1">Make this a recurring order</label>
                {form.isRecurring && (
                  <select
                    value={form.recurringFreq}
                    onChange={setField('recurringFreq')}
                    className="border border-gray-200 rounded-lg px-2 py-1 text-xs outline-none focus:ring-2 focus:ring-maroon-500"
                  >
                    {FREQ_OPTS.map(f => <option key={f} value={f}>{f.charAt(0) + f.slice(1).toLowerCase()}</option>)}
                  </select>
                )}
              </div>

              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setShowNew(false)}
                  className="flex-1 border border-gray-200 text-gray-600 py-2.5 rounded-lg text-sm hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 bg-maroon-600 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-maroon-700 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {submitting && <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                  {submitting ? 'Scheduling…' : 'Schedule Pickup'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
