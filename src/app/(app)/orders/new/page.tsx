'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';
import { ordersApi, customersApi, servicesApi } from '@/lib/api';

type OrderItem = { serviceName: string; serviceId: string; quantity: number; unitPrice: number; gstRate: number; discountAmount: number; isExpress: boolean };
type Garment = { name: string; category: string; quantity: number; color: string; conditionAtReceipt: string };

export default function NewOrderPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [customers, setCustomers] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    customerId: '',
    isExpress: false,
    isPickup: false,
    isDelivery: false,
    specialInstructions: '',
    discountPercent: 0,
    source: 'WALK_IN',
  });

  const [items, setItems] = useState<OrderItem[]>([
    { serviceName: '', serviceId: '', quantity: 1, unitPrice: 0, gstRate: 18, discountAmount: 0, isExpress: false },
  ]);

  const [garments, setGarments] = useState<Garment[]>([
    { name: '', category: '', quantity: 1, color: '', conditionAtReceipt: 'GOOD' },
  ]);

  useEffect(() => {
    customersApi.list({ limit: 100 }).then((r: any) => setCustomers(r.data || [])).catch(() => {});
    servicesApi.list().then((r: any) => {
      if (Array.isArray(r)) setServices(r);
      else if (r && Array.isArray(r.data)) setServices(r.data);
      else setServices([]);
    }).catch(() => {});
  }, []);

  const updateItem = (i: number, field: keyof OrderItem, value: any) => {
    setItems((prev) => prev.map((item, idx) => idx === i ? { ...item, [field]: value } : item));
  };

  const updateGarment = (i: number, field: keyof Garment, value: any) => {
    setGarments((prev) => prev.map((g, idx) => idx === i ? { ...g, [field]: value } : g));
  };

  const subtotal = items.reduce((sum, item) => sum + item.quantity * item.unitPrice - item.discountAmount, 0);
  const tax = items.reduce((sum, item) => {
    const line = item.quantity * item.unitPrice - item.discountAmount;
    return sum + line * (item.gstRate / 100);
  }, 0);
  const total = subtotal + tax + (form.isExpress ? subtotal * 0.5 : 0) + (form.isDelivery ? 50 : 0) - subtotal * (form.discountPercent / 100);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.customerId) { setError('Please select a customer'); return; }
    if (items.some((i) => !i.serviceId || !i.serviceName || i.unitPrice <= 0)) { setError('Please select a service from the dropdown for each line item'); return; }

    setLoading(true);
    setError('');
    try {
      const order = await ordersApi.create({
        ...form,
        discountPercent: Number(form.discountPercent),
        items,
        garments: garments.filter((g) => g.name),
      });
      router.push(`/orders/${(order as any).id}`);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to create order');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <button type="button" onClick={() => router.back()} className="p-2 hover:bg-gray-100 rounded-lg">
          <ArrowLeft size={18} />
        </button>
        <h2 className="text-lg font-semibold text-gray-900">New Order</h2>
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>}

      {/* Customer & Options */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
        <h3 className="font-medium text-gray-900">Customer & Options</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Customer *</label>
            <select
              value={form.customerId}
              onChange={(e) => setForm({ ...form, customerId: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-maroon-500 outline-none bg-white text-gray-900"
            >
              <option value="">Select customer...</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>{c.name} — {c.mobile}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Source</label>
            <select
              value={form.source}
              onChange={(e) => setForm({ ...form, source: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-maroon-500 outline-none bg-white text-gray-900"
            >
              {['WALK_IN', 'PHONE', 'APP', 'WEBSITE', 'WHATSAPP'].map((s) => (
                <option key={s} value={s}>{s.replace('_', ' ')}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="flex flex-wrap gap-4">
          {(['isExpress', 'isPickup', 'isDelivery'] as const).map((key) => (
            <label key={key} className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form[key]}
                onChange={(e) => setForm({ ...form, [key]: e.target.checked })}
                className="w-4 h-4 text-maroon-600 rounded"
              />
              <span className="text-sm text-gray-700">
                {key === 'isExpress' ? 'Express (+50%)' : key === 'isPickup' ? 'Pickup Required' : 'Delivery Required'}
              </span>
            </label>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Discount %</label>
            <input
              type="number"
              min={0}
              max={100}
              value={form.discountPercent}
              onChange={(e) => setForm({ ...form, discountPercent: Number(e.target.value) })}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-maroon-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Special Instructions</label>
            <input
              value={form.specialInstructions}
              onChange={(e) => setForm({ ...form, specialInstructions: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-maroon-500 outline-none"
              placeholder="e.g. Handle with care"
            />
          </div>
        </div>
      </div>

      {/* Service Items */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-medium text-gray-900">Services</h3>
          <button
            type="button"
            onClick={() => setItems((prev) => [...prev, { serviceName: '', serviceId: '', quantity: 1, unitPrice: 0, gstRate: 18, discountAmount: 0, isExpress: false }])}
            className="text-sm text-maroon-600 flex items-center gap-1"
          >
            <Plus size={14} /> Add Line
          </button>
        </div>
        <div className="space-y-3">
          {items.map((item, i) => (
            <div key={i} className="grid grid-cols-12 gap-2 items-end">
              <div className="col-span-4">
                {i === 0 && <label className="block text-xs text-gray-500 mb-1">Service</label>}
                <select
                  value={item.serviceId}
                  onChange={(e) => {
                    const svc = services.find((s) => s.id === e.target.value);
                    updateItem(i, 'serviceId', e.target.value);
                    if (svc) {
                      updateItem(i, 'serviceName', svc.name);
                      updateItem(i, 'unitPrice', Number(svc.basePrice));
                      updateItem(i, 'gstRate', Number(svc.gstRate));
                    }
                  }}
                  className="w-full px-2 py-2 text-sm border border-gray-200 rounded-lg focus:ring-1 focus:ring-maroon-500 outline-none bg-white text-gray-900"
                >
                  <option value="">Select or type...</option>
                  {services.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
              <div className="col-span-2">
                {i === 0 && <label className="block text-xs text-gray-500 mb-1">Qty</label>}
                <input type="number" min={1} value={item.quantity}
                  onChange={(e) => updateItem(i, 'quantity', Number(e.target.value))}
                  className="w-full px-2 py-2 text-sm border border-gray-200 rounded-lg focus:ring-1 focus:ring-maroon-500 outline-none" />
              </div>
              <div className="col-span-2">
                {i === 0 && <label className="block text-xs text-gray-500 mb-1">Rate ₹</label>}
                <input type="number" min={0} value={item.unitPrice}
                  onChange={(e) => updateItem(i, 'unitPrice', Number(e.target.value))}
                  className="w-full px-2 py-2 text-sm border border-gray-200 rounded-lg focus:ring-1 focus:ring-maroon-500 outline-none" />
              </div>
              <div className="col-span-2">
                {i === 0 && <label className="block text-xs text-gray-500 mb-1">GST %</label>}
                <input type="number" min={0} max={28} value={item.gstRate}
                  onChange={(e) => updateItem(i, 'gstRate', Number(e.target.value))}
                  className="w-full px-2 py-2 text-sm border border-gray-200 rounded-lg focus:ring-1 focus:ring-maroon-500 outline-none" />
              </div>
              <div className="col-span-1 text-right text-sm font-medium text-gray-900">
                {i === 0 && <div className="text-xs text-gray-500 mb-1">Total</div>}
                <div>₹{((item.quantity * item.unitPrice - item.discountAmount) * (1 + item.gstRate / 100)).toFixed(0)}</div>
              </div>
              <div className="col-span-1 flex justify-end">
                {items.length > 1 && (
                  <button type="button" onClick={() => setItems((prev) => prev.filter((_, idx) => idx !== i))}
                    className="p-1 text-red-400 hover:text-red-600">
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
        <div className="border-t border-gray-100 pt-3 space-y-1 text-sm text-right">
          <div className="text-gray-500">Subtotal: <span className="text-gray-900 font-medium">₹{subtotal.toFixed(2)}</span></div>
          <div className="text-gray-500">Tax: <span className="text-gray-900 font-medium">₹{tax.toFixed(2)}</span></div>
          {form.isExpress && <div className="text-orange-600">Express surcharge: ₹{(subtotal * 0.5).toFixed(2)}</div>}
          {form.isDelivery && <div className="text-gray-500">Delivery: ₹50.00</div>}
          {form.discountPercent > 0 && <div className="text-green-600">Discount: -₹{(subtotal * form.discountPercent / 100).toFixed(2)}</div>}
          <div className="text-base font-semibold text-gray-900 border-t pt-1">Total: ₹{total.toFixed(2)}</div>
        </div>
      </div>

      {/* Garments */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-medium text-gray-900">Garments <span className="text-xs text-gray-400 font-normal">(optional)</span></h3>
          <button type="button"
            onClick={() => setGarments((prev) => [...prev, { name: '', category: '', quantity: 1, color: '', conditionAtReceipt: 'GOOD' }])}
            className="text-sm text-maroon-600 flex items-center gap-1">
            <Plus size={14} /> Add Garment
          </button>
        </div>
        {garments.map((g, i) => (
          <div key={i} className="grid grid-cols-5 gap-2 items-center">
            <input placeholder="Name (e.g. Shirt)" value={g.name}
              onChange={(e) => updateGarment(i, 'name', e.target.value)}
              className="col-span-2 px-2 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:ring-1 focus:ring-maroon-500" />
            <input placeholder="Category" value={g.category}
              onChange={(e) => updateGarment(i, 'category', e.target.value)}
              className="px-2 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:ring-1 focus:ring-maroon-500" />
            <input placeholder="Color" value={g.color}
              onChange={(e) => updateGarment(i, 'color', e.target.value)}
              className="px-2 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:ring-1 focus:ring-maroon-500" />
            <div className="flex items-center gap-1">
              <input type="number" min={1} value={g.quantity}
                onChange={(e) => updateGarment(i, 'quantity', Number(e.target.value))}
                className="w-16 px-2 py-2 text-sm border border-gray-200 rounded-lg outline-none" />
              {garments.length > 1 && (
                <button type="button" onClick={() => setGarments((prev) => prev.filter((_, idx) => idx !== i))}
                  className="p-1 text-red-400 hover:text-red-600">
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-3 justify-end">
        <button type="button" onClick={() => router.back()}
          className="px-5 py-2.5 text-sm font-medium text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50">
          Cancel
        </button>
        <button type="submit" disabled={loading}
          className="px-5 py-2.5 text-sm font-medium text-white bg-maroon-600 rounded-lg hover:bg-maroon-700 disabled:opacity-50 flex items-center gap-2">
          {loading ? <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" /> : null}
          Create Order
        </button>
      </div>
    </form>
  );
}
