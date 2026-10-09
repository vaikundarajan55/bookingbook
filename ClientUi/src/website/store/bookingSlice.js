import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { webApi } from '../services/api.js';
import { getErrorMessage } from '../../core/createApiClient.js';

// ---- Thunks -------------------------------------------------------------
export const createBooking = createAsyncThunk('webBookings/create', async (payload, { rejectWithValue }) => {
  try {
    const { data } = await webApi.post('/bookings', payload);
    return data.data;
  } catch (err) {
    return rejectWithValue(getErrorMessage(err));
  }
});

export const fetchMyBookings = createAsyncThunk('webBookings/fetchMine', async (_, { rejectWithValue }) => {
  try {
    const { data } = await webApi.get('/bookings/mine');
    return data.data;
  } catch (err) {
    return rejectWithValue(getErrorMessage(err));
  }
});

export const cancelBooking = createAsyncThunk('webBookings/cancel', async (id, { rejectWithValue }) => {
  try {
    const { data } = await webApi.patch(`/bookings/${id}/cancel`);
    return data.data;
  } catch (err) {
    return rejectWithValue(getErrorMessage(err));
  }
});

// ---- Slice --------------------------------------------------------------
const upsert = (items, booking) => {
  const index = items.findIndex((b) => b.id === booking.id);
  if (index >= 0) items[index] = booking; else items.unshift(booking);
};

const bookingSlice = createSlice({
  name: 'webBookings',
  initialState: { items: [], status: 'idle', submitting: false, error: null },
  reducers: {
    // Called from the socket hook when an admin changes one of the guest's bookings
    bookingUpdatedLive(state, { payload }) { upsert(state.items, payload); },
    clearBookings(state) { state.items = []; state.status = 'idle'; },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchMyBookings.pending, (state) => { state.status = 'loading'; })
      .addCase(fetchMyBookings.fulfilled, (state, { payload }) => { state.status = 'succeeded'; state.items = payload; })
      .addCase(fetchMyBookings.rejected, (state, { payload }) => { state.status = 'failed'; state.error = payload; })
      .addCase(createBooking.pending, (state) => { state.submitting = true; })
      .addCase(createBooking.fulfilled, (state, { payload }) => { state.submitting = false; upsert(state.items, payload); })
      .addCase(createBooking.rejected, (state) => { state.submitting = false; })
      .addCase(cancelBooking.fulfilled, (state, { payload }) => { upsert(state.items, payload); });
  },
});

export const { bookingUpdatedLive, clearBookings } = bookingSlice.actions;
export default bookingSlice.reducer;
