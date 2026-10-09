import { createApiClient } from '../../core/createApiClient.js';

export const ADMIN_TOKEN_KEY = 'hb_admin_token';
export const ADMIN_USER_KEY = 'hb_admin_user';

export const adminApi = createApiClient(ADMIN_TOKEN_KEY);
