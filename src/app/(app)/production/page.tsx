'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Package, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { ordersApi } from '@/lib/api';

const PRODUCTION_STAGES = [
  { key: 'RECEIVED', label: 'Received', color: 'border-gray-200 bg-gray-50' },
  { key: 'SORTING', label: 'Sorting', color: 'border-maroon-200 bg-maroon-50' },
  { key: 'PRE_TREATMENT', label: 'Pre-Treatment', color: 'border-indigo-200 bg-indigo-50' },
  { key: 'WASHING', label: 'Washing', color: 'border-cyan-200 bg-cyan-50' },
  { key: 'DRYING', label: 'Drying', color: 'border-orange-200 bg-orange-50' },
  { key: 'IRONING', label: 'Ironing / Pressing', color: 'border-yellow-200 bg-yellow-50' },
  { key: 'QUALITY_CHECK', label: 'Quality Check', color: 'border-purple-200 bg-purple-50' },
  { key: 'PACKING', label: 'Packing', color: 'border-teal-200 bg-teal-50' },
  { key: 'READY_FOR_DELIVERY', label: 'Ready', color: 'border-green-200 bg-green-50' },
];

export default function ProductionPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    ordersApi.list({ limit: 100 })
      .then((data: any) => {
        const all = data?.data || [];
        setOrders(all.filter((o: any) => PRODUCTION_STAGES.map((s) => s.key).includes(o.status)));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const getOrdersForStage = (stageKey: string) =>
    orders.filter((o) => o.status === stageKey);

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Production Board</h2>
        <p className="text-sm text-gray-500">Track orders through the washing and processing pipeline</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin w-8 h-8 border-4 border-maroon-600 border-t-transparent rounded-full" />
        </div>
      ) : (
        <div className="overflow-x-auto pb-4">
          <div className="flex gap-3 min-w-max">
            {PRODUCTION_STAGES.map((stage) => {
              const stageOrders = getOrdersForStage(stage.key);
              return (
                <div key={stage.key} className={`w-56 border rounded-xl ${stage.color} flex flex-col min-h-48`}>
                  <div className="px-3 py-2.5 border-b border-current/10">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-gray-700">{stage.label}</span>
                      <span className="text-xs bg-white/60 text-gray-600 px-1.5 py-0.5 rounded-full font-medium">{stageOrders.length}</span>
                    </div>
                  </div>
                  <div className="flex-1 p-2 space-y-2 overflow-y-auto max-h-96">
                    {stageOrders.map((order) => (
                      <Link key={order.id} href={`/orders/${order.id}`}
                        className="block bg-white rounded-lg border border-white/60 shadow-sm p-2.5 hover:shadow-md transition-shadow cursor-pointer">
                        <div className="font-medium text-xs text-gray-900">{order.orderNumber}</div>
                        <div className="text-xs text-gray-500 mt-0.5 truncate">{order.customer?.name}</div>
                        {order.isExpress && (
                          <span className="text-xs bg-orange-100 text-orange-600 px-1 py-0.5 rounded mt-1 inline-block">EXPRESS</span>
                        )}
                      </Link>
                    ))}
                    {stageOrders.length === 0 && (
                      <div className="text-center py-6 text-gray-400 text-xs">Empty</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Summary */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Pipeline Summary</h3>
        <div className="flex flex-wrap gap-2">
          {PRODUCTION_STAGES.map((stage) => {
            const count = getOrdersForStage(stage.key).length;
            return count > 0 ? (
              <div key={stage.key} className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5">
                <span className="text-xs text-gray-600">{stage.label}</span>
                <span className="text-xs font-bold text-maroon-600">{count}</span>
              </div>
            ) : null;
          })}
          {orders.length === 0 && (
            <p className="text-sm text-gray-400">No orders in production pipeline</p>
          )}
        </div>
      </div>
    </div>
  );
}
