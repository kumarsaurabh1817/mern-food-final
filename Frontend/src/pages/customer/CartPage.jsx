import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { addItem, removeItem, clearCart, selectCartTotal } from '../../features/cart/cartSlice';
import { ShoppingCart, Plus, Minus, Trash2, ArrowRight, Shield, Bike, Store } from 'lucide-react';

const FALLBACK_IMG = 'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&cs=tinysrgb&w=200';

/* ─── Quantity Stepper ─────────────────────────────────────────────────────── */
function Stepper({ quantity, onAdd, onRemove }) {
  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center',
      border: '1.5px solid #FF7A00', borderRadius: '10px',
      overflow: 'hidden', background: '#fff',
    }}>
      <button
        onClick={onRemove}
        style={{
          width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'transparent', border: 'none', cursor: 'pointer', color: '#FF7A00', transition: 'background 0.15s',
        }}
        onMouseEnter={e => e.currentTarget.style.background = '#FFF7ED'}
        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
      >
        <Minus size={14} strokeWidth={2.5} />
      </button>
      <span style={{ minWidth: '28px', textAlign: 'center', fontSize: '14px', fontWeight: 800, color: '#FF7A00' }}>
        {quantity}
      </span>
      <button
        onClick={onAdd}
        style={{
          width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'transparent', border: 'none', cursor: 'pointer', color: '#FF7A00', transition: 'background 0.15s',
        }}
        onMouseEnter={e => e.currentTarget.style.background = '#FFF7ED'}
        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
      >
        <Plus size={14} strokeWidth={2.5} />
      </button>
    </div>
  );
}

/* ─── VegDot ───────────────────────────────────────────────────────────────── */
function VegDot({ isVeg }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      width: '16px', height: '16px', borderRadius: '3px', flexShrink: 0,
      border: `1.5px solid ${isVeg ? '#16A34A' : '#DC2626'}`,
    }}>
      <span style={{
        width: '8px', height: '8px', borderRadius: '50%',
        background: isVeg ? '#16A34A' : '#DC2626',
      }} />
    </span>
  );
}

/* ─── Empty State ──────────────────────────────────────────────────────────── */
function EmptyCart({ navigate }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      minHeight: '70vh', fontFamily: "'Plus Jakarta Sans', sans-serif",
      padding: '24px',
    }}>
      <div style={{
        width: '120px', height: '120px', borderRadius: '50%',
        background: '#FFF7ED', position: 'relative',
        display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '28px',
      }}>
        <div className="animate-ping" style={{
          position: 'absolute', inset: 0, borderRadius: '50%',
          background: 'rgba(255,122,0,0.12)',
        }} />
        <ShoppingCart size={52} color="#FF7A00" strokeWidth={1.5} />
      </div>
      <h2 style={{ fontSize: '22px', fontWeight: 800, color: '#1A1A1A', margin: '0 0 8px', letterSpacing: '-0.03em' }}>
        Your cart is empty
      </h2>
      <p style={{ fontSize: '14px', color: '#6B7280', margin: '0 0 28px', fontWeight: 500, textAlign: 'center' }}>
        Add items from a restaurant to get started
      </p>
      <button
        onClick={() => navigate('/')}
        style={{
          padding: '14px 32px', borderRadius: '14px', border: 'none', cursor: 'pointer',
          background: 'linear-gradient(135deg, #FF7A00, #FF9F43)',
          color: '#fff', fontWeight: 800, fontSize: '14px',
          fontFamily: "'Plus Jakarta Sans', sans-serif",
          boxShadow: '0 6px 20px rgba(255,122,0,0.35)',
          transition: 'all 0.2s ease',
        }}
        onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 10px 28px rgba(255,122,0,0.4)'; }}
        onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(255,122,0,0.35)'; }}
      >
        Explore Restaurants
      </button>
    </div>
  );
}

/* ─── Cart Page ────────────────────────────────────────────────────────────── */
export default function CartPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { items, shopName, shopId } = useSelector(s => s.cart);
  const total = useSelector(selectCartTotal);

  const deliveryCharge = total > 0 ? 30 : 0;
  const platformFee = total > 0 ? 5 : 0;
  const grandTotal = total + deliveryCharge + platformFee;

  if (items.length === 0) return <EmptyCart navigate={navigate} />;

  return (
    <div style={{
      maxWidth: '680px', margin: '0 auto', padding: '24px 16px 120px',
      fontFamily: "'Plus Jakarta Sans', sans-serif",
    }}>

      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <h1 style={{ margin: '0 0 2px', fontSize: '24px', fontWeight: 800, color: '#1A1A1A', letterSpacing: '-0.03em' }}>
            Your Cart
          </h1>
          <p style={{ margin: 0, fontSize: '13px', color: '#6B7280', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '5px' }}>
            <Store size={12} color="#FF7A00" /> {shopName || 'Restaurant'}
          </p>
        </div>
        <button
          onClick={() => dispatch(clearCart())}
          style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            padding: '8px 14px', borderRadius: '10px', cursor: 'pointer',
            border: '1.5px solid #FCA5A5', background: '#FEF2F2',
            color: '#DC2626', fontSize: '12px', fontWeight: 700,
            fontFamily: 'inherit', transition: 'all 0.2s ease',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = '#FEE2E2'; }}
          onMouseLeave={e => { e.currentTarget.style.background = '#FEF2F2'; }}
        >
          <Trash2 size={13} /> Clear All
        </button>
      </div>

      {/* ── Item Cards ── */}
      <div style={{
        background: '#fff', border: '1px solid #E5E7EB', borderRadius: '20px',
        overflow: 'hidden', marginBottom: '16px',
        boxShadow: '0 2px 12px rgba(0,0,0,0.05)',
      }}>
        {items.map((item, idx) => (
          <div
            key={item.id || item._id}
            style={{
              display: 'flex', gap: '14px', alignItems: 'center',
              padding: '18px 20px',
              borderBottom: idx < items.length - 1 ? '1px solid #F3F4F6' : 'none',
              transition: 'background 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.background = '#FAFAFA'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            {/* Item image */}
            <div style={{ position: 'relative', width: '72px', height: '72px', flexShrink: 0 }}>
              <img
                src={item.image || FALLBACK_IMG}
                alt={item.name}
                style={{ width: '100%', height: '100%', borderRadius: '12px', objectFit: 'cover', border: '1px solid #F3F4F6' }}
                onError={e => { e.target.src = FALLBACK_IMG; }}
              />
            </div>

            {/* Info */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                <VegDot isVeg={item.is_veg} />
                <p style={{ margin: 0, fontSize: '14px', fontWeight: 800, color: '#1A1A1A', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {item.name}
                </p>
              </div>
              <p style={{ margin: '0 0 10px', fontSize: '15px', fontWeight: 800, color: '#FF7A00' }}>
                ₹{(item.price * item.quantity).toFixed(2)}
              </p>
              <Stepper
                quantity={item.quantity}
                onRemove={() => dispatch(removeItem(item.id || item._id))}
                onAdd={() => dispatch(addItem({ item, shopId, shopName }))}
              />
            </div>

            {/* Per-unit price */}
            <div style={{ textAlign: 'right', flexShrink: 0 }}>
              <p style={{ margin: 0, fontSize: '11px', color: '#9CA3AF', fontWeight: 600 }}>per item</p>
              <p style={{ margin: 0, fontSize: '13px', fontWeight: 700, color: '#374151' }}>₹{item.price}</p>
            </div>
          </div>
        ))}

      </div>

      {/* ── Bill Summary ── */}
      <div style={{
        background: '#fff', border: '1px solid #E5E7EB', borderRadius: '20px',
        padding: '20px', marginBottom: '16px',
        boxShadow: '0 2px 12px rgba(0,0,0,0.05)',
      }}>
        <h3 style={{ margin: '0 0 18px', fontSize: '13px', fontWeight: 800, color: '#1A1A1A', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          Bill Details
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
            <span style={{ color: '#6B7280', fontWeight: 500 }}>Item Total ({items.length} items)</span>
            <span style={{ fontWeight: 700, color: '#1A1A1A' }}>₹{total.toFixed(2)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
            <span style={{ color: '#6B7280', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '5px' }}>
              <Bike size={13} /> Delivery Fee
            </span>
            <span style={{ fontWeight: 700, color: '#1A1A1A' }}>₹{deliveryCharge}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
            <span style={{ color: '#6B7280', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '5px' }}>
              <Shield size={13} /> Platform Fee
            </span>
            <span style={{ fontWeight: 700, color: '#1A1A1A' }}>₹{platformFee}</span>
          </div>
          <div style={{ height: '1px', background: '#F3F4F6', margin: '4px 0' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '17px', fontWeight: 900, color: '#1A1A1A' }}>
            <span>To Pay</span>
            <span style={{ color: '#FF7A00' }}>₹{grandTotal.toFixed(2)}</span>
          </div>
        </div>
      </div>



      {/* ── Checkout CTA ── */}
      <button
        onClick={() => navigate('/checkout')}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '18px 22px', borderRadius: '18px', border: 'none', cursor: 'pointer',
          background: 'linear-gradient(135deg, #FF7A00, #FF9F43)',
          boxShadow: '0 8px 24px rgba(255,122,0,0.4)',
          fontFamily: 'inherit', transition: 'all 0.2s ease',
        }}
        onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 12px 32px rgba(255,122,0,0.45)'; }}
        onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(255,122,0,0.4)'; }}
      >
        <div style={{ textAlign: 'left' }}>
          <p style={{ margin: 0, fontSize: '18px', fontWeight: 900, color: '#fff', letterSpacing: '-0.02em' }}>
            ₹{grandTotal.toFixed(2)}
          </p>
          <p style={{ margin: 0, fontSize: '11px', color: 'rgba(255,255,255,0.85)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Total Bill
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#fff', fontWeight: 800, fontSize: '15px' }}>
          Proceed to Pay <ArrowRight size={18} />
        </div>
      </button>
    </div>
  );
}
