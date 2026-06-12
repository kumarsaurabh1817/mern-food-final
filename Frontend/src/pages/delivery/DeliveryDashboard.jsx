import { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { ToggleLeft, ToggleRight, CheckCircle, XCircle, Send, Loader2, Navigation, DollarSign, Package, RefreshCw } from 'lucide-react';
import api from '../../lib/axios';
import { io } from 'socket.io-client';
import { useDispatch } from 'react-redux';
import { showToast } from '../../features/ui/uiSlice';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({ iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png', iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png', shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png' });

function MapUpdater({ position }) {
  const map = useMap();
  useEffect(() => { if (position) map.setView(position, 15, { animate: true }); }, [position, map]);
  return null;
}

export default function DeliveryDashboard() {
  const dispatch = useDispatch();
  const [profile, setProfile] = useState(null);
  const [pool, setPool] = useState([]);
  const [earnings, setEarnings] = useState(null);
  const [activeOrder, setActiveOrder] = useState(null);
  const [otp, setOtp] = useState('');
  const [myPos, setMyPos] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actioning, setActioning] = useState(null);
  const socketRef = useRef(null);
  const geoRef = useRef(null);

  const fetchAll = async () => {
    try {
      const [profileRes, poolRes, earningsRes] = await Promise.all([
        api.get('/delivery/me'),
        api.get('/delivery/pool'),
        api.get('/delivery/earnings'),
      ]);
      setProfile(profileRes.data.profile || profileRes.data);
      setPool(poolRes.data.orders || poolRes.data || []);
      setEarnings(earningsRes.data);
    } catch (_) {}
    setLoading(false);
  };

  useEffect(() => {
    fetchAll();
    const socket = io(import.meta.env.VITE_API_URL || 'http://localhost:5000', { withCredentials: true });
    socketRef.current = socket;
    return () => { socket.disconnect(); if (geoRef.current) navigator.geolocation.clearWatch(geoRef.current); };
  }, []);

  useEffect(() => {
    if (!profile?.isOnline || !activeOrder) { if (geoRef.current) { navigator.geolocation.clearWatch(geoRef.current); geoRef.current = null; } return; }
    geoRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        setMyPos([lat, lng]);
        socketRef.current?.emit('updateLocation', { orderId: activeOrder._id, lat, lng });
      },
      () => {},
      { enableHighAccuracy: true }
    );
    return () => { if (geoRef.current) navigator.geolocation.clearWatch(geoRef.current); };
  }, [profile?.isOnline, activeOrder]);

  const toggleDuty = async () => {
    try {
      const { data } = await api.patch('/delivery/toggle-duty');
      setProfile((prev) => ({ ...prev, isOnline: data.isOnline ?? !prev.isOnline }));
      dispatch(showToast({ message: `You are now ${data.isOnline ? 'on duty' : 'off duty'}`, type: 'info' }));
      if (data.isOnline) fetchAll();
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
      setActiveOrder(null);
      fetchAll();
      dispatch(showToast({ message: 'Order released back to pool', type: 'info' }));
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

  if (loading) return <div className="space-y-4">{[...Array(3)].map((_, i) => <div key={i} className="bg-white rounded-2xl h-20 animate-pulse" />)}</div>;

  return (
    <div className="space-y-5">
      {/* Duty toggle */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm flex items-center justify-between">
        <div>
          <h2 className="font-bold text-gray-900">Duty Status</h2>
          <p className="text-sm text-gray-400 mt-0.5">{profile?.isOnline ? 'You are online and receiving orders' : 'You are offline'}</p>
        </div>
        <button
          onClick={toggleDuty}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-colors ${profile?.isOnline ? 'bg-green-500 hover:bg-green-600 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-600'}`}
        >
          {profile?.isOnline ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5" />}
          {profile?.isOnline ? 'On Duty' : 'Go Online'}
        </button>
      </div>

      {/* Earnings */}
      {earnings && (
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Total Earnings', value: `₹${earnings.totalEarnings || 0}`, icon: DollarSign, color: 'text-green-500', bg: 'bg-green-50' },
            { label: 'Deliveries', value: earnings.totalDeliveries || 0, icon: Package, color: 'text-blue-500', bg: 'bg-blue-50' },
            { label: 'Today', value: `₹${earnings.todayEarnings || 0}`, icon: Navigation, color: 'text-orange-500', bg: 'bg-orange-50' },
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

      {/* Active order */}
      {activeOrder && (
        <div className="bg-white rounded-2xl border border-orange-200 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-gray-900 flex items-center gap-2">
              <span className="w-2 h-2 bg-orange-500 rounded-full animate-pulse" />
              Active Delivery
            </h3>
            <button onClick={handleRelease} className="text-xs text-red-500 hover:text-red-600 border border-red-200 px-3 py-1 rounded-full">Release</button>
          </div>
          <p className="text-sm text-gray-600 mb-1"><strong>From:</strong> {activeOrder.shop?.name}</p>
          <p className="text-sm text-gray-600 mb-3"><strong>To:</strong> {activeOrder.deliveryAddress?.street}, {activeOrder.deliveryAddress?.city}</p>

          {myPos && (
            <div className="rounded-xl overflow-hidden mb-4 h-48">
              <MapContainer center={myPos} zoom={15} style={{ height: '100%', width: '100%' }}>
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                <Marker position={myPos}><Popup>Your location</Popup></Marker>
                <MapUpdater position={myPos} />
              </MapContainer>
            </div>
          )}

          <form onSubmit={handleVerifyOtp} className="flex gap-2">
            <input
              type="text"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              placeholder="Enter delivery OTP"
              maxLength={6}
              className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-orange-400 text-center text-lg font-bold tracking-widest"
            />
            <button type="submit" disabled={!otp} className="bg-green-500 hover:bg-green-600 text-white px-4 py-2.5 rounded-xl disabled:opacity-50 flex items-center gap-2 font-semibold text-sm">
              <Send className="w-4 h-4" /> Verify
            </button>
          </form>
        </div>
      )}

      {/* Order pool */}
      {profile?.isOnline && !activeOrder && (
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-gray-900">Available Orders</h3>
            <button onClick={fetchAll} className="text-gray-400 hover:text-gray-600">
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
          {pool.length === 0 ? (
            <div className="text-center py-8">
              <Package className="w-10 h-10 mx-auto text-gray-200 mb-2" />
              <p className="text-gray-400 text-sm">No orders available right now</p>
            </div>
          ) : (
            <div className="space-y-3">
              {pool.map((order) => (
                <div key={order._id} className="border border-gray-100 rounded-xl p-4">
                  <div className="flex justify-between mb-2">
                    <p className="font-semibold text-gray-800">{order.shop?.name}</p>
                    <p className="font-bold text-orange-500">₹{order.totalAmount}</p>
                  </div>
                  <p className="text-xs text-gray-400 mb-3">{order.deliveryAddress?.city}</p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleAccept(order._id)}
                      disabled={actioning === order._id}
                      className="flex-1 bg-green-500 hover:bg-green-600 text-white text-sm font-semibold py-2 rounded-xl transition-colors flex items-center justify-center gap-1 disabled:opacity-60"
                    >
                      {actioning === order._id ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />} Accept
                    </button>
                    <button
                      onClick={() => handleReject(order._id)}
                      disabled={actioning === order._id + '_reject'}
                      className="flex-1 bg-red-50 hover:bg-red-100 text-red-600 text-sm font-semibold py-2 rounded-xl transition-colors flex items-center justify-center gap-1"
                    >
                      <XCircle className="w-4 h-4" /> Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {!profile?.isOnline && (
        <div className="bg-gray-50 border border-gray-100 rounded-2xl p-8 text-center">
          <p className="text-gray-400 text-sm">Go online to start receiving delivery orders</p>
        </div>
      )}
    </div>
  );
}
