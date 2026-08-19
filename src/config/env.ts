/**
 * 런타임 설정.
 *
 * API base URL 결정 순서:
 *   1. `EXPO_PUBLIC_API_BASE_URL` 환경변수 (`.env`, CI, 셸)
 *   2. `app.json`의 `expo.extra.apiBaseUrl`
 *   3. 하드코딩 기본값 `http://localhost:8080`
 * Mock API 사용 여부:
 *   - `EXPO_PUBLIC_MOCK_API=true` 이면 실제 fetch 대신 로컬 mock 응답을 쓴다.
 *
 * `EXPO_PUBLIC_` 접두사가 붙은 값은 번들에 그대로 인라인된다.
 * 시크릿을 두면 안 되고, base URL처럼 공개돼도 되는 값만 다룬다.
 */
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

/** 백엔드 API의 origin. 끝의 슬래시는 제거한다. */
export const API_BASE_URL: string = (
  process.env.EXPO_PUBLIC_API_BASE_URL ??
  readExtraApiBaseUrl() ??
  DEFAULT_API_BASE_URL
).replace(/\/+$/, '');

/** `true`면 네트워크 대신 로컬 mock 응답을 사용한다. */
export const MOCK_API = readBooleanEnv(process.env.EXPO_PUBLIC_MOCK_API);

/**
 * 모든 REST 엔드포인트가 공유하는 접두사.
 *
 * `/actuator/health`, `/swagger-ui.html`, `/v3/api-docs`는 이 접두사 밖이라
 * 그쪽을 부를 때는 `API_BASE_URL`을 직접 쓴다.
 */
export const API_PREFIX = '/api/v1';

/** 예: buildApiUrl('/auth/login') -> 'http://localhost:8080/api/v1/auth/login' */
export function buildApiUrl(path: string): string {
  const normalized = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE_URL}${API_PREFIX}${normalized}`;
}
