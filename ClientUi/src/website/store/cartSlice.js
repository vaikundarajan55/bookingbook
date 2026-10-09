import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { webApi } from '../services/api.js';
import { getErrorMessage } from '../../core/createApiClient.js';
import { readJSON } from '../../core/storage.js';
import { nightsBetween } from '../../core/format.js';

export const CART_KEY = 'hb_cart';
export const MAX_CART_ITEMS = 10;

const loadCart = () => {
  const saved = readJSON(CART_KEY);
  return Array.isArray(saved) ? saved : [];
};

/** Price of one cart line (tax-inclusive). */
export const lineTotal = (item) => nightsBetween(item.check_in, item.check_out) * item.price_per_night;

/** True when the cart already holds this room for dates that overlap the new stay. */
export const overlapsCart = (items, { room_id: roomId, check_in: checkIn, check_out: checkOut }) =>
  items.some((i) => i.room_id === roomId && i.check_in < checkOut && i.check_out > checkIn);

/** Books every cart item in one server transaction; returns the created bookings. */
export const checkoutCart = createAsyncThunk('webCart/checkout', async ({ items, notes }, { rejectWithValue }) => {
  try {
    const { data } = await webApi.post('/bookings/checkout', {
      items: items.map(({ room_id, check_in, check_out, guests }) => ({ room_id, check_in, check_out, guests })),
      notes: notes || undefined,
    });
    return data.data;
  } catch (err) {
    return rejectWithValue(getErrorMessage(err));
  }
});

const slice = createSlice({
  name: 'webCart',
  initialState: { items: loadCart(), submitting: false },
  reducers: {
    /** payload: a room snapshot + stay ({ room_id, room_name, ..., check_in, check_out, guests }) */
    cartItemAdded(state, { payload }) {
      if (state.items.length >= MAX_CART_ITEMS || overlapsCart(state.items, payload)) return;
      state.items.push({ ...payload, key: `${payload.room_id}-${payload.check_in}-${payload.check_out}-${Date.now()}` });
    },
    cartItemRemoved(state, { payload: key }) { state.items = state.items.filter((i) => i.key !== key); },
    cartCleared(state) { state.items = []; },
  },
  extraReducers: (builder) => {
    builder
      .addCase(checkoutCart.pending, (state) => { state.submitting = true; })
      .addCase(checkoutCart.fulfilled, (state) => { state.submitting = false; state.items = []; })
      .addCase(checkoutCart.rejected, (state) => { state.submitting = false; });
  },
});

export const { cartItemAdded, cartItemRemoved, cartCleared } = slice.actions;
export default slice.reducer;
