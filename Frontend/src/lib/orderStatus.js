// ─── Order status: single source of truth ────────────────────────────────────
// STATUS_STEPS / STATUS_LABEL / STATUS_BADGE were duplicated across OrdersPage,
// OwnerOrdersPage and OrderTrackingPage. Centralized here so labels, colors and
// the progress timeline stay consistent everywhere.

/** Ordered lifecycle steps shown in the customer tracking timeline. */
export const STATUS_STEPS = [
  { key: 'pending', label: 'Order Placed' },
  { key: 'confirmed', label: 'Confirmed' },
  { key: 'preparing', label: 'Preparing' },
  { key: 'ready_for_pickup', label: 'Ready' },
  { key: 'out_for_delivery', label: 'On the way' },
  { key: 'delivered', label: 'Delivered' },
];

/** Human-readable label per status. */
export const STATUS_LABEL = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  preparing: 'Preparing',
  ready_for_pickup: 'Ready for Pickup',
  out_for_delivery: 'Out for Delivery',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
};

/** Tailwind badge classes per status (soft bg + border + text). */
export const STATUS_BADGE = {
  pending: 'bg-amber-50 text-amber-700 border-amber-200',
  confirmed: 'bg-blue-50 text-blue-700 border-blue-200',
  preparing: 'bg-purple-50 text-purple-700 border-purple-200',
  ready_for_pickup: 'bg-cyan-50 text-cyan-700 border-cyan-200',
  out_for_delivery: 'bg-orange-50 text-orange-700 border-orange-200',
  delivered: 'bg-green-50 text-green-700 border-green-200',
  cancelled: 'bg-red-50 text-red-700 border-red-200',
};

export const statusLabel = (status) => STATUS_LABEL[status] || status;
export const statusBadge = (status) =>
  STATUS_BADGE[status] || 'bg-gray-50 text-gray-600 border-gray-200';

/** Index of a status within the linear lifecycle (-1 if not found/cancelled). */
export const statusStepIndex = (status) =>
  STATUS_STEPS.findIndex((s) => s.key === status);
