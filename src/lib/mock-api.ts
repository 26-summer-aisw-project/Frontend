import type { ErrorCode, ErrorDetail, ErrorResponse } from '@/src/types/error';
import type { LoginRequest, SignupRequest, UserResponse } from '@/src/types/auth';

type MockApiRequestOptions = Pick<RequestInit, 'body' | 'headers' | 'method'>;

const MOCK_TOKEN = 'mock-token-xxx';
const MOCK_REQUEST_ID = 'mock-request-id';
const MOCK_USER_ID = '1';
const MOCK_ME_EMAIL = 'test@test.com';
const MOCK_ME_DISPLAY_NAME = '테스트 사용자';
const MOCK_CREATED_AT = '2026-08-18T09:30:00Z';

const mockUsers = new Map<string, UserResponse>();

function normalizePath(path: string): string {
  return path.startsWith('/') ? path : `/${path}`;
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function normalizeString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function parseJsonBody<T>(body: BodyInit | null | undefined): T | null {
  if (typeof body !== 'string' || body.length === 0) {
    return null;
  }

  try {
    return JSON.parse(body) as T;
  } catch {
    return null;
  }
}

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
    },
  });
}

function errorResponse(
  status: number,
  code: ErrorCode,
  message: string,
  details: ErrorDetail[] = [],
): Response {
  const body: ErrorResponse = {
    error: {
      code,
      message,
      details,
      requestId: MOCK_REQUEST_ID,
    },
  };

  return jsonResponse(status, body);
}

function hasValidMockToken(headers: HeadersInit | undefined): boolean {
  const authorization = new Headers(headers).get('Authorization');
  return authorization === `Bearer ${MOCK_TOKEN}`;
}

function createMockUser(email: string, displayName: string): UserResponse {
  return {
    id: MOCK_USER_ID,
    email,
    displayName,
    roles: ['USER'],
    status: 'ACTIVE',
    createdAt: MOCK_CREATED_AT,
    updatedAt: MOCK_CREATED_AT,
  };
}

function getMockUser(email: string): UserResponse {
  const normalizedEmail = normalizeEmail(email);
  const existingUser = mockUsers.get(normalizedEmail);

  if (existingUser) {
    return existingUser;
  }

  const fallbackUser = createMockUser(
    normalizedEmail,
    normalizedEmail === MOCK_ME_EMAIL ? MOCK_ME_DISPLAY_NAME : '새 사용자',
  );
  mockUsers.set(normalizedEmail, fallbackUser);
  return fallbackUser;
}

export async function mockApiRequest(
  path: string,
  options: MockApiRequestOptions = {},
): Promise<Response> {
  const method = (options.method ?? 'GET').toUpperCase();
  const normalizedPath = normalizePath(path);

  if (method === 'POST' && normalizedPath === '/auth/signup') {
    const request = parseJsonBody<SignupRequest>(options.body);
    const email = normalizeEmail(request?.email ?? '');
    const displayName = normalizeString(request?.displayName) || MOCK_ME_DISPLAY_NAME;

    if (email === 'duplicate@test.com') {
      return errorResponse(
        409,
        'EMAIL_ALREADY_EXISTS',
        '이미 사용 중인 이메일입니다.',
      );
    }

    const user = createMockUser(email, displayName);
    mockUsers.set(email, user);
    return jsonResponse(201, user);
  }

  if (method === 'POST' && normalizedPath === '/auth/login') {
    const request = parseJsonBody<LoginRequest>(options.body);
    const email = normalizeEmail(request?.email ?? '');

    if (request?.password === 'wrong') {
      return errorResponse(
        401,
        'INVALID_CREDENTIALS',
        '이메일 또는 비밀번호가 올바르지 않습니다.',
      );
    }

    return jsonResponse(200, {
      accessToken: MOCK_TOKEN,
      tokenType: 'Bearer',
      expiresAt: '2099-12-31T23:59:59Z',
      user: getMockUser(email),
    });
  }

  if (method === 'GET' && normalizedPath === '/users/me') {
    if (!hasValidMockToken(options.headers)) {
      return errorResponse(
        401,
        'UNAUTHENTICATED',
        '로그인이 필요합니다.',
      );
    }

    return jsonResponse(200, {
      ...getMockUser(MOCK_ME_EMAIL),
    });
  }

  return errorResponse(404, 'NOT_FOUND', '요청한 정보를 찾을 수 없습니다.');
}
