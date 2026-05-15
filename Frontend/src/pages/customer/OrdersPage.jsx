import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../lib/axios';
import { Package, ChevronRight, Clock, MapPin, ShoppingBag, ReceiptText, CheckCircle2, XCircle, Truck, ChefHat, Loader2 } from 'lucide-react';

const STATUS_META = {
  pending:           { label: 'Pending',           color: '#D97706', bg: '#FEF3C7', border: '#FDE68A',  icon: Clock },
  confirmed:         { label: 'Confirmed',          color: '#2563EB', bg: '#EFF6FF', border: '#BFDBFE',  icon: CheckCircle2 },
  preparing:         { label: 'Preparing',          color: '#EA580C', bg: '#FFF7ED', border: '#FED7AA',  icon: ChefHat },
  ready_for_pickup:  { label: 'Ready for Pickup',   color: '#7C3AED', bg: '#F5F3FF', border: '#DDD6FE',  icon: Package },
  out_for_delivery:  { label: 'Out for Delivery',   color: '#0891B2', bg: '#ECFEFF', border: '#A5F3FC',  icon: Truck },
  delivered:         { label: 'Delivered',          color: '#16A34A', bg: '#DCFCE7', border: '#86EFAC',  icon: CheckCircle2 },
  cancelled:         { label: 'Cancelled',          color: '#DC2626', bg: '#FEF2F2', border: '#FCA5A5',  icon: XCircle },
};

const FALLBACK_IMG = 'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&cs=tinysrgb&w=100';

function OrderSkeleton() {
  return (
    <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: '20px', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
      <div style={{ padding: '20px', display: 'flex', gap: '16px', alignItems: 'center' }}>
        <div className="skeleton" style={{ width: '64px', height: '64px', borderRadius: '16px', flexShrink: 0 }} />
        <div style={{ flex: 1 }}>
          <div className="skeleton" style={{ height: '16px', width: '55%', marginBottom: '10px' }} />
          <div className="skeleton" style={{ height: '12px', width: '80%', marginBottom: '8px' }} />
          <div className="skeleton" style={{ height: '12px', width: '40%' }} />
        </div>
        <div className="skeleton" style={{ height: '28px', width: '80px', borderRadius: '100px' }} />
      </div>
      <div style={{ borderTop: '1px solid #F3F4F6', background: '#FAFAFA', padding: '12px 20px', display: 'flex', justifyContent: 'space-between' }}>
        <div className="skeleton" style={{ height: '12px', width: '30%' }} />
        <div className="skeleton" style={{ height: '12px', width: '20%' }} />
      </div>
    </div>
  );
}

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => { fetchOrders(); }, []);

  const fetchOrders = async () => {
    try {
      const { data } = await api.get('/orders');
      if (data.success) setOrders(data.orders || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const FILTERS = [
    { id: 'all', label: 'All Orders' },
    { id: 'active', label: 'Active' },
    { id: 'delivered', label: 'Delivered' },
    { id: 'cancelled', label: 'Cancelled' },
  ];

  const filteredOrders = orders.filter(o => {
    if (filter === 'all') return true;
    if (filter === 'active') return !['delivered', 'cancelled'].includes(o.status);
    return o.status === filter;
  });

  return (
    <div style={{ maxWidth: '720px', margin: '0 auto', padding: '28px 16px 100px', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>

      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '6px' }}>
          <div style={{
            width: '44px', height: '44px', borderRadius: '14px',
            background: 'linear-gradient(135deg, #FF7A00, #FF9F43)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 14px rgba(255,122,0,0.3)',
          }}>
            <ReceiptText size={22} color="#fff" />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 800, color: '#1A1A1A', letterSpacing: '-0.03em' }}>My Orders</h1>
            <p style={{ margin: 0, fontSize: '13px', color: '#6B7280', fontWeight: 500 }}>
              {loading ? 'Loading...' : `${orders.length} order${orders.length !== 1 ? 's' : ''} placed`}
            </p>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', overflowX: 'auto', paddingBottom: '4px' }} className="scrollbar-hide">
        {FILTERS.map(f => {
          const active = filter === f.id;
          return (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              style={{
                padding: '8px 18px', borderRadius: '100px', flexShrink: 0,
                border: `1.5px solid ${active ? '#FF7A00' : '#E5E7EB'}`,
                background: active ? 'rgba(255,122,0,0.08)' : '#fff',
                color: active ? '#FF7A00' : '#6B7280',
                fontWeight: active ? 700 : 600,
                fontSize: '13px', cursor: 'pointer',
                transition: 'all 0.2s ease', fontFamily: 'inherit',
              }}
            >
              {f.label}
            </button>
          );
        })}
      </div>

      {/* Content */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {[1, 2, 3].map(n => <OrderSkeleton key={n} />)}
        </div>
      ) : filteredOrders.length === 0 ? (
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          padding: '72px 24px', background: '#fff', borderRadius: '24px',
          border: '1px solid #E5E7EB', boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
          textAlign: 'center',
        }}>
          <div style={{ position: 'relative', marginBottom: '24px' }}>
            <div style={{
              width: '96px', height: '96px', borderRadius: '50%',
              background: '#FFF7ED', display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <ShoppingBag size={44} color="#FF7A00" strokeWidth={1.5} />
            </div>
            <div className="animate-ping" style={{
              position: 'absolute', inset: 0, borderRadius: '50%',
              background: 'rgba(255,122,0,0.12)',
            }} />
          </div>
          <h3 style={{ fontSize: '20px', fontWeight: 800, color: '#1A1A1A', margin: '0 0 8px' }}>
            {filter === 'all' ? 'No orders yet' : `No ${filter} orders`}
          </h3>
          <p style={{ fontSize: '14px', color: '#6B7280', margin: '0 0 24px', fontWeight: 500 }}>
            {filter === 'all' ? 'Your recent orders will appear here.' : 'Nothing to show in this category.'}
          </p>
          <Link
            to="/"
            style={{
              padding: '12px 28px', borderRadius: '14px', fontWeight: 700,
              background: 'linear-gradient(135deg, #FF7A00, #FF9F43)',
              color: '#fff', textDecoration: 'none', fontSize: '14px',
              boxShadow: '0 4px 14px rgba(255,122,0,0.3)',
            }}
          >
            Explore Restaurants
          </Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {filteredOrders.map((order, idx) => {
            const meta = STATUS_META[order.status] || STATUS_META.pending;
            const StatusIcon = meta.icon;
            const itemsSummary = (order.items || [])
              .slice(0, 3)
              .map(i => `${i.quantity || 1}× ${i.name}`)
              .join(', ');
            const extraCount = (order.items || []).length - 3;
            const dateStr = new Date(order.created_at || order.createdAt).toLocaleDateString('en-IN', {
              day: 'numeric', month: 'short', year: 'numeric',
            });
            const timeStr = new Date(order.created_at || order.createdAt).toLocaleTimeString('en-IN', {
              hour: '2-digit', minute: '2-digit',
            });
            const otp = order.deliveryOTP ? order.deliveryOTP.toString() : '';

            return (
              <Link
                key={order._id || order.id}
                to={`/track/${order._id || order.id}`}
                style={{ textDecoration: 'none', display: 'block' }}
              >
                <div
                  className="animate-slide-up"
                  style={{
                    animationDelay: `${idx * 0.04}s`,
                    background: '#fff',
                    border: '1px solid #E5E7EB',
                    borderRadius: '20px',
                    overflow: 'hidden',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                    transition: 'all 0.25s ease',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.boxShadow = '0 8px 28px rgba(0,0,0,0.1)';
                    e.currentTarget.style.transform = 'translateY(-3px)';
                    e.currentTarget.style.borderColor = '#D1D5DB';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.05)';
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.borderColor = '#E5E7EB';
                  }}
                >
                  {/* Status accent bar */}
                  <div style={{ height: '3px', background: meta.color, opacity: 0.8 }} />

                  <div style={{ padding: '18px 20px' }}>
                    {/* Top row: shop info + status badge */}
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px', marginBottom: '14px' }}>
                      <img
                        src={order.shops?.images?.[0] || FALLBACK_IMG}
                        alt={order.shops?.name || 'Restaurant'}
                        style={{
                          width: '60px', height: '60px', borderRadius: '14px',
                          objectFit: 'cover', flexShrink: 0,
                          border: '1.5px solid #F3F4F6',
                        }}
                        onError={e => { e.target.src = FALLBACK_IMG; }}
                      />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ margin: '0 0 3px', fontSize: '16px', fontWeight: 800, color: '#1A1A1A', letterSpacing: '-0.02em' }}>
                          {order.shops?.name || 'Restaurant'}
                        </p>
                        {order.shops?.city && (
                          <p style={{ margin: '0 0 6px', fontSize: '12px', color: '#9CA3AF', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '3px' }}>
                            <MapPin size={11} /> {order.shops.city}
                          </p>
                        )}
                        <p style={{ margin: 0, fontSize: '12px', color: '#6B7280', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {itemsSummary}{extraCount > 0 ? ` +${extraCount} more` : ''}
                        </p>
                      </div>
                      {/* Status Pill */}
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', gap: '5px',
                        padding: '5px 11px', borderRadius: '100px', flexShrink: 0,
                        background: meta.bg, color: meta.color,
                        border: `1px solid ${meta.border}`,
                        fontSize: '11px', fontWeight: 700, letterSpacing: '0.03em',
                        textTransform: 'uppercase',
                      }}>
                        <StatusIcon size={10} />
                        {meta.label}
                      </span>
                    </div>

                    {/* Divider */}
                    <div style={{ height: '1px', background: '#F3F4F6', marginBottom: '12px' }} />

                    {/* Delivery OTP (customer only) */}
                    {otp && (
                      <div style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        padding: '10px 12px', marginBottom: '12px',
                        background: '#FFF7ED', border: '1px dashed #FDBA74', borderRadius: '12px',
                      }}>
                        <span style={{
                          fontSize: '11px', fontWeight: 800, color: '#9A3412',
                          textTransform: 'uppercase', letterSpacing: '0.08em',
                        }}>
                          Delivery OTP
                        </span>
                        <span style={{
                          fontSize: '14px', fontWeight: 800, color: '#C2410C',
                          fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
                          letterSpacing: '0.2em',
                        }}>
                          {otp}
                        </span>
                      </div>
                    )}

                    {/* Bottom row: date + amount + arrow */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#9CA3AF' }}>
                        <Clock size={13} />
                        <span style={{ fontSize: '12px', fontWeight: 600 }}>{dateStr} · {timeStr}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '16px', fontWeight: 800, color: '#1A1A1A' }}>
                          ₹{(order.total_amount || order.totalAmount || 0).toFixed(2)}
                        </span>
                        <div style={{
                          width: '28px', height: '28px', borderRadius: '8px',
                          background: '#FFF7ED', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                          <ChevronRight size={14} color="#FF7A00" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
