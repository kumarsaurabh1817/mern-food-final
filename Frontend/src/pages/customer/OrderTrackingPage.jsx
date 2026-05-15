import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../lib/axios';
import { io } from 'socket.io-client';
import { CheckCircle, Clock, ChefHat, Bike, Package, X, MapPin, Phone, Copy, ArrowLeft } from 'lucide-react';

const STATUS_STEPS = [
  { key: 'pending', label: 'Order Placed', icon: Package, color: 'text-orange-500', bg: 'bg-orange-100', border: 'border-orange-200' },
  { key: 'confirmed', label: 'Confirmed', icon: CheckCircle, color: 'text-blue-600', bg: 'bg-blue-100', border: 'border-blue-200' },
  { key: 'preparing', label: 'Preparing', icon: ChefHat, color: 'text-orange-500', bg: 'bg-orange-50', border: 'border-orange-100' },
  { key: 'ready_for_pickup', label: 'Ready for Pickup', icon: Package, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-100' },
  { key: 'out_for_delivery', label: 'On the Way', icon: Bike, color: 'text-blue-600', bg: 'bg-blue-100', border: 'border-blue-200' },
  { key: 'delivered', label: 'Delivered', icon: CheckCircle, color: 'text-blue-700', bg: 'bg-blue-100', border: 'border-blue-200' },
];

const STATUS_ORDER = ['pending', 'confirmed', 'preparing', 'ready_for_pickup', 'out_for_delivery', 'delivered'];

const SOCKET_URL =
  import.meta.env.VITE_SOCKET_URL ||
  (import.meta.env.VITE_API_URL
    ? import.meta.env.VITE_API_URL.replace(/\/?api\/?$/, '')
    : 'http://localhost:5000');

const getAccessToken = () => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('accessToken');
};

const GOOGLE_MAPS_EMBED_KEY = import.meta.env.VITE_GOOGLE_MAPS_EMBED_KEY;

const buildDirectionsEmbedUrl = (origin, destination) => {
  if (!origin || !destination) return null;
  const originText = `${origin.lat},${origin.lng}`;
  const destText = `${destination.lat},${destination.lng}`;
  if (GOOGLE_MAPS_EMBED_KEY) {
    return `https://www.google.com/maps/embed/v1/directions?key=${GOOGLE_MAPS_EMBED_KEY}&origin=${encodeURIComponent(originText)}&destination=${encodeURIComponent(destText)}&mode=driving`;
  }
  return `https://maps.google.com/maps?f=d&source=s_d&saddr=${encodeURIComponent(originText)}&daddr=${encodeURIComponent(destText)}&output=embed`;
};

const buildDirectionsLink = (origin, destination) => {
  if (!origin || !destination) return null;
  const originText = `${origin.lat},${origin.lng}`;
  const destText = `${destination.lat},${destination.lng}`;
  return `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(originText)}&destination=${encodeURIComponent(destText)}&travelmode=driving`;
};

export default function OrderTrackingPage() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [orderItems, setOrderItems] = useState([]);
  const [shop, setShop] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [agentLocation, setAgentLocation] = useState(null);
  const [locationUpdatedAt, setLocationUpdatedAt] = useState(null);
  const [cancelReason, setCancelReason] = useState(null); // set when owner/admin cancels
  const intervalRef = useRef(null);
  const socketRef = useRef(null);

  useEffect(() => {
    fetchOrder();
    // Poll for updates every 5 seconds (simulating real-time)
    intervalRef.current = setInterval(fetchOrder, 5000);
    return () => clearInterval(intervalRef.current);
  }, [orderId]);

  useEffect(() => {
    if (!orderId) return;
    if (!socketRef.current) {
      const token = getAccessToken();
      socketRef.current = io(SOCKET_URL, {
        transports: ['websocket'],
        auth: token ? { token } : {},
      });
    }

    const socket = socketRef.current;
    socket.emit('joinOrderRoom', orderId);

    const handleLocation = (payload) => {
      const lat = Number(payload?.lat);
      const lng = Number(payload?.lng);
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;
      setAgentLocation({ lat, lng });
      setLocationUpdatedAt(new Date());
    };

    const handleStatus = (payload) => {
      if (!payload?.status) return;
      setOrder(prev => prev ? {
        ...prev,
        status: payload.status,
        deliveryAgent: payload.deliveryAgent ?? prev.deliveryAgent,
      } : prev);
    };

    // ── Real-time owner/admin cancellation ──
    const handleCancelled = (payload) => {
      setOrder(prev => prev ? { ...prev, status: 'cancelled' } : prev);
      setCancelReason(payload?.message || 'Your order has been cancelled.');
      clearInterval(intervalRef.current); // stop polling
    };

    socket.on('agentLocationUpdated', handleLocation);
    socket.on('order:status', handleStatus);
    socket.on('order:cancelled', handleCancelled);

    return () => {
      socket.off('agentLocationUpdated', handleLocation);
      socket.off('order:status', handleStatus);
      socket.off('order:cancelled', handleCancelled);
    };
  }, [orderId]);

  useEffect(() => {
    if (order?.status !== 'out_for_delivery') {
      setAgentLocation(null);
      setLocationUpdatedAt(null);
    }
  }, [order?.status]);

  useEffect(() => {
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, []);

  const fetchOrder = async () => {
    try {
      const { data } = await api.get(`/orders/${orderId}`);
      if (data.success && data.order) {
        setOrder(data.order);
        setOrderItems(data.order.items || []);
        setShop(data.order.shop);
        setLoading(false);

        if (data.order.status === 'delivered' || data.order.status === 'cancelled') {
          clearInterval(intervalRef.current);
        }
      } else {
        setLoading(false);
      }
    } catch (error) {
      console.error(error);
      setLoading(false);
    }
  };

  const copyOTP = () => {
    navigator.clipboard.writeText(order.deliveryOTP).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-[70vh] gap-4">
      <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin shadow-lg" />
      <p className="text-gray-500 font-bold tracking-wider uppercase text-sm animate-pulse">Locating Order...</p>
    </div>
  );

  if (!order) return (
    <div className="text-center py-20 px-4">
      <div className="w-24 h-24 bg-gray-100 rounded-full mx-auto flex items-center justify-center mb-6">
         <Package size={40} className="text-gray-400" />
      </div>
      <p className="text-xl font-extrabold text-gray-900 mb-2">Order not found</p>
      <p className="text-gray-500 font-medium mb-6">We couldn't find the details for this order.</p>
      <button onClick={() => navigate('/orders')} className="px-6 py-3 bg-gray-900 text-white rounded-xl text-sm font-bold uppercase tracking-wider">View Past Orders</button>
    </div>
  );

  const currentStepIndex = STATUS_ORDER.indexOf(order.status);
  const isCancelled = order.status === 'cancelled';
  const addr = order?.deliveryAddress || {};
  const addrLat = Number(addr.lat ?? addr.latitude);
  const addrLng = Number(addr.lng ?? addr.longitude);
  const customerCoords = Number.isFinite(addrLat) && Number.isFinite(addrLng)
    ? { lat: addrLat, lng: addrLng }
    : null;
  const directionsUrl = agentLocation && customerCoords
    ? buildDirectionsEmbedUrl(agentLocation, customerCoords)
    : null;
  const directionsLink = agentLocation && customerCoords
    ? buildDirectionsLink(agentLocation, customerCoords)
    : null;

  return (
    <div className="max-w-2xl mx-auto pb-24 md:pb-12 mt-4 md:mt-8 font-sans px-4 md:px-0">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
         <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)} className="w-10 h-10 bg-white border border-gray-200 rounded-full flex items-center justify-center text-gray-700 hover:bg-gray-50 md:hidden">
               <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">Order #{order._id?.slice(-8).toUpperCase() || order.id?.slice(-8).toUpperCase()}</h1>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mt-0.5">Track your meal</p>
            </div>
         </div>
        {order.status !== 'delivered' && order.status !== 'cancelled' && (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-orange-50 border border-orange-100 rounded-full text-xs text-orange-600 font-extrabold uppercase tracking-widest">
            <div className="w-2 h-2 bg-orange-500 rounded-full animate-ping" />
            Live
          </div>
        )}
      </div>

      {/* Status steps */}
      {!isCancelled ? (
        <div className="bg-white md:rounded-3xl shadow-sm border border-gray-100 p-6 mb-6">
          <div className="relative space-y-6">
             <div className="absolute left-6 top-6 bottom-6 w-0.5 bg-gray-100" />
            {STATUS_STEPS.map((step, i) => {
              const isComplete = i <= currentStepIndex;
              const isCurrent = i === currentStepIndex;
              return (
                <div key={step.key} className="relative flex items-start gap-4">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 z-10 transition-all border-4 border-white ${
                    isComplete ? `${step.bg} shadow-sm` : 'bg-gray-50'
                  } ${isCurrent ? 'ring-2 ring-orange-200 ring-offset-2' : ''}`}>
                    <step.icon size={20} className={isComplete ? step.color : 'text-gray-300'} />
                  </div>
                  <div className="flex-1 pt-2.5 flex justify-between items-center">
                    <div>
                        <p className={`text-base font-extrabold tracking-tight ${isComplete ? 'text-gray-900' : 'text-gray-400'}`}>
                        {step.label}
                        </p>
                        {isCurrent && order.status !== 'delivered' && (
                        <p className="text-xs font-bold text-orange-500 uppercase tracking-wider mt-1 animate-pulse">Processing...</p>
                        )}
                    </div>
                    {isComplete && <CheckCircle size={20} className="text-blue-600" />}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="bg-red-50 border border-red-200 rounded-3xl p-6 mb-6 flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <X size={32} className="text-red-500" />
          </div>
          <p className="text-xl font-extrabold text-red-700">Order Cancelled</p>
          <p className="text-sm font-semibold text-red-500 mt-2">
            {cancelReason || 'Unfortunately, your order could not be completed.'}
          </p>
        </div>
      )}

        {/* OTP */}
        {order.deliveryOTP && (
          <div className="bg-gradient-to-br from-blue-50 to-orange-50 border border-orange-100 rounded-3xl p-6 mb-6 shadow-sm">
          <div className="flex items-start justify-between">
             <div>
               <p className="text-sm font-extrabold text-blue-900 tracking-widest uppercase mb-1">Delivery PIN</p>
               <p className="text-xs font-semibold text-blue-700/80 max-w-[200px]">Share this PIN with the delivery partner upon arrival.</p>
             </div>
             <div className="flex items-center gap-2">
                 <div className="flex gap-1.5">
                 {order.deliveryOTP.split('').map((d, i) => (
                    <div key={i} className="w-10 h-12 bg-white border-2 border-orange-200 rounded-xl flex items-center justify-center text-xl font-extrabold text-orange-600 shadow-sm">
                        {d}
                    </div>
                 ))}
                 </div>
                 <button onClick={copyOTP} className="w-12 h-12 rounded-xl bg-white border border-orange-100 hover:bg-orange-50 flex items-center justify-center transition-colors shadow-sm">
                  <Copy size={20} className={copied ? 'text-blue-600' : 'text-orange-500'} />
                 </button>
             </div>
          </div>
        </div>
      )}

      {/* Live map */}
      {order.status === 'out_for_delivery' && (
        <div className="bg-white md:rounded-3xl shadow-sm border border-gray-100 p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse" />
              <p className="text-sm font-extrabold text-gray-900 uppercase tracking-wider">Live Delivery Location</p>
            </div>
            {locationUpdatedAt && (
              <span className="text-xs font-bold text-gray-500">
                Updated {locationUpdatedAt.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
          </div>

          {directionsUrl ? (
            <>
              <div className="rounded-2xl overflow-hidden border border-gray-100" style={{ height: 280, display: 'flex', flexDirection: 'column' }}>
                <iframe
                  key={`${agentLocation.lat.toFixed(5)},${agentLocation.lng.toFixed(5)}-${customerCoords.lat.toFixed(5)},${customerCoords.lng.toFixed(5)}`}
                  title="Delivery navigation"
                  src={directionsUrl}
                  style={{ width: '100%', flex: 1, border: 'none' }}
                  referrerPolicy="no-referrer-when-downgrade"
                  allowFullScreen
                />
                <div style={{ padding: '6px 14px', background: '#F9FAFB', borderTop: '1px solid #F0F0F0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span className="text-xs font-semibold text-gray-400">
                    {agentLocation.lat.toFixed(5)}, {agentLocation.lng.toFixed(5)}
                  </span>
                  {directionsLink && (
                    <a
                      href={directionsLink}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs font-bold text-orange-500"
                    >
                      Open in Google Maps
                    </a>
                  )}
                  <span className="text-xs font-bold text-green-500 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full inline-block animate-pulse" />
                    Tracking Live
                  </span>
                </div>
              </div>
            </>
          ) : agentLocation ? (
            <div className="h-44 rounded-2xl border border-dashed border-gray-200 bg-gray-50 flex flex-col items-center justify-center text-center px-6">
              <MapPin size={24} className="text-orange-500 mb-2" />
              <p className="text-sm font-bold text-gray-700">Add a saved address with GPS location</p>
              <p className="text-xs text-gray-500 mt-1">We need your address coordinates to draw the route.</p>
            </div>
          ) : (
            <div className="h-44 rounded-2xl border border-dashed border-gray-200 bg-gray-50 flex flex-col items-center justify-center text-center px-6">
              <MapPin size={24} className="text-orange-500 mb-2" />
              <p className="text-sm font-bold text-gray-700">Waiting for delivery partner location...</p>
              <p className="text-xs text-gray-500 mt-1">This will update automatically when they start moving.</p>
            </div>
          )}
        </div>
      )}

      {/* Restaurant info */}
      {shop && (
        <div className="bg-white md:rounded-3xl shadow-sm border border-gray-100 p-4 mb-6 flex items-center gap-4 hover:border-gray-200 transition-colors cursor-pointer" onClick={() => navigate(`/restaurant/${shop._id || shop.id}`)}>
          <img
            src={shop.images?.[0] || 'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&cs=tinysrgb&w=200'}
            alt={shop.name}
            className="w-16 h-16 rounded-2xl object-cover shadow-sm"
            onError={e => { e.target.src = 'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&cs=tinysrgb&w=200'; }}
          />
          <div className="flex-1">
            <p className="font-extrabold text-gray-900 text-lg tracking-tight mb-0.5">{shop.name}</p>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest flex items-center gap-1"><MapPin size={12}/> {shop.city}</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center border border-gray-100">
             <ArrowLeft size={16} className="text-gray-400 rotate-180" />
          </div>
        </div>
      )}

      {/* Order items */}
      <div className="bg-white md:rounded-3xl shadow-sm border border-gray-100 p-6 mb-6">
        <h3 className="font-extrabold text-gray-900 mb-6 uppercase tracking-wider text-sm border-b border-dashed border-gray-200 pb-4">Bill Details</h3>
        <div className="space-y-4">
          {orderItems.map((item, idx) => (
            <div key={item.id || idx} className="flex justify-between items-start text-sm font-semibold text-gray-700">
              <div className="flex gap-3 max-w-[200px] md:max-w-none">
                  <div className={`w-3.5 h-3.5 mt-0.5 border flex items-center justify-center flex-shrink-0 rounded-sm ${item.is_veg !== false ? 'border-blue-600' : 'border-red-600'}`}>
                    <div className={`w-1.5 h-1.5 rounded-full ${item.is_veg !== false ? 'bg-blue-600' : 'bg-red-600'}`} />
                 </div>
                 <span><span className="font-extrabold text-gray-900 mr-1">{item.quantity} x</span> {item.name}</span>
              </div>
              <span className="font-extrabold text-gray-900">₹{(item.price * item.quantity).toFixed(2)}</span>
            </div>
          ))}
        </div>
        <div className="border-t-2 border-dashed border-gray-200 mt-6 pt-4 flex justify-between font-extrabold text-gray-900 text-lg">
          <span>Paid via {order.paymentMethod === 'cod' ? 'Cash' : 'Online'}</span>
          <span>₹{(order.totalAmount || order.total_amount || 0).toFixed(2)}</span>
        </div>
      </div>

    </div>
  );
}
