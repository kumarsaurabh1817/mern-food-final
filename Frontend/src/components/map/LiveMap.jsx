import { useEffect, useMemo, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { fetchRoute } from '../../lib/routing';
import { haversineDistanceKm } from '../../lib/geo';

// ── Default marker icon fix (Leaflet + bundlers drop the marker images) ──────
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

const colorIcon = (color) =>
  new L.Icon({
    iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-${color}.png`,
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
  });

const DEST_ICON = colorIcon('red');
const PICKUP_ICON = colorIcon('blue');

// Zomato-style live rider marker: a white circular badge with a scooter and a
// soft pulsing ring.
const RIDER_ICON = L.divIcon({
  className: 'rider-marker',
  html: `
    <div style="position:relative;width:44px;height:44px;">
      <span style="position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);width:40px;height:40px;border-radius:50%;background:rgba(239,68,68,0.25);animation:riderPulse 1.6s ease-out infinite;"></span>
      <div style="position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);width:34px;height:34px;border-radius:50%;background:#fff;border:2px solid #ef4444;box-shadow:0 2px 6px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;font-size:18px;line-height:1;">🛵</div>
    </div>`,
  iconSize: [44, 44],
  iconAnchor: [22, 22],
  popupAnchor: [0, -18],
});

// Inject the pulse keyframes once (divIcon HTML can't carry a <style> reliably).
if (typeof document !== 'undefined' && !document.getElementById('rider-marker-style')) {
  const style = document.createElement('style');
  style.id = 'rider-marker-style';
  style.textContent = `@keyframes riderPulse{0%{transform:translate(-50%,-50%) scale(0.6);opacity:0.8}100%{transform:translate(-50%,-50%) scale(1.6);opacity:0}}`;
  document.head.appendChild(style);
}

// ── Smoothly-animated rider marker (managed imperatively) ────────────────────
// Glides the scooter from its previous position to each new GPS fix over ~1.2 s
// using requestAnimationFrame — so it slides along the road like Swiggy/Zomato
// instead of teleporting. Large jumps (>500 m, e.g. first fix) snap instantly.
function AnimatedRider({ position, label }) {
  const map = useMap();
  const markerRef = useRef(null);
  const currentRef = useRef(null);
  const rafRef = useRef(null);

  useEffect(() => {
    const m = L.marker(position || [0, 0], { icon: RIDER_ICON, zIndexOffset: 1000 });
    if (label) m.bindPopup(`🛵 ${label}`);
    m.addTo(map);
    markerRef.current = m;
    currentRef.current = position || null;
    return () => {
      cancelAnimationFrame(rafRef.current);
      m.remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const m = markerRef.current;
    if (!m || !position) return;
    const from = currentRef.current;
    const to = position;

    // First fix or a big jump → snap.
    const jump = from ? haversineDistanceKm(from[0], from[1], to[0], to[1]) || 0 : Infinity;
    if (!from || jump > 0.5 || jump === 0) {
      currentRef.current = to;
      m.setLatLng(to);
      return;
    }

    cancelAnimationFrame(rafRef.current);
    const duration = 1200;
    let start = null;
    const step = (ts) => {
      if (start === null) start = ts;
      const t = Math.min(1, (ts - start) / duration);
      m.setLatLng([from[0] + (to[0] - from[0]) * t, from[1] + (to[1] - from[1]) * t]);
      if (t < 1) {
        rafRef.current = requestAnimationFrame(step);
      } else {
        currentRef.current = to;
      }
    };
    rafRef.current = requestAnimationFrame(step);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [position?.[0], position?.[1]]);

  return null;
}

// Fit the map ONCE to the stable endpoints (destination/pickup), then keep the
// rider in view by panning only when it would leave the viewport — no constant
// zoom churn as the scooter moves.
function MapController({ agent, destination, pickup }) {
  const map = useMap();
  const fitKey = [destination, pickup].map((p) => p?.join(',')).join('|');

  useEffect(() => {
    const pts = [agent, destination, pickup].filter(Boolean);
    if (pts.length === 0) return;
    if (pts.length === 1) {
      map.setView(pts[0], 15, { animate: true });
      return;
    }
    map.fitBounds(L.latLngBounds(pts), { padding: [60, 60], maxZoom: 16, animate: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fitKey]);

  useEffect(() => {
    if (agent && !map.getBounds().pad(-0.15).contains(agent)) {
      map.panTo(agent, { animate: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [agent?.[0], agent?.[1]]);

  return null;
}

/**
 * Reusable live delivery map.
 *
 * Props (each [lat, lng] | null):
 *   agent       — live delivery-agent position (animated scooter)
 *   destination — customer's delivery address
 *   pickup      — restaurant location
 *   onRouteInfo — optional callback({ distanceKm, durationMin }) with the real
 *                 road distance/ETA whenever the route is (re)computed.
 */
export default function LiveMap({
  agent = null,
  destination = null,
  pickup = null,
  agentLabel = 'Delivery Agent',
  destinationLabel = 'Delivery Address',
  pickupLabel = 'Restaurant',
  onRouteInfo,
  className = '',
}) {
  const center = agent || destination || pickup;

  // ── Road route (agent → destination), refreshed as the rider moves ─────────
  const [route, setRoute] = useState(null); // full road path [lat,lng][]
  const routedFrom = useRef(null);
  const lastFetchAt = useRef(0);

  useEffect(() => {
    if (!agent || !destination) {
      setRoute(null);
      routedFrom.current = null;
      return;
    }
    // Throttle OSRM calls: re-route when the rider moved >40 m, max once / 5 s.
    const moved =
      !routedFrom.current ||
      (haversineDistanceKm(routedFrom.current[0], routedFrom.current[1], agent[0], agent[1]) || 0) > 0.04;
    const now = Date.now();
    if (route && (!moved || now - lastFetchAt.current < 5000)) return;

    let cancelled = false;
    lastFetchAt.current = now;
    fetchRoute(agent, destination).then((result) => {
      if (cancelled) return;
      if (result?.points?.length) {
        routedFrom.current = agent;
        setRoute(result.points);
        onRouteInfo?.({ distanceKm: result.distanceKm, durationMin: result.durationMin });
      } else {
        setRoute(null);
      }
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [agent?.[0], agent?.[1], destination?.[0], destination?.[1]]);

  // The line actually drawn: trim the road route so it ALWAYS starts at the
  // rider's current position and shrinks as they advance (real-time feel).
  // Falls back to a straight rider→customer segment until a road route loads.
  const line = useMemo(() => {
    if (route && agent) {
      let best = 0;
      let bestD = Infinity;
      for (let i = 0; i < route.length; i++) {
        const d = haversineDistanceKm(agent[0], agent[1], route[i][0], route[i][1]);
        if (d != null && d < bestD) {
          bestD = d;
          best = i;
        }
      }
      return [agent, ...route.slice(best)];
    }
    if (route) return route;
    if (agent && destination) return [agent, destination];
    return null;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [route, agent?.[0], agent?.[1], destination?.[0], destination?.[1]]);

  if (!center) return null;

  return (
    <MapContainer
      center={center}
      zoom={14}
      className={className}
      style={{ height: '100%', width: '100%', position: 'absolute', inset: 0 }}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
      />

      {pickup && (
        <Marker position={pickup} icon={PICKUP_ICON}>
          <Popup>
            <span className="font-semibold text-blue-600">🍴 {pickupLabel}</span>
          </Popup>
        </Marker>
      )}

      {destination && (
        <Marker position={destination} icon={DEST_ICON}>
          <Popup>
            <span className="font-semibold text-red-600">📍 {destinationLabel}</span>
          </Popup>
        </Marker>
      )}

      {/* Red live route: white casing under a bold red line for contrast */}
      {line && (
        <>
          <Polyline positions={line} pathOptions={{ color: '#ffffff', weight: 8, opacity: 0.9 }} />
          <Polyline positions={line} pathOptions={{ color: '#ef4444', weight: 5, opacity: 0.95 }} />
        </>
      )}

      {agent && <AnimatedRider position={agent} label={agentLabel} />}

      <MapController agent={agent} destination={destination} pickup={pickup} />
    </MapContainer>
  );
}
