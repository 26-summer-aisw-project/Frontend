import type { ErrorCode, ErrorDetail, ErrorResponse } from '@/src/types/error';
import type { LoginRequest, SignupRequest, UserResponse } from '@/src/types/auth';
import {
  DEFAULT_RETENTION_DAYS,
  ALLOWED_IMAGE_CONTENT_TYPES,
  MAX_IMAGE_BYTES,
  MAX_IMAGE_COUNT,
  isValidGeoPoint,
  validateStorageFields,
  type CreateFoundItemRequest,
  type CreateItemFeatureRequest,
  type FinalizeImageRequest,
  type FoundItemImageResponse,
  type FoundItemResponse,
  type ImageUploadGrant,
  type ItemFeatureResponse,
  type LostCenter,
  type RequestImageUploadRequest,
  type UpdateFoundItemRequest,
} from '@/src/types/found-item';

type MockApiRequestOptions = Pick<RequestInit, 'body' | 'headers' | 'method'>;

const MOCK_TOKEN = 'mock-token-xxx';
const MOCK_REQUEST_ID = 'mock-request-id';
const MOCK_USER_ID = '1';
const MOCK_ME_EMAIL = 'test@test.com';
const MOCK_ME_DISPLAY_NAME = '테스트 사용자';
const MOCK_CREATED_AT = '2026-08-18T09:30:00Z';

const mockUsers = new Map<string, UserResponse>();

const mockFoundItems = new Map<string, FoundItemResponse>();
const mockFeatures = new Map<string, ItemFeatureResponse[]>();
const mockUploadRequests = new Map<
  string,
  RequestImageUploadRequest & { itemId: string }
>();
let nextFoundItemId = 300;
let nextImageId = 500;
let nextFeatureId = 700;

const MOCK_LOST_CENTERS: LostCenter[] = [
  {
    id: '1',
    name: '숭실대학교 분실물센터',
    address: '서울특별시 동작구 상도로 369 숭실대학교 학생회관 4층',
    contactPhone: '02-820-0000',
    location: { latitude: 37.4963, longitude: 126.9572 },
    retentionDays: DEFAULT_RETENTION_DAYS,
    isActive: true,
    createdAt: MOCK_CREATED_AT,
    updatedAt: MOCK_CREATED_AT,
  },
  {
    id: '2',
    name: '형남공학관 안내데스크',
    address: '서울특별시 동작구 상도로 369 숭실대학교 형남공학관 1층 로비',
    contactPhone: null,
    location: { latitude: 37.4955, longitude: 126.958 },
    retentionDays: null,
    isActive: true,
    createdAt: MOCK_CREATED_AT,
    updatedAt: MOCK_CREATED_AT,
  },
  {
    id: '3',
    name: '교내 무인 보관함 A',
    address: '서울특별시 동작구 상도로 369 숭실대학교 베어드홀 지하 1층',
    contactPhone: null,
    location: { latitude: 37.497, longitude: 126.9565 },
    retentionDays: null,
    isActive: true,
    createdAt: MOCK_CREATED_AT,
    updatedAt: MOCK_CREATED_AT,
  },
];

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

function stripQuery(path: string): string {
  const queryIndex = path.indexOf('?');
  return queryIndex === -1 ? path : path.slice(0, queryIndex);
}

function matchPath(pattern: string, path: string): string[] | null {
  const patternParts = pattern.split('/');
  const pathParts = path.split('/');

  if (patternParts.length !== pathParts.length) {
    return null;
  }

  const captured: string[] = [];
  for (let index = 0; index < patternParts.length; index += 1) {
    if (patternParts[index] === '*') {
      captured.push(pathParts[index]);
      continue;
    }
    if (patternParts[index] !== pathParts[index]) {
      return null;
    }
  }

  return captured;
}

function isoAfterDays(from: Date, days: number): string {
  const expired = new Date(from.getTime() + days * 24 * 60 * 60 * 1000);
  return expired.toISOString().replace(/\.\d{3}Z$/, 'Z');
}

function nowIso(): string {
  return new Date().toISOString().replace(/\.\d{3}Z$/, 'Z');
}

function validateCreateFoundItem(request: CreateFoundItemRequest | null): ErrorDetail[] {
  if (!request) {
    return [{ field: 'body', reason: 'Required.' }];
  }

  const details: ErrorDetail[] = [];
  if (normalizeString(request.category).length === 0) {
    details.push({ field: 'category', reason: 'Required.' });
  }

  if (!request.foundAt || !Number.isFinite(Date.parse(request.foundAt))) {
    details.push({ field: 'foundAt', reason: 'Required.' });
  } else if (Date.parse(request.foundAt) > Date.now()) {
    details.push({ field: 'foundAt', reason: 'Must not be in the future.' });
  }

  if (!isValidGeoPoint(request.location)) {
    details.push({ field: 'location', reason: 'Required.' });
  }

  if (!['LEFT_IN_PLACE', 'MOVED_TO_SAFE_PLACE', 'HANDED_TO_CENTER'].includes(request.storageMethod)) {
    details.push({ field: 'storageMethod', reason: 'Required.' });
  }

  if (
    typeof request.expectedImageCount !== 'number' ||
    !Number.isInteger(request.expectedImageCount) ||
    request.expectedImageCount < 1 ||
    request.expectedImageCount > MAX_IMAGE_COUNT
  ) {
    details.push({
      field: 'expectedImageCount',
      reason: `Must be between 1 and ${MAX_IMAGE_COUNT}.`,
    });
  }

  for (const [field, reason] of Object.entries(validateStorageFields(request))) {
    details.push({
      field,
      reason: reason === 'REQUIRED' ? 'Required.' : 'Not allowed for this storage method.',
    });
  }

  if (request.storageMethod === 'HANDED_TO_CENTER') {
    if (request.handedAt && request.foundAt) {
      const foundAt = Date.parse(request.foundAt);
      const handedAt = Date.parse(request.handedAt);
      if (!Number.isFinite(handedAt)) {
        details.push({ field: 'handedAt', reason: 'Must be an RFC 3339 timestamp.' });
      } else if (Number.isFinite(foundAt)) {
        if (handedAt < foundAt) {
          details.push({ field: 'handedAt', reason: 'Must not be before foundAt.' });
        } else if (handedAt > Date.now()) {
          details.push({ field: 'handedAt', reason: 'Must not be in the future.' });
        }
      }
    }

    const center = MOCK_LOST_CENTERS.find((candidate) => candidate.id === request.centerId);
    if (!center || !center.isActive) {
      details.push({ field: 'centerId', reason: 'Must reference an active center.' });
    }
  }

  return details;
}

function createFoundItem(request: CreateFoundItemRequest): FoundItemResponse {
  nextFoundItemId += 1;
  const timestamp = nowIso();
  const center = MOCK_LOST_CENTERS.find((candidate) => candidate.id === request.centerId);
  // 만료 기준점은 인계 시각이고, 인계하지 않았으면 습득 시각이다.
  const retentionStart = new Date(request.handedAt ?? request.foundAt ?? timestamp);
  const retentionDays = center?.retentionDays ?? DEFAULT_RETENTION_DAYS;

  const item: FoundItemResponse = {
    id: String(nextFoundItemId),
    finderId: MOCK_USER_ID,
    category: normalizeString(request.category),
    foundAt: request.foundAt,
    location: request.location,
    storageMethod: request.storageMethod,
    storageDesc: normalizeString(request.storageDesc) || null,
    centerId: request.centerId ?? null,
    handedAt: request.handedAt ?? null,
    expectedImageCount: request.expectedImageCount,
    status: 'PROCESSING',
    expiredAt: isoAfterDays(retentionStart, retentionDays),
    returnSource: null,
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  mockFoundItems.set(item.id, item);
  return item;
}

export async function mockApiRequest(
  path: string,
  options: MockApiRequestOptions = {},
): Promise<Response> {
  const method = (options.method ?? 'GET').toUpperCase();
  const normalizedPath = stripQuery(normalizePath(path));

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

  const isFoundItemPath = normalizedPath.startsWith('/found-items');
  const isCenterPath = normalizedPath.startsWith('/lost-centers');

  if ((isFoundItemPath || isCenterPath) && !hasValidMockToken(options.headers)) {
    return errorResponse(401, 'UNAUTHENTICATED', '로그인이 필요합니다.');
  }

  if (method === 'GET' && normalizedPath === '/lost-centers') {
    const query = new URLSearchParams(normalizePath(path).split('?')[1] ?? '');
    const searchTerm = normalizeString(query.get('q')).toLowerCase();
    const page = Math.max(1, Number(query.get('page')) || 1);
    const pageSize = Math.min(100, Math.max(1, Number(query.get('pageSize')) || 20));
    const filtered = MOCK_LOST_CENTERS.filter(
      (center) =>
        center.isActive &&
        (!searchTerm ||
          center.name.toLowerCase().includes(searchTerm) ||
          center.address.toLowerCase().includes(searchTerm)),
    );
    const centers = filtered.slice((page - 1) * pageSize, page * pageSize);

    return jsonResponse(200, {
      data: centers,
      meta: {
        page,
        pageSize,
        totalItems: filtered.length,
        totalPages: Math.max(1, Math.ceil(filtered.length / pageSize)),
      },
    });
  }

  const centerMatch = method === 'GET' ? matchPath('/lost-centers/*', normalizedPath) : null;
  if (centerMatch) {
    const center = MOCK_LOST_CENTERS.find((candidate) => candidate.id === centerMatch[0]);
    return center
      ? jsonResponse(200, center)
      : errorResponse(404, 'NOT_FOUND', '요청한 정보를 찾을 수 없습니다.');
  }

  if (method === 'POST' && normalizedPath === '/found-items') {
    const request = parseJsonBody<CreateFoundItemRequest>(options.body);
    const details = validateCreateFoundItem(request);

    if (details.length > 0 || !request) {
      return errorResponse(422, 'VALIDATION_ERROR', '입력값을 확인해 주세요.', details);
    }

    const item = createFoundItem(request);
    return jsonResponse(201, item);
  }

  if (method === 'GET' && normalizedPath === '/found-items') {
    const items = [...mockFoundItems.values()].reverse();
    return jsonResponse(200, {
      data: items,
      meta: {
        page: 1,
        pageSize: 20,
        totalItems: items.length,
        totalPages: Math.max(1, Math.ceil(items.length / 20)),
      },
    });
  }

  const uploadRequestMatch =
    method === 'POST' ? matchPath('/found-items/*/image-upload-requests', normalizedPath) : null;
  if (uploadRequestMatch) {
    const itemId = uploadRequestMatch[0];
    if (!mockFoundItems.has(itemId)) {
      return errorResponse(404, 'NOT_FOUND', '요청한 정보를 찾을 수 없습니다.');
    }

    const request = parseJsonBody<RequestImageUploadRequest>(options.body);
    const details: ErrorDetail[] = [];
    if (
      !request ||
      !(ALLOWED_IMAGE_CONTENT_TYPES as readonly string[]).includes(request.contentType)
    ) {
      details.push({ field: 'contentType', reason: 'Unsupported content type.' });
    }
    if (
      !request ||
      !Number.isInteger(request.byteSize) ||
      request.byteSize < 1 ||
      request.byteSize > MAX_IMAGE_BYTES
    ) {
      details.push({ field: 'byteSize', reason: `Must be between 1 and ${MAX_IMAGE_BYTES}.` });
    }
    if (!request || !/^[0-9a-f]{64}$/.test(request.sha256)) {
      details.push({ field: 'sha256', reason: 'Must be a SHA-256 hex digest.' });
    }
    const sortOrder = request?.sortOrder;
    if (
      sortOrder !== undefined &&
      (!Number.isInteger(sortOrder) || sortOrder < 0 || sortOrder >= MAX_IMAGE_COUNT)
    ) {
      details.push({ field: 'sortOrder', reason: `Must be between 0 and ${MAX_IMAGE_COUNT - 1}.` });
    }
    if (!request || details.length > 0) {
      return errorResponse(422, 'VALIDATION_ERROR', '입력값을 확인해 주세요.', details);
    }

    const uploadToken = `mock-upload-token-${itemId}-${request.sortOrder ?? 0}-${Date.now()}`;
    mockUploadRequests.set(uploadToken, { ...request, itemId });
    const grant: ImageUploadGrant = {
      uploadToken,
      uploadUrl: 'https://mock.lostory.local/upload',
      method: 'PUT',
      requiredHeaders: { 'Content-Type': request.contentType },
      expiresAt: new Date(Date.now() + 5 * 60 * 1000).toISOString().replace(/\.\d{3}Z$/, 'Z'),
      maxByteSize: MAX_IMAGE_BYTES,
    };
    return jsonResponse(201, grant);
  }

  const imagesMatch =
    method === 'POST' ? matchPath('/found-items/*/images', normalizedPath) : null;
  if (imagesMatch) {
    const itemId = imagesMatch[0];
    if (!mockFoundItems.has(itemId)) {
      return errorResponse(404, 'NOT_FOUND', '요청한 정보를 찾을 수 없습니다.');
    }

    const request = parseJsonBody<FinalizeImageRequest>(options.body);
    const uploadToken = request?.uploadToken;
    const upload = uploadToken ? mockUploadRequests.get(uploadToken) : undefined;
    if (!uploadToken || !upload || upload.itemId !== itemId) {
      return errorResponse(422, 'VALIDATION_ERROR', '입력값을 확인해 주세요.', [
        { field: 'uploadToken', reason: 'Invalid or expired upload token.' },
      ]);
    }

    nextImageId += 1;
    const image: FoundItemImageResponse = {
      id: String(nextImageId),
      itemId,
      contentType: upload.contentType,
      byteSize: upload.byteSize,
      sha256: upload.sha256,
      sortOrder: upload.sortOrder ?? 0,
      thumbnailStatus: 'PENDING',
      originalUrl: `https://mock.lostory.local/original/${nextImageId}`,
      urlExpiresAt: new Date(Date.now() + 10 * 60 * 1000)
        .toISOString()
        .replace(/\.\d{3}Z$/, 'Z'),
      createdAt: nowIso(),
    };
    mockUploadRequests.delete(uploadToken);
    return jsonResponse(201, image);
  }

  const featuresMatch =
    method === 'POST' ? matchPath('/found-items/*/features', normalizedPath) : null;
  if (featuresMatch) {
    const itemId = featuresMatch[0];
    if (!mockFoundItems.has(itemId)) {
      return errorResponse(404, 'NOT_FOUND', '요청한 정보를 찾을 수 없습니다.');
    }

    const request = parseJsonBody<CreateItemFeatureRequest>(options.body);
    const details: ErrorDetail[] = [];
    if (!request || normalizeString(request.kind).length === 0) {
      details.push({ field: 'kind', reason: 'Required.' });
    }
    if (!request || normalizeString(request.value).length === 0) {
      details.push({ field: 'value', reason: 'Required.' });
    }
    if (!request || !['CANDIDATE_VIEW', 'MATCH_ONLY'].includes(request.visibility)) {
      details.push({ field: 'visibility', reason: 'Required.' });
    }
    if (request && ('source' in request || 'confidence' in request)) {
      details.push({ field: 'source', reason: 'Not writable.' });
    }
    if (
      request?.ordinal !== undefined &&
      (!Number.isInteger(request.ordinal) || request.ordinal < 0)
    ) {
      details.push({ field: 'ordinal', reason: 'Must be zero or greater.' });
    }
    if (!request || details.length > 0) {
      return errorResponse(422, 'VALIDATION_ERROR', '입력값을 확인해 주세요.', details);
    }

    nextFeatureId += 1;
    const timestamp = nowIso();
    const feature: ItemFeatureResponse = {
      id: String(nextFeatureId),
      itemId,
      kind: normalizeString(request.kind),
      value: normalizeString(request.value),
      source: 'FINDER',
      visibility: request.visibility,
      ordinal: request.ordinal ?? 0,
      createdAt: timestamp,
      updatedAt: timestamp,
    };
    mockFeatures.set(itemId, [...(mockFeatures.get(itemId) ?? []), feature]);
    return jsonResponse(201, feature);
  }

  const updateItemMatch =
    method === 'PATCH' ? matchPath('/found-items/*', normalizedPath) : null;
  if (updateItemMatch) {
    const item = mockFoundItems.get(updateItemMatch[0]);
    if (!item) {
      return errorResponse(404, 'NOT_FOUND', '요청한 정보를 찾을 수 없습니다.');
    }

    const request = parseJsonBody<UpdateFoundItemRequest>(options.body);
    if (!request || Object.keys(request).length === 0) {
      return errorResponse(422, 'VALIDATION_ERROR', '입력값을 확인해 주세요.', [
        { field: 'body', reason: 'At least one field is required.' },
      ]);
    }

    if (
      item.storageMethod === 'HANDED_TO_CENTER' &&
      (('centerId' in request && request.centerId !== item.centerId) ||
        ('handedAt' in request && request.handedAt !== item.handedAt))
    ) {
      return errorResponse(
        422,
        'INVALID_STATE_TRANSITION',
        '현재 상태에서는 변경할 수 없습니다.',
      );
    }

    const candidate: CreateFoundItemRequest = {
      category: request.category ?? item.category,
      foundAt: request.foundAt ?? item.foundAt,
      location: request.location ?? item.location,
      storageMethod: request.storageMethod ?? item.storageMethod,
      storageDesc: 'storageDesc' in request ? request.storageDesc : item.storageDesc,
      centerId: 'centerId' in request ? request.centerId : item.centerId,
      handedAt: 'handedAt' in request ? request.handedAt : item.handedAt,
      expectedImageCount: request.expectedImageCount ?? item.expectedImageCount,
    };
    const details = validateCreateFoundItem(candidate);
    if (details.length > 0) {
      return errorResponse(422, 'VALIDATION_ERROR', '입력값을 확인해 주세요.', details);
    }

    const center = MOCK_LOST_CENTERS.find((value) => value.id === candidate.centerId);
    const retentionStart = new Date(candidate.handedAt ?? candidate.foundAt);
    const updated: FoundItemResponse = {
      ...item,
      ...candidate,
      storageDesc: candidate.storageDesc ?? null,
      centerId: candidate.centerId ?? null,
      handedAt: candidate.handedAt ?? null,
      expiredAt:
        candidate.storageMethod === 'HANDED_TO_CENTER'
          ? isoAfterDays(retentionStart, center?.retentionDays ?? DEFAULT_RETENTION_DAYS)
          : item.expiredAt,
      updatedAt: nowIso(),
    };
    mockFoundItems.set(updated.id, updated);
    return jsonResponse(200, updated);
  }

  const itemMatch = method === 'GET' ? matchPath('/found-items/*', normalizedPath) : null;
  if (itemMatch) {
    const item = mockFoundItems.get(itemMatch[0]);
    if (!item) {
      // 타인 소유 리소스도 존재를 숨기기 위해 404로 답한다.
      return errorResponse(404, 'NOT_FOUND', '요청한 정보를 찾을 수 없습니다.');
    }
    return jsonResponse(200, item);
  }

  return errorResponse(404, 'NOT_FOUND', '요청한 정보를 찾을 수 없습니다.');
}
