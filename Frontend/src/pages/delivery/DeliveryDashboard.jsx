import { useState, useEffect, useRef } from 'react';
import {
  ToggleLeft, ToggleRight, CheckCircle, XCircle, Send, Loader2,
  Navigation, DollarSign, Package, RefreshCw, MapPin, UtensilsCrossed,
  IndianRupee, Bike, TrendingUp
} from 'lucide-react';
import api from '../../lib/axios';
import { getSocket } from '../../lib/socket';
import { useDispatch } from 'react-redux';
import { showToast } from '../../features/ui/uiSlice';
import LiveMap from '../../components/map/LiveMap';
import LiveDot from '../../components/ui/LiveDot';
import { addressToLatLng, shopToLatLng, haversineDistanceKm, etaMinutes, formatDistance } from '../../lib/geo';

export default function DeliveryDashboard() {
  const dispatch = useDispatch();
  const [profile, setProfile] = useState(null);
  const [pool, setPool] = useState([]);
  const [earnings, setEarnings] = useState(null);
  const [activeOrder, setActiveOrder] = useState(null);
  const [otp, setOtp] = useState('');
  const [myPos, setMyPos] = useState(null);
  const [routeInfo, setRouteInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actioning, setActioning] = useState(null);
  const socketRef = useRef(null);
  const geoRef = useRef(null);
  // Mirror live state into refs so the once-mounted socket handlers (empty deps)
  // always read the current active order / online flag instead of stale closures.
  const activeRef = useRef(null);
  const onlineRef = useRef(false);
  useEffect(() => { activeRef.current = activeOrder; }, [activeOrder]);
  useEffect(() => { onlineRef.current = !!profile?.isOnline; }, [profile?.isOnline]);

  const fetchPool = async () => {
    try {
      const res = await api.get('/delivery/pool');
      const orders = res.data.orders || res.data || [];
      // Deduplicate by _id — last-resort guard against any race condition
      const seen = new Set();
      const unique = orders.filter((o) => {
        if (seen.has(o._id)) return false;
        seen.add(o._id);
        return true;
      });
      setPool(unique);
    } catch (_) {
      // 400 = agent is offline — pool stays empty, which is correct
      setPool([]);
    }
  };

  const fetchAll = async () => {
    try {
      const [profileRes, earningsRes, myOrdersRes] = await Promise.all([
        api.get('/delivery/me'),
        api.get('/delivery/earnings'),
        api.get('/orders?status=out_for_delivery'),
      ]);
      const prof = profileRes.data.profile || profileRes.data;
      setProfile(prof);
      setEarnings(earningsRes.data);

      const myOrders = myOrdersRes.data.orders || [];
      const inProgress = myOrders.find((o) => o.status === 'out_for_delivery');
      if (inProgress) {
        // Agent already has an active delivery — don't show pool at all
        setActiveOrder(inProgress);
        setPool([]);
      } else {
        setActiveOrder(null);
        // Only fetch pool if the agent is online
        if (prof?.isOnline) await fetchPool();
        else setPool([]);
      }
    } catch (_) {}
    setLoading(false);
  };

  useEffect(() => {
    fetchAll();
    const socket = getSocket();
    socketRef.current = socket;

    const joinPool = () => socket.emit('joinDeliveryPool');
    socket.on('connect', joinPool);
    if (socket.connected) joinPool();

    // A new order became available — refetch the pool (only while idle + online).
    const onPoolAdd = ({ order }) => {
      if (activeRef.current || !onlineRef.current) return;
      fetchPool();
      dispatch(showToast({
        message: `New order available${order?.shop?.name ? ` from ${order.shop.name}` : ''}!`,
        type: 'info',
      }));
    };
    // An order left the pool (accepted by someone / cancelled) — drop it locally.
    const onPoolRemove = ({ orderId }) => {
      setPool((prev) => prev.filter((o) => o._id !== orderId));
    };
    // Status change on the agent's active order (e.g. owner/admin cancelled it).
    const onOrderUpdate = (p) => {
      setActiveOrder((prev) => {
        if (!prev || prev._id !== p.orderId) return prev;
        if (p.status === 'cancelled' || p.status === 'delivered') {
          dispatch(showToast({ message: `Order ${p.status}`, type: 'info' }));
          fetchAll();
          return null;
        }
        return { ...prev, status: p.status };
      });
    };

    socket.on('pool:add', onPoolAdd);
    socket.on('pool:remove', onPoolRemove);
    socket.on('order:update', onOrderUpdate);

    return () => {
      socket.off('connect', joinPool);
      socket.off('pool:add', onPoolAdd);
      socket.off('pool:remove', onPoolRemove);
      socket.off('order:update', onOrderUpdate);
      socket.emit('leaveDeliveryPool');
      if (geoRef.current) navigator.geolocation.clearWatch(geoRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!profile?.isOnline || !activeOrder) {
      if (geoRef.current) { navigator.geolocation.clearWatch(geoRef.current); geoRef.current = null; }
      return;
    }

    const emitLocation = (lat, lng) => {
      setMyPos([lat, lng]);
      socketRef.current?.emit('updateLocation', { orderId: activeOrder._id, lat, lng });
    };

    // Push current position immediately so customer map populates right away
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => emitLocation(pos.coords.latitude, pos.coords.longitude),
        () => {},
        { enableHighAccuracy: true, timeout: 10000 }
      );
    }

    geoRef.current = navigator.geolocation.watchPosition(
      (pos) => emitLocation(pos.coords.latitude, pos.coords.longitude),
      () => {},
      { enableHighAccuracy: true }
    );
    return () => { if (geoRef.current) navigator.geolocation.clearWatch(geoRef.current); };
  }, [profile?.isOnline, activeOrder]);

  const toggleDuty = async () => {
    try {
      const { data } = await api.patch('/delivery/toggle-duty');
      const nowOnline = data.isOnline ?? !profile?.isOnline;
      setProfile((prev) => ({ ...prev, isOnline: nowOnline }));
      dispatch(showToast({ message: `You are now ${nowOnline ? 'on duty' : 'off duty'}`, type: 'info' }));
      if (nowOnline) {
        // Fetch pool fresh when going online
        await fetchPool();
      } else {
        setPool([]);
      }
    } catch (_) {
      dispatch(showToast({ message: 'Failed to toggle duty', type: 'error' }));
    }
  };

  const handleAccept = async (orderId) => {
    setActioning(orderId);
    try {
      const { data } = await api.post(`/delivery/accept/${orderId}`);
      setActiveOrder(data.order || pool.find((o) => o._id === orderId));
      setPool([]);
      dispatch(showToast({ message: 'Order accepted!', type: 'success' }));
    } catch (err) {
      dispatch(showToast({ message: err.response?.data?.message || 'Failed to accept', type: 'error' }));
    } finally {
      setActioning(null);
    }
  };

  const handleReject = async (orderId) => {
    setActioning(orderId + '_reject');
    try {
      await api.post(`/delivery/reject/${orderId}`);
      setPool((prev) => prev.filter((o) => o._id !== orderId));
      dispatch(showToast({ message: 'Order rejected', type: 'info' }));
    } catch (err) {
      dispatch(showToast({ message: 'Failed to reject', type: 'error' }));
    } finally {
      setActioning(null);
    }
  };

  const handleRelease = async () => {
    if (!activeOrder) return;
    try {
      await api.post(`/delivery/release/${activeOrder._id}`);
      // Clear active order and pool immediately — don't wait for fetchPool
      // to avoid showing the released order back in this agent's pool.
      setActiveOrder(null);
      setPool([]);
      dispatch(showToast({ message: 'Order released back to pool', type: 'info' }));
      // Fetch pool after a short delay to let the DB write settle
      setTimeout(fetchPool, 500);
    } catch (err) {
      dispatch(showToast({ message: 'Failed to release order', type: 'error' }));
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (!activeOrder || !otp) return;
    try {
      await api.post(`/orders/${activeOrder._id}/verify-otp`, { otp });
      setActiveOrder(null);
      setOtp('');
      fetchAll();
      dispatch(showToast({ message: 'Delivery confirmed!', type: 'success' }));
    } catch (err) {
      dispatch(showToast({ message: err.response?.data?.message || 'Invalid OTP', type: 'error' }));
    }
  };

  // Map points for the active delivery: agent = self (myPos), destination =
  // customer's saved coordinates, pickup = restaurant (when shop has coords).
  const destPos = addressToLatLng(activeOrder?.deliveryAddress);
  const pickupPos = shopToLatLng(activeOrder?.shop);
  // Prefer the real road route distance/ETA; fall back to straight-line.
  const haversineKm = myPos && destPos
    ? haversineDistanceKm(myPos[0], myPos[1], destPos[0], destPos[1])
    : null;
  const distanceKm = routeInfo?.distanceKm ?? haversineKm;
  const eta = routeInfo?.durationMin ?? etaMinutes(distanceKm);

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => <div key={i} className="bg-white rounded-2xl h-20 animate-pulse" />)}
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row gap-5 items-start">

      {/* ── LEFT COLUMN ──────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-5 w-full lg:w-[420px] xl:w-[460px] flex-shrink-0">

        {/* Duty toggle */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm flex items-center justify-between">
          <div>
            <h2 className="font-bold text-gray-900">Duty Status</h2>
            <p className="text-sm text-gray-400 mt-0.5">
              {profile?.isOnline ? 'Online — receiving orders' : 'You are offline'}
            </p>
          </div>
          <button
            onClick={toggleDuty}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-colors
              ${profile?.isOnline
                ? 'bg-green-500 hover:bg-green-600 text-white shadow-md shadow-green-200'
                : 'bg-gray-100 hover:bg-gray-200 text-gray-600'}`}
          >
            {profile?.isOnline ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5" />}
            {profile?.isOnline ? 'On Duty' : 'Go Online'}
          </button>
        </div>

        {/* Earnings stats */}
        {earnings && (
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Total Earned', value: `₹${earnings.totalEarnings || 0}`, icon: DollarSign, color: 'text-green-600', bg: 'bg-green-50' },
              { label: 'Deliveries', value: earnings.totalDeliveries || 0, icon: TrendingUp, color: 'text-blue-600', bg: 'bg-blue-50' },
              { label: "Today's", value: `₹${earnings.todayEarnings || 0}`, icon: IndianRupee, color: 'text-orange-500', bg: 'bg-orange-50' },
            ].map(({ label, value, icon: Icon, color, bg }) => (
              <div key={label} className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm text-center">
                <div className={`w-9 h-9 ${bg} rounded-xl flex items-center justify-center mx-auto mb-2`}>
                  <Icon className={`w-4 h-4 ${color}`} />
                </div>
                <p className="text-lg font-black text-gray-900">{value}</p>
                <p className="text-xs text-gray-400">{label}</p>
              </div>
            ))}
          </div>
        )}

        {/* Active order info + OTP */}
        {activeOrder && (
          <div className="bg-white rounded-2xl border border-orange-200 p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-gray-900 flex items-center gap-2">
                <span className="w-2 h-2 bg-orange-500 rounded-full animate-pulse" />
                Active Delivery
              </h3>
              <button
                onClick={handleRelease}
                className="text-xs text-red-500 hover:text-red-600 border border-red-200 px-3 py-1 rounded-full hover:bg-red-50 transition-colors"
              >
                Release
              </button>
            </div>

            {/* Pickup → Dropoff */}
            <div className="space-y-2">
              <div className="flex items-start gap-2.5">
                <div className="w-7 h-7 bg-orange-50 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                  <UtensilsCrossed className="w-3.5 h-3.5 text-orange-500" />
                </div>
                <div>
                  <p className="text-xs text-gray-400 font-medium">Pickup from</p>
                  <p className="text-sm font-semibold text-gray-800">{activeOrder.shop?.name}</p>
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <div className="w-7 h-7 bg-red-50 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                  <MapPin className="w-3.5 h-3.5 text-red-500" />
                </div>
                <div>
                  <p className="text-xs text-gray-400 font-medium">Deliver to</p>
                  <p className="text-sm font-semibold text-gray-800">
                    {[activeOrder.deliveryAddress?.street, activeOrder.deliveryAddress?.city].filter(Boolean).join(', ')}
                  </p>
                </div>
              </div>
            </div>

            {/* Items summary */}
            <div className="bg-gray-50 rounded-xl px-3 py-2.5">
              <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide mb-1.5">Items</p>
              {activeOrder.items?.map((item, i) => (
                <div key={i} className="flex justify-between text-sm">
                  <span className="text-gray-700">{item.name}</span>
                  <span className="text-gray-500">×{item.quantity}</span>
                </div>
              ))}
            </div>

            {/* OTP verify form */}
            <form onSubmit={handleVerifyOtp} className="space-y-2">
              <p className="text-xs text-gray-500 font-medium">Enter OTP from customer to confirm delivery</p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder="Enter OTP"
                  maxLength={6}
                  className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-orange-400 text-center text-lg font-bold tracking-widest"
                />
                <button
                  type="submit"
                  disabled={!otp}
                  className="bg-green-500 hover:bg-green-600 text-white px-4 py-2.5 rounded-xl disabled:opacity-50 flex items-center gap-2 font-semibold text-sm transition-colors"
                >
                  <Send className="w-4 h-4" /> Verify
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Order pool */}
        {profile?.isOnline && !activeOrder && (
          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-900">Available Orders</h3>
              <button onClick={fetchAll} className="text-gray-400 hover:text-gray-600 transition-colors">
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>

            {pool.length === 0 ? (
              <div className="text-center py-10">
                <Package className="w-10 h-10 mx-auto text-gray-200 mb-2" />
                <p className="text-gray-400 text-sm">No orders available right now</p>
              </div>
            ) : (
              <div className="space-y-3">
                {pool.map((order) => {
                  const addr = order.deliveryAddress || {};
                  const addrLine = [addr.street, addr.city, addr.state].filter(Boolean).join(', ');
                  return (
                    <div key={order._id} className="border border-gray-100 rounded-2xl p-4 space-y-3 hover:border-orange-200 transition-colors">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-orange-50 rounded-lg flex items-center justify-center flex-shrink-0">
                            <UtensilsCrossed className="w-4 h-4 text-orange-500" />
                          </div>
                          <div>
                            <p className="font-bold text-gray-900 text-sm">{order.shop?.name || 'Restaurant'}</p>
                            <p className="text-xs text-gray-400">Pickup point</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-0.5 text-orange-500 font-black text-base flex-shrink-0">
                          <IndianRupee className="w-4 h-4" />{order.totalAmount}
                        </div>
                      </div>

                      <div className="bg-gray-50 rounded-xl px-3 py-2.5">
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5 flex items-center gap-1">
                          <Package className="w-3 h-3" /> Items
                        </p>
                        {order.items?.map((item, idx) => (
                          <div key={idx} className="flex justify-between text-sm">
                            <span className="text-gray-700">{item.name}</span>
                            <span className="text-gray-500 font-medium">×{item.quantity}</span>
                          </div>
                        ))}
                      </div>

                      <div className="flex items-start gap-2">
                        <MapPin className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-xs font-semibold text-gray-500 mb-0.5">Deliver to</p>
                          <p className="text-sm text-gray-700">{addrLine || 'Address not available'}</p>
                        </div>
                      </div>

                      <div className="flex gap-2 pt-1">
                        <button
                          onClick={() => handleAccept(order._id)}
                          disabled={actioning === order._id}
                          className="flex-1 bg-green-500 hover:bg-green-600 text-white text-sm font-semibold py-2.5 rounded-xl flex items-center justify-center gap-1.5 disabled:opacity-60 shadow-sm shadow-green-100 transition-colors"
                        >
                          {actioning === order._id ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                          Accept
                        </button>
                        <button
                          onClick={() => handleReject(order._id)}
                          disabled={actioning === order._id + '_reject'}
                          className="flex-1 bg-red-50 hover:bg-red-100 border border-red-100 text-red-600 text-sm font-semibold py-2.5 rounded-xl flex items-center justify-center gap-1.5 disabled:opacity-60 transition-colors"
                        >
                          {actioning === order._id + '_reject' ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                          Reject
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {!profile?.isOnline && (
          <div className="bg-gray-50 border border-gray-100 rounded-2xl p-10 text-center">
            <Bike className="w-10 h-10 mx-auto text-gray-200 mb-3" />
            <p className="text-gray-400 text-sm">Go online to start receiving delivery orders</p>
          </div>
        )}
      </div>

      {/* ── RIGHT COLUMN — Live map (always visible on desktop) ────────────── */}
      <div className="flex-1 w-full lg:sticky lg:top-6" style={{ minHeight: '520px' }}>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden h-full flex flex-col" style={{ minHeight: '520px' }}>
          {/* Map header */}
          <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-100 flex-shrink-0">
            <Navigation className="w-4 h-4 text-orange-500" />
            <span className="font-semibold text-gray-800 text-sm">
              {activeOrder ? 'Route to Customer' : 'Delivery Map'}
            </span>
            {activeOrder && myPos && destPos && distanceKm != null ? (
              <span className="ml-auto flex items-center gap-2 text-xs font-semibold text-gray-700">
                <span className="bg-orange-50 text-orange-600 px-2 py-0.5 rounded-full">{formatDistance(distanceKm)}</span>
                {eta != null && <span className="bg-green-50 text-green-600 px-2 py-0.5 rounded-full">~{eta} min</span>}
              </span>
            ) : activeOrder && myPos ? (
              <span className="ml-auto"><LiveDot label="Broadcasting" /></span>
            ) : null}
          </div>

          {/* Map body */}
          <div className="flex-1 relative" style={{ minHeight: '470px' }}>
            {activeOrder && myPos ? (
              <LiveMap
                agent={myPos}
                destination={destPos}
                pickup={pickupPos}
                agentLabel="You"
                destinationLabel="Customer delivery address"
                pickupLabel={activeOrder.shop?.name || 'Restaurant'}
                onRouteInfo={setRouteInfo}
              />
            ) : activeOrder && !myPos ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-50 gap-3">
                <div className="w-14 h-14 bg-orange-50 rounded-full flex items-center justify-center">
                  <Loader2 className="w-7 h-7 text-orange-400 animate-spin" />
                </div>
                <p className="text-sm font-medium text-gray-600">Getting your location...</p>
                <p className="text-xs text-gray-400">Allow location access in your browser</p>
              </div>
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-50 gap-3">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                  <Bike className="w-8 h-8 text-gray-300" />
                </div>
                <p className="text-sm font-medium text-gray-500">No active delivery</p>
                <p className="text-xs text-gray-400 text-center px-6">
                  {profile?.isOnline ? 'Accept an order to see your live location here' : 'Go online to start receiving orders'}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
