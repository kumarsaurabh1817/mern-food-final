import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { Package, CheckCircle, ChevronLeft, Navigation, Phone } from 'lucide-react';
import api from '../../lib/axios';
import { io } from 'socket.io-client';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({ iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png', iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png', shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png' });

const STATUS_STEPS = [
  { key: 'pending', label: 'Order Placed' },
  { key: 'confirmed', label: 'Confirmed' },
  { key: 'preparing', label: 'Preparing' },
  { key: 'ready_for_pickup', label: 'Ready' },
  { key: 'out_for_delivery', label: 'On the way' },
  { key: 'delivered', label: 'Delivered' },
];

function MapUpdater({ position }) {
  const map = useMap();
  useEffect(() => { if (position) map.setView(position, 15, { animate: true }); }, [position, map]);
  return null;
}

export default function OrderTrackingPage() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [agentPos, setAgentPos] = useState(null);
  const socketRef = useRef(null);

  useEffect(() => {
    api.get(`/orders/${orderId}`).then(({ data }) => setOrder(data.order || data)).catch(() => navigate('/orders'));
  }, [orderId]);

  useEffect(() => {
    const socket = io(import.meta.env.VITE_API_URL || 'http://localhost:5000', { withCredentials: true });
    socketRef.current = socket;
    socket.emit('joinOrderRoom', { orderId });
    socket.on('agentLocationUpdated', ({ lat, lng }) => setAgentPos([lat, lng]));
    socket.on('orderStatusUpdated', ({ status }) => setOrder((prev) => prev ? { ...prev, status } : prev));
    return () => socket.disconnect();
  }, [orderId]);

  const currentStepIndex = STATUS_STEPS.findIndex((s) => s.key === order?.status);

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
        {order.status === 'delivered' && (
          <div className="flex items-center gap-1.5 bg-green-50 text-green-600 text-sm font-semibold px-3 py-1.5 rounded-full">
            <CheckCircle className="w-4 h-4" /> Delivered
          </div>
        )}
      </div>

      {/* Status timeline */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm mb-5">
        <div className="flex items-center justify-between">
          {STATUS_STEPS.filter((s) => s.key !== 'cancelled').map((step, i) => {
            const stepIdx = STATUS_STEPS.findIndex((s2) => s2.key === step.key);
            const done = stepIdx <= currentStepIndex;
            const active = stepIdx === currentStepIndex;
            return (
              <div key={step.key} className="flex flex-col items-center flex-1">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${done ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-400'} ${active ? 'ring-4 ring-orange-100' : ''}`}>
                  {done ? <CheckCircle className="w-4 h-4" /> : i + 1}
                </div>
                <p className={`text-xs mt-1.5 text-center leading-tight ${active ? 'text-orange-500 font-semibold' : done ? 'text-gray-600' : 'text-gray-300'}`}>
                  {step.label}
                </p>
                {i < STATUS_STEPS.filter((s) => s.key !== 'cancelled').length - 1 && (
                  <div className="hidden" />
                )}
              </div>
            );
          })}
        </div>
        <div className="relative mt-2">
          <div className="absolute top-0 left-4 right-4 h-1 bg-gray-100 rounded-full" />
          <div
            className="absolute top-0 left-4 h-1 bg-orange-500 rounded-full transition-all duration-700"
            style={{ right: `${100 - (currentStepIndex / (STATUS_STEPS.filter((s) => s.key !== 'cancelled').length - 1)) * 100}%` }}
          />
        </div>
      </div>

      {/* Order info */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm mb-5">
        <h3 className="font-bold text-gray-900 mb-3">Order Details</h3>
        <p className="text-sm text-gray-600 mb-2"><strong className="text-gray-800">From:</strong> {order.shop?.name}</p>
        <div className="space-y-1">
          {order.items?.map((item) => (
            <p key={item._id || item.name} className="text-sm text-gray-500">{item.name} × {item.quantity} — ₹{item.price * item.quantity}</p>
          ))}
        </div>
        <hr className="my-3 border-gray-100" />
        <div className="flex justify-between text-sm font-bold text-gray-900">
          <span>Total</span><span>₹{order.totalAmount}</span>
        </div>
        {order.deliveryOTP && order.status !== 'delivered' && (
          <div className="mt-3 bg-orange-50 border border-orange-100 rounded-xl p-3 text-center">
            <p className="text-xs text-gray-500 mb-1">Share this OTP with the delivery agent</p>
            <p className="text-3xl font-black text-orange-500 tracking-widest">{order.deliveryOTP}</p>
          </div>
        )}
      </div>

      {/* Live map */}
      {(agentPos || order.status === 'out_for_delivery') && (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
          <div className="flex items-center gap-2 p-4 border-b border-gray-100">
            <Navigation className="w-4 h-4 text-orange-500" />
            <span className="font-semibold text-gray-800 text-sm">Live Delivery Tracking</span>
            <span className="ml-auto w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          </div>
          <div className="h-64">
            {agentPos ? (
              <MapContainer center={agentPos} zoom={15} style={{ height: '100%', width: '100%' }}>
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                <Marker position={agentPos}><Popup>Delivery Agent</Popup></Marker>
                <MapUpdater position={agentPos} />
              </MapContainer>
            ) : (
              <div className="h-full flex items-center justify-center bg-gray-50">
                <p className="text-sm text-gray-400">Waiting for agent location...</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
