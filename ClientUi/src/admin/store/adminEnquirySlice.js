import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { adminApi } from '../services/api.js';
import { getErrorMessage } from '../../core/createApiClient.js';

export const fetchEnquiries = createAsyncThunk('adminEnquiries/fetch', async (filters = {}, { rejectWithValue }) => {
  try {
    const params = Object.fromEntries(Object.entries(filters).filter(([, v]) => v));
    const { data } = await adminApi.get('/enquiries', { params });
    return data.data;
  } catch (err) {
    return rejectWithValue(getErrorMessage(err));
  }
});

export const setEnquiryStatus = createAsyncThunk('adminEnquiries/status', async ({ id, status }, { rejectWithValue }) => {
  try {
    const { data } = await adminApi.patch(`/enquiries/${id}/status`, { status });
    return data.data;
  } catch (err) {
    return rejectWithValue(getErrorMessage(err));
  }
});

export const deleteEnquiry = createAsyncThunk('adminEnquiries/delete', async (id, { rejectWithValue }) => {
  try {
    await adminApi.delete(`/enquiries/${id}`);
    return id;
  } catch (err) {
    return rejectWithValue(getErrorMessage(err));
  }
});

const slice = createSlice({
  name: 'adminEnquiries',
  initialState: { items: [], status: 'idle', error: null },
  reducers: {
    // Socket-driven
    enquiryAddedLive(state, { payload }) {
      if (!state.items.some((q) => q.id === payload.id)) state.items.unshift(payload);
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchEnquiries.pending, (state) => { state.status = 'loading'; })
      .addCase(fetchEnquiries.fulfilled, (state, { payload }) => { state.status = 'succeeded'; state.items = payload; })
      .addCase(fetchEnquiries.rejected, (state, { payload }) => { state.status = 'failed'; state.error = payload; })
      .addCase(setEnquiryStatus.fulfilled, (state, { payload }) => {
        const i = state.items.findIndex((q) => q.id === payload.id);
        if (i >= 0) state.items[i] = payload;
      })
      .addCase(deleteEnquiry.fulfilled, (state, { payload }) => { state.items = state.items.filter((q) => q.id !== payload); });
  },
});

export const { enquiryAddedLive } = slice.actions;
export default slice.reducer;
