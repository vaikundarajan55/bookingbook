import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { adminApi } from '../services/api.js';
import { getErrorMessage } from '../../core/createApiClient.js';

export const fetchAdminBookings = createAsyncThunk('adminBookings/fetch', async (filters = {}, { rejectWithValue }) => {
  try {
    const params = Object.fromEntries(Object.entries(filters).filter(([, v]) => v));
    const { data } = await adminApi.get('/bookings', { params });
    return data.data;
  } catch (err) {
    return rejectWithValue(getErrorMessage(err));
  }
});

export const changeBookingStatus = createAsyncThunk('adminBookings/changeStatus', async ({ id, status }, { rejectWithValue }) => {
  try {
    const { data } = await adminApi.patch(`/bookings/${id}/status`, { status });
    return data.data;
  } catch (err) {
    return rejectWithValue(getErrorMessage(err));
  }
});

const replace = (items, booking) => {
  const i = items.findIndex((b) => b.id === booking.id);
  if (i >= 0) items[i] = booking;
};

const slice = createSlice({
  name: 'adminBookings',
  initialState: { items: [], status: 'idle', updatingId: null, error: null },
  reducers: {
    // Socket-driven reducers
    bookingAddedLive(state, { payload }) {
      if (!state.items.some((b) => b.id === payload.id)) state.items.unshift(payload);
    },
    bookingUpdatedLive(state, { payload }) { replace(state.items, payload); },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAdminBookings.pending, (state) => { state.status = 'loading'; })
      .addCase(fetchAdminBookings.fulfilled, (state, { payload }) => { state.status = 'succeeded'; state.items = payload; })
      .addCase(fetchAdminBookings.rejected, (state, { payload }) => { state.status = 'failed'; state.error = payload; })
      .addCase(changeBookingStatus.pending, (state, { meta }) => { state.updatingId = meta.arg.id; })
      .addCase(changeBookingStatus.fulfilled, (state, { payload }) => { state.updatingId = null; replace(state.items, payload); })
      .addCase(changeBookingStatus.rejected, (state) => { state.updatingId = null; });
  },
});

export const { bookingAddedLive, bookingUpdatedLive } = slice.actions;
export default slice.reducer;
