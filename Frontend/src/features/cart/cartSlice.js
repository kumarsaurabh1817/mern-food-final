import { createSlice } from '@reduxjs/toolkit';

const normalizeCart = (cart) => {
  const items = Array.isArray(cart?.items)
    ? cart.items.map((item) => {
      const rawQty = item.quantity ?? item.qty ?? 1;
      const quantity = Math.max(1, parseInt(rawQty, 10) || 1);
      const normalized = { ...item, quantity };
      delete normalized.qty;
      return normalized;
    })
    : [];

  return {
    items,
    shopId: cart?.shopId || null,
    shopName: cart?.shopName || '',
  };
};

const loadCart = () => {
  try {
    const stored = localStorage.getItem('orangebite_cart');
    return stored
      ? normalizeCart(JSON.parse(stored))
      : { items: [], shopId: null, shopName: '' };
  } catch {
    return { items: [], shopId: null, shopName: '' };
  }
};

const saveCart = (state) => {
  localStorage.setItem('orangebite_cart', JSON.stringify(state));
};

const cartSlice = createSlice({
  name: 'cart',
  initialState: loadCart(),
  reducers: {
    addItem(state, action) {
      const { item, shopId, shopName } = action.payload;
      // If a new shop is specified and differs from current, clear cart first
      if (shopId && state.shopId && state.shopId !== shopId) {
        state.items = [];
        state.shopId = shopId;
        state.shopName = shopName || '';
      }
      if (!state.shopId && shopId) {
        state.shopId = shopId;
        state.shopName = shopName || '';
      }
      const existing = state.items.find(i => i.id === item.id);
      if (existing) {
        existing.quantity += 1;
      } else {
        state.items.push({ ...item, quantity: 1 });
      }
      saveCart(state);
    },
    removeItem(state, action) {
      const id = action.payload;
      const existing = state.items.find(i => i.id === id);
      if (existing) {
        if (existing.quantity > 1) {
          existing.quantity -= 1;
        } else {
          state.items = state.items.filter(i => i.id !== id);
        }
      }
      if (state.items.length === 0) {
        state.shopId = null;
        state.shopName = '';
      }
      saveCart(state);
    },
    clearCart(state) {
      state.items = [];
      state.shopId = null;
      state.shopName = '';
      saveCart(state);
    },
    clearShopAndAddItem(state, action) {
      const { item, shopId, shopName } = action.payload;
      state.items = [{ ...item, quantity: 1 }];
      state.shopId = shopId;
      state.shopName = shopName;
      saveCart(state);
    },
  },
});

export const { addItem, removeItem, clearCart, clearShopAndAddItem } = cartSlice.actions;

export const selectCartTotal = (state) => state.cart.items.reduce((sum, i) => sum + i.price * i.quantity, 0);
export const selectCartCount = (state) => state.cart.items.reduce((sum, i) => sum + i.quantity, 0);

export default cartSlice.reducer;
