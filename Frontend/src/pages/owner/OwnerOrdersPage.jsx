import { useState, useEffect, useRef } from 'react';
import { CheckCircle, ChefHat, Package, Clock, RefreshCw, Loader2 } from 'lucide-react';
import api from '../../lib/axios';
import { io } from 'socket.io-client';
import { useDispatch } from 'react-redux';
import { showToast } from '../../features/ui/uiSlice';
import { useSelector } from 'react-redux';
import { selectUser } from '../../features/auth/authSlice';

const STATUS_META = {
  pending:   { label: 'Pending', color: 'bg-amber-50 text-amber-600 border-amber-200', action: 'Confirm', next: 'confirm', actionColor: 'bg-blue-500 hover:bg-blue-600' },
  confirmed: { label: 'Confirmed', color: 'bg-blue-50 text-blue-600 border-blue-200', action: 'Mark Preparing', next: 'preparing', actionColor: 'bg-purple-500 hover:bg-purple-600' },
  preparing: { label: 'Preparing', color: 'bg-purple-50 text-purple-600 border-purple-200', action: 'Mark Ready', next: 'ready', actionColor: 'bg-cyan-500 hover:bg-cyan-600' },
  ready_for_pickup: { label: 'Ready for Pickup', color: 'bg-cyan-50 text-cyan-600 border-cyan-200', action: null },
  out_for_delivery: { label: 'Out for Delivery', color: 'bg-orange-50 text-orange-600 border-orange-200', action: null },
  delivered: { label: 'Delivered', color: 'bg-green-50 text-green-600 border-green-200', action: null },
  cancelled: { label: 'Cancelled', color: 'bg-red-50 text-red-600 border-red-200', action: null },
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
    const socket = io(import.meta.env.VITE_API_URL || 'http://localhost:5000', { withCredentials: true });
    socketRef.current = socket;
    socket.emit('joinOwnerRoom');
    socket.on('newOrder', () => fetchOrders());
    socket.on('orderStatusUpdated', () => fetchOrders());
    return () => socket.disconnect();
  }, []);

  const handleAction = async (order, action) => {
    setActioning(order._id);
    try {
      await api.patch(`/orders/${order._id}/${action}`);
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

      {/* Status filter */}
      <div className="flex gap-2 overflow-x-auto scrollbar-hide mb-5">
        {FILTER_TABS.map((f) => (
          <button key={f} onClick={() => setFilter(f)}
            className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold capitalize transition-colors ${filter === f ? 'bg-orange-500 text-white' : 'bg-white border border-gray-200 text-gray-500 hover:border-orange-300'}`}>
            {f === 'all' ? 'All' : f.replace(/_/g, ' ')}
            {f !== 'all' && orders.filter((o) => o.status === f).length > 0 && (
              <span className="ml-1.5 bg-white/20 rounded-full px-1.5">{orders.filter((o) => o.status === f).length}</span>
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
            const meta = STATUS_META[order.status] || {};
            return (
              <div key={order._id} className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div>
                    <p className="font-bold text-gray-900">Order #{order._id.slice(-6).toUpperCase()}</p>
                    <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                      <Clock className="w-3 h-3" /> {new Date(order.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${meta.color}`}>{meta.label}</span>
                </div>

                <div className="bg-gray-50 rounded-xl p-3 mb-3">
                  <p className="text-xs text-gray-500 mb-1.5 font-medium">Items</p>
                  {order.items?.map((item) => (
                    <p key={item._id || item.name} className="text-sm text-gray-700">{item.name} × {item.quantity}</p>
                  ))}
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-400">Customer: <span className="text-gray-600">{order.customer?.name}</span></p>
                    <p className="font-bold text-gray-900">₹{order.totalAmount}</p>
                  </div>
                  {meta.action && (
                    <button
                      onClick={() => handleAction(order, meta.next)}
                      disabled={actioning === order._id}
                      className={`flex items-center gap-2 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors ${meta.actionColor} disabled:opacity-60`}
                    >
                      {actioning === order._id ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                      {meta.action}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
