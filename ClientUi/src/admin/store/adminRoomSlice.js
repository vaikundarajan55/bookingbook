import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { adminApi } from '../services/api.js';
import { getErrorMessage } from '../../core/createApiClient.js';

export const fetchAdminRooms = createAsyncThunk('adminRooms/fetch', async (_, { rejectWithValue }) => {
  try {
    const { data } = await adminApi.get('/rooms/admin/all');
    return data.data;
  } catch (err) {
    return rejectWithValue(getErrorMessage(err));
  }
});

/** Create when `id` is missing, update otherwise. */
export const saveRoom = createAsyncThunk('adminRooms/save', async ({ id, ...payload }, { rejectWithValue }) => {
  try {
    const { data } = id ? await adminApi.put(`/rooms/${id}`, payload) : await adminApi.post('/rooms', payload);
    return data.data;
  } catch (err) {
    return rejectWithValue(getErrorMessage(err));
  }
});

export const archiveRoom = createAsyncThunk('adminRooms/archive', async (id, { rejectWithValue }) => {
  try {
    await adminApi.delete(`/rooms/${id}`);
    return id;
  } catch (err) {
    return rejectWithValue(getErrorMessage(err));
  }
});

const slice = createSlice({
  name: 'adminRooms',
  initialState: { items: [], status: 'idle', saving: false, error: null },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchAdminRooms.pending, (state) => { state.status = 'loading'; })
      .addCase(fetchAdminRooms.fulfilled, (state, { payload }) => { state.status = 'succeeded'; state.items = payload; })
      .addCase(fetchAdminRooms.rejected, (state, { payload }) => { state.status = 'failed'; state.error = payload; })
      .addCase(saveRoom.pending, (state) => { state.saving = true; })
      .addCase(saveRoom.fulfilled, (state, { payload }) => {
        state.saving = false;
        const i = state.items.findIndex((r) => r.id === payload.id);
        if (i >= 0) state.items[i] = payload; else state.items.push(payload);
      })
      .addCase(saveRoom.rejected, (state) => { state.saving = false; })
      .addCase(archiveRoom.fulfilled, (state, { payload }) => {
        const room = state.items.find((r) => r.id === payload);
        if (room) room.is_active = false;
      });
  },
});

export default slice.reducer;
