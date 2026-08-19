import { router } from 'expo-router';

import { buildApiUrl, MOCK_API } from '@/src/config/env';
import { clearAccessToken, getAccessToken } from '@/src/lib/auth-token';
import { mockApiRequest } from '@/src/lib/mock-api';
import {
  isErrorResponse,
  toErrorDetails,
  type ErrorCode,
  type ErrorDetail,
} from '@/src/types/error';

const ERROR_MESSAGES: Record<ErrorCode, string> = {
  INVALID_JSON: '요청 형식이 올바르지 않습니다.',
  INVALID_QUERY: '요청 조건이 올바르지 않습니다.',
  INVALID_SORT: '정렬 조건이 올바르지 않습니다.',
  UNAUTHENTICATED: '로그인이 만료되었습니다. 다시 로그인해 주세요.',
  INVALID_CREDENTIALS: '이메일 또는 비밀번호가 올바르지 않습니다.',
  FORBIDDEN: '이 작업을 수행할 권한이 없습니다.',
  USER_BLOCKED: '이용이 제한된 계정입니다.',
  NOT_FOUND: '요청한 정보를 찾을 수 없습니다.',
  EMAIL_ALREADY_EXISTS: '이미 사용 중인 이메일입니다.',
  UNIQUE_CONFLICT: '이미 등록된 정보입니다.',
  IDEMPOTENCY_CONFLICT: '이미 처리된 요청입니다.',
  VALIDATION_ERROR: '입력한 내용을 다시 확인해 주세요.',
  INVALID_STATE_TRANSITION: '현재 상태에서는 이 작업을 진행할 수 없습니다.',
  LAST_IMAGE_REQUIRED: '최소 한 장의 이미지가 필요합니다.',
  THUMBNAIL_NOT_READY: '이미지 처리가 아직 끝나지 않았습니다. 잠시 후 다시 시도해 주세요.',
  RATE_LIMITED: '요청이 너무 많습니다. 잠시 후 다시 시도해 주세요.',
};

const NETWORK_ERROR_MESSAGE = '서버에 연결할 수 없습니다. 네트워크 상태를 확인해 주세요.';
const UNKNOWN_ERROR_MESSAGE = '요청을 처리하지 못했습니다. 잠시 후 다시 시도해 주세요.';

type ClientErrorCode = ErrorCode | 'NETWORK_ERROR' | 'UNKNOWN_ERROR';

export class ApiError extends Error {
  readonly code: ClientErrorCode;
  readonly status: number | null;
  readonly details: ErrorDetail[];
  readonly requestId: string | null;

  constructor(options: {
    code: ClientErrorCode;
    userMessage: string;
    status?: number;
    details?: ErrorDetail[];
    requestId?: string;
  }) {
    super(options.userMessage);
    this.name = 'ApiError';
    this.code = options.code;
    this.status = options.status ?? null;
    this.details = options.details ?? [];
    this.requestId = options.requestId ?? null;
  }
}

export type ApiRequestOptions = Omit<RequestInit, 'body'> & {
  body?: BodyInit | null;
  json?: unknown;
  skipAuth?: boolean;
};

/**
 * 서버가 명세에 없는 코드를 보낼 수 있으므로 폴백을 남긴다.
 * `isErrorResponse`가 `code`의 값까지는 검사하지 않아 실제로 도달 가능한 경로다.
 */
function messageForCode(code: ErrorCode): string {
  return ERROR_MESSAGES[code] ?? UNKNOWN_ERROR_MESSAGE;
}

async function parseJson(response: Response): Promise<unknown> {
  const text = await response.text();
  if (text.length === 0) {
    return undefined;
  }

  try {
    return JSON.parse(text) as unknown;
  } catch {
    return undefined;
  }
}

async function redirectAfterUnauthenticated(): Promise<void> {
  try {
    await clearAccessToken();
  } finally {
    router.replace('/login');
  }
}

/**
 * LOSTORY API 공통 fetch 래퍼.
 *
 * 서버의 `message`는 버리며, 사용자 문구는 안정적인 `error.code`로만 결정한다.
 */
export async function apiRequest<T>(
  path: string,
  options: ApiRequestOptions = {},
): Promise<T> {
  const { body, headers: rawHeaders, json, skipAuth = false, ...requestInit } = options;
  const headers = new Headers(rawHeaders);
  headers.set('Accept', 'application/json');

  if (!skipAuth) {
    const token = await getAccessToken();
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
  }

  let requestBody = body;
  if (json !== undefined) {
    headers.set('Content-Type', 'application/json');
    requestBody = JSON.stringify(json);
  }

  let response: Response;
  if (MOCK_API) {
    response = await mockApiRequest(path, {
      ...requestInit,
      body: requestBody,
      headers,
    });
  } else {
    try {
      response = await fetch(buildApiUrl(path), {
        ...requestInit,
        body: requestBody,
        headers,
      });
    } catch {
      throw new ApiError({
        code: 'NETWORK_ERROR',
        userMessage: NETWORK_ERROR_MESSAGE,
      });
    }
  }

  const payload = await parseJson(response);
  if (response.ok) {
    return payload as T;
  }

  if (!isErrorResponse(payload)) {
    throw new ApiError({
      code: 'UNKNOWN_ERROR',
      userMessage: UNKNOWN_ERROR_MESSAGE,
      status: response.status,
    });
  }

  const { code, details, requestId } = payload.error;
  if (code === 'UNAUTHENTICATED') {
    await redirectAfterUnauthenticated();
  }

  throw new ApiError({
    code,
    userMessage: messageForCode(code),
    status: response.status,
    details: toErrorDetails(details),
    requestId: typeof requestId === 'string' ? requestId : undefined,
  });
}
