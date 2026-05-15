import { createSlice } from '@reduxjs/toolkit';

const uiSlice = createSlice({
  name: 'ui',
  initialState: {
    sidebarOpen: false,
    cartOpen: false,
    clearCartModal: null, // { item, shopId, shopName }
    toast: null, // { message, type }
  },
  reducers: {
    toggleSidebar(state) { state.sidebarOpen = !state.sidebarOpen; },
    setSidebarOpen(state, action) { state.sidebarOpen = action.payload; },
    toggleCart(state) { state.cartOpen = !state.cartOpen; },
    setCartOpen(state, action) { state.cartOpen = action.payload; },
    showClearCartModal(state, action) { state.clearCartModal = action.payload; },
    hideClearCartModal(state) { state.clearCartModal = null; },
    showToast(state, action) { state.toast = action.payload; },
    hideToast(state) { state.toast = null; },
  },
});

export const {
  toggleSidebar, setSidebarOpen,
  toggleCart, setCartOpen,
  showClearCartModal, hideClearCartModal,
  showToast, hideToast,
} = uiSlice.actions;

export default uiSlice.reducer;
