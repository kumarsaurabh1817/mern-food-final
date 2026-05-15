import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api, { setAccessToken } from '../../lib/axios';

export const signUp = createAsyncThunk('auth/signUp', async (userData, { rejectWithValue }) => {
  try {
    const { data } = await api.post('/auth/signup', userData);
    if (!data.success) throw new Error(data.message);

    if (data.user?.role === 'user') {
      try {
        const { data: loginData } = await api.post('/auth/login', {
          email: userData.email,
          password: userData.password,
        });

        if (loginData.success && loginData.accessToken) {
          setAccessToken(loginData.accessToken);
          localStorage.setItem('accessToken', loginData.accessToken);
          localStorage.setItem('user', JSON.stringify(loginData.user));
          return { user: loginData.user, session: loginData.accessToken };
        }
      } catch {
        // Signup succeeded, but auto-login failed — fall through without a session.
      }
    }

    return { user: null, session: null };
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || error.message);
  }
});

export const signIn = createAsyncThunk('auth/signIn', async ({ email, password }, { rejectWithValue }) => {
  try {
    const { data } = await api.post('/auth/login', { email, password });
    if (!data.success) throw new Error(data.message);

    setAccessToken(data.accessToken);
    localStorage.setItem('accessToken', data.accessToken);
    localStorage.setItem('user', JSON.stringify(data.user));

    return { user: data.user, session: data.accessToken };
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || error.message);
  }
});

export const signOut = createAsyncThunk('auth/signOut', async (_, { rejectWithValue }) => {
  try {
    await api.post('/auth/logout');
    setAccessToken(null);
    localStorage.removeItem('accessToken');
    localStorage.removeItem('user');
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || error.message);
  }
});

// ─── Helper: decode JWT payload without a library ────────────────────────────
function decodeJwtPayload(token) {
  try {
    const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(atob(base64));
  } catch {
    return null;
  }
}

// ─── Helper: is the token expired? (with a 30-second clock-skew buffer) ──────
function isTokenExpired(token) {
  const payload = decodeJwtPayload(token);
  if (!payload?.exp) return true;
  return payload.exp * 1000 < Date.now() + 30_000;
}

export const loadSession = createAsyncThunk('auth/loadSession', async (_, { rejectWithValue }) => {
  try {
    const token   = localStorage.getItem('accessToken');
    const userStr = localStorage.getItem('user');

    // 1. No local data at all — user has never logged in on this device
    if (!token || !userStr) return null;

    // 2. Token is still valid — restore session with a fresh user from the server
    if (!isTokenExpired(token)) {
      setAccessToken(token);
      return await fetchFreshUser(JSON.parse(userStr), token);
    }

    // 3. Token is expired — attempt a silent refresh via the HttpOnly cookie.
    //    The server now rotates the cookie too (rolling refresh), so a successful
    //    call means the user stays logged in indefinitely while active.
    try {
      const { data } = await api.post('/auth/refresh');
      if (data.success && data.accessToken) {
        setAccessToken(data.accessToken);
        localStorage.setItem('accessToken', data.accessToken);
        return await fetchFreshUser(JSON.parse(userStr), data.accessToken);
      }
    } catch (refreshErr) {
      // 401 = session expired / revoked — clear everything and prompt re-login
      // Network errors are ignored so the app doesn't log out on connectivity issues
      const status = refreshErr?.response?.status;
      if (status === 401 || status === 403) {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('user');
        return null;
      }
      // Non-auth network error: keep stale data so app works offline
    }

    // 4. Refresh failed for a non-auth reason — use stale cached user (offline mode)
    return { user: JSON.parse(userStr), session: token };
  } catch (error) {
    return rejectWithValue(error.message);
  }
});

// ─── Helper: fetch live user data, fall back to cached ────────────────────────
async function fetchFreshUser(cachedUser, token) {
  try {
    const { data } = await api.get('/users/me');
    if (data.success && data.user) {
      localStorage.setItem('user', JSON.stringify(data.user));
      return { user: data.user, session: token };
    }
  } catch {
    // Server unreachable / 401 — use cached data so app isn't broken offline
  }
  return { user: cachedUser, session: token };
}

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: null,
    session: null,
    loading: true,
    error: null,
  },
  reducers: {
    clearError(state) {
      state.error = null;
    },
    // Kept for backward-compat; updates the single source-of-truth user field
    setUser(state, action) {
      state.user = action.payload;
      localStorage.setItem('user', JSON.stringify(action.payload));
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(signUp.pending,   (state) => { state.loading = true; state.error = null; })
      .addCase(signUp.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload?.session && action.payload?.user) {
          state.user = action.payload.user;
          state.session = action.payload.session;
        }
      })
      .addCase(signUp.rejected,  (state, action) => { state.loading = false; state.error = action.payload; })

      .addCase(signIn.pending,   (state) => { state.loading = true; state.error = null; })
      .addCase(signIn.fulfilled, (state, action) => {
        state.loading = false;
        state.user    = action.payload.user;
        state.session = action.payload.session;
      })
      .addCase(signIn.rejected, (state, action) => { state.loading = false; state.error = action.payload; })

      .addCase(signOut.fulfilled, (state) => {
        state.user    = null;
        state.session = null;
        state.loading = false;
      })

      .addCase(loadSession.pending,   (state) => { state.loading = true; state.error = null; })
      .addCase(loadSession.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload) {
          state.user    = action.payload.user;
          state.session = action.payload.session;
        }
      })
      .addCase(loadSession.rejected, (state) => { state.loading = false; });
  },
});

// ─── Selectors ────────────────────────────────────────────────────────────────
// 'profile' is an alias for 'user' kept for backward compatibility with
// the many components that already do `const { profile } = useSelector(s => s.auth)`.
// Prefer accessing `s.auth.user` in new code.
export const selectUser    = (state) => state.auth.user;
export const selectProfile = (state) => state.auth.user; // alias

export const { clearError, setUser, setUser: setProfile } = authSlice.actions;
export default authSlice.reducer;
