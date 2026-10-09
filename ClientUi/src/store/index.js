import { configureStore } from '@reduxjs/toolkit';

// Website slices
import webAuth from '../website/store/authSlice.js';
import webRooms from '../website/store/roomSlice.js';
import webBookings from '../website/store/bookingSlice.js';
import webCart, { CART_KEY } from '../website/store/cartSlice.js';
import { writeJSON } from '../core/storage.js';

// Admin slices
import adminAuth from '../admin/store/adminAuthSlice.js';
import adminHotels from '../admin/store/adminHotelSlice.js';
import adminRooms from '../admin/store/adminRoomSlice.js';
import adminBookings from '../admin/store/adminBookingSlice.js';
import adminUsers from '../admin/store/adminUserSlice.js';
import dashboard from '../admin/store/dashboardSlice.js';
import adminEmployees from '../admin/store/adminEmployeeSlice.js';
import adminInvoices from '../admin/store/adminInvoiceSlice.js';
import adminFeedback from '../admin/store/adminFeedbackSlice.js';
import adminEnquiries from '../admin/store/adminEnquirySlice.js';
import notifications from '../admin/store/notificationSlice.js';

// redux-thunk middleware is included by default in Redux Toolkit's configureStore.
export const store = configureStore({
  reducer: { webAuth, webRooms, webBookings, webCart, adminAuth, adminHotels, adminRooms, adminBookings, adminUsers, dashboard, adminEmployees, adminInvoices, adminFeedback, adminEnquiries, notifications },
  devTools: import.meta.env.DEV,
});

// Persist the cart so it survives reloads and the sign-in redirect
let lastCart = store.getState().webCart.items;
store.subscribe(() => {
  const { items } = store.getState().webCart;
  if (items === lastCart) return;
  lastCart = items;
  try { writeJSON(CART_KEY, items); } catch { /* storage full or blocked: cart lives for this tab only */ }
});
