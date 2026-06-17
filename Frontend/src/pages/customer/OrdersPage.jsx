import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Package, ChevronRight, Clock, XCircle, CreditCard, RefreshCw, AlertTriangle } from 'lucide-react';
import api from '../../lib/axios';
import { useDispatch } from 'react-redux';
import { showToast } from '../../features/ui/uiSlice';
import { clearCart } from '../../features/cart/cartSlice';
import { useRazorpay } from '../../hooks/useRazorpay';

const STATUS_COLORS = {
  pending:          'bg-amber-50 text-amber-600 border-amber-200',
  confirmed:        'bg-blue-50 text-blue-600 border-blue-200',
  preparing:        'bg-purple-50 text-purple-600 border-purple-200',
  ready_for_pickup: 'bg-cyan-50 text-cyan-600 border-cyan-200',
  out_for_delivery: 'bg-orange-50 text-orange-600 border-orange-200',
  delivered:        'bg-green-50 text-green-600 border-green-200',
  cancelled:        'bg-red-50 text-red-600 border-red-200',
};

const STATUS_LABELS = {
  pending: 'Pending', confirmed: 'Confirmed', preparing: 'Preparing',
  ready_for_pickup: 'Ready for Pickup', out_for_delivery: 'Out for Delivery',
  delivered: 'Delivered', cancelled: 'Cancelled',
};

// Detect payment-abandoned orders.
// COD orders go straight to status:'confirmed' on creation — they are NEVER 'pending'.
// Any order that has status:'pending' AND paymentStatus:'pending' is therefore an
// online payment that the customer did not complete.
// We don't require paymentMethod === 'online' because old orders may not have the field.
const isPaymentPending = (order) =>
  order.status === 'pending' && (order.paymentStatus === 'pending' || !order.paymentStatus);

export default function OrdersPage() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { openRazorpay } = useRazorpay();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [retrying, setRetrying] = useState(null); // orderId currently being retried

  const fetchOrders = () => {
    api.get('/orders')
      .then(({ data }) => setOrders(data.orders || data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchOrders(); }, []);

  const handleCancel = async (orderId, e) => {
    e.stopPropagation();
    try {
      await api.patch(`/orders/${orderId}/cancel`);
      dispatch(showToast({ message: 'Order cancelled', type: 'success' }));
      fetchOrders();
    } catch (err) {
      dispatch(showToast({ message: err.response?.data?.message || 'Cannot cancel order', type: 'error' }));
    }
  };

  // Re-opens Razorpay for an order that was created but never paid.
  const handleRetryPayment = async (order, e) => {
    e.stopPropagation();
    setRetrying(order._id);
    try {
      // /payments/create-intent accepts an existing orderId and returns a fresh Razorpay order
      const { data: intentData } = await api.post('/payments/create-intent', { orderId: order._id });

      openRazorpay({
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: intentData.amount,
        currency: 'INR',
        name: 'OrangeBite',
        order_id: intentData.orderId,
        handler: async (response) => {
          try {
            await api.post('/payments/verify', { orderId: order._id, ...response });
            dispatch(clearCart());
            dispatch(showToast({ message: 'Payment successful! Order confirmed.', type: 'success' }));
          } catch (_) {
            dispatch(showToast({ message: 'Payment recorded. Please check your orders.', type: 'info' }));
          }
          fetchOrders();
        },
        modal: {
          ondismiss: () => {
            dispatch(showToast({ message: 'Payment cancelled. You can retry anytime.', type: 'warning' }));
          },
        },
        prefill: {},
        theme: { color: '#f97316' },
      });
    } catch (err) {
      // Order may have been auto-cancelled by the cron job (30-min timeout)
      dispatch(showToast({ message: err.response?.data?.message || 'Unable to retry payment. Order may have expired.', type: 'error' }));
      fetchOrders();
    } finally {
      setRetrying(null);
    }
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8 space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5 animate-pulse">
            <div className="flex gap-4">
              <div className="w-16 h-16 bg-gray-100 rounded-xl" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-100 rounded w-1/2" />
                <div className="h-3 bg-gray-100 rounded w-1/3" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
      <h1 className="text-2xl font-black text-gray-900 mb-6">My Orders</h1>

      {orders.length === 0 ? (
        <div className="text-center py-20">
          <Package className="w-16 h-16 mx-auto text-gray-200 mb-4" />
          <h3 className="text-lg font-bold text-gray-700 mb-2">No orders yet</h3>
          <p className="text-gray-400 text-sm mb-6">Start by ordering from a restaurant</p>
          <button onClick={() => navigate('/')} className="bg-orange-500 text-white px-6 py-2.5 rounded-xl font-semibold hover:bg-orange-600 transition-colors">
            Browse Restaurants
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => {
            const paymentPending = isPaymentPending(order);

            // ── PAYMENT PENDING CARD ──────────────────────────────────────────
            // Shown when the customer opened Razorpay but closed it without paying.
            if (paymentPending) {
              return (
                <div key={order._id} className="bg-amber-50 border-2 border-amber-200 rounded-2xl p-5 shadow-sm">
                  {/* Header */}
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div>
                      <p className="font-bold text-gray-900">{order.shop?.name || 'Restaurant'}</p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        <Clock className="w-3 h-3 inline mr-1" />
                        {new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                    {/* Distinct amber "Payment Pending" badge */}
                    <span className="flex-shrink-0 flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border bg-amber-100 text-amber-700 border-amber-300">
                      <AlertTriangle className="w-3 h-3" />
                      Payment Pending
                    </span>
                  </div>

                  {/* Items */}
                  <p className="text-sm text-gray-500 mb-3 line-clamp-1">
                    {order.items?.map((i) => `${i.name} ×${i.quantity}`).join(', ')}
                  </p>

                  {/* Warning message */}
                  <div className="bg-white border border-amber-200 rounded-xl px-4 py-3 mb-4 flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-amber-700 leading-relaxed">
                      Your payment was not completed. This order is <strong>reserved</strong> but will be
                      automatically cancelled if payment is not made within 30 minutes.
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between">
                    <p className="font-bold text-gray-900">₹{order.totalAmount?.toFixed(2)}</p>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => handleCancel(order._id, e)}
                        className="flex items-center gap-1 text-xs text-red-500 border border-red-200 px-2.5 py-1.5 rounded-full hover:bg-red-50 transition-colors"
                      >
                        <XCircle className="w-3 h-3" /> Cancel
                      </button>
                      <button
                        onClick={(e) => handleRetryPayment(order, e)}
                        disabled={retrying === order._id}
                        className="flex items-center gap-1.5 text-xs font-semibold bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white px-3 py-1.5 rounded-full transition-colors shadow-sm shadow-orange-200"
                      >
                        {retrying === order._id
                          ? <RefreshCw className="w-3 h-3 animate-spin" />
                          : <CreditCard className="w-3 h-3" />}
                        Retry Payment
                      </button>
                    </div>
                  </div>
                </div>
              );
            }

            // ── NORMAL ORDER CARD ─────────────────────────────────────────────
            return (
              <div
                key={order._id}
                onClick={() => navigate(`/track/${order._id}`)}
                className="bg-white rounded-2xl border border-gray-100 p-5 cursor-pointer hover:shadow-md transition-all shadow-sm"
              >
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div>
                    <p className="font-bold text-gray-900">{order.shop?.name || 'Restaurant'}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      <Clock className="w-3 h-3 inline mr-1" />
                      {new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  <span className={`flex-shrink-0 text-xs font-semibold px-2.5 py-1 rounded-full border ${STATUS_COLORS[order.status] || 'bg-gray-50 text-gray-600 border-gray-200'}`}>
                    {STATUS_LABELS[order.status] || order.status}
                  </span>
                </div>

                <p className="text-sm text-gray-500 mb-3 line-clamp-1">
                  {order.items?.map((i) => `${i.name} ×${i.quantity}`).join(', ')}
                </p>

                <div className="flex items-center justify-between">
                  <p className="font-bold text-gray-900">₹{order.totalAmount}</p>
                  <div className="flex items-center gap-2">
                    {/* Only show Cancel on COD pending — never on payment-pending (handled above) */}
                    {order.status === 'pending' && order.paymentStatus !== 'pending' && (
                      <button
                        onClick={(e) => handleCancel(order._id, e)}
                        className="flex items-center gap-1 text-xs text-red-500 border border-red-200 px-2.5 py-1 rounded-full hover:bg-red-50"
                      >
                        <XCircle className="w-3 h-3" /> Cancel
                      </button>
                    )}
                    <span className="flex items-center gap-1 text-xs text-orange-500 font-medium">
                      {order.status === 'out_for_delivery' ? (
                        <>
                          <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                          Live Track
                        </>
                      ) : 'Track'}
                      <ChevronRight className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
