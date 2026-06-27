import { useState, useEffect, useRef, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { Package, CheckCircle, ChevronLeft, Navigation, Loader2, Store, MapPin } from 'lucide-react';
import api from '../../lib/axios';
import { getSocket } from '../../lib/socket';
import { showToast } from '../../features/ui/uiSlice';
import { STATUS_STEPS, statusStepIndex } from '../../lib/orderStatus';
import { addressToLatLng, shopToLatLng, haversineDistanceKm, etaMinutes, formatDistance } from '../../lib/geo';
import LiveMap from '../../components/map/LiveMap';

export default function OrderTrackingPage() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [order, setOrder] = useState(null);
  const [agentPos, setAgentPos] = useState(null);
  const [mapReady, setMapReady] = useState(false);
  const socketRef = useRef(null);

  useEffect(() => {
    // Guard: redirect immediately if orderId is not a valid Mongo ObjectId
    if (!orderId || !/^[a-f\d]{24}$/i.test(orderId)) {
      navigate('/orders', { replace: true });
      return;
    }
    api.get(`/orders/${orderId}`)
      .then(({ data }) => setOrder(data.order || data))
      .catch(() => navigate('/orders'));
  }, [orderId, navigate]);

  useEffect(() => {
    // Don't connect the socket until we know orderId is valid
    if (!orderId || !/^[a-f\d]{24}$/i.test(orderId)) return;

    const socket = getSocket();
    socketRef.current = socket;

    const join = () => {
      socket.emit('joinOrderRoom', orderId);
      socket.emit('requestAgentLocation', orderId);
    };
    socket.on('connect', join);
    if (socket.connected) join();

    const onAgentLocation = ({ lat, lng }) => {
      if (Number.isFinite(lat) && Number.isFinite(lng)) {
        setAgentPos([lat, lng]);
        setMapReady(true);
      }
    };
    const onStatus = (p) => setOrder((prev) => (prev ? { ...prev, status: p.status, ...(p.order || {}) } : prev));
    const onCancelled = ({ message }) => {
      setOrder((prev) => (prev ? { ...prev, status: 'cancelled' } : prev));
      dispatch(showToast({ message: message || 'Order cancelled', type: 'warning' }));
    };

    socket.on('agentLocationUpdated', onAgentLocation);
    socket.on('order:update', onStatus);
    socket.on('order:cancelled', onCancelled);

    return () => {
      socket.off('connect', join);
      socket.off('agentLocationUpdated', onAgentLocation);
      socket.off('order:update', onStatus);
      socket.off('order:cancelled', onCancelled);
    };
  }, [orderId, dispatch]);

  useEffect(() => {
    if (order?.status === 'out_for_delivery') setMapReady(true);
  }, [order?.status]);

  const currentStepIndex = statusStepIndex(order?.status);
  const isOutForDelivery = order?.status === 'out_for_delivery';
  const isDelivered = order?.status === 'delivered';

  // Map points: agent (live), customer destination, restaurant pickup.
  const destPos = useMemo(() => addressToLatLng(order?.deliveryAddress), [order?.deliveryAddress]);
  const pickupPos = useMemo(() => shopToLatLng(order?.shop), [order?.shop]);

  // Live distance + ETA from agent → destination. Prefer the real road route
  // (from LiveMap/OSRM) when available; fall back to straight-line haversine.
  const [routeInfo, setRouteInfo] = useState(null);
  const haversineKm = agentPos && destPos
    ? haversineDistanceKm(agentPos[0], agentPos[1], destPos[0], destPos[1])
    : null;
  const distanceKm = routeInfo?.distanceKm ?? haversineKm;
  const eta = routeInfo?.durationMin ?? etaMinutes(distanceKm);

  if (!order) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-16 h-16 bg-orange-50 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
            <Package className="w-8 h-8 text-orange-300" />
          </div>
          <p className="text-gray-400">Loading order details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 sm:px-6 py-6 max-w-screen-xl mx-auto">
      {/* Back button + title row */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => navigate('/orders')}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" /> My Orders
        </button>
        <div className="flex-1">
          <h1 className="text-xl font-black text-gray-900 leading-none">Track Order</h1>
          <p className="text-xs text-gray-400 mt-0.5">#{(orderId || '').slice(-8).toUpperCase()}</p>
        </div>
        {isDelivered && (
          <div className="flex items-center gap-1.5 bg-green-50 text-green-600 text-sm font-semibold px-3 py-1.5 rounded-full border border-green-200">
            <CheckCircle className="w-4 h-4" /> Delivered
          </div>
        )}
      </div>

      {/* ── Two-column split layout ──────────────────────────────────────────── */}
      {/* On mobile: stacks vertically. On lg+: left info | right map side-by-side */}
      <div className="flex flex-col lg:flex-row gap-5">

        {/* ── LEFT COLUMN — Order info ──────────────────────────────────────── */}
        <div className="flex flex-col gap-5 lg:w-[420px] xl:w-[460px] flex-shrink-0">

          {/* Status timeline */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-4">Order Progress</p>
            <div className="flex items-start justify-between">
              {STATUS_STEPS.map((step, i) => {
                const stepIdx = STATUS_STEPS.findIndex((s) => s.key === step.key);
                const done = stepIdx <= currentStepIndex;
                const active = stepIdx === currentStepIndex;
                return (
                  <div key={step.key} className="flex flex-col items-center flex-1">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-500
                      ${done ? 'bg-orange-500 text-white shadow-md shadow-orange-200' : 'bg-gray-100 text-gray-400'}
                      ${active ? 'ring-4 ring-orange-100 scale-110' : ''}`}>
                      {done ? <CheckCircle className="w-4 h-4" /> : i + 1}
                    </div>
                    <p className={`text-[10px] mt-1.5 text-center leading-tight font-medium
                      ${active ? 'text-orange-500' : done ? 'text-gray-600' : 'text-gray-300'}`}>
                      {step.label}
                    </p>
                  </div>
                );
              })}
            </div>
            <div className="relative mt-3 h-1.5 bg-gray-100 rounded-full mx-4">
              <div
                className="absolute top-0 left-0 h-full bg-orange-500 rounded-full transition-all duration-700"
                style={{ width: `${Math.max(0, (currentStepIndex / (STATUS_STEPS.length - 1)) * 100)}%` }}
              />
            </div>
          </div>

          {/* Restaurant + items */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 bg-orange-50 rounded-lg flex items-center justify-center">
                <Store className="w-4 h-4 text-orange-500" />
              </div>
              <div>
                <p className="font-bold text-gray-900 text-sm">{order.shop?.name}</p>
                <p className="text-xs text-gray-400">Restaurant</p>
              </div>
            </div>

            <div className="bg-gray-50 rounded-xl p-3 mb-3 space-y-1.5">
              {order.items?.map((item) => (
                <div key={item._id || item.name} className="flex justify-between text-sm">
                  <span className="text-gray-700">{item.name} <span className="text-gray-400">×{item.quantity}</span></span>
                  <span className="text-gray-600 font-medium">₹{item.price * item.quantity}</span>
                </div>
              ))}
            </div>

            <div className="flex justify-between text-sm font-bold text-gray-900 pt-1 border-t border-gray-100">
              <span>Total</span><span>₹{order.totalAmount}</span>
            </div>
          </div>

          {/* Delivery address */}
          {order.deliveryAddress && (
            <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-red-50 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                  <MapPin className="w-4 h-4 text-red-500" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Delivery Address</p>
                  <p className="text-sm text-gray-700 leading-relaxed">
                    {[order.deliveryAddress.street, order.deliveryAddress.city, order.deliveryAddress.state, order.deliveryAddress.zipCode].filter(Boolean).join(', ')}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* OTP card */}
          {order.deliveryOTP && !isDelivered && (
            <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl p-5 text-center shadow-lg shadow-orange-200">
              <p className="text-orange-100 text-xs mb-2 font-medium">Share this OTP with the delivery agent</p>
              <p className="text-4xl font-black text-white tracking-[0.3em]">{order.deliveryOTP}</p>
            </div>
          )}
        </div>

        {/* ── RIGHT COLUMN — Live map (sticky on desktop) ───────────────────── */}
        <div className="flex-1 min-h-[400px] lg:min-h-0">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden h-full flex flex-col lg:sticky lg:top-6" style={{ minHeight: '480px' }}>
            {/* Map header */}
            <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-100 flex-shrink-0">
              <Navigation className="w-4 h-4 text-orange-500" />
              <span className="font-semibold text-gray-800 text-sm">Live Delivery Tracking</span>
              {isOutForDelivery && !isDelivered && distanceKm != null && (
                <span className="ml-auto flex items-center gap-2 text-xs font-semibold text-gray-700">
                  <span className="bg-orange-50 text-orange-600 px-2 py-0.5 rounded-full">{formatDistance(distanceKm)}</span>
                  {eta != null && <span className="bg-green-50 text-green-600 px-2 py-0.5 rounded-full">~{eta} min</span>}
                </span>
              )}
              {isOutForDelivery && !isDelivered && distanceKm == null && (
                <span className="ml-auto flex items-center gap-1.5 text-xs text-green-600 font-medium">
                  <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                  Live
                </span>
              )}
            </div>

            {/* Map body */}
            <div className="flex-1 relative" style={{ minHeight: '420px' }}>
              {mapReady ? (
                agentPos || destPos ? (
                  <LiveMap
                    agent={agentPos}
                    destination={destPos}
                    pickup={pickupPos}
                    agentLabel="Delivery Agent — heading your way"
                    destinationLabel="Your delivery address"
                    pickupLabel={order.shop?.name || 'Restaurant'}
                    onRouteInfo={setRouteInfo}
                  />
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-50 gap-3">
                    <div className="w-14 h-14 bg-orange-50 rounded-full flex items-center justify-center">
                      <Loader2 className="w-7 h-7 text-orange-400 animate-spin" />
                    </div>
                    <p className="text-sm font-medium text-gray-600">Waiting for agent location...</p>
                    <p className="text-xs text-gray-400">The map updates automatically</p>
                  </div>
                )
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-50 gap-3">
                  <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center">
                    <Navigation className="w-7 h-7 text-gray-300" />
                  </div>
                  <p className="text-sm font-medium text-gray-500">Live tracking available</p>
                  <p className="text-xs text-gray-400">Map will appear when your order is out for delivery</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
