// ─── Road routing via OSRM (free, no API key) ────────────────────────────────
// Returns the actual driving path that follows roads between two points, so the
// map can draw a real route line (like Zomato) instead of a straight segment.
// Falls back gracefully (returns null) on any network/parse error — callers
// then draw a simple straight line.

const OSRM_BASE = 'https://router.project-osrm.org/route/v1/driving';

/**
 * Fetch a road route between two [lat, lng] points.
 * @returns {Promise<{ points: [number,number][], distanceKm: number, durationMin: number } | null>}
 */
export async function fetchRoute(from, to) {
  if (!from || !to) return null;
  const url = `${OSRM_BASE}/${from[1]},${from[0]};${to[1]},${to[0]}?overview=full&geometries=geojson`;
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();
    const route = data?.routes?.[0];
    const coords = route?.geometry?.coordinates;
    if (!Array.isArray(coords) || coords.length === 0) return null;
    return {
      // OSRM returns [lng, lat]; Leaflet wants [lat, lng]
      points: coords.map(([lng, lat]) => [lat, lng]),
      distanceKm: Number.isFinite(route.distance) ? route.distance / 1000 : null,
      durationMin: Number.isFinite(route.duration) ? Math.max(1, Math.round(route.duration / 60)) : null,
    };
  } catch {
    return null;
  }
}
