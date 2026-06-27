import { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { LocateFixed, Loader2, MapPin } from 'lucide-react';
import { reverseGeocode } from '../../lib/geocode';

// Default marker icon fix (in case LiveMap's module hasn't loaded on this page).
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

const PIN_ICON = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const DEFAULT_CENTER = [20.5937, 78.9629]; // India

// Click anywhere on the map to move the pin there.
function ClickToPlace({ onPick }) {
  useMapEvents({
    click(e) {
      onPick([e.latlng.lat, e.latlng.lng]);
    },
  });
  return null;
}

// Imperatively fly the map to a target only when it changes (mount / locate),
// so dragging the pin doesn't fight the view.
function FlyTo({ target }) {
  const map = useMap();
  useEffect(() => {
    if (target) map.setView(target, 16, { animate: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target?.[0], target?.[1]]);
  return null;
}

/**
 * Map-based delivery address picker.
 *
 * Props:
 *   value   — { lat, lng } | null (initial pin)
 *   onPick  — called with { lat, lng, street, city, state, zipCode } on every
 *             pin placement (after reverse geocoding)
 */
export default function AddressPicker({ value, onPick }) {
  const initial =
    Number.isFinite(value?.lat) && Number.isFinite(value?.lng) ? [value.lat, value.lng] : null;
  const [pos, setPos] = useState(initial);
  const [flyTarget, setFlyTarget] = useState(initial);
  const [loading, setLoading] = useState(false);
  const [resolved, setResolved] = useState('');
  const markerRef = useRef(null);

  // On first mount with no pin, try the browser's location to seed the map.
  useEffect(() => {
    if (initial || !navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (p) => handlePick([p.coords.latitude, p.coords.longitude], true),
      () => {},
      { enableHighAccuracy: true, timeout: 8000 }
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handlePick = async (next, fly = false) => {
    setPos(next);
    if (fly) setFlyTarget(next);
    setLoading(true);
    const addr = await reverseGeocode(next[0], next[1]);
    setLoading(false);
    if (addr) {
      setResolved(addr.display);
      onPick?.(addr);
    } else {
      // Still hand back the coordinates even if geocoding failed.
      onPick?.({ lat: next[0], lng: next[1] });
    }
  };

  const useMyLocation = () => {
    if (!navigator.geolocation) return;
    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      (p) => handlePick([p.coords.latitude, p.coords.longitude], true),
      () => setLoading(false),
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-xs text-gray-500 flex items-center gap-1">
          <MapPin className="w-3.5 h-3.5 text-red-400" /> Tap the map or drag the pin to set your location
        </p>
        <button
          type="button"
          onClick={useMyLocation}
          className="flex items-center gap-1.5 text-xs font-semibold text-orange-600 bg-orange-50 hover:bg-orange-100 px-2.5 py-1 rounded-full transition-colors"
        >
          {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <LocateFixed className="w-3.5 h-3.5" />}
          Use my location
        </button>
      </div>

      <div className="relative h-56 rounded-xl overflow-hidden border border-gray-200">
        <MapContainer
          center={pos || DEFAULT_CENTER}
          zoom={pos ? 16 : 5}
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          />
          <ClickToPlace onPick={(p) => handlePick(p)} />
          {pos && (
            <Marker
              position={pos}
              icon={PIN_ICON}
              draggable
              ref={markerRef}
              eventHandlers={{
                dragend() {
                  const m = markerRef.current;
                  if (m) {
                    const ll = m.getLatLng();
                    handlePick([ll.lat, ll.lng]);
                  }
                },
              }}
            />
          )}
          <FlyTo target={flyTarget} />
        </MapContainer>

        {loading && (
          <div className="absolute top-2 left-2 z-[1000] bg-white/90 text-xs text-gray-600 px-2 py-1 rounded-full shadow flex items-center gap-1.5">
            <Loader2 className="w-3 h-3 animate-spin text-orange-500" /> Finding address…
          </div>
        )}
      </div>

      {resolved && (
        <p className="text-xs text-gray-500 leading-snug">
          <span className="font-medium text-gray-700">Selected:</span> {resolved}
        </p>
      )}
    </div>
  );
}
