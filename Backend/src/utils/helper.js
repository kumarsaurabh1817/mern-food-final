// ─── parseDurationToMs ───────────────────────────────────────────────────────
// Converts a human-readable duration string like "7d", "15m", or "3h" into
// milliseconds (a number). This is needed because JWT libraries accept expiry
// as a string ("7d") but when we need to set a cookie's maxAge, the browser
// requires it in milliseconds. Used in auth.controller.js when setting the
// refresh token cookie after login or registration.
//
// Examples:
//   parseDurationToMs("7d")  → 604800000  (7 days in ms)
//   parseDurationToMs("30m") → 1800000    (30 minutes in ms)
//   parseDurationToMs("bad") → null
export function parseDurationToMs(str) {
  if (!str || typeof str !== "string") return null;
  const match = str.match(/^(\d+)([smhd])$/);
  if (!match) return null;
  const n = parseInt(match[1], 10);
  const unit = match[2];
  const map = { s: 1_000, m: 60_000, h: 3_600_000, d: 86_400_000 };
  return n * map[unit];
}

// ─── isPasswordValid ──────────────────────────────────────────────────────────
// Checks whether a password meets the app's security requirements:
//   - At least 8 characters long
//   - Contains at least one uppercase letter (A-Z)
//   - Contains at least one number (0-9)
//   - Contains at least one special character (@, $, !, %, etc.)
//
// Used in auth.controller.js during user registration and password reset
// to reject weak passwords before they even hit the database.
export function isPasswordValid(password) {
  if (!password || typeof password !== "string") return false;
  return (
    password.length >= 8 &&
    /[A-Z]/.test(password) &&
    /[0-9]/.test(password) &&
    /[@$!%*#?&^()_\-+=<>]/.test(password)
  );
}

// ─── PASSWORD_POLICY_MSG ──────────────────────────────────────────────────────
// A single reusable error message shown to the user when their password fails
// the isPasswordValid() check. Keeping it here (instead of hardcoding it in
// multiple controllers) ensures the message stays consistent across the app.
export const PASSWORD_POLICY_MSG =
  "Password must be at least 8 characters and include an uppercase letter, a number, and a special character.";

// ─── haversineDistanceKm ──────────────────────────────────────────────────────
// Calculates the straight-line distance (in kilometers) between two GPS
// coordinates using the Haversine formula — the standard algorithm for
// measuring distances on a sphere (the Earth).
//
// Used in order.controller.js when a customer places an order to estimate
// the delivery distance from the restaurant's location to the customer's
// delivery address. This distance is used to calculate the delivery fee.
//
// Parameters:
//   lat1, lng1 → latitude & longitude of the restaurant (shop)
//   lat2, lng2 → latitude & longitude of the customer's delivery address
//
// Returns: distance in kilometers (e.g. 3.7 means 3.7 km away)
export function haversineDistanceKm(lat1, lng1, lat2, lng2) {
  const R = 6371; // Earth's radius in kilometers
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
