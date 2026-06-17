import { useState, useEffect, useRef } from 'react';
import { CheckCircle, ChefHat, Package, Clock, RefreshCw, Loader2, Banknote, CreditCard, ArrowRight, AlertCircle } from 'lucide-react';
import api from '../../lib/axios';
import { io } from 'socket.io-client';
import { useDispatch } from 'react-redux';
import { showToast } from '../../features/ui/uiSlice';
import { useSelector } from 'react-redux';
import { selectUser } from '../../features/auth/authSlice';
import { TOKEN_KEY } from '../../lib/constants';

// Consistent status badge colors
const STATUS_BADGE = {
  pending:          'bg-amber-50 text-amber-700 border-amber-200',
  confirmed:        'bg-blue-50 text-blue-700 border-blue-200',
  preparing:        'bg-purple-50 text-purple-700 border-purple-200',
  ready_for_pickup: 'bg-cyan-50 text-cyan-700 border-cyan-200',
  out_for_delivery: 'bg-orange-50 text-orange-700 border-orange-200',
  delivered:        'bg-green-50 text-green-700 border-green-200',
  cancelled:        'bg-red-50 text-red-700 border-red-200',
};

const STATUS_LABEL = {
  pending:          'Pending',
  confirmed:        'Confirmed',
  preparing:        'Preparing',
  ready_for_pickup: 'Ready for Pickup',
  out_for_delivery: 'Out for Delivery',
  delivered:        'Delivered',
  cancelled:        'Cancelled',
};

// Each active status maps to the next action
// All action buttons use one consistent style — only label changes
const NEXT_ACTION = {
  pending:   { label: 'Confirm Order',   route: 'confirm'   },
  confirmed: { label: 'Start Preparing', route: 'preparing' },
  preparing: { label: 'Mark Ready',      route: 'ready'     },
};

const FILTER_TABS = ['all', 'pending', 'confirmed', 'preparing', 'ready_for_pickup', 'out_for_delivery', 'delivered'];

export default function OwnerOrdersPage() {
  const dispatch = useDispatch();
  const user = useSelector(selectUser);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [actioning, setActioning] = useState(null);
  const socketRef = useRef(null);

  const fetchOrders = () => {
    api.get('/orders').then(({ data }) => setOrders(data.orders || data || [])).catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchOrders();
    const token = localStorage.getItem(TOKEN_KEY) || '';
    const socket = io(import.meta.env.VITE_API_URL || 'http://localhost:5000', {
      withCredentials: true,
      auth: { token },
    });
    socketRef.current = socket;
    socket.on('connect', () => {
      // Pass the actual user ID so the server puts us in the right room
      if (user?.id) socket.emit('joinOwnerRoom', user.id);
    });
    socket.on('newOrder', () => fetchOrders());
    socket.on('orderStatusUpdated', () => fetchOrders());
    return () => socket.disconnect();
  }, [user?.id]);

  const handleAction = async (order, route) => {
    setActioning(order._id);
    try {
      await api.patch(`/orders/${order._id}/${route}`, {});
      dispatch(showToast({ message: 'Order updated!', type: 'success' }));
      fetchOrders();
    } catch (err) {
      dispatch(showToast({ message: err.response?.data?.message || 'Action failed', type: 'error' }));
    } finally {
      setActioning(null);
    }
  };

  const filteredOrders = filter === 'all' ? orders : orders.filter((o) => o.status === filter);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Orders</h1>
          <p className="text-gray-400 text-sm">{orders.length} total orders</p>
        </div>
        <button onClick={fetchOrders} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 border border-gray-200 px-3 py-2 rounded-xl hover:bg-gray-50">
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      {/* Status filter tabs */}
      <div className="flex gap-2 overflow-x-auto scrollbar-hide mb-5 pb-1">
        {FILTER_TABS.map((f) => (
          <button key={f} onClick={() => setFilter(f)}
            className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold capitalize transition-colors ${filter === f ? 'bg-orange-500 text-white' : 'bg-white border border-gray-200 text-gray-500 hover:border-orange-300'}`}>
            {f === 'all' ? 'All' : f.replace(/_/g, ' ')}
            {f !== 'all' && orders.filter((o) => o.status === f).length > 0 && (
              <span className={`ml-1.5 rounded-full px-1.5 ${filter === f ? 'bg-white/25 text-white' : 'bg-orange-50 text-orange-600'}`}>
                {orders.filter((o) => o.status === f).length}
              </span>
            )}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="bg-white rounded-2xl h-24 animate-pulse" />)}</div>
      ) : filteredOrders.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center shadow-sm">
          <Package className="w-12 h-12 mx-auto text-gray-200 mb-3" />
          <p className="text-gray-400">{filter === 'all' ? 'No orders yet' : `No ${filter.replace(/_/g, ' ')} orders`}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order) => {
            const badgeClass = STATUS_BADGE[order.status] || 'bg-gray-50 text-gray-600 border-gray-200';
            const statusLabel = STATUS_LABEL[order.status] || order.status;
            const isCOD = order.paymentMethod === 'cod';
            // An online order whose payment was cancelled/not completed must NOT
            // be actionable by the owner — the customer hasn't paid yet.
            const isOnlineUnpaid = !isCOD && order.paymentStatus !== 'paid';
            // Only show the next-action button when payment is resolved.
            const nextAction = isOnlineUnpaid ? null : NEXT_ACTION[order.status];

            return (
              <div key={order._id} className={`bg-white rounded-2xl border p-5 shadow-sm ${
                isOnlineUnpaid ? 'border-red-100 opacity-80' : 'border-gray-100'
              }`}>
                {/* Header */}
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-bold text-gray-900">Order #{order._id.slice(-6).toUpperCase()}</p>
                      {/* Payment method badge */}
                      <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${
                        isCOD ? 'bg-amber-50 text-amber-700' : 'bg-indigo-50 text-indigo-700'
                      }`}>
                        {isCOD ? <Banknote className="w-3 h-3" /> : <CreditCard className="w-3 h-3" />}
                        {isCOD ? 'Cash on Delivery' : 'Online Payment'}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                      <Clock className="w-3 h-3" />
                      {new Date(order.createdAt).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  {/* Status badge */}
                  <span className={`flex-shrink-0 text-xs font-semibold px-2.5 py-1 rounded-full border ${badgeClass}`}>
                    {statusLabel}
                  </span>
                </div>

                {/* Items */}
                <div className="bg-gray-50 rounded-xl p-3 mb-3">
                  <p className="text-xs text-gray-500 mb-1.5 font-medium">Items</p>
                  {order.items?.map((item) => (
                    <p key={item._id || item.name} className="text-sm text-gray-700">{item.name} × {item.quantity}</p>
                  ))}
                </div>

                {/* Footer: customer + amount + action button */}
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs text-gray-400">Customer: <span className="text-gray-600">{order.customer?.name}</span></p>
                    <p className="font-bold text-gray-900 mt-0.5">₹{order.totalAmount}</p>
                  </div>

                  {/* Action button — only for orders with completed payment */}
                  {nextAction && (
                    <button
                      onClick={() => handleAction(order, nextAction.route)}
                      disabled={actioning === order._id}
                      className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors shadow-sm shadow-orange-100"
                    >
                      {actioning === order._id
                        ? <Loader2 className="w-4 h-4 animate-spin" />
                        : <ArrowRight className="w-4 h-4" />}
                      {nextAction.label}
                    </button>
                  )}
                </div>

                {/* Payment not completed — owner must not prepare this order */}
                {isOnlineUnpaid && (
                  <p className="mt-3 text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-1.5 flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                    Payment not completed by customer. Do not prepare this order — it will be auto-cancelled shortly.
                  </p>
                )}

                {/* COD info note for pending-skipped orders */}
                {order.status === 'confirmed' && isCOD && (
                  <p className="mt-3 text-xs text-amber-600 bg-amber-50 border border-amber-100 rounded-lg px-3 py-1.5">
                    💵 COD order — auto-confirmed. Start preparing when ready.
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
