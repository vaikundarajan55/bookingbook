import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { webApi, WEB_TOKEN_KEY, WEB_USER_KEY } from '../services/api.js';
import { getErrorMessage } from '../../core/createApiClient.js';
import { readJSON, writeJSON } from '../../core/storage.js';

const persist = ({ token, user }) => {
  localStorage.setItem(WEB_TOKEN_KEY, token);
  writeJSON(WEB_USER_KEY, user);
};

// ---- Thunks -------------------------------------------------------------
export const loginUser = createAsyncThunk('webAuth/login', async (credentials, { rejectWithValue }) => {
  try {
    const { data } = await webApi.post('/auth/login', credentials);
    if (data.user.role === 'admin') return rejectWithValue('Admin accounts sign in on the admin portal');
    persist(data);
    return data;
  } catch (err) {
    return rejectWithValue(getErrorMessage(err));
  }
});

export const registerUser = createAsyncThunk('webAuth/register', async (payload, { rejectWithValue }) => {
  try {
    const { data } = await webApi.post('/auth/register', payload);
    persist(data);
    return data;
  } catch (err) {
    return rejectWithValue(getErrorMessage(err));
  }
});

export const updateProfile = createAsyncThunk('webAuth/updateProfile', async (payload, { rejectWithValue }) => {
  try {
    const { data } = await webApi.put('/auth/profile', payload);
    writeJSON(WEB_USER_KEY, data.user);
    return data.user;
  } catch (err) {
    return rejectWithValue(getErrorMessage(err));
  }
});

// ---- Slice --------------------------------------------------------------
const initialState = {
  token: localStorage.getItem(WEB_TOKEN_KEY),
  user: readJSON(WEB_USER_KEY),
  status: 'idle', // idle | loading | failed
  error: null,
};

const authSlice = createSlice({
  name: 'webAuth',
  initialState,
  reducers: {
    logout(state) {
      state.token = null;
      state.user = null;
      localStorage.removeItem(WEB_TOKEN_KEY);
      localStorage.removeItem(WEB_USER_KEY);
    },
    clearAuthError(state) { state.error = null; },
  },
  extraReducers: (builder) => {
    const pending = (state) => { state.status = 'loading'; state.error = null; };
    const fulfilled = (state, { payload }) => { state.status = 'idle'; state.token = payload.token; state.user = payload.user; };
    const rejected = (state, { payload }) => { state.status = 'failed'; state.error = payload; };
    builder
      .addCase(loginUser.pending, pending).addCase(loginUser.fulfilled, fulfilled).addCase(loginUser.rejected, rejected)
      .addCase(registerUser.pending, pending).addCase(registerUser.fulfilled, fulfilled).addCase(registerUser.rejected, rejected)
      .addCase(updateProfile.fulfilled, (state, { payload }) => { state.user = payload; });
  },
});

export const { logout, clearAuthError } = authSlice.actions;
export default authSlice.reducer;
