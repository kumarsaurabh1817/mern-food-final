/**
 * Shared frontend constants.
 *
 * Import from here instead of redefining in every file.
 * TOKEN_KEY was previously copy-pasted in: authSlice.js, axios.js,
 * OrderTrackingPage.jsx, OwnerOrdersPage.jsx, DeliveryDashboard.jsx
 */

/** localStorage key for the JWT access token */
export const TOKEN_KEY = 'ob_access_token';

/** localStorage key for the persisted cart state */
export const CART_STORAGE_KEY = 'ob_cart';
