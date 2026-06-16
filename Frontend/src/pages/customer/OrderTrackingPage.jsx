import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { Package, CheckCircle, ChevronLeft, Navigation, Loader2 } from 'lucide-react';
import api from '../../lib/axios';
import { io } from 'socket.io-client';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix default leaflet marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// Custom orange icon for delivery agent
const agentIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-orange.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const STATUS_STEPS = [
  { key: 'pending',          label: 'Order Placed' },
  { key: 'confirmed',        label: 'Confirmed' },
  { key: 'preparing',        label: 'Preparing' },
  { key: 'ready_for_pickup', label: 'Ready' },
  { key: 'out_for_delivery', label: 'On the way' },
  { key: 'delivered',        label: 'Delivered' },
];

function MapUpdater({ position }) {
  const map = useMap();
  useEffect(() => { if (position) map.setView(position, 15, { animate: true }); }, [position, map]);
  return null;
}

const TOKEN_KEY = 'ob_access_token';

export default function OrderTrackingPage() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [agentPos, setAgentPos] = useState(null);
  const [mapReady, setMapReady] = useState(false);
  const socketRef = useRef(null);

  // ── Fetch order details ────────────────────────────────────────────────────
  useEffect(() => {
    api.get(`/orders/${orderId}`)
      .then(({ data }) => setOrder(data.order || data))
      .catch(() => navigate('/orders'));
  }, [orderId, navigate]);

  // ── Connect to socket and join the order room ──────────────────────────────
  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY) || '';

    const socket = io(import.meta.env.VITE_API_URL || 'http://localhost:5000', {
      withCredentials: true,
      // Pass the access token so the socket middleware recognises the user.
      // Without this the middleware rejects/ignores the connection.
      auth: { token },
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      // Join the order-specific room to receive location + status updates.
      socket.emit('joinOrderRoom', orderId);

      // Also pull the last cached location immediately — the server will reply
      // with agentLocationUpdated if it has a cached position. This handles
      // the case where the agent was already moving before we joined the room.
      socket.emit('requestAgentLocation', orderId);
    });

    // Real-time agent location updates
    socket.on('agentLocationUpdated', ({ lat, lng }) => {
      if (Number.isFinite(lat) && Number.isFinite(lng)) {
        setAgentPos([lat, lng]);
        setMapReady(true);
      }
    });

    // Real-time order status changes
    socket.on('order:status', ({ status }) => {
      setOrder((prev) => prev ? { ...prev, status } : prev);
    });
    socket.on('orderStatusUpdated', ({ status }) => {
      setOrder((prev) => prev ? { ...prev, status } : prev);
    });

    return () => socket.disconnect();
  }, [orderId]);

  // ── Show map placeholder when agent is out for delivery ────────────────────
  useEffect(() => {
    if (order?.status === 'out_for_delivery') setMapReady(true);
  }, [order?.status]);

  const currentStepIndex = STATUS_STEPS.findIndex((s) => s.key === order?.status);

  // ── Loading state ──────────────────────────────────────────────────────────
  if (!order) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
          <Package className="w-8 h-8 text-gray-300" />
        </div>
        <p className="text-gray-400">Loading order details...</p>
      </div>
    );
  }

  const isOutForDelivery = order.status === 'out_for_delivery';
  const isDelivered = order.status === 'delivered';

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
      <button onClick={() => navigate('/orders')} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-5">
        <ChevronLeft className="w-4 h-4" /> My Orders
      </button>

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-black text-gray-900">Track Order</h1>
          <p className="text-xs text-gray-400 mt-0.5">#{orderId.slice(-8).toUpperCase()}</p>
        </div>
        {isDelivered && (
          <div className="flex items-center gap-1.5 bg-green-50 text-green-600 text-sm font-semibold px-3 py-1.5 rounded-full">
            <CheckCircle className="w-4 h-4" /> Delivered
          </div>
        )}
      </div>

      {/* ── Status timeline ─────────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm mb-5">
        <div className="flex items-start justify-between">
          {STATUS_STEPS.map((step, i) => {
            const stepIdx = STATUS_STEPS.findIndex((s) => s.key === step.key);
            const done = stepIdx <= currentStepIndex;
            const active = stepIdx === currentStepIndex;
            const isLast = i === STATUS_STEPS.length - 1;
            return (
              <div key={step.key} className="flex flex-col items-center flex-1">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-500
                  ${done ? 'bg-orange-500 text-white shadow-md shadow-orange-200' : 'bg-gray-100 text-gray-400'}
                  ${active ? 'ring-4 ring-orange-100 scale-110' : ''}`}>
                  {done ? <CheckCircle className="w-4 h-4" /> : i + 1}
                </div>
                <p className={`text-xs mt-1.5 text-center leading-tight
                  ${active ? 'text-orange-500 font-semibold' : done ? 'text-gray-600' : 'text-gray-300'}`}>
                  {step.label}
                </p>
                {/* Connector line between steps */}
                {!isLast && (
                  <div className="absolute" />
                )}
              </div>
            );
          })}
        </div>
        {/* Progress bar */}
        <div className="relative mt-3 h-1.5 bg-gray-100 rounded-full mx-4">
          <div
            className="absolute top-0 left-0 h-full bg-orange-500 rounded-full transition-all duration-700"
            style={{ width: `${Math.max(0, (currentStepIndex / (STATUS_STEPS.length - 1)) * 100)}%` }}
          />
        </div>
      </div>

      {/* ── Live tracking map ────────────────────────────────────────────────── */}
      {mapReady && (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm mb-5">
          <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-100">
            <Navigation className="w-4 h-4 text-orange-500" />
            <span className="font-semibold text-gray-800 text-sm">Live Delivery Tracking</span>
            {isOutForDelivery && !isDelivered && (
              <span className="ml-auto flex items-center gap-1.5 text-xs text-green-600 font-medium">
                <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                Live
              </span>
            )}
          </div>

          <div className="h-64">
            {agentPos ? (
              <MapContainer center={agentPos} zoom={15} style={{ height: '100%', width: '100%' }} zoomControl={true}>
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                />
                <Marker position={agentPos} icon={agentIcon}>
                  <Popup>
                    <span className="font-semibold text-orange-600">🛵 Delivery Agent</span><br />
                    <span className="text-xs text-gray-500">Heading your way</span>
                  </Popup>
                </Marker>
                <MapUpdater position={agentPos} />
              </MapContainer>
            ) : (
              // Agent is out for delivery but hasn't sent a location yet
              <div className="h-full flex flex-col items-center justify-center bg-gray-50 gap-3">
                <Loader2 className="w-6 h-6 text-orange-400 animate-spin" />
                <p className="text-sm text-gray-400">Waiting for agent location...</p>
                <p className="text-xs text-gray-300">The map will update automatically</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Order details ─────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
        <h3 className="font-bold text-gray-900 mb-3">Order Details</h3>
        <p className="text-sm text-gray-600 mb-2"><strong className="text-gray-800">From:</strong> {order.shop?.name}</p>
        <div className="space-y-1">
          {order.items?.map((item) => (
            <p key={item._id || item.name} className="text-sm text-gray-500">
              {item.name} × {item.quantity} — ₹{item.price * item.quantity}
            </p>
          ))}
        </div>
        <hr className="my-3 border-gray-100" />
        <div className="flex justify-between text-sm font-bold text-gray-900">
          <span>Total</span><span>₹{order.totalAmount}</span>
        </div>

        {/* OTP — only shown when out for delivery */}
        {order.deliveryOTP && !isDelivered && (
          <div className="mt-4 bg-orange-50 border border-orange-100 rounded-xl p-4 text-center">
            <p className="text-xs text-gray-500 mb-1">Share this OTP with the delivery agent</p>
            <p className="text-3xl font-black text-orange-500 tracking-widest">{order.deliveryOTP}</p>
          </div>
        )}
      </div>
    </div>
  );
}
