'use client';

import { useState, useEffect } from 'react';
import { ShoppingCart, Plus, Minus, Trash2, CreditCard, Banknote, Smartphone, Search, User, CheckCircle } from 'lucide-react';
import apiClient, { unwrap } from '@/lib/api';

const posApi = {
  listServices: (params?: any) => apiClient.get('/services', { params }).then(unwrap),
  searchCustomers: (search: string) => apiClient.get('/customers', { params: { search } }).then(unwrap),
  createOrder: (data: any) => apiClient.post('/orders', data).then(unwrap),
};

type CartItem = { serviceId: string; serviceName: string; price: number; qty: number };

const PAY_METHODS = [
  { key: 'CASH', label: 'Cash', icon: Banknote },
  { key: 'UPI', label: 'UPI', icon: Smartphone },
  { key: 'CARD', label: 'Card', icon: CreditCard },
];

export default function POSPage() {
  const [services, setServices] = useState<any[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customer, setCustomer] = useState<any>(null);
  const [customerSearch, setCustomerSearch] = useState('');
  const [customerResults, setCustomerResults] = useState<any[]>([]);
  const [serviceSearch, setServiceSearch] = useState('');
  const [payMethod, setPayMethod] = useState('CASH');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => { posApi.listServices().then(setServices); }, []);

  const filteredServices = services.filter(s =>
    !serviceSearch || s.name?.toLowerCase().includes(serviceSearch.toLowerCase())
  );

  const handleCustomerSearch = async (val: string) => {
    setCustomerSearch(val);
    if (val.length < 2) { setCustomerResults([]); return; }
    const results = await posApi.searchCustomers(val);
    setCustomerResults(results?.items || results || []);
  };

  const addToCart = (svc: any) => {
    setCart(prev => {
      const existing = prev.find(c => c.serviceId === svc.id);
      if (existing) return prev.map(c => c.serviceId === svc.id ? { ...c, qty: c.qty + 1 } : c);
      return [...prev, { serviceId: svc.id, serviceName: svc.name, price: svc.basePrice || 0, qty: 1 }];
    });
  };

  const updateQty = (serviceId: string, delta: number) => {
    setCart(prev => prev
      .map(c => c.serviceId === serviceId ? { ...c, qty: c.qty + delta } : c)
      .filter(c => c.qty > 0)
    );
  };

  const total = cart.reduce((sum, c) => sum + c.price * c.qty, 0);

  const handleCheckout = async () => {
    if (!customer || cart.length === 0) return;
    setLoading(true);
    try {
      await posApi.createOrder({
        customerId: customer.id,
        orderDate: new Date().toISOString(),
        items: cart.map(c => ({ serviceId: c.serviceId, serviceName: c.serviceName, quantity: c.qty, price: c.price })),
        totalAmount: total,
        paymentMethod: payMethod,
        notes: 'Walk-in POS order',
      });
      setSuccess(true);
      setCart([]);
      setTimeout(() => setSuccess(false), 3000);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
          <CheckCircle size={40} className="text-green-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900">Order Created!</h2>
        <p className="text-gray-500">Customer will be notified</p>
        <button onClick={() => { setCustomer(null); setCustomerSearch(''); }} className="bg-maroon-600 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-maroon-700">
          New Order
        </button>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-120px)] flex gap-4">
      {/* Left — Service catalog */}
      <div className="flex-1 flex flex-col space-y-4 overflow-hidden">
        <div>
          <h1 className="text-xl font-bold text-gray-900">POS Terminal</h1>
          <p className="text-xs text-gray-500">Walk-in counter mode</p>
        </div>

        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={serviceSearch} onChange={e => setServiceSearch(e.target.value)} placeholder="Search services…" className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-maroon-500 outline-none" />
        </div>

        <div className="flex-1 overflow-y-auto grid grid-cols-2 md:grid-cols-3 gap-3 content-start">
          {filteredServices.map(svc => (
            <button
              key={svc.id}
              onClick={() => addToCart(svc)}
              className="bg-white border border-gray-200 rounded-xl p-3 text-left hover:border-maroon-300 hover:bg-maroon-50 transition-colors group"
            >
              <p className="font-medium text-gray-900 text-sm group-hover:text-maroon-700">{svc.name}</p>
              <p className="text-xs text-gray-400 mt-0.5">{svc.category?.replace(/_/g, ' ')}</p>
              <p className="text-maroon-600 font-semibold text-sm mt-1">₹{Number(svc.basePrice || 0).toLocaleString('en-IN')}</p>
              <div className="flex items-center gap-1 text-xs text-green-600 mt-1">
                <Plus size={10} /> Add to cart
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Right — Cart */}
      <div className="w-80 flex flex-col bg-white border border-gray-200 rounded-2xl overflow-hidden">
        {/* Customer selection */}
        <div className="p-4 border-b border-gray-100">
          <p className="text-xs font-medium text-gray-500 mb-2">CUSTOMER</p>
          {customer ? (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-maroon-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
                {customer.name?.[0]?.toUpperCase()}
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-gray-900">{customer.name}</p>
                <p className="text-xs text-gray-400">{customer.phone}</p>
              </div>
              <button onClick={() => { setCustomer(null); setCustomerSearch(''); }} className="text-xs text-gray-400 hover:text-red-500">×</button>
            </div>
          ) : (
            <div className="relative">
              <input
                value={customerSearch}
                onChange={e => handleCustomerSearch(e.target.value)}
                placeholder="Search customer…"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-maroon-500"
              />
              {customerResults.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 max-h-40 overflow-y-auto">
                  {customerResults.map((c: any) => (
                    <button
                      key={c.id}
                      onClick={() => { setCustomer(c); setCustomerSearch(''); setCustomerResults([]); }}
                      className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 border-b border-gray-100 last:border-0"
                    >
                      <p className="font-medium text-gray-900">{c.name}</p>
                      <p className="text-xs text-gray-400">{c.phone}</p>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Cart items */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          <p className="text-xs font-medium text-gray-500 mb-3">CART ({cart.length} items)</p>
          {cart.length === 0 ? (
            <div className="text-center py-8 text-gray-300">
              <ShoppingCart size={32} className="mx-auto mb-2" />
              <p className="text-xs">Add services from the catalog</p>
            </div>
          ) : cart.map(item => (
            <div key={item.serviceId} className="flex items-center gap-2">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">{item.serviceName}</p>
                <p className="text-xs text-gray-400">₹{item.price} each</p>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => updateQty(item.serviceId, -1)} className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 hover:bg-gray-200"><Minus size={10} /></button>
                <span className="text-sm font-semibold w-6 text-center">{item.qty}</span>
                <button onClick={() => updateQty(item.serviceId, 1)} className="w-6 h-6 rounded-full bg-maroon-100 flex items-center justify-center text-maroon-600 hover:bg-maroon-200"><Plus size={10} /></button>
              </div>
              <p className="text-sm font-semibold text-gray-900 w-16 text-right">₹{(item.price * item.qty).toLocaleString('en-IN')}</p>
            </div>
          ))}
        </div>

        {/* Total + Payment */}
        <div className="p-4 border-t border-gray-100 space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Total</span>
            <span className="text-xl font-bold text-gray-900">₹{total.toLocaleString('en-IN')}</span>
          </div>

          <div className="grid grid-cols-3 gap-1">
            {PAY_METHODS.map(m => {
              const Icon = m.icon;
              return (
                <button
                  key={m.key}
                  onClick={() => setPayMethod(m.key)}
                  className={`flex flex-col items-center gap-1 py-2 rounded-lg text-xs font-medium transition-colors ${payMethod === m.key ? 'bg-maroon-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                >
                  <Icon size={14} />
                  {m.label}
                </button>
              );
            })}
          </div>

          <button
            onClick={handleCheckout}
            disabled={!customer || cart.length === 0 || loading}
            className="w-full bg-maroon-600 text-white py-3 rounded-xl text-sm font-semibold hover:bg-maroon-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {loading ? 'Creating Order…' : `Confirm Order · ₹${total.toLocaleString('en-IN')}`}
          </button>
        </div>
      </div>
    </div>
  );
}
