import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { adminApi } from '../services/api.js';
import { getErrorMessage } from '../../core/createApiClient.js';

export const fetchAdminHotels = createAsyncThunk('adminHotels/fetch', async (_, { rejectWithValue }) => {
  try {
    const { data } = await adminApi.get('/hotels/admin/all');
    return data.data;
  } catch (err) {
    return rejectWithValue(getErrorMessage(err));
  }
});

/** Create when `id` is missing, update otherwise. */
export const saveHotel = createAsyncThunk('adminHotels/save', async ({ id, ...payload }, { rejectWithValue }) => {
  try {
    const { data } = id ? await adminApi.put(`/hotels/${id}`, payload) : await adminApi.post('/hotels', payload);
    return data.data;
  } catch (err) {
    return rejectWithValue(getErrorMessage(err));
  }
});

export const archiveHotel = createAsyncThunk('adminHotels/archive', async (id, { rejectWithValue }) => {
  try {
    await adminApi.delete(`/hotels/${id}`);
    return id;
  } catch (err) {
    return rejectWithValue(getErrorMessage(err));
  }
});

const slice = createSlice({
  name: 'adminHotels',
  initialState: { items: [], status: 'idle', saving: false, error: null },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchAdminHotels.pending, (state) => { state.status = 'loading'; })
      .addCase(fetchAdminHotels.fulfilled, (state, { payload }) => { state.status = 'succeeded'; state.items = payload; })
      .addCase(fetchAdminHotels.rejected, (state, { payload }) => { state.status = 'failed'; state.error = payload; })
      .addCase(saveHotel.pending, (state) => { state.saving = true; })
      .addCase(saveHotel.fulfilled, (state, { payload }) => {
        state.saving = false;
        const i = state.items.findIndex((h) => h.id === payload.id);
        // Keep the room counts from the list endpoint; the save response doesn't include them
        if (i >= 0) state.items[i] = { ...state.items[i], ...payload };
        else state.items.push({ ...payload, rooms_count: 0, ac_rooms_count: 0, non_ac_rooms_count: 0 });
      })
      .addCase(saveHotel.rejected, (state) => { state.saving = false; })
      .addCase(archiveHotel.fulfilled, (state, { payload }) => {
        const hotel = state.items.find((h) => h.id === payload);
        if (hotel) hotel.is_active = false;
      });
  },
});

export default slice.reducer;
