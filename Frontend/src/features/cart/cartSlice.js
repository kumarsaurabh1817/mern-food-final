import { createSlice } from '@reduxjs/toolkit';
import { showClearCartModal } from '../ui/uiSlice';
import { CART_STORAGE_KEY } from '../../lib/constants';

// ── Helpers ───────────────────────────────────────────────────────────────────
const loadFromStorage = () => {
  try {
    const raw = localStorage.getItem(CART_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const saveToStorage = (state) => {
  try {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify({
      items: state.items,
      shopId: state.shopId,
      shopName: state.shopName,
    }));
  } catch { /* quota exceeded or private mode — ignore */ }
};

const clearStorage = () => {
  try { localStorage.removeItem(CART_STORAGE_KEY); } catch { /* ignore */ }
};

const savedCart = loadFromStorage();

const cartSlice = createSlice({
  name: 'cart',
  initialState: savedCart || {
    items: [],
    shopId: null,
    shopName: '',
  },
  reducers: {
    loadCart: (state) => {
      // Re-hydrate from localStorage (called once on app mount)
      const saved = loadFromStorage();
      if (saved) {
        state.items    = saved.items    ?? [];
        state.shopId   = saved.shopId   ?? null;
        state.shopName = saved.shopName ?? '';
      }
    },
    addItem: (state, action) => {
      const { item } = action.payload;
      const existing = state.items.find((i) => i._id === item._id);
      if (existing) {
        existing.quantity += 1;
      } else {
        state.items.push({ ...item, quantity: 1 });
      }
      state.shopId   = action.payload.shopId;
      state.shopName = action.payload.shopName;
      saveToStorage(state);
    },
    removeItem: (state, action) => {
      const existing = state.items.find((i) => i._id === action.payload);
      if (existing) {
        if (existing.quantity > 1) {
          existing.quantity -= 1;
        } else {
          state.items = state.items.filter((i) => i._id !== action.payload);
        }
      }
      if (state.items.length === 0) {
        state.shopId   = null;
        state.shopName = '';
      }
      saveToStorage(state);
    },
    clearCart: (state) => {
      state.items    = [];
      state.shopId   = null;
      state.shopName = '';
      clearStorage();
    },
    clearShopAndAddItem: (state, action) => {
      const { item, shopId, shopName } = action.payload;
      state.items    = [{ ...item, quantity: 1 }];
      state.shopId   = shopId;
      state.shopName = shopName;
      saveToStorage(state);
    },
  },
});

export const { loadCart, addItem, removeItem, clearCart, clearShopAndAddItem } = cartSlice.actions;

export const addItemSafe = (payload) => (dispatch, getState) => {
  const { cart } = getState();
  if (cart.shopId && cart.shopId !== payload.shopId && cart.items.length > 0) {
    dispatch(showClearCartModal(payload));
  } else {
    dispatch(addItem(payload));
  }
};

export const selectCartItems    = (state) => state.cart.items;
export const selectCartCount    = (state) => state.cart.items.reduce((sum, i) => sum + i.quantity, 0);
export const selectCartTotal    = (state) => state.cart.items.reduce((sum, i) => sum + i.price * i.quantity, 0);
export const selectCartShopId   = (state) => state.cart.shopId;
export const selectCartShopName = (state) => state.cart.shopName;

export default cartSlice.reducer;
