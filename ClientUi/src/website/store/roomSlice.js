import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { webApi } from '../services/api.js';
import { getErrorMessage } from '../../core/createApiClient.js';

// ---- Thunks -------------------------------------------------------------
export const fetchRooms = createAsyncThunk('webRooms/fetchAll', async (filters = {}, { rejectWithValue }) => {
  try {
    const params = Object.fromEntries(Object.entries(filters).filter(([, v]) => v !== '' && v != null));
    const { data } = await webApi.get('/rooms', { params });
    return { rooms: data.data, filters };
  } catch (err) {
    return rejectWithValue(getErrorMessage(err));
  }
});

export const fetchRoomById = createAsyncThunk('webRooms/fetchOne', async (id, { rejectWithValue }) => {
  try {
    const { data } = await webApi.get(`/rooms/${id}`);
    return data.data;
  } catch (err) {
    return rejectWithValue(getErrorMessage(err));
  }
});

/** Resolves true/false: is this room free for the given dates? (used by the booking panel) */
export const checkRoomAvailability = createAsyncThunk('webRooms/availability', async ({ id, checkIn, checkOut, guests }, { rejectWithValue }) => {
  try {
    const { data } = await webApi.get('/rooms', { params: { checkIn, checkOut, guests } });
    return data.data.some((room) => room.id === Number(id));
  } catch (err) {
    return rejectWithValue(getErrorMessage(err));
  }
});

/** Plain thunk (function form): re-run the last search when the server announces a room change. */
export const refreshRooms = () => (dispatch, getState) => dispatch(fetchRooms(getState().webRooms.filters));

// ---- Slice --------------------------------------------------------------
const roomSlice = createSlice({
  name: 'webRooms',
  initialState: { items: [], current: null, filters: {}, status: 'idle', detailStatus: 'idle', error: null },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchRooms.pending, (state) => { state.status = 'loading'; state.error = null; })
      .addCase(fetchRooms.fulfilled, (state, { payload }) => { state.status = 'succeeded'; state.items = payload.rooms; state.filters = payload.filters; })
      .addCase(fetchRooms.rejected, (state, { payload }) => { state.status = 'failed'; state.error = payload; })
      .addCase(fetchRoomById.pending, (state) => { state.detailStatus = 'loading'; state.current = null; })
      .addCase(fetchRoomById.fulfilled, (state, { payload }) => { state.detailStatus = 'succeeded'; state.current = payload; })
      .addCase(fetchRoomById.rejected, (state, { payload }) => { state.detailStatus = 'failed'; state.error = payload; });
  },
});

export default roomSlice.reducer;
