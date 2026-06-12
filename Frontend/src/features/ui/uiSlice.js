import { createSlice } from '@reduxjs/toolkit';

const uiSlice = createSlice({
  name: 'ui',
  initialState: {
    toast: null,
    clearCartModal: { visible: false, pendingItem: null },
  },
  reducers: {
    showToast: (state, action) => {
      state.toast = {
        message: action.payload.message,
        type: action.payload.type || 'info',
        duration: action.payload.duration || 3000,
        id: Date.now(),
      };
    },
    hideToast: (state) => { state.toast = null; },
    showClearCartModal: (state, action) => {
      state.clearCartModal = { visible: true, pendingItem: action.payload };
    },
    hideClearCartModal: (state) => {
      state.clearCartModal = { visible: false, pendingItem: null };
    },
  },
});

export const { showToast, hideToast, showClearCartModal, hideClearCartModal } = uiSlice.actions;
export const selectToast = (state) => state.ui.toast;
export const selectClearCartModal = (state) => state.ui.clearCartModal;

export default uiSlice.reducer;
