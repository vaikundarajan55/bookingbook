import { createApiClient } from '../../core/createApiClient.js';

export const WEB_TOKEN_KEY = 'hb_web_token';
export const WEB_USER_KEY = 'hb_web_user';

export const webApi = createApiClient(WEB_TOKEN_KEY);
