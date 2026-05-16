import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: true, // Need this for cookies (refreshToken)
  headers: {
    'Content-Type': 'application/json',
  },
});

let accessToken = null;

if (typeof window !== 'undefined') {
  accessToken = localStorage.getItem('accessToken');
}

export const setAccessToken = (token) => {
  accessToken = token || null;
  if (typeof window !== 'undefined') {
    if (token) localStorage.setItem('accessToken', token);
    else localStorage.removeItem('accessToken');
  }
};

// Add interceptor to inject the token
api.interceptors.request.use(
  (config) => {
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Add interceptor to handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const status = error.response?.status;

    // Never retry the refresh call itself — avoids infinite 401 loops
    const isRefreshCall = originalRequest?.url?.includes('/auth/refresh');

    // Only attempt a silent refresh if:
    // 1. The response was 401 (Unauthorized)
    // 2. We haven't already retried this request
    // 3. This is not the /auth/refresh call itself
    // 4. We actually have a token — if we have no token, there's no cookie either
    const hasToken = !!accessToken;

    if (status === 401 && !originalRequest._retry && !isRefreshCall && hasToken) {
      originalRequest._retry = true;

      try {
        const { data } = await axios.post(`${BASE_URL}/auth/refresh`, {}, { withCredentials: true });

        if (data.success && data.accessToken) {
          setAccessToken(data.accessToken);
          originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
          return api(originalRequest); // Retry the original request
        }
      } catch {
        // Refresh failed — clear auth state and redirect to login.
        // IMPORTANT: Reject with the ORIGINAL error (not the refresh error) so the
        // caller sees the real API error message, never "Refresh token not found".
        setAccessToken(null);
        localStorage.removeItem('accessToken');
        localStorage.removeItem('user');
        if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
        return Promise.reject(error); // <-- original error, not refreshError
      }
    }

    return Promise.reject(error);
  }
);

export default api;
