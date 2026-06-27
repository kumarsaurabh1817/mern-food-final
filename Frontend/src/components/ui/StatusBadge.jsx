import { statusBadge, statusLabel } from '../../lib/orderStatus';

// Small pill showing an order's status with consistent colors across all roles.
// `pulse` adds a soft animated ring — used for "live" states like out_for_delivery.
export default function StatusBadge({ status, className = '', pulse = false }) {
  const isLive = status === 'out_for_delivery';
  return (
    <span
      className={`inline-flex items-center gap-1.5 flex-shrink-0 text-xs font-semibold px-2.5 py-1 rounded-full border ${statusBadge(
        status
      )} ${className}`}
    >
      {(pulse || isLive) && (
        <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
      )}
      {statusLabel(status)}
    </span>
  );
}
