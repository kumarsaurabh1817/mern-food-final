import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import api from '../../lib/axios';
import { clearCart, selectCartTotal } from '../../features/cart/cartSlice';
import { showToast } from '../../features/ui/uiSlice';
import useRazorpay from '../../hooks/useRazorpay';
import {
  MapPin, CreditCard, ArrowRight, Plus, Loader2,
  ArrowLeft, Banknote, Wallet, CheckCircle2, Home,
  Briefcase, MoreHorizontal, X, ShoppingBag, Trash2,
  AlertTriangle, Navigation,
} from 'lucide-react';

const MAX_ADDRESSES = 5;

function generateIdempotencyKey() {
  return 'ik_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

/* ─── Shared section card style ───────────────────────────────────────────── */
const CARD = {
  background: '#FFFFFF',
  border: '1px solid #E5E7EB',
  borderRadius: '20px',
  padding: '22px',
  boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
  marginBottom: '16px',
};

const SECTION_TITLE = {
  fontSize: '13px', fontWeight: 800, color: '#1A1A1A',
  textTransform: 'uppercase', letterSpacing: '0.07em',
  margin: '0 0 16px', display: 'flex', alignItems: 'center', gap: '8px',
};

const LABEL_ICONS = { Home: Home, Work: Briefcase, Other: MoreHorizontal };
const hasGpsCoords = (addr) =>
  Number.isFinite(Number(addr?.lat)) && Number.isFinite(Number(addr?.lng));

/* ─── Address Card ─────────────────────────────────────────────────────────── */
function AddressCard({ addr, selected, onSelect, onDelete, onAddGps, gpsUpdating }) {
  const isSelected = selected?._id === addr._id || selected?.id === addr.id;
  const Icon = LABEL_ICONS[addr.label] || MapPin;
  const hasGps = hasGpsCoords(addr);
  return (
    <div
      style={{
        borderRadius: '14px',
        border: `2px solid ${isSelected ? '#FF7A00' : '#E5E7EB'}`,
        background: isSelected ? 'rgba(255,122,0,0.04)' : '#fff',
        transition: 'all 0.2s ease',
        overflow: 'hidden',
      }}
    >
      {/* Top row: selectable area */}
      <button
        onClick={() => onSelect(addr)}
        style={{
          width: '100%', textAlign: 'left', padding: '14px 16px 10px',
          background: 'transparent', border: 'none',
          cursor: 'pointer', fontFamily: 'inherit',
          display: 'flex', alignItems: 'flex-start', gap: '12px',
        }}
        onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = '#F9FAFB50'; }}
        onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
      >
        {/* Radio dot */}
        <div style={{
          width: '18px', height: '18px', borderRadius: '50%', flexShrink: 0, marginTop: '9px',
          border: `2px solid ${isSelected ? '#FF7A00' : '#D1D5DB'}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: isSelected ? '#FF7A00' : 'transparent',
          transition: 'all 0.18s ease',
        }}>
          {isSelected && <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#fff' }} />}
        </div>

        {/* Icon */}
        <div style={{
          width: '36px', height: '36px', borderRadius: '10px', flexShrink: 0,
          background: isSelected ? 'rgba(255,122,0,0.12)' : '#F3F4F6',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'all 0.18s ease',
        }}>
          <Icon size={15} color={isSelected ? '#FF7A00' : '#6B7280'} />
        </div>

        {/* Text */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '7px', marginBottom: '3px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '11px', fontWeight: 800, color: isSelected ? '#FF7A00' : '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              {addr.label}
            </span>
            {isSelected
              ? <span style={{ fontSize: '10px', fontWeight: 700, color: '#16A34A', background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: '100px', padding: '1px 8px' }}>✓ Deliver here</span>
              : <span style={{ fontSize: '10px', fontWeight: 600, color: '#9CA3AF' }}>Tap to select</span>
            }
          </div>
          <p style={{ margin: '0 0 1px', fontSize: '13px', fontWeight: 700, color: '#1A1A1A', lineHeight: 1.4 }}>{addr.street}</p>
          <p style={{ margin: 0, fontSize: '12px', color: '#6B7280', fontWeight: 500 }}>{addr.city}{addr.state ? `, ${addr.state}` : ''}</p>
          {hasGps ? (
            <p style={{ margin: '3px 0 0', fontSize: '10px', color: '#9CA3AF', display: 'flex', alignItems: 'center', gap: '3px' }}>
              <Navigation size={9} /> GPS saved
            </p>
          ) : (
            <p style={{ margin: '3px 0 0', fontSize: '10px', color: '#DC2626', display: 'flex', alignItems: 'center', gap: '3px' }}>
              <AlertTriangle size={9} /> GPS missing
            </p>
          )}
        </div>
      </button>

      {/* Bottom row: delete action */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '6px 12px 10px',
        borderTop: '1px solid #F3F4F6',
      }}>
        {!hasGps && (
          <button
            onClick={(e) => { e.stopPropagation(); onAddGps?.(addr); }}
            disabled={gpsUpdating}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              background: 'none', border: 'none', cursor: gpsUpdating ? 'wait' : 'pointer',
              padding: '5px 8px', borderRadius: '8px',
              color: '#FF7A00', fontSize: '11px', fontWeight: 800,
              fontFamily: 'inherit', transition: 'all 0.2s ease',
            }}
            onMouseEnter={e => { if (!gpsUpdating) e.currentTarget.style.background = '#FFF7ED'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
          >
            {gpsUpdating ? <Loader2 size={12} className="animate-spin" /> : <Navigation size={12} />}
            {gpsUpdating ? 'Saving...' : 'Add GPS'}
          </button>
        )}
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(addr._id || addr.id); }}
          style={{
            display: 'flex', alignItems: 'center', gap: '5px',
            background: 'none', border: 'none', cursor: 'pointer',
            padding: '5px 10px', borderRadius: '8px',
            color: '#EF4444', fontSize: '11px', fontWeight: 700,
            fontFamily: 'inherit', transition: 'all 0.2s ease',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = '#FEE2E2'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
        >
          <Trash2 size={13} /> Remove
        </button>
      </div>
    </div>
  );
}

/* ─── Payment Option ───────────────────────────────────────────────────────── */
function PaymentOption({ value, current, onSelect, icon: Icon, label, sub }) {
  const active = current === value;
  return (
    <button
      onClick={() => onSelect(value)}
      style={{
        width: '100%', textAlign: 'left', padding: '14px 16px',
        borderRadius: '14px', cursor: 'pointer', fontFamily: 'inherit',
        border: `2px solid ${active ? '#FF7A00' : '#E5E7EB'}`,
        background: active ? 'rgba(255,122,0,0.05)' : '#fff',
        display: 'flex', alignItems: 'center', gap: '12px',
        transition: 'all 0.2s ease',
      }}
      onMouseEnter={e => { if (!active) e.currentTarget.style.borderColor = '#D1D5DB'; }}
      onMouseLeave={e => { if (!active) e.currentTarget.style.borderColor = '#E5E7EB'; }}
    >
      <div style={{
        width: '40px', height: '40px', borderRadius: '12px', flexShrink: 0,
        background: active ? 'rgba(255,122,0,0.12)' : '#F3F4F6',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Icon size={18} color={active ? '#FF7A00' : '#6B7280'} />
      </div>
      <div style={{ flex: 1 }}>
        <p style={{ margin: '0 0 2px', fontSize: '14px', fontWeight: 700, color: '#1A1A1A' }}>{label}</p>
        <p style={{ margin: 0, fontSize: '11px', color: '#9CA3AF', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{sub}</p>
      </div>
      <div style={{
        width: '20px', height: '20px', borderRadius: '50%', flexShrink: 0,
        border: `2px solid ${active ? '#FF7A00' : '#D1D5DB'}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: active ? '#FF7A00' : 'transparent',
      }}>
        {active && <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#fff' }} />}
      </div>
    </button>
  );
}

/* ─── Checkout Page ────────────────────────────────────────────────────────── */
export default function CheckoutPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { items, shopId, shopName } = useSelector(s => s.cart);
  const subtotal = useSelector(selectCartTotal);
  const deliveryFee = 5;
  const platformFee = subtotal * 0.1;
  const total = subtotal + deliveryFee + platformFee;

  const [addresses, setAddresses] = useState([]);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const { openCheckout, loading: rzpLoading } = useRazorpay();
  const [paymentMethod, setPaymentMethod] = useState('cod');
  const [loading, setLoading] = useState(false);
  const [radiusError, setRadiusError] = useState(null);
  const [newAddr, setNewAddr] = useState({ label: 'Home', street: '', city: '', state: '', zipCode: '', lat: null, lng: null });
  const [showAddForm, setShowAddForm] = useState(false);
  const [locating, setLocating] = useState(false);
  const [gpsUpdatingId, setGpsUpdatingId] = useState(null);

  // Persist idempotency key for this checkout session — same key on retries
  const idempotencyKeyRef = useRef(generateIdempotencyKey());
  const canAddMore = addresses.length < MAX_ADDRESSES;
  const selectedHasGps = hasGpsCoords(selectedAddress);

  useEffect(() => {
    if (items.length === 0) navigate('/cart');
    fetchAddresses();
  }, [navigate, items.length]);

  // Clear radius error when user picks a different address
  useEffect(() => { setRadiusError(null); }, [selectedAddress]);

  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      dispatch(showToast({ message: 'Geolocation not supported by your browser', type: 'error' }));
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setNewAddr(p => ({ ...p, lat: pos.coords.latitude, lng: pos.coords.longitude }));
        setLocating(false);
        dispatch(showToast({ message: 'Location captured — enables delivery radius check', type: 'success' }));
      },
      () => {
        setLocating(false);
        dispatch(showToast({ message: 'Could not get location. Address saved without GPS.', type: 'error' }));
      },
      { timeout: 8000 },
    );
  };

  const handleAttachLocation = (addr) => {
    if (!addr) return;
    if (!navigator.geolocation) {
      dispatch(showToast({ message: 'Geolocation not supported by your browser', type: 'error' }));
      return;
    }
    const addrId = addr._id || addr.id;
    if (!addrId) {
      dispatch(showToast({ message: 'Address ID missing', type: 'error' }));
      return;
    }
    setGpsUpdatingId(addrId);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const payload = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          const { data } = await api.patch(`/users/me/addresses/${addrId}`, payload);
          if (data.success && data.address) {
            setAddresses(prev => prev.map(a => ((a._id || a.id) === addrId ? { ...a, ...data.address } : a)));
            setSelectedAddress(prev => {
              if (!prev) return prev;
              const prevId = prev._id || prev.id;
              return prevId === addrId ? { ...prev, ...data.address } : prev;
            });
            dispatch(showToast({ message: 'GPS location saved to address', type: 'success' }));
          } else {
            dispatch(showToast({ message: data.message || 'Failed to update address', type: 'error' }));
          }
        } catch (e) {
          dispatch(showToast({ message: e.response?.data?.message || 'Failed to update address', type: 'error' }));
        } finally {
          setGpsUpdatingId(null);
        }
      },
      () => {
        setGpsUpdatingId(null);
        dispatch(showToast({ message: 'Could not get location', type: 'error' }));
      },
      { timeout: 8000 },
    );
  };

  const fetchAddresses = async () => {
    try {
      const { data } = await api.get('/users/me/addresses');
      if (data.success) {
        setAddresses(data.addresses || []);
        if (data.addresses?.length > 0) setSelectedAddress(data.addresses[0]);
      }
    } catch (e) { console.error(e); }
  };

  const handleAddAddress = async () => {
    if (!newAddr.street || !newAddr.city || !newAddr.state) {
      dispatch(showToast({ message: 'Please fill street, city, and state', type: 'error' }));
      return;
    }
    if (!canAddMore) {
      dispatch(showToast({ message: `You can save up to ${MAX_ADDRESSES} addresses. Remove one first.`, type: 'error' }));
      return;
    }
    try {
      const { data } = await api.post('/users/me/addresses', newAddr);
      if (data.success) {
        setAddresses(prev => [...prev, data.address]);
        setSelectedAddress(data.address);
        setShowAddForm(false);
        setNewAddr({ label: 'Home', street: '', city: '', state: '', zipCode: '', lat: null, lng: null });
      }
    } catch (e) {
      dispatch(showToast({ message: e.response?.data?.message || 'Failed to save address', type: 'error' }));
    }
  };

  const handleDeleteAddress = async (id) => {
    if (addresses.length <= 1) {
      dispatch(showToast({ message: 'You must have at least one address to place an order.', type: 'error' }));
      return;
    }
    try {
      const { data } = await api.delete(`/users/me/addresses/${id}`);
      if (data.success) {
        setAddresses(prev => prev.filter(a => a._id !== id && a.id !== id));
        if (selectedAddress?._id === id || selectedAddress?.id === id) {
          const remaining = addresses.filter(a => a._id !== id && a.id !== id);
          setSelectedAddress(remaining[0] || null);
        }
        dispatch(showToast({ message: 'Address deleted successfully', type: 'success' }));
      }
    } catch (e) {
      dispatch(showToast({ message: e.response?.data?.message || 'Failed to delete address', type: 'error' }));
    }
  };

  const handlePlaceOrder = async () => {
    if (!shopId) { dispatch(showToast({ message: 'Cart is missing restaurant info. Please re-add items.', type: 'error' })); navigate('/cart'); return; }
    if (!selectedAddress) { dispatch(showToast({ message: 'Please select a delivery address', type: 'error' })); return; }
    if (!selectedHasGps) { dispatch(showToast({ message: 'Please add GPS location to your selected address', type: 'error' })); return; }
    setLoading(true);
    setRadiusError(null);
    try {
      // Step 1 — Create DB order (idempotency key is stable for this session)
      const payload = {
        shopId,
        items: items.map(item => ({ menuItemId: item._id || item.id, quantity: item.quantity || 1 })),
        deliveryAddress: selectedAddress,
        idempotencyKey: idempotencyKeyRef.current,
        paymentMethod,
      };
      const { data } = await api.post('/orders/checkout', payload);
      if (!data.success) {
        if (data.code === 'OUTSIDE_DELIVERY_RADIUS') {
          setRadiusError({ message: data.message, distanceKm: data.distanceKm, radiusKm: data.radiusKm });
          setLoading(false); return;
        }
        dispatch(showToast({ message: data.message || 'Failed to place order', type: 'error' })); setLoading(false); return;
      }

      const dbOrderId = data.order._id || data.order.id;

      // Step 2 — COD: done immediately
      if (paymentMethod === 'cod') {
        dispatch(clearCart());
        dispatch(showToast({ message: 'Order placed successfully!', type: 'success' }));
        navigate(`/track/${dbOrderId}`);
        return;
      }

      // Step 3 — Online: create Razorpay order via backend
      const { data: rzpData } = await api.post('/payments/create-intent', { orderId: dbOrderId, provider: 'razorpay' });
      if (!rzpData.success) { dispatch(showToast({ message: 'Failed to initialise payment', type: 'error' })); setLoading(false); return; }

      // Step 4 — Open Razorpay modal
      const profile = undefined; // profile not in scope here — prefill omitted
      await openCheckout({
        rzpOrderId:  rzpData.orderId,
        amount:      rzpData.amount,
        currency:    rzpData.currency || 'INR',
        name:        'Orange Bite',
        description: `Order from ${shopName || 'Restaurant'}`,
        onSuccess: async (rzpResponse) => {
          // Step 5 — Verify signature on backend
          try {
            const { data: vData } = await api.post('/payments/verify', {
              orderId:             dbOrderId,
              razorpay_order_id:   rzpResponse.razorpay_order_id,
              razorpay_payment_id: rzpResponse.razorpay_payment_id,
              razorpay_signature:  rzpResponse.razorpay_signature,
            });
            if (vData.success) {
              dispatch(clearCart());
              dispatch(showToast({ message: 'Payment successful! Order confirmed.', type: 'success' }));
              navigate(`/track/${dbOrderId}`);
            } else {
              dispatch(showToast({ message: 'Payment verification failed. Contact support.', type: 'error' }));
            }
          } catch (e) {
            dispatch(showToast({ message: e.response?.data?.message || 'Verification error', type: 'error' }));
          } finally {
            setLoading(false);
          }
        },
        onDismiss: async () => {
          // User closed / cancelled the Razorpay modal — cancel the DB order immediately
          try {
            await api.patch(`/orders/${dbOrderId}/cancel`);
            dispatch(showToast({ message: 'Payment cancelled. Order has been removed.', type: 'error' }));
          } catch {
            dispatch(showToast({ message: 'Payment cancelled. If an order appears, contact support.', type: 'error' }));
          }
          setLoading(false);
        },
        onFailure: async () => {
          // Payment failed (card declined, timeout, etc.) — cancel the DB order
          try {
            await api.patch(`/orders/${dbOrderId}/cancel`);
          } catch { /* ignore */ }
          setLoading(false);
        },
      });
    } catch (e) {
      if (e.response?.data?.code === 'OUTSIDE_DELIVERY_RADIUS') {
        setRadiusError({ message: e.response.data.message, distanceKm: e.response.data.distanceKm, radiusKm: e.response.data.radiusKm });
      } else {
        dispatch(showToast({ message: e.response?.data?.message || 'Failed to place order', type: 'error' }));
      }
      setLoading(false);
    }
  };

  const inputStyle = {
    width: '100%', padding: '11px 14px', borderRadius: '10px',
    border: '1.5px solid #E5E7EB', background: '#fff', outline: 'none',
    fontSize: '13px', color: '#1A1A1A', fontFamily: 'inherit', fontWeight: 500,
    transition: 'border-color 0.2s ease', boxSizing: 'border-box',
  };

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '28px 20px 100px', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>

      {/* ── Page Header ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '28px' }}>
        <button
          onClick={() => navigate(-1)}
          style={{
            width: '40px', height: '40px', borderRadius: '12px', flexShrink: 0,
            border: '1.5px solid #E5E7EB', background: '#fff', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#374151', transition: 'all 0.2s ease',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = '#F9FAFB'; }}
          onMouseLeave={e => { e.currentTarget.style.background = '#fff'; }}
        >
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 800, color: '#1A1A1A', letterSpacing: '-0.03em' }}>Checkout</h1>
          <p style={{ margin: 0, fontSize: '13px', color: '#6B7280', fontWeight: 500 }}>{items.length} item{items.length !== 1 ? 's' : ''} from {shopName || 'Restaurant'}</p>
        </div>
      </div>

      {/* ── Two-column layout ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', alignItems: 'start' }} className="checkout-grid">

        {/* ════════════ LEFT COLUMN: Address + Payment ════════════ */}
        <div>

          {/* ── Delivery Address ── */}
          <div style={CARD}>
            <p style={SECTION_TITLE}>
              <span style={{ width: '28px', height: '28px', borderRadius: '8px', background: 'rgba(255,122,0,0.1)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                <MapPin size={14} color="#FF7A00" />
              </span>
              Delivery Address
              <span style={{ marginLeft: 'auto', fontSize: '11px', fontWeight: 700, color: canAddMore ? '#9CA3AF' : '#EF4444', background: canAddMore ? '#F3F4F6' : '#FEE2E2', borderRadius: '100px', padding: '2px 10px' }}>
                {addresses.length}/{MAX_ADDRESSES}
              </span>
            </p>

            {addresses.length === 0 && !showAddForm && (
              <div style={{ textAlign: 'center', padding: '18px 0 6px', color: '#9CA3AF' }}>
                <MapPin size={28} style={{ marginBottom: '8px', opacity: 0.4 }} />
                <p style={{ margin: '0 0 4px', fontSize: '13px', fontWeight: 700 }}>No addresses yet</p>
                <p style={{ margin: 0, fontSize: '12px' }}>Add a delivery address below to continue</p>
              </div>
            )}
            {addresses.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '14px' }}>
                {addresses.map(addr => (
                  <AddressCard
                    key={addr._id || addr.id}
                    addr={addr}
                    selected={selectedAddress}
                    onSelect={(a) => setSelectedAddress(a)}
                    onDelete={handleDeleteAddress}
                    onAddGps={handleAttachLocation}
                    gpsUpdating={gpsUpdatingId === (addr._id || addr.id)}
                  />
                ))}
              </div>
            )}

            {selectedAddress && !selectedHasGps && (
              <div style={{
                marginTop: '12px', padding: '12px 14px', borderRadius: '12px',
                background: '#FFF7ED', border: '1.5px solid #FED7AA',
                display: 'flex', alignItems: 'center', gap: '10px',
              }}>
                <AlertTriangle size={14} color="#EA580C" />
                <div style={{ flex: 1 }}>
                  <p style={{ margin: 0, fontSize: '12px', fontWeight: 700, color: '#9A3412' }}>
                    Add GPS to enable live tracking and delivery radius checks.
                  </p>
                  <p style={{ margin: 0, fontSize: '11px', color: '#9CA3AF' }}>
                    Tap "Add GPS" or use your location below.
                  </p>
                </div>
                <button
                  onClick={() => handleAttachLocation(selectedAddress)}
                  disabled={gpsUpdatingId === (selectedAddress._id || selectedAddress.id)}
                  style={{
                    padding: '6px 10px', borderRadius: '10px',
                    border: '1px solid #FDBA74', background: '#FFF7ED',
                    color: '#C2410C', fontWeight: 800, fontSize: '11px',
                    cursor: gpsUpdatingId ? 'wait' : 'pointer',
                    fontFamily: 'inherit',
                  }}
                >
                  {gpsUpdatingId === (selectedAddress._id || selectedAddress.id) ? 'Saving...' : 'Use my location'}
                </button>
              </div>
            )}

            {!showAddForm ? (
              canAddMore ? (
                <button
                  onClick={() => setShowAddForm(true)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '8px',
                    width: '100%', padding: '12px 14px', borderRadius: '12px',
                    border: '2px dashed #FED7AA', background: '#FFF7ED',
                    color: '#FF7A00', fontWeight: 700, fontSize: '13px',
                    cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.2s ease',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = '#FEF3C7'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = '#FFF7ED'; }}
                >
                  <Plus size={15} /> Add new address
                </button>
              ) : (
                <div style={{ padding: '12px 14px', borderRadius: '12px', background: '#FEF2F2', border: '1.5px solid #FECACA', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <AlertTriangle size={14} color="#EF4444" />
                  <p style={{ margin: 0, fontSize: '12px', fontWeight: 600, color: '#DC2626' }}>
                    Address limit reached ({MAX_ADDRESSES}/{MAX_ADDRESSES}). Remove one to add a new address.
                  </p>
                </div>
              )
            ) : (
              <div style={{ border: '1.5px solid #E5E7EB', borderRadius: '14px', padding: '16px', background: '#F9FAFB' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                  <p style={{ margin: 0, fontSize: '13px', fontWeight: 700, color: '#1A1A1A' }}>New Address</p>
                  <button onClick={() => setShowAddForm(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF', padding: '2px' }}><X size={16} /></button>
                </div>
                {/* Label tabs */}
                <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                  {['Home', 'Work', 'Other'].map(l => {
                    const active = newAddr.label === l;
                    return (
                      <button key={l} onClick={() => setNewAddr(p => ({ ...p, label: l }))}
                        style={{
                          padding: '6px 16px', borderRadius: '100px', fontFamily: 'inherit',
                          border: `1.5px solid ${active ? '#FF7A00' : '#E5E7EB'}`,
                          background: active ? 'rgba(255,122,0,0.08)' : '#fff',
                          color: active ? '#FF7A00' : '#6B7280', fontWeight: 700, fontSize: '12px',
                          cursor: 'pointer', transition: 'all 0.2s ease',
                        }}>
                        {l}
                      </button>
                    );
                  })}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <input
                    placeholder="Street address *"
                    value={newAddr.street}
                    onChange={e => setNewAddr(p => ({ ...p, street: e.target.value }))}
                    style={inputStyle}
                    onFocus={e => e.target.style.borderColor = '#FF7A00'}
                    onBlur={e => e.target.style.borderColor = '#E5E7EB'}
                  />
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <input placeholder="City *" value={newAddr.city} onChange={e => setNewAddr(p => ({ ...p, city: e.target.value }))} style={inputStyle}
                      onFocus={e => e.target.style.borderColor = '#FF7A00'} onBlur={e => e.target.style.borderColor = '#E5E7EB'} />
                    <input placeholder="State *" value={newAddr.state} onChange={e => setNewAddr(p => ({ ...p, state: e.target.value }))} style={inputStyle}
                      onFocus={e => e.target.style.borderColor = '#FF7A00'} onBlur={e => e.target.style.borderColor = '#E5E7EB'} />
                  </div>
                  <input placeholder="PIN Code" value={newAddr.zipCode} onChange={e => setNewAddr(p => ({ ...p, zipCode: e.target.value }))} style={{ ...inputStyle, width: '50%' }}
                    onFocus={e => e.target.style.borderColor = '#FF7A00'} onBlur={e => e.target.style.borderColor = '#E5E7EB'} />
                  {/* Location detect */}
                  <button
                    onClick={handleDetectLocation}
                    disabled={locating}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '7px', padding: '10px 14px',
                      borderRadius: '10px', border: '1.5px solid #E5E7EB', background: newAddr.lat ? '#F0FDF4' : '#fff',
                      color: newAddr.lat ? '#16A34A' : '#6B7280', fontWeight: 600, fontSize: '12px',
                      cursor: locating ? 'wait' : 'pointer', fontFamily: 'inherit', transition: 'all 0.2s ease',
                    }}
                  >
                    {locating ? <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} /> : <Navigation size={13} />}
                    {newAddr.lat ? '✓ Location captured' : (locating ? 'Detecting...' : 'Use my location (recommended)')}
                  </button>
                  <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
                    <button
                      onClick={handleAddAddress}
                      style={{
                        flex: 1, padding: '11px', borderRadius: '12px', border: 'none',
                        background: 'linear-gradient(135deg, #FF7A00, #FF9F43)',
                        color: '#fff', fontWeight: 700, fontSize: '13px',
                        cursor: 'pointer', fontFamily: 'inherit',
                        boxShadow: '0 4px 12px rgba(255,122,0,0.3)',
                      }}
                    >Save Address</button>
                    <button
                      onClick={() => setShowAddForm(false)}
                      style={{
                        flex: 1, padding: '11px', borderRadius: '12px', fontFamily: 'inherit',
                        border: '1.5px solid #E5E7EB', background: '#fff',
                        color: '#6B7280', fontWeight: 700, fontSize: '13px', cursor: 'pointer',
                      }}
                    >Cancel</button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ── Payment Method ── */}
          <div style={CARD}>
            <p style={SECTION_TITLE}>
              <span style={{ width: '28px', height: '28px', borderRadius: '8px', background: 'rgba(255,122,0,0.1)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                <CreditCard size={14} color="#FF7A00" />
              </span>
              Payment Method
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <PaymentOption value="cod" current={paymentMethod} onSelect={setPaymentMethod} icon={Banknote} label="Cash on Delivery" sub="Pay when you receive" />
              <PaymentOption value="online" current={paymentMethod} onSelect={setPaymentMethod} icon={Wallet} label="Pay Online" sub="Card · UPI · Net Banking" />
            </div>
            {paymentMethod === 'online' && (
              <div style={{ marginTop: '12px', padding: '12px 14px', background: '#FFF7ED', borderRadius: '12px', border: '1px solid #FED7AA', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <img src="https://razorpay.com/favicon.ico" alt="Razorpay" width={18} height={18} style={{ borderRadius: 4 }} />
                <p style={{ margin: 0, fontSize: '12px', color: '#C2410C', fontWeight: 600 }}>
                  Powered by <strong>Razorpay</strong> — UPI, Cards, Net Banking &amp; Wallets accepted.
                </p>
              </div>
            )}
          </div>

        </div>

        {/* ════════════ RIGHT COLUMN: Order Summary + CTA ════════════ */}
        <div>

          {/* ── Order Items ── */}
          <div style={CARD}>
            <p style={SECTION_TITLE}>
              <span style={{ width: '28px', height: '28px', borderRadius: '8px', background: 'rgba(255,122,0,0.1)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                <ShoppingBag size={14} color="#FF7A00" />
              </span>
              Order Items ({items.length})
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
              {items.map((item, idx) => (
                <div
                  key={item._id || item.id}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '12px',
                    padding: '12px 0',
                    borderBottom: idx < items.length - 1 ? '1px solid #F3F4F6' : 'none',
                  }}
                >
                  {/* Veg dot */}
                  <span style={{
                    width: '14px', height: '14px', borderRadius: '3px', flexShrink: 0,
                    border: `1.5px solid ${item.is_veg ? '#16A34A' : '#DC2626'}`,
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: item.is_veg ? '#16A34A' : '#DC2626' }} />
                  </span>
                  <p style={{ flex: 1, margin: 0, fontSize: '13px', fontWeight: 700, color: '#1A1A1A' }}>{item.name}</p>
                  <span style={{ fontSize: '12px', color: '#9CA3AF', fontWeight: 600, marginRight: '4px' }}>×{item.quantity || 1}</span>
                  <span style={{ fontSize: '14px', fontWeight: 800, color: '#FF7A00' }}>₹{(item.price * (item.quantity || 1)).toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* ── Bill Summary ── */}
          <div style={CARD}>
            <p style={SECTION_TITLE}>Bill Details</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                <span style={{ color: '#6B7280', fontWeight: 500 }}>Item Total</span>
                <span style={{ fontWeight: 700, color: '#1A1A1A' }}>₹{subtotal.toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                <span style={{ color: '#6B7280', fontWeight: 500 }}>Delivery Fee</span>
                <span style={{ fontWeight: 700, color: '#1A1A1A' }}>₹{deliveryFee}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                <span style={{ color: '#6B7280', fontWeight: 500 }}>Platform Fee</span>
                <span style={{ fontWeight: 700, color: '#1A1A1A' }}>₹{platformFee}</span>
              </div>
              <div style={{ height: '1px', background: '#F3F4F6' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '18px', fontWeight: 900, color: '#1A1A1A' }}>
                <span>Total</span>
                <span style={{ color: '#FF7A00' }}>₹{total.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* ── Delivery Radius Error Banner ── */}
          {radiusError && (
            <div style={{
              marginBottom: '16px', padding: '16px', borderRadius: '16px',
              background: '#FEF2F2', border: '2px solid #FECACA',
              display: 'flex', gap: '12px', alignItems: 'flex-start',
            }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#FEE2E2', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <AlertTriangle size={18} color="#EF4444" />
              </div>
              <div>
                <p style={{ margin: '0 0 4px', fontSize: '14px', fontWeight: 800, color: '#DC2626' }}>Outside Delivery Area</p>
                <p style={{ margin: '0 0 6px', fontSize: '12px', color: '#7F1D1D', fontWeight: 500, lineHeight: 1.5 }}>{radiusError.message}</p>
                {radiusError.distanceKm && (
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '11px', fontWeight: 700, background: '#FEE2E2', color: '#DC2626', borderRadius: '100px', padding: '2px 10px' }}>
                      Your address: {radiusError.distanceKm} km away
                    </span>
                    <span style={{ fontSize: '11px', fontWeight: 700, background: '#F3F4F6', color: '#6B7280', borderRadius: '100px', padding: '2px 10px' }}>
                      Max radius: {radiusError.radiusKm} km
                    </span>
                  </div>
                )}
                <p style={{ margin: '8px 0 0', fontSize: '11px', color: '#9CA3AF', fontWeight: 600 }}>
                  💡 Try selecting a different address or contact the restaurant.
                </p>
              </div>
            </div>
          )}

          {/* ── Place Order CTA ── */}
          <button
            onClick={handlePlaceOrder}
            disabled={loading || rzpLoading || !!radiusError || !selectedHasGps}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '18px 22px', borderRadius: '18px', border: 'none',
              cursor: (loading || rzpLoading || radiusError || !selectedHasGps) ? 'not-allowed' : 'pointer',
              background: (loading || rzpLoading || radiusError || !selectedHasGps) ? '#FED7AA' : 'linear-gradient(135deg, #FF7A00, #FF9F43)',
              boxShadow: (loading || rzpLoading || radiusError || !selectedHasGps) ? 'none' : '0 8px 24px rgba(255,122,0,0.4)',
              fontFamily: 'inherit', transition: 'all 0.2s ease',
            }}
            onMouseEnter={e => { if (!loading && !rzpLoading && !radiusError && selectedHasGps) { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 12px 32px rgba(255,122,0,0.45)'; } }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = (loading || rzpLoading || radiusError || !selectedHasGps) ? 'none' : '0 8px 24px rgba(255,122,0,0.4)'; }}
          >
            {loading ? (
              <span style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#fff', fontWeight: 800, fontSize: '15px', width: '100%', justifyContent: 'center' }}>
                <Loader2 size={20} style={{ animation: 'spin 1s linear infinite' }} />
                {rzpLoading ? 'Opening Payment...' : 'Placing Order...'}
              </span>
            ) : (
              <>
                <div style={{ textAlign: 'left' }}>
                  <p style={{ margin: 0, fontSize: '18px', fontWeight: 900, color: '#fff', letterSpacing: '-0.02em' }}>₹{total.toFixed(2)}</p>
                  <p style={{ margin: 0, fontSize: '11px', color: 'rgba(255,255,255,0.85)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    {paymentMethod === 'cod' ? 'Pay on Delivery' : 'Pay Now'}
                  </p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#fff', fontWeight: 800, fontSize: '15px' }}>
                  Place Order <ArrowRight size={18} />
                </div>
              </>
            )}
          </button>

          {/* Security note */}
          <p style={{ margin: '14px 0 0', textAlign: 'center', fontSize: '12px', color: '#9CA3AF', fontWeight: 500 }}>
            🔒 Your order & payment details are 100% secure
          </p>

        </div>
      </div>

      {/* Responsive: stack on mobile */}
      <style>{`
        @media (max-width: 768px) {
          .checkout-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
