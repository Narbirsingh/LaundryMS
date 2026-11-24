'use client';

import { useEffect, useState } from 'react';
import { Truck, Package, ArrowUpRight } from 'lucide-react';
import Link from 'next/link';
import { ordersApi } from '@/lib/api';
import { formatDate } from '@/lib/utils';

type ViewTab = 'pickup' | 'delivery';

const PICKUP_STATUSES = ['PICKUP_SCHEDULED', 'PICKUP_IN_PROGRESS'];
const DELIVERY_STATUSES = ['OUT_FOR_DELIVERY', 'DELIVERY_ATTEMPTED'];

const STATUS_COLOR: Record<string, string> = {
  PICKUP_SCHEDULED: 'bg-maroon-100 text-maroon-700',
  PICKUP_IN_PROGRESS: 'bg-indigo-100 text-indigo-700',
  OUT_FOR_DELIVERY: 'bg-orange-100 text-orange-700',
  DELIVERY_ATTEMPTED: 'bg-red-100 text-red-700',
};

export default function PickupDeliveryPage() {
  const [tab, setTab] = useState<ViewTab>('pickup');
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const statuses = tab === 'pickup' ? PICKUP_STATUSES : DELIVERY_STATUSES;
    ordersApi.list({ limit: 100 })
      .then((data: any) => {
        const all = data?.data || [];
        setOrders(all.filter((o: any) => statuses.includes(o.status)));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [tab]);

  const stats = {
    pickupScheduled: 0,
    pickupInProgress: 0,
    outForDelivery: 0,
    deliveryAttempted: 0,
  };

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Pickup & Delivery</h2>
        <p className="text-sm text-gray-500">Manage order pickups and deliveries in progress</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        <button onClick={() => setTab('pickup')}
          className={`flex items-center gap-2 px-4 py-2 text-sm rounded-lg font-medium transition-colors ${tab === 'pickup' ? 'bg-maroon-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
          <Package size={14} /> Pickups
        </button>
        <button onClick={() => setTab('delivery')}
          className={`flex items-center gap-2 px-4 py-2 text-sm rounded-lg font-medium transition-colors ${tab === 'delivery' ? 'bg-orange-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
          <Truck size={14} /> Deliveries
        </button>
      </div>

      {/* Orders */}
      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="animate-spin w-6 h-6 border-4 border-maroon-600 border-t-transparent rounded-full" />
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          {orders.length > 0 ? (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Order</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Customer</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Address</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Status</th>
                  {tab === 'delivery' && (
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Expected</th>
                  )}
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Action</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900">{order.orderNumber}</div>
                      {order.isExpress && (
                        <span className="text-xs bg-orange-100 text-orange-600 px-1 py-0.5 rounded">EXPRESS</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900">{order.customer?.name}</div>
                      <div className="text-xs text-gray-500">{order.customer?.mobile}</div>
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs max-w-xs">
                      {order.pickupAddress || order.deliveryAddress || '—'}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLOR[order.status] || 'bg-gray-100 text-gray-600'}`}>
                        {order.status?.replace(/_/g, ' ')}
                      </span>
                    </td>
                    {tab === 'delivery' && (
                      <td className="px-4 py-3 text-gray-500 text-xs">
                        {order.expectedDeliveryDate ? formatDate(order.expectedDeliveryDate) : '—'}
                      </td>
                    )}
                    <td className="px-4 py-3 text-right">
                      <Link href={`/orders/${order.id}`}
                        className="inline-flex items-center gap-1 text-maroon-600 hover:text-maroon-800 text-xs font-medium">
                        Open <ArrowUpRight size={11} />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="text-center py-16 text-gray-400">
              {tab === 'pickup' ? (
                <>
                  <Package size={28} className="mx-auto mb-2 opacity-30" />
                  <p>No pickups scheduled or in progress</p>
                </>
              ) : (
                <>
                  <Truck size={28} className="mx-auto mb-2 opacity-30" />
                  <p>No deliveries out right now</p>
                </>
              )}
            </div>
          )}
        </div>
      )}

      {/* Instructions */}
      <div className="bg-maroon-50 border border-maroon-100 rounded-xl p-4 text-sm text-maroon-800">
        <strong>Tip:</strong> To move an order into pickup or delivery status, open the order and use the status update buttons.
        Orders with status <code className="bg-maroon-100 px-1 rounded">PICKUP_SCHEDULED</code> or <code className="bg-maroon-100 px-1 rounded">OUT_FOR_DELIVERY</code> appear here automatically.
      </div>
    </div>
  );
}
