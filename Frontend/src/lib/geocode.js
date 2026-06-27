// ─── Reverse geocoding via Nominatim (OpenStreetMap, free, no key) ────────────
// Turns a dropped map pin (lat/lng) into a human address so the customer can
// pick their delivery location on a map instead of typing it. Nominatim asks
// for <=1 request/sec — callers debounce by only geocoding on drag-end / click.

const NOMINATIM = 'https://nominatim.openstreetmap.org/reverse';

/**
 * Reverse-geocode a coordinate into address fields.
 * @returns {Promise<{lat,lng,street,city,state,zipCode,display}|null>}
 */
export async function reverseGeocode(lat, lng) {
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  const url = `${NOMINATIM}?format=jsonv2&lat=${lat}&lon=${lng}&addressdetails=1`;
  try {
    const res = await fetch(url, { headers: { Accept: 'application/json' } });
    if (!res.ok) return null;
    const data = await res.json();
    const a = data.address || {};
    const street =
      [a.house_number, a.road || a.pedestrian || a.footway || a.neighbourhood]
        .filter(Boolean)
        .join(' ') ||
      a.suburb ||
      a.hamlet ||
      data.name ||
      '';
    const city = a.city || a.town || a.village || a.municipality || a.county || a.state_district || '';
    const state = a.state || '';
    const zipCode = a.postcode || '';
    return { lat, lng, street, city, state, zipCode, display: data.display_name || '' };
  } catch {
    return null;
  }
}
