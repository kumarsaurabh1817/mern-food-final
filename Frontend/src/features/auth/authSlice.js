import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../lib/axios';
import { TOKEN_KEY } from '../../lib/constants';

export const signIn = createAsyncThunk('auth/signIn', async (credentials, { rejectWithValue }) => {
  try {
    const { data } = await api.post('/auth/login', credentials);
    localStorage.setItem(TOKEN_KEY, data.accessToken);
    return data.user;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Login failed');
  }
});

export const signUp = createAsyncThunk('auth/signUp', async (payload, { rejectWithValue }) => {
  try {
    const { data } = await api.post('/auth/signup', payload);
    return data;
  } catch (err) {
    const data = err.response?.data;
    // If the backend returned per-field validation errors, pass them along
    if (data?.errors && Array.isArray(data.errors) && data.errors.length > 0) {
      return rejectWithValue({ message: data.message || 'Validation failed', fields: data.errors });
    }
    return rejectWithValue({ message: data?.message || 'Signup failed', fields: [] });
  }
});

export const signOut = createAsyncThunk('auth/signOut', async (_, { rejectWithValue }) => {
  try {
    await api.post('/auth/logout');
  } catch (_) {}
  localStorage.removeItem(TOKEN_KEY);
});

export const loadSession = createAsyncThunk('auth/loadSession', async (_, { rejectWithValue }) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (!token) return rejectWithValue('No token');
  try {
    const { data } = await api.get('/users/me');
    return data.user;
  } catch (err) {
    localStorage.removeItem(TOKEN_KEY);
    return rejectWithValue('Session expired');
  }
});

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: null,
    loading: false,
    error: null,
    initialized: false,
  },
  reducers: {
    clearError: (state) => { state.error = null; },
  },
  extraReducers: (builder) => {
    builder
      .addCase(signIn.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(signIn.fulfilled, (state, action) => { state.loading = false; state.user = action.payload; })
      .addCase(signIn.rejected, (state, action) => { state.loading = false; state.error = action.payload; })
      .addCase(signUp.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(signUp.fulfilled, (state) => { state.loading = false; })
      .addCase(signUp.rejected, (state, action) => { state.loading = false; state.error = action.payload; })
      .addCase(signOut.fulfilled, (state) => { state.user = null; state.initialized = true; })
      .addCase(loadSession.pending, (state) => { state.loading = true; })
      .addCase(loadSession.fulfilled, (state, action) => { state.loading = false; state.user = action.payload; state.initialized = true; })
      .addCase(loadSession.rejected, (state) => { state.loading = false; state.initialized = true; });
  },
});

export const { clearError } = authSlice.actions;
export const selectUser = (state) => state.auth.user;
export const selectAuthLoading = (state) => state.auth.loading;
export const selectAuthError = (state) => state.auth.error;
export const selectAuthInitialized = (state) => state.auth.initialized;

export default authSlice.reducer;
