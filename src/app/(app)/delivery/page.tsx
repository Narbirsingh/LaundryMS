'use client';

import { useState, useEffect } from 'react';
import { Truck, Package, MapPin, CheckCircle, Clock, Phone, User, Navigation } from 'lucide-react';
import apiClient, { unwrap } from '@/lib/api';

const deliveryApi = {
  getStats: () => apiClient.get('/delivery/stats').then(unwrap),
  getRiderQueue: () => apiClient.get('/delivery/queue').then(unwrap),
  getPickupQueue: () => apiClient.get('/delivery/pickup-queue').then(unwrap),
  markDelivered: (id: string) => apiClient.patch(`/delivery/${id}/delivered`).then(unwrap),
  markPickupDone: (id: string) => apiClient.patch(`/delivery/${id}/pickup-done`).then(unwrap),
};

const STATUS_COLOR: Record<string, string> = {
  PICKUP_SCHEDULED: 'bg-maroon-100 text-maroon-700',
  PICKUP_ASSIGNED: 'bg-indigo-100 text-indigo-700',
  DELIVERY_ASSIGNED: 'bg-yellow-100 text-yellow-700',
  OUT_FOR_DELIVERY: 'bg-orange-100 text-orange-700',
};

const toArray = (v: any): any[] => {
  if (Array.isArray(v)) return v;
  if (v && Array.isArray(v.data)) return v.data;
  if (v && Array.isArray(v.items)) return v.items;
  return [];
};

export default function DeliveryPage() {
  const [tab, setTab] = useState<'deliveries' | 'pickups'>('deliveries');
  const [stats, setStats] = useState<any>(null);
  const [deliveries, setDeliveries] = useState<any[]>([]);
  const [pickups, setPickups] = useState<any[]>([]);

  const load = async () => {
    try {
      const [s, d, p] = await Promise.all([
        deliveryApi.getStats(),
        deliveryApi.getRiderQueue(),
        deliveryApi.getPickupQueue(),
      ]);
      setStats(s); setDeliveries(toArray(d)); setPickups(toArray(p));
    } catch { /* auth redirect handled by interceptor */ }
  };

  useEffect(() => { load(); }, []);

  const OrderCard = ({ order, isPickup }: { order: any; isPickup: boolean }) => (
    <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLOR[order.status] || 'bg-gray-100 text-gray-600'}`}>
              {order.status?.replace(/_/g, ' ')}
            </span>
          </div>
          <p className="font-semibold text-gray-900 font-mono text-sm">#{order.orderNumber}</p>
        </div>
        {isPickup
          ? order.orderDate && <p className="text-xs text-gray-400">{new Date(order.orderDate).toLocaleDateString('en-IN')}</p>
          : order.expectedDelivery && <p className="text-xs text-gray-400">By {new Date(order.expectedDelivery).toLocaleDateString('en-IN')}</p>
        }
      </div>

      {order.customer && (
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-sm text-gray-700">
            <User size={14} className="text-gray-400" />
            <span className="font-medium">{order.customer.name}</span>
          </div>
          {order.customer.phone && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Phone size={14} className="text-gray-400" />
              <a href={`tel:${order.customer.phone}`} className="text-maroon-600 hover:underline">{order.customer.phone}</a>
            </div>
          )}
          {(order.deliveryAddress || order.customer.address) && (
            <div className="flex items-start gap-2 text-sm text-gray-600">
              <MapPin size={14} className="text-gray-400 mt-0.5 flex-shrink-0" />
              <span>{order.deliveryAddress || order.customer.address}</span>
            </div>
          )}
        </div>
      )}

      <div className="flex gap-2">
        {order.customer?.address && (
          <a
            href={`https://maps.google.com/?q=${encodeURIComponent(order.customer.address)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-xs border border-maroon-200 text-maroon-600 rounded-lg px-3 py-1.5 hover:bg-maroon-50"
          >
            <Navigation size={12} /> Navigate
          </a>
        )}
        <button
          onClick={() => isPickup ? deliveryApi.markPickupDone(order.id).then(load) : deliveryApi.markDelivered(order.id).then(load)}
          className="flex-1 flex items-center justify-center gap-1 bg-green-600 text-white text-xs rounded-lg px-3 py-1.5 hover:bg-green-700 font-medium"
        >
          <CheckCircle size={12} /> Mark {isPickup ? 'Collected' : 'Delivered'}
        </button>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Rider / Delivery View</h1>
        <p className="text-sm text-gray-500 mt-1">Manage pickups and deliveries in the field</p>
      </div>

      {stats && (
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3">
            <div className="w-10 h-10 bg-maroon-100 rounded-xl flex items-center justify-center"><Package size={18} className="text-maroon-600" /></div>
            <div><p className="text-2xl font-bold text-gray-900">{stats.pendingPickups}</p><p className="text-xs text-gray-500">Pending Pickups</p></div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center"><Truck size={18} className="text-orange-600" /></div>
            <div><p className="text-2xl font-bold text-gray-900">{stats.pendingDeliveries}</p><p className="text-xs text-gray-500">Out for Delivery</p></div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center"><CheckCircle size={18} className="text-green-600" /></div>
            <div><p className="text-2xl font-bold text-gray-900">{stats.completedToday}</p><p className="text-xs text-gray-500">Delivered Today</p></div>
          </div>
        </div>
      )}

      <div className="border-b border-gray-200">
        <div className="flex gap-6">
          {(['deliveries', 'pickups'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)} className={`pb-3 text-sm font-medium capitalize border-b-2 transition-colors ${tab === t ? 'border-maroon-600 text-maroon-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
              {t === 'deliveries' ? `Deliveries (${deliveries.length})` : `Pickups (${pickups.length})`}
            </button>
          ))}
        </div>
      </div>

      {tab === 'deliveries' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {deliveries.length === 0 ? (
            <div className="col-span-3 text-center py-16 text-gray-400">
              <Truck size={40} className="mx-auto mb-3 opacity-30" />
              <p>No pending deliveries</p>
            </div>
          ) : deliveries.map(d => <OrderCard key={d.id} order={d} isPickup={false} />)}
        </div>
      )}

      {tab === 'pickups' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {pickups.length === 0 ? (
            <div className="col-span-3 text-center py-16 text-gray-400">
              <Package size={40} className="mx-auto mb-3 opacity-30" />
              <p>No pending pickups</p>
            </div>
          ) : pickups.map(p => <OrderCard key={p.id} order={p} isPickup={true} />)}
        </div>
      )}
    </div>
  );
}
