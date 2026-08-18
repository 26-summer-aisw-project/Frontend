import type { ErrorCode, ErrorDetail, ErrorResponse } from '@/src/types/error';
import type { LoginRequest, SignupRequest } from '@/src/types/auth';

type MockApiRequestOptions = Pick<RequestInit, 'body' | 'headers' | 'method'>;

const MOCK_TOKEN = 'mock-token-xxx';
const MOCK_REQUEST_ID = 'mock-request-id';

function normalizePath(path: string): string {
  return path.startsWith('/') ? path : `/${path}`;
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
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

export async function mockApiRequest(
  path: string,
  options: MockApiRequestOptions = {},
): Promise<Response> {
  const method = (options.method ?? 'GET').toUpperCase();
  const normalizedPath = normalizePath(path);

  if (method === 'POST' && normalizedPath === '/auth/signup') {
    const request = parseJsonBody<SignupRequest>(options.body);
    const email = normalizeEmail(request?.email ?? '');

    if (email === 'duplicate@test.com') {
      return errorResponse(
        409,
        'EMAIL_ALREADY_EXISTS',
        '이미 사용 중인 이메일입니다.',
      );
    }

    return jsonResponse(201, {
      id: '1',
      email,
      displayName: null,
      roles: ['USER'],
      status: 'ACTIVE',
    });
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
      user: {
        id: '1',
        email,
        displayName: null,
        roles: ['USER'],
        status: 'ACTIVE',
      },
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
      id: '1',
      email: 'test@test.com',
      displayName: null,
      roles: ['USER'],
      status: 'ACTIVE',
    });
  }

  return errorResponse(404, 'NOT_FOUND', '요청한 정보를 찾을 수 없습니다.');
}
