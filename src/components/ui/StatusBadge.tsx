import { cn } from '@/lib/utils';
import { ORDER_STATUS_COLORS, ORDER_STATUS_LABELS, ITR_STATUS_LABELS } from '@/lib/constants';

interface StatusBadgeProps {
  status: string;
  type?: 'order' | 'itr' | 'payment';
  className?: string;
}

const PAYMENT_COLORS: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  PARTIAL: 'bg-orange-100 text-orange-800',
  PAID: 'bg-green-100 text-green-800',
  REFUNDED: 'bg-maroon-100 text-maroon-800',
  FAILED: 'bg-red-100 text-red-800',
};

export default function StatusBadge({ status, type = 'order', className }: StatusBadgeProps) {
  const colorClass =
    type === 'payment'
      ? PAYMENT_COLORS[status] || 'bg-gray-100 text-gray-800'
      : ORDER_STATUS_COLORS[status] || 'bg-gray-100 text-gray-700';

  const label =
    type === 'itr'
      ? ITR_STATUS_LABELS[status] || status
      : ORDER_STATUS_LABELS[status] || status;

  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium whitespace-nowrap',
        colorClass,
        className,
      )}
    >
      {label}
    </span>
  );
}
