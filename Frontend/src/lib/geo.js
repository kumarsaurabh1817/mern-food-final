// ─── Client-side geo helpers ──────────────────────────────────────────────────
// Mirrors Backend/src/utils/helper.js haversineDistanceKm so the tracking map
// can compute live distance + ETA without a round-trip to the server.

/** Straight-line distance in km between two [lat, lng] points (Haversine). */
export function haversineDistanceKm(lat1, lng1, lat2, lng2) {
  if (
    ![lat1, lng1, lat2, lng2].every((n) => Number.isFinite(n))
  ) {
    return null;
  }
  const R = 6371; // Earth radius (km)
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/** Rough ETA in minutes for a road distance, assuming an average speed. */
export function etaMinutes(distanceKm, kmph = 20) {
  if (!Number.isFinite(distanceKm) || distanceKm <= 0) return null;
  // Add a 1.3x factor to approximate real road distance vs straight-line.
  return Math.max(1, Math.round((distanceKm * 1.3) / kmph * 60));
}

/** Format a distance for display: "850 m" or "3.2 km". */
export function formatDistance(km) {
  if (!Number.isFinite(km)) return '';
  return km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(1)} km`;
}

/**
 * Normalize a delivery address's coordinates to [lat, lng] or null.
 * Accepts { lat, lng } as stored on the order's deliveryAddress.
 */
export function addressToLatLng(addr) {
  const lat = Number(addr?.lat);
  const lng = Number(addr?.lng);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  if (lat === 0 && lng === 0) return null;
  return [lat, lng];
}

/**
 * Normalize a shop's GeoJSON coordinates ([lng, lat]) to [lat, lng] or null.
 * Skips the [0, 0] default that means "not set".
 */
export function shopToLatLng(shop) {
  const coords = shop?.address?.coordinates?.coordinates;
  const lng = Number(coords?.[0]);
  const lat = Number(coords?.[1]);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  if (lat === 0 && lng === 0) return null;
  return [lat, lng];
}
