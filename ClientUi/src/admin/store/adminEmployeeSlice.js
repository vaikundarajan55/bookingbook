import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { adminApi } from '../services/api.js';
import { getErrorMessage } from '../../core/createApiClient.js';

export const fetchEmployees = createAsyncThunk('adminEmployees/fetch', async (filters = {}, { rejectWithValue }) => {
  try {
    const params = Object.fromEntries(Object.entries(filters).filter(([, v]) => v));
    const { data } = await adminApi.get('/employees', { params });
    return data.data;
  } catch (err) {
    return rejectWithValue(getErrorMessage(err));
  }
});

/** Create when `id` is missing, update otherwise. */
export const saveEmployee = createAsyncThunk('adminEmployees/save', async ({ id, ...payload }, { rejectWithValue }) => {
  try {
    const { data } = id ? await adminApi.put(`/employees/${id}`, payload) : await adminApi.post('/employees', payload);
    return data.data;
  } catch (err) {
    return rejectWithValue(getErrorMessage(err));
  }
});

export const deleteEmployee = createAsyncThunk('adminEmployees/delete', async (id, { rejectWithValue }) => {
  try {
    await adminApi.delete(`/employees/${id}`);
    return id;
  } catch (err) {
    return rejectWithValue(getErrorMessage(err));
  }
});

const slice = createSlice({
  name: 'adminEmployees',
  initialState: { items: [], status: 'idle', saving: false, error: null },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchEmployees.pending, (state) => { state.status = 'loading'; })
      .addCase(fetchEmployees.fulfilled, (state, { payload }) => { state.status = 'succeeded'; state.items = payload; })
      .addCase(fetchEmployees.rejected, (state, { payload }) => { state.status = 'failed'; state.error = payload; })
      .addCase(saveEmployee.pending, (state) => { state.saving = true; })
      .addCase(saveEmployee.fulfilled, (state, { payload }) => {
        state.saving = false;
        const i = state.items.findIndex((e) => e.id === payload.id);
        if (i >= 0) state.items[i] = payload; else state.items.push(payload);
      })
      .addCase(saveEmployee.rejected, (state) => { state.saving = false; })
      .addCase(deleteEmployee.fulfilled, (state, { payload }) => { state.items = state.items.filter((e) => e.id !== payload); });
  },
});

export default slice.reducer;
