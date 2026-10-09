import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { adminApi, ADMIN_TOKEN_KEY, ADMIN_USER_KEY } from '../services/api.js';
import { getErrorMessage } from '../../core/createApiClient.js';
import { readJSON, writeJSON } from '../../core/storage.js';

export const adminLogin = createAsyncThunk('adminAuth/login', async (credentials, { rejectWithValue }) => {
  try {
    const { data } = await adminApi.post('/auth/admin/login', credentials);
    localStorage.setItem(ADMIN_TOKEN_KEY, data.token);
    writeJSON(ADMIN_USER_KEY, data.user);
    return data;
  } catch (err) {
    return rejectWithValue(getErrorMessage(err));
  }
});

const slice = createSlice({
  name: 'adminAuth',
  initialState: { token: localStorage.getItem(ADMIN_TOKEN_KEY), user: readJSON(ADMIN_USER_KEY), status: 'idle', error: null },
  reducers: {
    adminLogout(state) {
      state.token = null;
      state.user = null;
      localStorage.removeItem(ADMIN_TOKEN_KEY);
      localStorage.removeItem(ADMIN_USER_KEY);
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(adminLogin.pending, (state) => { state.status = 'loading'; state.error = null; })
      .addCase(adminLogin.fulfilled, (state, { payload }) => { state.status = 'idle'; state.token = payload.token; state.user = payload.user; })
      .addCase(adminLogin.rejected, (state, { payload }) => { state.status = 'failed'; state.error = payload; });
  },
});

export const { adminLogout } = slice.actions;
export default slice.reducer;
