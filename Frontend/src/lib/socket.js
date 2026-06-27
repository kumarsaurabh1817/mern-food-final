// ─── Shared socket.io client (singleton) ─────────────────────────────────────
// One connection per browser tab, reused across every page. Previously each
// page called io(...) independently, opening 3+ duplicate sockets. Centralizing
// it here keeps a single authenticated connection, re-reads the JWT on connect,
// and survives route changes (we never disconnect on unmount — only the tab
// closing tears it down).
import { io } from 'socket.io-client';
import { TOKEN_KEY } from './constants';

const SOCKET_URL =
  import.meta.env.VITE_SOCKET_URL ||
  import.meta.env.VITE_API_URL ||
  'http://localhost:5000';

let socket = null;

/**
 * Returns the shared socket, creating + connecting it on first use.
 * The auth token is read fresh from localStorage so a login/refresh that
 * happened after the module loaded is still picked up on (re)connect.
 */
export function getSocket() {
  if (socket) return socket;

  socket = io(SOCKET_URL, {
    withCredentials: true,
    autoConnect: true,
    transports: ['websocket', 'polling'],
    auth: (cb) => cb({ token: localStorage.getItem(TOKEN_KEY) || '' }),
  });

  return socket;
}

/** Explicitly tear down the shared socket (e.g. on logout). */
export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
