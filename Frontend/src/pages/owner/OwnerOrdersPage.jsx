import { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import api from '../../lib/axios';
import { showToast } from '../../features/ui/uiSlice';
import { ChefHat, CheckCircle, Bike, Package, X, RefreshCw } from 'lucide-react';

const STATUS_CLASS = {
  pending: 'status-pending',
  confirmed: 'status-confirmed',
  preparing: 'status-preparing',
  ready_for_pickup: 'status-ready_for_pickup',
  out_for_delivery: 'status-out_for_delivery',
  delivered: 'status-delivered',
  cancelled: 'status-cancelled',
};

function OrderCard({ order, onUpdate }) {
  const dispatch = useDispatch();
  const [accepting, setAccepting] = useState(false);
  const [prepTime, setPrepTime] = useState(20);
  const [loading, setLoading] = useState(false);

  const confirmOrder = async () => {
    setLoading(true);
    try {
      await api.patch(`/orders/${order._id || order.id}/confirm`, { preparationTime: prepTime });
      dispatch(showToast({ message: 'Order confirmed', type: 'success' }));
      onUpdate();
    } catch (error) {
      dispatch(showToast({ message: error.response?.data?.message || 'Error confirming order', type: 'error' }));
    }
    setLoading(false);
  };

  const markPreparing = async () => {
    setLoading(true);
    try {
      await api.patch(`/orders/${order._id || order.id}/preparing`);
      dispatch(showToast({ message: 'Order is now being prepared!', type: 'success' }));
      onUpdate();
    } catch (error) {
      dispatch(showToast({ message: error.response?.data?.message || 'Error marking as preparing', type: 'error' }));
    }
    setLoading(false);
  };

  const markReady = async () => {
    setLoading(true);
    try {
      await api.patch(`/orders/${order._id || order.id}/ready`);
      dispatch(showToast({ message: 'Order ready — waiting for delivery agent!', type: 'success' }));
      onUpdate();
    } catch (error) {
      dispatch(showToast({ message: error.response?.data?.message || 'Error marking ready', type: 'error' }));
    }
    setLoading(false);
  };

  const cancel = async () => {
    if (!window.confirm('Cancel this order?')) return;
    setLoading(true);
    try {
      await api.patch(`/orders/${order._id || order.id}/cancel`);
      onUpdate();
    } catch (error) {
      dispatch(showToast({ message: error.response?.data?.message || 'Error cancelling order', type: 'error' }));
    }
    setLoading(false);
  };

  const isPending = order.status === 'pending';

  return (
    <div style={{
      background: '#FFFFFF',
      border: `1px solid ${isPending ? '#FED7AA' : '#E5E7EB'}`,
      borderLeft: `4px solid ${isPending ? '#FF7A00' : '#E5E7EB'}`,
      borderRadius: '16px',
      padding: '18px',
      boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
      transition: 'all 0.2s ease',
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
        <div>
          <p style={{ fontSize: '14px', fontWeight: 900, color: '#1A1A1A', margin: 0, fontFamily: 'monospace' }}>
            #{(order._id || order.id)?.slice(-8).toUpperCase()}
          </p>
          <p style={{ fontSize: '11px', color: '#6B7280', margin: '4px 0 0' }}>
            {new Date(order.createdAt || order.created_at).toLocaleString()}
          </p>
        </div>
        <span className={STATUS_CLASS[order.status] || 'status-pending'}>
          {(order.status || 'pending').replace(/_/g, ' ')}
        </span>
      </div>

      {/* Items */}
      <div className="owner-card-soft" style={{ marginTop: '14px' }}>
        {(order.items || order.order_items || []).map(item => (
          <div key={item._id || item.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: '13px' }}>
            <span style={{ color: '#374151' }}>{item.quantity}× {item.name}</span>
            <span style={{ fontWeight: 700, color: '#1A1A1A' }}>₹{(item.price * item.quantity).toFixed(0)}</span>
          </div>
        ))}
        <div style={{ borderTop: '1px solid #E5E7EB', marginTop: '8px', paddingTop: '8px', display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
          <span style={{ color: '#6B7280', fontWeight: 600 }}>Total</span>
          <span style={{ fontWeight: 800, color: '#1A1A1A' }}>₹{(order.totalAmount || order.total_amount || 0).toFixed(0)}</span>
        </div>
      </div>

      {/* Address */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', marginTop: '12px', fontSize: '12px', color: '#6B7280' }}>
        <Package size={12} style={{ marginTop: '2px', flexShrink: 0, color: '#FF7A00' }} />
        <span>{(order.deliveryAddress || order.delivery_address)?.street}, {(order.deliveryAddress || order.delivery_address)?.city}</span>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginTop: '14px' }}>
        {order.status === 'pending' ? (
          accepting ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '12px', color: '#6B7280', fontWeight: 600 }}>Prep time:</span>
              <input
                type="number"
                value={prepTime}
                onChange={e => setPrepTime(Number(e.target.value))}
                min={5}
                max={120}
                className="input-field owner-input-compact"
                style={{ width: '56px' }}
              />
              <span style={{ fontSize: '12px', color: '#6B7280', fontWeight: 600 }}>mins</span>
              <button
                className="btn-primary"
                style={{ padding: '8px 16px', fontSize: '12px' }}
                onClick={confirmOrder}
                disabled={loading}
              >
                Confirm
              </button>
              <button
                className="btn-ghost"
                style={{ padding: '8px 12px', fontSize: '12px' }}
                onClick={() => setAccepting(false)}
                disabled={loading}
              >
                Cancel
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                className="btn-primary"
                style={{ padding: '9px 18px', fontSize: '12px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                onClick={() => setAccepting(true)}
                disabled={loading}
              >
                <CheckCircle size={13} /> Accept
              </button>
              <button
                className="btn-ghost-danger"
                style={{ padding: '9px 18px', fontSize: '12px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                onClick={cancel}
                disabled={loading}
              >
                <X size={13} /> Cancel
              </button>
            </div>
          )
        ) : null}
        {order.status === 'confirmed' && (
          <button onClick={markPreparing} disabled={loading} className="btn-primary"
            style={{ padding: '9px 16px', fontSize: '12px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            <ChefHat size={14} /> Start Preparing
          </button>
        )}
        {order.status === 'preparing' && (
          <button onClick={markReady} disabled={loading} className="btn-primary"
            style={{ padding: '9px 16px', fontSize: '12px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            <Bike size={14} /> Mark Ready for Pickup
          </button>
        )}
      </div>
    </div>
  );
}

export default function OwnerOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('active');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async ({ refresh = false } = {}) => {
    if (refresh) setRefreshing(true);
    try {
      const { data } = await api.get('/orders');
      if (data.success) setOrders(data.orders || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
      if (refresh) setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    fetchData({ refresh: true });
  };

  const activeStatuses = ['pending', 'confirmed', 'preparing', 'ready_for_pickup', 'out_for_delivery'];
  const filtered = filter === 'active'
    ? orders.filter(o => activeStatuses.includes(o.status))
    : orders.filter(o => o.status === 'delivered' || o.status === 'cancelled');

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '240px' }}>
      <div style={{ width: '32px', height: '32px', border: '3px solid #E5E7EB', borderTopColor: '#FF7A00', borderRadius: '50%' }} className="animate-spin" />
    </div>
  );

  return (
    <div className="owner-page">
      <div className="owner-header">
        <div>
          <h1 className="owner-title">Orders</h1>
          <p className="owner-subtitle">Track and action your live queue</p>
        </div>
        <button onClick={handleRefresh} className="btn-ghost" disabled={refreshing}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 14px' }}>
          <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} /> Refresh
        </button>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        {[{ key: 'active', label: 'Active' }, { key: 'history', label: 'History' }].map(tab => (
          <button key={tab.key} onClick={() => setFilter(tab.key)}
            className={`owner-tab ${filter === tab.key ? 'owner-tab-active' : ''}`}>
            {tab.label}
            {tab.key === 'active' && filtered.length > 0 && filter === 'active' && (
              <span className="owner-tab-count">{filtered.length}</span>
            )}
          </button>
        ))}
      </div>

      {/* Order list */}
      {filtered.length === 0 ? (
        <div className="owner-empty">
          <Package size={32} style={{ margin: '0 auto 10px', opacity: 0.4 }} />
          <p style={{ fontWeight: 700 }}>{filter === 'active' ? 'No active orders' : 'No order history'}</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {filtered.map(order => <OrderCard key={order._id || order.id} order={order} onUpdate={fetchData} />)}
        </div>
      )}
    </div>
  );
}