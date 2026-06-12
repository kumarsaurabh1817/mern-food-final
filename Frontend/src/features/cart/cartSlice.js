import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { showClearCartModal } from '../ui/uiSlice';

const cartSlice = createSlice({
  name: 'cart',
  initialState: {
    items: [],
    shopId: null,
    shopName: '',
  },
  reducers: {
    addItem: (state, action) => {
      const { item } = action.payload;
      const existing = state.items.find((i) => i._id === item._id);
      if (existing) {
        existing.quantity += 1;
      } else {
        state.items.push({ ...item, quantity: 1 });
      }
      state.shopId = action.payload.shopId;
      state.shopName = action.payload.shopName;
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
        state.shopId = null;
        state.shopName = '';
      }
    },
    clearCart: (state) => {
      state.items = [];
      state.shopId = null;
      state.shopName = '';
    },
    clearShopAndAddItem: (state, action) => {
      const { item, shopId, shopName } = action.payload;
      state.items = [{ ...item, quantity: 1 }];
      state.shopId = shopId;
      state.shopName = shopName;
    },
  },
});

export const { addItem, removeItem, clearCart, clearShopAndAddItem } = cartSlice.actions;

export const addItemSafe = (payload) => (dispatch, getState) => {
  const { cart } = getState();
  if (cart.shopId && cart.shopId !== payload.shopId && cart.items.length > 0) {
    dispatch(showClearCartModal(payload));
  } else {
    dispatch(addItem(payload));
  }
};

export const selectCartItems = (state) => state.cart.items;
export const selectCartCount = (state) => state.cart.items.reduce((sum, i) => sum + i.quantity, 0);
export const selectCartTotal = (state) => state.cart.items.reduce((sum, i) => sum + i.price * i.quantity, 0);
export const selectCartShopId = (state) => state.cart.shopId;
export const selectCartShopName = (state) => state.cart.shopName;

export default cartSlice.reducer;
