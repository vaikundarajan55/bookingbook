import { createSlice } from '@reduxjs/toolkit';

const MAX_ITEMS = 30;

/** Live events (new bookings, feedback, enquiries) shown in the header bell. Session-only. */
const slice = createSlice({
  name: 'notifications',
  initialState: { items: [], unread: 0 },
  reducers: {
    notificationAdded: {
      reducer(state, { payload }) {
        state.items.unshift(payload);
        state.items = state.items.slice(0, MAX_ITEMS);
        state.unread += 1;
      },
      // type: booking | cancel | feedback | enquiry
      prepare: ({ type, title, text, to }) => ({
        payload: { id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, type, title, text, to, at: Date.now() },
      }),
    },
    notificationsRead(state) { state.unread = 0; },
    notificationsCleared(state) { state.items = []; state.unread = 0; },
  },
});

export const { notificationAdded, notificationsRead, notificationsCleared } = slice.actions;
export default slice.reducer;
