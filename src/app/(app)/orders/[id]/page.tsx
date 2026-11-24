'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Clock, CheckCircle, XCircle, FileText, User, Package, MessageCircle, Phone, Copy, Share2 } from 'lucide-react';
import StatusBadge from '@/components/ui/StatusBadge';
import { ordersApi, billingApi } from '@/lib/api';
import { formatCurrency, formatDateTime } from '@/lib/utils';

const NEXT_STATUSES: Record<string, { label: string; value: string }[]> = {
  ORDER_CREATED: [{ label: 'Schedule Pickup', value: 'PICKUP_SCHEDULED' }, { label: 'Received at Facility', value: 'RECEIVED_AT_FACILITY' }],
  PICKUP_SCHEDULED: [{ label: 'Assign Pickup', value: 'PICKUP_ASSIGNED' }],
  PICKUP_ASSIGNED: [{ label: 'Collected', value: 'GARMENTS_COLLECTED' }],
  GARMENTS_COLLECTED: [{ label: 'Received at Facility', value: 'RECEIVED_AT_FACILITY' }],
  RECEIVED_AT_FACILITY: [{ label: 'Start Inspection', value: 'GARMENT_INSPECTION' }],
  GARMENT_INSPECTION: [{ label: 'Weigh', value: 'WEIGHT_VERIFICATION' }],
  WEIGHT_VERIFICATION: [{ label: 'Identify Stains', value: 'STAIN_IDENTIFICATION' }],
  STAIN_IDENTIFICATION: [{ label: 'Confirm Order', value: 'ORDER_CONFIRMED' }],
  ORDER_CONFIRMED: [{ label: 'Tag Garments', value: 'GARMENT_TAGGING' }],
  GARMENT_TAGGING: [{ label: 'Sort', value: 'SORTING' }],
  SORTING: [{ label: 'Add to Wash Queue', value: 'WASHING_QUEUE' }],
  WASHING_QUEUE: [{ label: 'Start Washing', value: 'WASHING_IN_PROGRESS' }],
  WASHING_IN_PROGRESS: [{ label: 'Drying', value: 'DRYING_IN_PROGRESS' }],
  DRYING_IN_PROGRESS: [{ label: 'Iron', value: 'IRONING' }, { label: 'Dry Clean', value: 'DRY_CLEANING' }],
  IRONING: [{ label: 'Quality Check', value: 'QUALITY_INSPECTION' }],
  DRY_CLEANING: [{ label: 'Quality Check', value: 'QUALITY_INSPECTION' }],
  QUALITY_INSPECTION: [{ label: 'Pack', value: 'FOLDING_PACKING' }, { label: 'Reprocess', value: 'REPROCESSING' }],
  REPROCESSING: [{ label: 'Quality Check', value: 'QUALITY_INSPECTION' }],
  FOLDING_PACKING: [{ label: 'Ready for Dispatch', value: 'READY_FOR_DISPATCH' }],
  READY_FOR_DISPATCH: [{ label: 'Out for Delivery', value: 'OUT_FOR_DELIVERY' }],
  OUT_FOR_DELIVERY: [{ label: 'Delivered', value: 'DELIVERED' }],
  DELIVERED: [{ label: 'Mark Paid', value: 'PAYMENT_COMPLETED' }],
  PAYMENT_COMPLETED: [{ label: 'Close Order', value: 'ORDER_CLOSED' }],
};

export default function OrderDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [remarks, setRemarks] = useState('');
  const [copied, setCopied] = useState(false);

  const fetchOrder = () => {
    setLoading(true);
    ordersApi.get(id as string)
      .then(setOrder)
      .catch(() => router.push('/orders'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchOrder(); }, [id]);

  const updateStatus = async (newStatus: string) => {
    setUpdating(true);
    try {
      await ordersApi.updateStatus(id as string, { status: newStatus, remarks });
      setRemarks('');
      fetchOrder();
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Failed to update status');
    } finally {
      setUpdating(false);
    }
  };

  const buildShareMessage = () => {
    const name = order?.customer?.name || 'Customer';
    const num = order?.orderNumber || '';
    const status = (order?.status || '').replace(/_/g, ' ');
    const services = (order?.items || []).map((i: any) => `  • ${i.serviceName} x${i.quantity}`).join('\n');
    const total = formatCurrency(order?.totalAmount || 0);
    const paid = formatCurrency(order?.amountPaid || 0);
    const due = formatCurrency(order?.amountDue || 0);
    return `Hi ${name}! 👋\n\nYour order *#${num}* update:\n📦 Status: ${status}\n\nServices:\n${services}\n\n💰 Total: ${total}\n✅ Paid: ${paid}${order?.amountDue > 0 ? `\n🔴 Due: ${due}` : ''}\n\nThank you for choosing us! 🧺`;
  };

  const getPhone = () => {
    const mobile = order?.customer?.mobile || '';
    const digits = mobile.replace(/\D/g, '');
    return digits.startsWith('91') ? digits : `91${digits}`;
  };

  const shareWhatsApp = () => {
    const msg = encodeURIComponent(buildShareMessage());
    window.open(`https://wa.me/${getPhone()}?text=${msg}`, '_blank');
  };

  const shareSMS = () => {
    const msg = encodeURIComponent(buildShareMessage());
    window.open(`sms:+${getPhone()}?body=${msg}`, '_blank');
  };

  const copyMessage = async () => {
    try {
      await navigator.clipboard.writeText(buildShareMessage());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      alert(buildShareMessage());
    }
  };

  const generateInvoice = async () => {
    try {
      await billingApi.createFromOrder(id as string);
      alert('Invoice generated successfully');
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Failed to generate invoice');
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin w-8 h-8 border-4 border-maroon-600 border-t-transparent rounded-full" />
    </div>
  );

  if (!order) return null;

  const nextStatuses = NEXT_STATUSES[order.status] || [];

  return (
    <div className="max-w-5xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="p-2 hover:bg-gray-100 rounded-lg">
            <ArrowLeft size={18} />
          </button>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Order {order.orderNumber}</h2>
            <p className="text-sm text-gray-500">{formatDateTime(order.orderDate)}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <StatusBadge status={order.status} />
          <StatusBadge status={order.paymentStatus} type="payment" />
          <button onClick={generateInvoice}
            className="flex items-center gap-2 px-3 py-1.5 text-sm border border-gray-200 rounded-lg hover:bg-gray-50">
            <FileText size={14} /> Invoice
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left column */}
        <div className="lg:col-span-2 space-y-5">
          {/* Customer card */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="font-medium text-gray-900 mb-3 flex items-center gap-2"><User size={16} />Customer</h3>
            <div className="text-sm space-y-1">
              <p className="font-medium text-gray-900">{order.customer?.name}</p>
              <p className="text-gray-500">{order.customer?.mobile}</p>
              <p className="text-gray-500">{order.customer?.email}</p>
            </div>
          </div>

          {/* Items */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="font-medium text-gray-900 mb-3 flex items-center gap-2"><Package size={16} />Services</h3>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left pb-2 text-gray-500 font-medium">Service</th>
                  <th className="text-right pb-2 text-gray-500 font-medium">Qty</th>
                  <th className="text-right pb-2 text-gray-500 font-medium">Rate</th>
                  <th className="text-right pb-2 text-gray-500 font-medium">Total</th>
                </tr>
              </thead>
              <tbody>
                {(order.items || []).map((item: any) => (
                  <tr key={item.id} className="border-b border-gray-50">
                    <td className="py-2">{item.serviceName}</td>
                    <td className="py-2 text-right">{item.quantity}</td>
                    <td className="py-2 text-right">{formatCurrency(item.unitPrice)}</td>
                    <td className="py-2 text-right font-medium">{formatCurrency(item.totalPrice)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="mt-3 pt-3 border-t border-gray-100 space-y-1 text-sm text-right">
              <div className="text-gray-500">Subtotal: {formatCurrency(order.subtotal)}</div>
              <div className="text-gray-500">Tax: {formatCurrency(order.taxAmount)}</div>
              {order.expressCharge > 0 && <div className="text-orange-600">Express: {formatCurrency(order.expressCharge)}</div>}
              {order.discountAmount > 0 && <div className="text-green-600">Discount: -{formatCurrency(order.discountAmount)}</div>}
              <div className="text-base font-semibold">Total: {formatCurrency(order.totalAmount)}</div>
              <div className="text-green-600">Paid: {formatCurrency(order.amountPaid)}</div>
              <div className="text-red-500">Due: {formatCurrency(order.amountDue)}</div>
            </div>
          </div>

          {/* Garments */}
          {(order.garments || []).length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h3 className="font-medium text-gray-900 mb-3">Garments ({order.garments.length})</h3>
              <div className="space-y-2">
                {order.garments.map((g: any) => (
                  <div key={g.id} className="flex items-center justify-between text-sm bg-gray-50 rounded-lg px-3 py-2">
                    <span className="font-medium text-gray-900">{g.name}</span>
                    <span className="text-gray-500">{g.category}</span>
                    <span className="text-gray-400 text-xs font-mono">{g.tagId}</span>
                    <StatusBadge status={g.status} />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right column */}
        <div className="space-y-5">
          {/* Status update */}
          {nextStatuses.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h3 className="font-medium text-gray-900 mb-3">Update Status</h3>
              <textarea
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="Remarks (optional)"
                rows={2}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-maroon-500 outline-none mb-3 resize-none"
              />
              <div className="space-y-2">
                {nextStatuses.map((ns) => (
                  <button
                    key={ns.value}
                    onClick={() => updateStatus(ns.value)}
                    disabled={updating}
                    className="w-full px-3 py-2 text-sm font-medium text-white bg-maroon-600 rounded-lg hover:bg-maroon-700 disabled:opacity-50"
                  >
                    {ns.label}
                  </button>
                ))}
              </div>
              {['ORDER_CREATED', 'PICKUP_SCHEDULED', 'PICKUP_ASSIGNED', 'GARMENT_INSPECTION', 'AWAITING_CUSTOMER_APPROVAL'].includes(order.status) && (
                <button onClick={() => updateStatus('CANCELLED')} disabled={updating}
                  className="w-full mt-2 px-3 py-2 text-sm font-medium text-red-600 border border-red-200 rounded-lg hover:bg-red-50 disabled:opacity-50">
                  Cancel Order
                </button>
              )}
            </div>
          )}

          {/* Summary */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-3 text-sm">
            <h3 className="font-medium text-gray-900">Details</h3>
            {[
              ['Order #', order.orderNumber],
              ['Branch', order.branch?.name || '—'],
              ['Garments', order.garmentCount],
              ['Express', order.isExpress ? 'Yes' : 'No'],
              ['Pickup', order.isPickup ? 'Yes' : 'No'],
              ['Delivery', order.isDelivery ? 'Yes' : 'No'],
              ['Source', order.source],
            ].map(([label, value]) => (
              <div key={label as string} className="flex justify-between">
                <span className="text-gray-500">{label}</span>
                <span className="text-gray-900 font-medium">{value}</span>
              </div>
            ))}
          </div>

          {/* Share */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="font-medium text-gray-900 mb-3 flex items-center gap-2"><Share2 size={14} />Share with Customer</h3>
            <div className="space-y-2">
              <button
                onClick={shareWhatsApp}
                className="w-full flex items-center gap-2 px-3 py-2.5 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700"
              >
                <MessageCircle size={16} />
                Send via WhatsApp
              </button>
              <button
                onClick={shareSMS}
                className="w-full flex items-center gap-2 px-3 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
              >
                <Phone size={16} />
                Send via SMS
              </button>
              <button
                onClick={copyMessage}
                className="w-full flex items-center gap-2 px-3 py-2.5 text-sm font-medium text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50"
              >
                <Copy size={16} />
                {copied ? 'Copied!' : 'Copy Message'}
              </button>
            </div>
            {order?.customer?.mobile && (
              <p className="mt-2 text-xs text-gray-400 text-center">Sending to {order.customer.mobile}</p>
            )}
          </div>

          {/* History */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="font-medium text-gray-900 mb-3 flex items-center gap-2"><Clock size={14} />History</h3>
            <div className="space-y-3">
              {(order.history || []).map((h: any) => (
                <div key={h.id} className="text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-maroon-500 mt-0.5 shrink-0" />
                    <span className="font-medium text-gray-900">{h.newStatus?.replace(/_/g, ' ')}</span>
                  </div>
                  <div className="ml-3.5 text-gray-400">{formatDateTime(h.changedAt)}</div>
                  {h.remarks && <div className="ml-3.5 text-gray-500 italic">{h.remarks}</div>}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
