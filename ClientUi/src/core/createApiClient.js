import axios from 'axios';

// Relative by default: same host the page was opened on (localhost or an IP address)
export const API_URL = import.meta.env.VITE_API_URL || '/api';

/**
 * Factory so the website and admin each get their own axios instance
 * with their own token storage key (they never share a session).
 */
export const createApiClient = (tokenKey) => {
  const client = axios.create({ baseURL: API_URL, timeout: 15000 });

  client.interceptors.request.use((config) => {
    const token = localStorage.getItem(tokenKey);
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  });

  client.interceptors.response.use(
    (response) => response,
    (error) => {
      const isAuthCall = error.config?.url?.includes('/auth/');
      if (error.response?.status === 401 && !isAuthCall) {
        localStorage.removeItem(tokenKey);
        window.dispatchEvent(new CustomEvent('session:expired', { detail: tokenKey }));
      }
      return Promise.reject(error);
    },
  );

  return client;
};

// Field errors ({ details: { field: message } }) are more useful than the generic 'Validation failed'
export const getErrorMessage = (error) =>
  (error?.response?.data?.details && Object.values(error.response.data.details).join('. ')) ||
  error?.response?.data?.message || (error?.code === 'ERR_NETWORK' ? 'Cannot reach the server. Check your connection.' : error?.message) || 'Something went wrong';
