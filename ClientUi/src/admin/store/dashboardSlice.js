import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { adminApi } from '../services/api.js';
import { getErrorMessage } from '../../core/createApiClient.js';

export const fetchDashboard = createAsyncThunk('dashboard/fetch', async (_, { rejectWithValue }) => {
  try {
    const { data } = await adminApi.get('/dashboard');
    return data.data;
  } catch (err) {
    return rejectWithValue(getErrorMessage(err));
  }
});

const slice = createSlice({
  name: 'dashboard',
  initialState: { data: null, status: 'idle', error: null, online: 0, socketConnected: false },
  reducers: {
    presenceUpdated(state, { payload }) { state.online = payload.online; },
    socketStatusChanged(state, { payload }) { state.socketConnected = payload; },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchDashboard.pending, (state) => { if (!state.data) state.status = 'loading'; })
      .addCase(fetchDashboard.fulfilled, (state, { payload }) => { state.status = 'succeeded'; state.data = payload; })
      .addCase(fetchDashboard.rejected, (state, { payload }) => { state.status = 'failed'; state.error = payload; });
  },
});

export const { presenceUpdated, socketStatusChanged } = slice.actions;
export default slice.reducer;
