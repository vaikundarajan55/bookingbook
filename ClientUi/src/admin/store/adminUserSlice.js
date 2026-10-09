import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { adminApi } from '../services/api.js';
import { getErrorMessage } from '../../core/createApiClient.js';

export const fetchUsers = createAsyncThunk('adminUsers/fetch', async (filters = {}, { rejectWithValue }) => {
  try {
    const { data } = await adminApi.get('/users', { params: filters });
    return data.data;
  } catch (err) {
    return rejectWithValue(getErrorMessage(err));
  }
});

export const toggleUserActive = createAsyncThunk('adminUsers/toggle', async (id, { rejectWithValue }) => {
  try {
    const { data } = await adminApi.patch(`/users/${id}/toggle-active`);
    return data.data;
  } catch (err) {
    return rejectWithValue(getErrorMessage(err));
  }
});

const slice = createSlice({
  name: 'adminUsers',
  initialState: { items: [], status: 'idle', error: null },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchUsers.pending, (state) => { state.status = 'loading'; })
      .addCase(fetchUsers.fulfilled, (state, { payload }) => { state.status = 'succeeded'; state.items = payload; })
      .addCase(fetchUsers.rejected, (state, { payload }) => { state.status = 'failed'; state.error = payload; })
      .addCase(toggleUserActive.fulfilled, (state, { payload }) => {
        const user = state.items.find((u) => u.id === payload.id);
        if (user) user.is_active = payload.is_active;
      });
  },
});

export default slice.reducer;
