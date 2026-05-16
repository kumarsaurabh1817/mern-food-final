import { useState, useEffect, useRef, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from "react-leaflet";
import L from "leaflet";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";
import api from "../../lib/axios";
import { showToast } from "../../features/ui/uiSlice";
import { io } from "socket.io-client";
import { RefreshCw, Navigation2, AlertCircle, Search, CheckCircle2, MapPin, X, XCircle } from "lucide-react";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

const mkIcon = (emoji, bg, size=38) => L.divIcon({
  html:`<div style="width:${size}px;height:${size}px;background:${bg};border:3px solid #fff;border-radius:50%;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 14px rgba(0,0,0,0.18);font-size:${size*0.4}px">${emoji}</div>`,
  iconSize:[size,size], iconAnchor:[size/2,size/2], className:"",
});

const riderIcon   = mkIcon("🛵","#FF7A00",42);
const dropIcon    = mkIcon("📍","#EF4444",36);
const pickupIcon  = mkIcon("📦","#3B82F6",32);

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "http://localhost:5000";
const ACTIVE_S   = ["pending","confirmed","preparing","out_for_delivery"];
const STATUS = {
  pending:          {label:"Pending",      cls:"bg-amber-50 text-amber-600 border-amber-200"},
  confirmed:        {label:"Confirmed",    cls:"bg-blue-50 text-blue-600 border-blue-200"},
  preparing:        {label:"Preparing",    cls:"bg-violet-50 text-violet-600 border-violet-200"},
  out_for_delivery: {label:"On the Way",  cls:"bg-emerald-50 text-emerald-600 border-emerald-200"},
  delivered:        {label:"Delivered",   cls:"bg-green-50 text-green-600 border-green-200"},
};

const getAccessToken = () => {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("accessToken");
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

function FitBounds({ positions }) {
  const map = useMap();
  useEffect(() => {
    if (positions?.length >= 2) {
      try { map.fitBounds(positions, { padding:[60,60], maxZoom:15, animate:true }); } catch(_){}
    } else if (positions?.length === 1) {
      map.flyTo(positions[0], 14, { animate:true });
    }
  }, [JSON.stringify(positions)]);
  return null;
}

function FlyToLocation({ target }) {
  const map = useMap();
  useEffect(() => {
    if (target) map.flyTo(target, 15, { animate: true, duration: 1.2 });
  }, [target]);
  return null;
}

async function fetchOSRMRoute(from, to) {
  try {
    const url = `https://router.project-osrm.org/route/v1/driving/${from[1]},${from[0]};${to[1]},${to[0]}?overview=full&geometries=geojson`;
    const r = await fetch(url);
    const d = await r.json();
    if (d.routes?.[0]) return d.routes[0].geometry.coordinates.map(([ln,la]) => [la,ln]);
  } catch(_) {}
  return [from, to];
}

function PoolCard({ order, onAccept }) {
  const id  = order._id || order.id;
  const addr = order.deliveryAddress || {};
  const pickupLine = order.shop?.address?.addressLine1 || "Pickup point";

  // Full delivery address parts
  const addrLine1  = addr.addressLine1 || "";
  const landmark   = addr.landmark || "";
  const cityState  = [addr.city, addr.state].filter(Boolean).join(", ");
  const zip        = addr.zipCode || addr.pincode || "";
  const hasAddress = addrLine1 || cityState;

  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm hover:border-orange-300 hover:shadow-md transition-all duration-200">

      {/* Header row */}
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-base">🍽️</span>
            <span className="text-sm font-bold text-gray-900">{order.shop?.name || "Restaurant"}</span>
          </div>
          <span className="text-xs font-semibold text-gray-400">#{id?.slice(-6).toUpperCase()}</span>
        </div>
        <div className="text-right">
          <div className="text-base font-black text-orange-500">₹{(order.totalAmount||0).toFixed(0)}</div>
          <div className="text-[10px] font-bold text-gray-400">~25 min</div>
        </div>
      </div>

      {/* Route: pickup → drop */}
      <div className="bg-gray-50 rounded-xl p-3 mb-3 space-y-1.5">
        <div className="flex items-start gap-2">
          <div className="w-2 h-2 rounded-full border-2 border-orange-500 mt-1 shrink-0"/>
          <span className="text-xs font-semibold text-gray-600">{pickupLine}</span>
        </div>
        <div className="w-px h-3 bg-gray-300 ml-[3px]"/>
        <div className="flex items-start gap-2">
          <div className="w-2 h-2 rounded-full bg-red-500 mt-1 shrink-0"/>
          <span className="text-xs font-semibold text-gray-600">
            {addrLine1 || cityState || "Customer address"}
          </span>
        </div>
      </div>

      {/* Full delivery address callout */}
      <div className="bg-red-50 border border-red-100 rounded-xl p-3 mb-3">
        <div className="flex items-center gap-1.5 mb-1.5">
          <MapPin size={11} className="text-red-500 shrink-0"/>
          <p className="text-[10px] font-black text-red-400 uppercase tracking-wider">Deliver To</p>
        </div>
        {hasAddress ? (
          <div className="space-y-0.5 pl-4">
            {addrLine1  && <p className="text-xs font-bold text-gray-800">{addrLine1}</p>}
            {landmark   && <p className="text-xs text-gray-500">Near: {landmark}</p>}
            {cityState  && <p className="text-xs font-semibold text-gray-700">{cityState}</p>}
            {zip        && <p className="text-[10px] text-gray-400">PIN: {zip}</p>}
          </div>
        ) : (
          <p className="text-xs text-gray-400 italic pl-4">Address not provided</p>
        )}
      </div>

      <button onClick={() => onAccept(id)}
        className="w-full py-2.5 bg-orange-500 hover:bg-orange-600 active:scale-95 text-white text-sm font-bold rounded-xl transition-all duration-150 shadow-sm">
        Accept Order
      </button>
    </div>
  );
}

function ActiveCard({ order, otpValue, onOtpChange, onVerify, onRelease }) {
  const id  = order._id || order.id;
  const cfg = STATUS[order.status] || STATUS.pending;
  const addr = order.deliveryAddress;
  const addrLine = [addr?.street || addr?.addressLine1, addr?.city, addr?.state].filter(Boolean).join(", ");
  const isOFD = order.status === "out_for_delivery";
  const mapsUrl = addrLine ? `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(addrLine)}` : null;
  const [confirmCancel, setConfirmCancel] = useState(false);

  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-base">🍽️</span>
            <span className="text-sm font-bold text-gray-900">{order.shop?.name || "Restaurant"}</span>
          </div>
          <span className="text-xs font-semibold text-gray-400">#{id?.slice(-6).toUpperCase()}</span>
        </div>
        <div className="flex flex-col items-end gap-1">
          <span className="text-base font-black text-orange-500">₹{(order.totalAmount||0).toFixed(0)}</span>
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${cfg.cls}`}>{cfg.label}</span>
        </div>
      </div>

      <div className="bg-gray-50 rounded-xl p-3 mb-3">
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Items</p>
        {(order.items||[]).slice(0,3).map((it,i)=>(
          <div key={i} className="flex justify-between py-0.5">
            <span className="text-xs text-gray-700 font-semibold">{it.quantity}× {it.name}</span>
            <span className="text-xs font-bold text-gray-900">₹{(it.price*it.quantity).toFixed(0)}</span>
          </div>
        ))}
      </div>

      {/* Delivery address */}
      <div className="flex items-start gap-2 mb-3 bg-red-50 rounded-xl p-3 border border-red-100">
        <MapPin size={13} className="text-red-500 shrink-0 mt-0.5"/>
        <div>
          <p className="text-[10px] font-bold text-red-400 uppercase tracking-wider mb-0.5">Deliver To</p>
          <p className="text-xs font-semibold text-gray-700">{addrLine || "No address"}</p>
          {addr?.zipCode && <p className="text-[10px] text-gray-400 mt-0.5">ZIP: {addr.zipCode}</p>}
        </div>
      </div>

      {mapsUrl && (
        <a href={mapsUrl} target="_blank" rel="noreferrer"
          className="flex items-center justify-center gap-2 w-full py-2 mb-3 bg-orange-50 hover:bg-orange-100 text-orange-600 text-xs font-bold rounded-xl transition-colors no-underline">
          <Navigation2 size={13}/> Open in Maps
        </a>
      )}

      {isOFD && (
        <div className="bg-gray-900 rounded-xl p-3 mb-3">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Enter Customer OTP</p>
          <div className="flex gap-2">
            <input type="text" maxLength={6} placeholder="· · · · · ·" value={otpValue||""}
              onChange={e => onOtpChange(id, e.target.value)}
              className="flex-1 bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-center text-lg font-black tracking-[0.25em] outline-none focus:border-orange-400 transition-colors placeholder:text-white/30"
              style={{fontFamily:"inherit"}}
            />
            <button onClick={() => onVerify(order)}
              className="px-4 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1">
              <CheckCircle2 size={13}/> Done
            </button>
          </div>
        </div>
      )}

      {/* Cancel / Release section */}
      {!confirmCancel ? (
        <button
          onClick={() => setConfirmCancel(true)}
          className="w-full flex items-center justify-center gap-1.5 py-2 text-red-500 text-xs font-bold rounded-xl border border-red-200 hover:bg-red-50 transition-colors"
        >
          <XCircle size={13}/> Cancel Order
        </button>
      ) : (
        <div className="bg-red-50 border border-red-200 rounded-xl p-3">
          <p className="text-xs font-bold text-red-600 text-center mb-2">Release this order back to the pool?</p>
          <p className="text-[10px] text-red-400 text-center mb-3 font-semibold">
            {isOFD ? "Status will revert to Preparing." : "Another agent will be able to pick it up."}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => { onRelease(id); setConfirmCancel(false); }}
              className="flex-1 py-2 bg-red-500 hover:bg-red-600 text-white text-xs font-bold rounded-lg transition-colors">
              Yes, Release
            </button>
            <button
              onClick={() => setConfirmCancel(false)}
              className="flex-1 py-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-600 text-xs font-bold rounded-lg transition-colors">
              Go Back
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function DeliveryDashboard() {
  const { user: profile } = useSelector(s => s.auth);
  const dispatch = useDispatch();
  const [agentData, setAgentData]   = useState(null);
  const [pool, setPool]             = useState([]);
  const [myOrders, setMyOrders]     = useState([]);
  const [stats, setStats]           = useState({ earnings:0 });
  const [loading, setLoading]       = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [tab, setTab]               = useState("available");
  const [search, setSearch]         = useState("");
  const [otpInputs, setOtpInputs]   = useState({});
  const [riderPos, setRiderPos]     = useState([20.5937, 78.9629]);
  const [gpsReady, setGpsReady]     = useState(false);
  const [routeLine, setRouteLine]   = useState(null);
  const [dropPos, setDropPos]       = useState(null);
  // Map location search
  const [mapSearch, setMapSearch]       = useState("");
  const [mapResults, setMapResults]     = useState([]);
  const [mapSearching, setMapSearching] = useState(false);
  const [flyTarget, setFlyTarget]       = useState(null);
  const [searchMarker, setSearchMarker] = useState(null);
  const mapSearchRef = useRef(null);
  const socketRef = useRef(null);
  const watchRef  = useRef(null);

  const fetchData = useCallback(async () => {
    setRefreshing(true);
    try {
      const [pR, eR, poolR, oR] = await Promise.allSettled([
        api.get("/delivery/me"), api.get("/delivery/earnings"),
        api.get("/delivery/pool"), api.get("/orders"),
      ]);
      if (pR.status==="fulfilled") setAgentData(pR.value.data.profile);
      if (eR.status==="fulfilled") setStats({ earnings: eR.value.data.totalEarnings||0 });
      const online = pR.value?.data?.profile?.isOnline;
      setPool(online && poolR.status==="fulfilled" ? poolR.value.data.orders||[] : []);
      if (oR.status==="fulfilled")
        setMyOrders((oR.value.data.orders||[]).filter(o => ACTIVE_S.includes(o.status)));
    } finally {
      setLoading(false);
      setTimeout(()=>setRefreshing(false),400);
    }
  }, []);

  useEffect(()=>{ fetchData(); const t=setInterval(fetchData,12000); return ()=>clearInterval(t); },[fetchData]);

  // Live GPS + routing when out_for_delivery
  const activeDel = myOrders.find(o => o.status==="out_for_delivery");
  useEffect(()=>{
    if (!activeDel){
      navigator.geolocation?.clearWatch(watchRef.current);
      setRouteLine(null);
      setDropPos(null);
      setGpsReady(false);
      return;
    }
    const id = activeDel._id || activeDel.id;

    // Build delivery destination coords
    const addr = activeDel.deliveryAddress;
    const destLat = addr?.lat || addr?.latitude;
    const destLng = addr?.lng || addr?.longitude;
    const dest = destLat && destLng ? [parseFloat(destLat), parseFloat(destLng)] : null;
    if (dest) setDropPos(dest);

    // Socket
    if (!socketRef.current?.connected) {
      const token = getAccessToken();
      socketRef.current = io(SOCKET_URL, {
        transports: ["websocket"],
        auth: token ? { token } : {},
      });
    }
    socketRef.current.emit("joinOrderRoom", id);

    // GPS watch + route refresh
    watchRef.current = navigator.geolocation?.watchPosition(async pos => {
      const {latitude:lat, longitude:lng} = pos.coords;
      setRiderPos([lat,lng]);
      setGpsReady(true);
      socketRef.current?.emit("updateLocation",{orderId:id, lat, lng});
      if (dest) {
        const route = await fetchOSRMRoute([lat,lng], dest);
        setRouteLine(route);
      }
    }, err=>{
      if (err.code===1) dispatch(showToast({message:"Enable GPS in browser settings",type:"error"}));
    }, {enableHighAccuracy:true, maximumAge:3000, timeout:15000});

    return ()=>{ navigator.geolocation?.clearWatch(watchRef.current); };
  }, [activeDel?._id, dispatch]);

  useEffect(()=>()=>{
    socketRef.current?.disconnect();
    navigator.geolocation?.clearWatch(watchRef.current);
  },[]);

  const toggleDuty = async () => {
    try {
      const {data} = await api.patch("/delivery/toggle-duty");
      if (data.success){ setAgentData(data.profile||{...agentData,isOnline:data.isOnline}); fetchData(); dispatch(showToast({message:data.message,type:"success"})); }
    } catch(e){ dispatch(showToast({message:e.response?.data?.message||"Error",type:"error"})); }
  };

  const acceptOrder = async id => {
    try {
      const {data} = await api.post("/delivery/accept/"+id);
      if (data.success){ dispatch(showToast({message:"Order accepted!",type:"success"})); setTab("active"); fetchData(); }
    } catch(e){ dispatch(showToast({message:e.response?.data?.message||"Error",type:"error"})); }
  };

  const verifyOTP = async order => {
    const id = order._id||order.id;
    const otp = otpInputs[id]||"";
    if (!otp){ dispatch(showToast({message:"Enter OTP",type:"error"})); return; }
    try {
      const {data} = await api.post("/orders/"+id+"/verify-otp",{otp});
      if (data.success){ dispatch(showToast({message:"Delivered! 🎉",type:"success"})); fetchData(); }
    } catch(e){ dispatch(showToast({message:e.response?.data?.message||"Wrong OTP",type:"error"})); }
  };

  const releaseOrder = async id => {
    try {
      const {data} = await api.post("/delivery/release/"+id);
      if (data.success){
        dispatch(showToast({message:"Order released back to pool",type:"success"}));
        setTab("available");
        fetchData();
      }
    } catch(e){ dispatch(showToast({message:e.response?.data?.message||"Failed to release order",type:"error"})); }
  };

  // Map location search via Nominatim (no API key needed)
  const searchMapLocation = useCallback(async (q) => {
    if (!q || q.trim().length < 3) { setMapResults([]); return; }
    setMapSearching(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&limit=5&q=${encodeURIComponent(q)}`,
        { headers: { "Accept-Language": "en" } }
      );
      const data = await res.json();
      setMapResults(data.map(r => ({
        label: r.display_name,
        lat: parseFloat(r.lat),
        lng: parseFloat(r.lon),
      })));
    } catch(_) {
      dispatch(showToast({ message: "Location search failed", type: "error" }));
    } finally {
      setMapSearching(false);
    }
  }, [dispatch]);

  // Debounce map search
  useEffect(() => {
    const t = setTimeout(() => searchMapLocation(mapSearch), 500);
    return () => clearTimeout(t);
  }, [mapSearch, searchMapLocation]);

  const selectMapResult = (r) => {
    setFlyTarget([r.lat, r.lng]);
    setSearchMarker([r.lat, r.lng]);
    setMapResults([]);
    setMapSearch(r.label.split(",")[0]); // short display name
  };

  const isOnline = agentData?.isOnline;
  const poolFiltered = pool.filter(o=>(o.shop?.name||"").toLowerCase().includes(search.toLowerCase()));
  const displayList  = tab==="available" ? poolFiltered : myOrders;

  // Map bounds: rider + drop destination (if active delivery)
  const mapPositions = dropPos ? [riderPos, dropPos] : [riderPos];
  const hasActiveRoute = !!(activeDel && gpsReady && dropPos);
  const directionsUrl = hasActiveRoute
    ? buildDirectionsEmbedUrl({ lat: riderPos[0], lng: riderPos[1] }, { lat: dropPos[0], lng: dropPos[1] })
    : null;
  const directionsLink = hasActiveRoute
    ? buildDirectionsLink({ lat: riderPos[0], lng: riderPos[1] }, { lat: dropPos[0], lng: dropPos[1] })
    : null;

  if (!profile?.isApprovedByAdmin) return (
    <div className="flex items-center justify-center h-full bg-gray-50">
      <div className="bg-white rounded-3xl p-10 text-center shadow-lg max-w-sm">
        <div className="w-16 h-16 bg-orange-50 rounded-2xl flex items-center justify-center mx-auto mb-4"><AlertCircle size={28} className="text-orange-500"/></div>
        <h2 className="text-xl font-black text-gray-900 mb-2">Awaiting Approval</h2>
        <p className="text-sm text-gray-400 font-semibold">Your account is pending admin review.</p>
      </div>
    </div>
  );

  if (loading) return (
    <div className="flex items-center justify-center h-full bg-gray-50">
      <div className="w-9 h-9 rounded-full border-4 border-orange-500 border-t-transparent animate-spin"/>
    </div>
  );

  return (
    <div className="flex h-full overflow-hidden" style={{fontFamily:"'Plus Jakarta Sans',sans-serif"}}>

      {/* ── LEFT SIDEBAR 50% ── */}
      <div className="w-[50%] min-w-[360px] max-w-[560px] flex flex-col h-full overflow-hidden bg-gray-50 border-r border-gray-200">

        {/* Agent header */}
        <div className={`shrink-0 p-5 ${isOnline?"bg-gradient-to-br from-orange-500 to-orange-600":"bg-gradient-to-br from-gray-700 to-gray-900"}`}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-xs font-bold text-white/60 uppercase tracking-widest mb-0.5">{isOnline?"Ready to deliver":"You're offline"}</p>
              <h1 className="text-2xl font-black text-white leading-tight">{profile?.name?.split(" ")[0]||"Agent"}</h1>
            </div>
            <div className="text-right">
              <p className="text-xs font-bold text-white/60 uppercase tracking-wider mb-0.5">Today's Earnings</p>
              <p className="text-2xl font-black text-white">₹{stats.earnings.toFixed(0)}</p>
            </div>
          </div>
          <div className="flex items-center justify-between bg-white/10 backdrop-blur rounded-2xl px-4 py-2.5">
            <div className="flex items-center gap-2">
              <span className={`w-2.5 h-2.5 rounded-full ${isOnline?"bg-green-400 animate-pulse":"bg-white/40"}`}/>
              <span className="text-sm font-bold text-white">{isOnline?"Online — Ready for orders":"Offline"}</span>
            </div>
            <button onClick={toggleDuty} className={`relative w-12 h-6 rounded-full transition-colors duration-300 ${isOnline?"bg-green-400":"bg-white/20"}`}>
              <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-md transition-transform duration-300 ${isOnline?"translate-x-6":"translate-x-0.5"}`}/>
            </button>
          </div>
        </div>

        {/* Search + Tabs */}
        <div className="shrink-0 px-4 py-3 space-y-2">
          <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-3 py-2 shadow-sm">
            <Search size={14} className="text-gray-400"/>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search by restaurant…"
              className="flex-1 bg-transparent outline-none text-sm font-semibold text-gray-800 placeholder:text-gray-400 border-none"/>
          </div>
          <div className="flex bg-white rounded-xl p-1 shadow-sm border border-gray-100 gap-1">
            {[["available",`Available (${pool.length})`],["active",`Active (${myOrders.length})`]].map(([k,lbl])=>(
              <button key={k} onClick={()=>setTab(k)}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all duration-200 ${tab===k?"bg-orange-500 text-white shadow-sm":"text-gray-500 hover:text-gray-700"}`}>{lbl}</button>
            ))}
            <button onClick={fetchData} className="px-3 border border-gray-200 rounded-lg text-gray-400 hover:text-orange-500 hover:border-orange-300 transition-colors">
              <RefreshCw size={13} className={refreshing?"animate-spin":""}/>
            </button>
          </div>
        </div>

        {/* Order list */}
        <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-3">
          {displayList.length===0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="text-4xl mb-3">{tab==="available"?"🎯":"📦"}</div>
              <p className="text-sm font-bold text-gray-500">
                {tab==="available"?(isOnline?"No orders in pool yet":"Go online to receive orders"):"No active deliveries"}
              </p>
            </div>
          ) : tab==="available" ? (
            displayList.map(o=><PoolCard key={o._id||o.id} order={o} onAccept={acceptOrder}/>)
          ) : (
            displayList.map(o=>(
              <ActiveCard key={o._id||o.id} order={o}
                otpValue={otpInputs[o._id||o.id]}
                onOtpChange={(id,v)=>setOtpInputs(p=>({...p,[id]:v}))}
                onVerify={verifyOTP}
                onRelease={releaseOrder}/>
            ))
          )}
        </div>
      </div>

      {/* ── RIGHT MAP 50% ── */}
      <div className="flex-1 relative overflow-hidden">

        {/* Floating map search bar */}
        {!activeDel && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1001] w-[min(400px,calc(100%-24px))]" ref={mapSearchRef}>
          <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-xl border border-white/60 overflow-visible">
            <div className="flex items-center gap-2 px-4 py-2.5">
              {mapSearching
                ? <div className="w-3.5 h-3.5 rounded-full border-2 border-orange-400 border-t-transparent animate-spin shrink-0"/>
                : <Search size={14} className="text-gray-400 shrink-0"/>
              }
              <input
                value={mapSearch}
                onChange={e => { setMapSearch(e.target.value); if (!e.target.value) { setMapResults([]); setSearchMarker(null); setFlyTarget(null); } }}
                placeholder="Search location on map…"
                className="flex-1 bg-transparent outline-none text-sm font-semibold text-gray-800 placeholder:text-gray-400 min-w-0"
              />
              {mapSearch && (
                <button onClick={() => { setMapSearch(""); setMapResults([]); setSearchMarker(null); setFlyTarget(null); }} className="text-gray-400 hover:text-gray-600">
                  <X size={13}/>
                </button>
              )}
              <span className={`shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full ${isOnline?"bg-emerald-100 text-emerald-600":"bg-gray-100 text-gray-500"}`}>
                {isOnline?"● Online":"○ Offline"}
              </span>
            </div>
            {/* Dropdown results */}
            {mapResults.length > 0 && (
              <div className="border-t border-gray-100 max-h-52 overflow-y-auto">
                {mapResults.map((r, i) => (
                  <button key={i} onClick={() => selectMapResult(r)}
                    className="w-full text-left px-4 py-2.5 hover:bg-orange-50 flex items-start gap-2.5 transition-colors border-b border-gray-50 last:border-0">
                    <MapPin size={13} className="text-orange-400 mt-0.5 shrink-0"/>
                    <span className="text-xs font-semibold text-gray-700 line-clamp-2 leading-relaxed">{r.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
        )}

        {/* Route info pill when navigating */}
        {(hasActiveRoute || (dropPos && routeLine)) && (
          <div className="absolute top-[70px] left-1/2 -translate-x-1/2 z-[1000]">
            <div className="flex items-center gap-2 bg-orange-500 text-white px-4 py-2 rounded-full shadow-lg text-xs font-bold">
              <Navigation2 size={12}/> Navigating to customer
            </div>
          </div>
        )}

        {/* Bottom banner */}
        <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-[1000]">
          <div className="flex items-center gap-2.5 bg-white/95 backdrop-blur-md px-5 py-2.5 rounded-2xl shadow-xl border border-gray-100 whitespace-nowrap">
            <span className={`w-2 h-2 rounded-full ${isOnline?"bg-emerald-400 animate-pulse":"bg-gray-300"}`}/>
            <span className="text-sm font-bold text-gray-800">
              {!isOnline?"Go online to receive orders":activeDel?"Delivering — live tracking active":pool.length>0?`${pool.length} order${pool.length>1?"s":""} nearby`:"Waiting for orders…"}
            </span>
          </div>
        </div>

        {hasActiveRoute && directionsUrl ? (
          <div style={{ height: "100%", width: "100%", position: "relative" }}>
            <iframe
              key={`${riderPos[0].toFixed(5)},${riderPos[1].toFixed(5)}-${dropPos[0].toFixed(5)},${dropPos[1].toFixed(5)}`}
              title="Delivery navigation"
              src={directionsUrl}
              style={{ width: "100%", height: "100%", border: "none" }}
              referrerPolicy="no-referrer-when-downgrade"
              allowFullScreen
            />
            {directionsLink && (
              <a
                href={directionsLink}
                target="_blank"
                rel="noreferrer"
                className="absolute right-4 bottom-20 bg-white/95 backdrop-blur px-3 py-2 rounded-xl shadow-lg text-xs font-bold text-orange-600 border border-orange-100"
              >
                Open in Google Maps
              </a>
            )}
          </div>
        ) : (
          <MapContainer center={riderPos} zoom={13} style={{height:"100%",width:"100%"}} zoomControl={false} attributionControl={false}>
            <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"/>
            <FitBounds positions={mapPositions}/>
            <FlyToLocation target={flyTarget}/>

            {/* Rider */}
            <Marker position={riderPos} icon={riderIcon}>
              <Popup><strong>Your location</strong></Popup>
            </Marker>

            {/* Delivery destination */}
            {dropPos && (
              <Marker position={dropPos} icon={dropIcon}>
                <Popup><strong>Deliver here</strong><br/>{activeDel?.deliveryAddress?.addressLine1}</Popup>
              </Marker>
            )}

            {/* Route polyline */}
            {routeLine && routeLine.length > 1 && (
              <Polyline positions={routeLine} pathOptions={{color:"#FF7A00",weight:5,opacity:0.85,dashArray:"0"}}/>
            )}

            {/* Search result marker */}
            {searchMarker && (
              <Marker position={searchMarker} icon={mkIcon("🔍","#8B5CF6",34)}>
                <Popup><strong>Search result</strong><br/>{mapSearch}</Popup>
              </Marker>
            )}

            {/* Pool order pickups */}
            {!activeDel && pool.slice(0,5).map((o,i)=>{
              const lat=o.shop?.address?.lat, lng=o.shop?.address?.lng;
              if (!lat||!lng) return null;
              return (
                <Marker key={o._id||i} position={[lat,lng]} icon={pickupIcon}>
                  <Popup><strong>{o.shop?.name}</strong><br/>₹{o.totalAmount?.toFixed(0)}</Popup>
                </Marker>
              );
            })}
          </MapContainer>
        )}
      </div>
    </div>
  );
}
