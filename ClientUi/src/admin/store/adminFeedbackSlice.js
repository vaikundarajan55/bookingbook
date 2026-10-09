import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { adminApi } from '../services/api.js';
import { getErrorMessage } from '../../core/createApiClient.js';

export const fetchFeedback = createAsyncThunk('adminFeedback/fetch', async (filters = {}, { rejectWithValue }) => {
  try {
    const params = Object.fromEntries(Object.entries(filters).filter(([, v]) => v));
    const { data } = await adminApi.get('/feedback', { params });
    return data.data;
  } catch (err) {
    return rejectWithValue(getErrorMessage(err));
  }
});

export const setFeedbackStatus = createAsyncThunk('adminFeedback/status', async ({ id, status }, { rejectWithValue }) => {
  try {
    const { data } = await adminApi.patch(`/feedback/${id}/status`, { status });
    return data.data;
  } catch (err) {
    return rejectWithValue(getErrorMessage(err));
  }
});

export const deleteFeedback = createAsyncThunk('adminFeedback/delete', async (id, { rejectWithValue }) => {
  try {
    await adminApi.delete(`/feedback/${id}`);
    return id;
  } catch (err) {
    return rejectWithValue(getErrorMessage(err));
  }
});

const slice = createSlice({
  name: 'adminFeedback',
  initialState: { items: [], status: 'idle', error: null },
  reducers: {
    // Socket-driven
    feedbackAddedLive(state, { payload }) {
      if (!state.items.some((f) => f.id === payload.id)) state.items.unshift(payload);
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchFeedback.pending, (state) => { state.status = 'loading'; })
      .addCase(fetchFeedback.fulfilled, (state, { payload }) => { state.status = 'succeeded'; state.items = payload; })
      .addCase(fetchFeedback.rejected, (state, { payload }) => { state.status = 'failed'; state.error = payload; })
      .addCase(setFeedbackStatus.fulfilled, (state, { payload }) => {
        const i = state.items.findIndex((f) => f.id === payload.id);
        if (i >= 0) state.items[i] = payload;
      })
      .addCase(deleteFeedback.fulfilled, (state, { payload }) => { state.items = state.items.filter((f) => f.id !== payload); });
  },
});

export const { feedbackAddedLive } = slice.actions;
export default slice.reducer;
