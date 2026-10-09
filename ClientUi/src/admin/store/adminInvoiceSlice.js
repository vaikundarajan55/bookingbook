import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { adminApi } from '../services/api.js';
import { getErrorMessage } from '../../core/createApiClient.js';

export const fetchInvoices = createAsyncThunk('adminInvoices/fetch', async (filters = {}, { rejectWithValue }) => {
  try {
    const params = Object.fromEntries(Object.entries(filters).filter(([, v]) => v));
    const { data } = await adminApi.get('/invoices', { params });
    return data.data;
  } catch (err) {
    return rejectWithValue(getErrorMessage(err));
  }
});

export const fetchInvoice = createAsyncThunk('adminInvoices/fetchOne', async (id, { rejectWithValue }) => {
  try {
    const { data } = await adminApi.get(`/invoices/${id}`);
    return data.data;
  } catch (err) {
    return rejectWithValue(getErrorMessage(err));
  }
});

export const updatePayment = createAsyncThunk('adminInvoices/payment', async ({ id, ...payload }, { rejectWithValue }) => {
  try {
    const { data } = await adminApi.patch(`/invoices/${id}/payment`, payload);
    return data.data;
  } catch (err) {
    return rejectWithValue(getErrorMessage(err));
  }
});

const slice = createSlice({
  name: 'adminInvoices',
  initialState: { items: [], status: 'idle', current: null, currentStatus: 'idle', saving: false, error: null },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchInvoices.pending, (state) => { state.status = 'loading'; })
      .addCase(fetchInvoices.fulfilled, (state, { payload }) => { state.status = 'succeeded'; state.items = payload; })
      .addCase(fetchInvoices.rejected, (state, { payload }) => { state.status = 'failed'; state.error = payload; })
      .addCase(fetchInvoice.pending, (state) => { state.currentStatus = 'loading'; state.current = null; })
      .addCase(fetchInvoice.fulfilled, (state, { payload }) => { state.currentStatus = 'succeeded'; state.current = payload; })
      .addCase(fetchInvoice.rejected, (state, { payload }) => { state.currentStatus = 'failed'; state.error = payload; })
      .addCase(updatePayment.pending, (state) => { state.saving = true; })
      .addCase(updatePayment.fulfilled, (state, { payload }) => {
        state.saving = false;
        if (state.current?.id === payload.id) state.current = payload;
        const i = state.items.findIndex((inv) => inv.id === payload.id);
        if (i >= 0) state.items[i] = payload;
      })
      .addCase(updatePayment.rejected, (state) => { state.saving = false; });
  },
});

export default slice.reducer;
