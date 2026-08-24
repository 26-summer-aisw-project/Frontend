import Constants from 'expo-constants';

const DEFAULT_API_BASE_URL = 'http://localhost:8080';

function readExtraApiBaseUrl(): string | undefined {
  const extra = Constants.expoConfig?.extra;
  if (extra && typeof extra === 'object' && 'apiBaseUrl' in extra) {
    const value = (extra as Record<string, unknown>).apiBaseUrl;
    if (typeof value === 'string' && value.length > 0) {
      return value;
    }
  }
  return undefined;
}

function readBooleanEnv(value: string | undefined): boolean {
  if (typeof value !== 'string') {
    return false;
  }

  const normalized = value.trim().toLowerCase();
  return normalized === 'true' || normalized === '1';
}

export const API_BASE_URL: string = (
  process.env.EXPO_PUBLIC_API_BASE_URL ??
  readExtraApiBaseUrl() ??
  DEFAULT_API_BASE_URL
).replace(/\/+$/, '');

export const MOCK_API = readBooleanEnv(process.env.EXPO_PUBLIC_MOCK_API);

export const NAVER_MAP_CLIENT_ID =
  process.env.EXPO_PUBLIC_NAVER_MAP_CLIENT_ID?.trim() ?? '';

export const NAVER_MAP_ENABLED = !MOCK_API && NAVER_MAP_CLIENT_ID.length > 0;

export const API_PREFIX = '/api/v1';

export function buildApiUrl(path: string): string {
  const normalized = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE_URL}${API_PREFIX}${normalized}`;
}
