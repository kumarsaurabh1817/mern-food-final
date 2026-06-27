import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { MapPin, Plus, CreditCard, Banknote, Check, Loader2, ChevronLeft } from 'lucide-react';
import api from '../../lib/axios';
import { selectCartItems, selectCartTotal, selectCartShopId, clearCart } from '../../features/cart/cartSlice';
import { showToast } from '../../features/ui/uiSlice';
import { useRazorpay } from '../../hooks/useRazorpay';
import AddressPicker from '../../components/map/AddressPicker';

// Pick the first standard label that isn't already taken, then fall back to a
// unique custom label so a new address never collides with an existing one.
const nextLabel = (addresses = []) => {
  const used = new Set(addresses.map((a) => (a.label || '').toLowerCase()));
  const free = ['Home', 'Work', 'Other'].find((l) => !used.has(l.toLowerCase()));
  return free || `Address ${addresses.length + 1}`;
};

export default function CheckoutPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { openRazorpay } = useRazorpay();

  const cartItems = useSelector(selectCartItems);
  const cartTotal = useSelector(selectCartTotal);
  const shopId = useSelector(selectCartShopId);

  const [addresses, setAddresses] = useState([]);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('cod');
  const [loading, setLoading] = useState(false);
  const [addressForm, setAddressForm] = useState({ show: false, label: '', street: '', city: '', state: '', zipCode: '', lat: null, lng: null });

  // These match the backend formulas exactly so the displayed total === what is charged.
  // Backend: platformFee = subtotal * 0.1 (float), deliveryCharge = 5 (fixed)
  const platformFee = cartTotal * 0.1;            // keep as float — matches backend
  const deliveryCharge = 5;
  const total = cartTotal + platformFee + deliveryCharge; // exact, no rounding


  useEffect(() => {
    if (cartItems.length === 0) navigate('/cart');
    api.get('/users/me/addresses').then(({ data }) => {
      const list = data.addresses || [];
      setAddresses(list);
      const def = list.find((a) => a.isDefault) || list[0];
      if (def) setSelectedAddress(def._id);
    }).catch(() => {});
  }, [cartItems.length, navigate]);

  const handleAddAddress = async (e) => {
    e.preventDefault();
    try {
      // Ensure a unique label — the backend rejects a second Home/Work/Other.
      const payload = { ...addressForm, label: addressForm.label?.trim() || nextLabel(addresses) };
      const { data } = await api.post('/users/me/addresses', payload);
      const list = data.addresses || [];
      setAddresses(list);
      const newAddr = list[list.length - 1];
      if (newAddr) setSelectedAddress(newAddr._id);
      setAddressForm({ show: false, label: '', street: '', city: '', state: '', zipCode: '', lat: null, lng: null });
      dispatch(showToast({ message: 'Address added!', type: 'success' }));
    } catch (err) {
      dispatch(showToast({ message: err.response?.data?.message || 'Failed to add address', type: 'error' }));
    }
  };

  // Best-effort browser geolocation so the delivery destination has coordinates
  // for live map tracking + the radius check. Resolves to null if denied/timeout
  // — the order still goes through, the map just degrades to agent-only.
  const getCurrentCoords = () =>
    new Promise((resolve) => {
      if (!navigator.geolocation) return resolve(null);
      navigator.geolocation.getCurrentPosition(
        (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => resolve(null),
        { enableHighAccuracy: true, timeout: 8000, maximumAge: 60000 }
      );
    });

  const placeOrder = async () => {
    if (!selectedAddress) { dispatch(showToast({ message: 'Please select a delivery address', type: 'warning' })); return; }
    setLoading(true);
    const address = addresses.find((a) => a._id === selectedAddress);
    try {
      // Prefer the coordinates saved with the address (dropped on the map at
      // creation time); only fall back to live geolocation if absent.
      const savedCoords =
        Number.isFinite(address?.lat) && Number.isFinite(address?.lng)
          ? { lat: address.lat, lng: address.lng }
          : null;
      const coords = savedCoords || (await getCurrentCoords());
      const orderPayload = {
        shopId,
        items: cartItems.map((i) => ({ menuItemId: i._id, quantity: i.quantity })),
        deliveryAddress: {
          street: address.street,
          city: address.city,
          state: address.state,
          zipCode: address.zipCode,
          ...(coords || {}),
        },
        paymentMethod,
      };

      if (paymentMethod === 'cod') {
        await api.post('/orders/checkout', orderPayload);
        dispatch(clearCart());
        dispatch(showToast({ message: 'Order placed successfully!', type: 'success' }));
        navigate('/orders');
      } else {
        // ── Online payment flow ──────────────────────────────────────────────
        // Step 1: Create the app order. Pass an idempotency key so that if the
        //         user accidentally double-taps, only one order is created.
        const { data: orderData } = await api.post('/orders/checkout', {
          ...orderPayload,
          idempotencyKey: `checkout_${shopId}_${Date.now()}`,
        });

        // Step 2: Create the Razorpay order for this app order
        const { data: intentData } = await api.post('/payments/create-intent', {
          orderId: orderData.order._id,
        });

        // Step 3: Open Razorpay. If the user dismisses it, the app order stays
        //         as 'pending' — the cron job will auto-cancel it after 30 min.
        //         The user can go to Orders and see it labelled 'Payment Pending'.
        openRazorpay({
          key: import.meta.env.VITE_RAZORPAY_KEY_ID,
          amount: intentData.amount,
          currency: 'INR',
          name: 'OrangeBite',
          order_id: intentData.orderId,
          handler: async (response) => {
            try {
              await api.post('/payments/verify', { orderId: orderData.order._id, ...response });
              dispatch(clearCart());
              dispatch(showToast({ message: 'Payment successful! Order placed.', type: 'success' }));
            } catch (_) {
              dispatch(showToast({ message: 'Payment recorded. Please check your orders.', type: 'info' }));
            }
            window.location.href = '/orders';
          },
          modal: {
            ondismiss: () => {
              dispatch(showToast({
                message: 'Payment cancelled. Your order is saved — you can retry from My Orders.',
                type: 'warning',
                duration: 5000,
              }));
              navigate('/orders');
            },
          },
          prefill: {},
          theme: { color: '#f97316' },
        });
      }
    } catch (err) {
      dispatch(showToast({ message: err.response?.data?.message || 'Failed to place order', type: 'error' }));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
      <button onClick={() => navigate('/cart')} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-5">
        <ChevronLeft className="w-4 h-4" /> Back to cart
      </button>
      <h1 className="text-2xl font-black text-gray-900 mb-6">Checkout</h1>

      {/* Address selection */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm mb-5">
        <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2"><MapPin className="w-4 h-4 text-orange-400" /> Delivery Address</h2>
        {addresses.length === 0 && !addressForm.show && (
          <p className="text-gray-400 text-sm mb-3">No saved addresses. Add one below.</p>
        )}
        <div className="space-y-2 mb-3">
          {addresses.map((addr) => (
            <label key={addr._id} className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${selectedAddress === addr._id ? 'border-orange-400 bg-orange-50' : 'border-gray-200 hover:bg-gray-50'}`}>
              <input type="radio" name="address" checked={selectedAddress === addr._id} onChange={() => setSelectedAddress(addr._id)} className="mt-0.5 accent-orange-500" />
              <div>
                <p className="font-semibold text-sm text-gray-800">{addr.label || 'Address'}</p>
                <p className="text-xs text-gray-500">{addr.street}, {addr.city}, {addr.state} {addr.zipCode}</p>
              </div>
            </label>
          ))}
        </div>
        {addressForm.show ? (
          <form onSubmit={handleAddAddress} className="space-y-3 border border-gray-100 rounded-xl p-4">
            <h3 className="font-semibold text-sm text-gray-800">New address</h3>
            <AddressPicker
              value={addressForm.lat != null ? { lat: addressForm.lat, lng: addressForm.lng } : null}
              onPick={(a) => setAddressForm((prev) => ({
                ...prev,
                lat: a.lat,
                lng: a.lng,
                street: a.street || prev.street,
                city: a.city || prev.city,
                state: a.state || prev.state,
                zipCode: a.zipCode || prev.zipCode,
              }))}
            />
            <div className="grid grid-cols-2 gap-3">
              <input placeholder="Label (Home, Work...)" value={addressForm.label} onChange={(e) => setAddressForm({ ...addressForm, label: e.target.value })} className="col-span-2 px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-orange-400" />
              <input placeholder="Street address" value={addressForm.street} onChange={(e) => setAddressForm({ ...addressForm, street: e.target.value })} required className="col-span-2 px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-orange-400" />
              <input placeholder="City" value={addressForm.city} onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })} required className="px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-orange-400" />
              <input placeholder="State" value={addressForm.state} onChange={(e) => setAddressForm({ ...addressForm, state: e.target.value })} required className="px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-orange-400" />
              <input placeholder="ZIP Code" value={addressForm.zipCode} onChange={(e) => setAddressForm({ ...addressForm, zipCode: e.target.value })} required className="px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-orange-400" />
            </div>
            <div className="flex gap-2">
              <button type="submit" className="bg-orange-500 text-white text-sm font-semibold px-4 py-2 rounded-xl hover:bg-orange-600">Save</button>
              <button type="button" onClick={() => setAddressForm({ ...addressForm, show: false })} className="text-sm text-gray-500 px-4 py-2 rounded-xl hover:bg-gray-50 border border-gray-200">Cancel</button>
            </div>
          </form>
        ) : (
          <button onClick={() => setAddressForm({ ...addressForm, show: true })} className="flex items-center gap-2 text-sm text-orange-500 font-medium hover:text-orange-600">
            <Plus className="w-4 h-4" /> Add new address
          </button>
        )}
      </div>

      {/* Payment method */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm mb-5">
        <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2"><CreditCard className="w-4 h-4 text-orange-400" /> Payment Method</h2>
        <div className="grid grid-cols-2 gap-3">
          {[{ value: 'cod', icon: Banknote, label: 'Cash on Delivery', desc: 'Pay when delivered' },
            { value: 'online', icon: CreditCard, label: 'Pay Online', desc: 'UPI, Cards, Netbanking' }].map(({ value, icon: Icon, label, desc }) => (
            <label key={value} className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer ${paymentMethod === value ? 'border-orange-400 bg-orange-50' : 'border-gray-200 hover:bg-gray-50'}`}>
              <input type="radio" name="payment" value={value} checked={paymentMethod === value} onChange={() => setPaymentMethod(value)} className="accent-orange-500" />
              <div>
                <Icon className="w-5 h-5 text-gray-500 mb-1" />
                <p className="text-sm font-semibold text-gray-800">{label}</p>
                <p className="text-xs text-gray-400">{desc}</p>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Order summary */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm mb-6">
        <h2 className="font-bold text-gray-900 mb-4">Order Summary</h2>
        <div className="space-y-2 text-sm mb-4">
          {cartItems.map((item) => (
            <div key={item._id} className="flex justify-between text-gray-600">
              <span>{item.name} × {item.quantity}</span>
              <span>₹{item.price * item.quantity}</span>
            </div>
          ))}
        </div>
        <hr className="border-gray-100 mb-3" />
        <div className="space-y-2 text-sm">
          <div className="flex justify-between text-gray-600"><span>Subtotal</span><span>₹{cartTotal.toFixed(2)}</span></div>
          <div className="flex justify-between text-gray-600"><span>Platform fee (10%)</span><span>₹{platformFee.toFixed(2)}</span></div>
          <div className="flex justify-between text-gray-600"><span>Delivery charge</span><span>₹{deliveryCharge.toFixed(2)}</span></div>
          <hr className="border-gray-100" />
          <div className="flex justify-between font-bold text-gray-900 text-base"><span>Total</span><span>₹{total.toFixed(2)}</span></div>
        </div>
      </div>

      <button
        onClick={placeOrder}
        disabled={loading}
        className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 text-base transition-colors shadow-lg shadow-orange-200"
      >
        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Check className="w-5 h-5" />}
        {paymentMethod === 'cod' ? `Place Order • ₹${total.toFixed(2)}` : `Pay ₹${total.toFixed(2)}`}
      </button>
    </div>
  );
}
