import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { API_URL } from '@/lib/config';

// Real-API axios client (used when USE_MOCKS is false). Auth + base URL mirror the
// web app's useAxios; 401-refresh is ported here when the backend is wired.
export const apiClient = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

export const ACCESS_TOKEN_KEY = 'scoup_access_token';

apiClient.interceptors.request.use(async (config) => {
  try {
    const token = await SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
    if (token) config.headers.Authorization = `Bearer ${token}`;
  } catch {
    // SecureStore unavailable (e.g. web) — fall through unauthenticated.
  }
  return config;
});
