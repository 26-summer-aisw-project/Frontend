import type { ErrorCode, ErrorDetail, ErrorResponse } from '@/src/types/error';
import type { LoginRequest, SignupRequest, UserResponse } from '@/src/types/auth';
import {
  LOST_REPORT_RADIUS_METERS,
  MAX_WAYPOINT_COUNT,
  MIN_WAYPOINT_COUNT,
  type CreateLostReportRequest,
  type LostReportResponse,
} from '@/src/types/lost-report';
import {
  DEFAULT_RETENTION_DAYS,
  ALLOWED_IMAGE_CONTENT_TYPES,
  MAX_IMAGE_BYTES,
  MAX_IMAGE_COUNT,
  isValidGeoPoint,
  validateStorageFields,
  type CompleteFoundItemDraftRequest,
  type CreateItemFeatureRequest,
  type FinalizeImageRequest,
  type FoundItemImageResponse,
  type FoundItemDraftResponse,
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
const LOST_REPORT_RETENTION_DAYS = 7;

const mockUsers = new Map<string, UserResponse>();

const mockFoundItems = new Map<string, FoundItemResponse>();
const mockFoundDrafts = new Map<
  string,
  FoundItemDraftResponse & { pollCount: number }
>();
const mockLostReports = new Map<string, LostReportResponse>();
const mockFeatures = new Map<string, ItemFeatureResponse[]>();
const mockUploadRequests = new Map<
  string,
  RequestImageUploadRequest & { itemId: string }
>();
let nextFoundItemId = 300;
let nextImageId = 500;
let nextFeatureId = 700;
let nextLostReportId = 900;

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

function formDataValues(body: BodyInit | null | undefined, name: string): unknown[] {
  if (!(body instanceof FormData)) {
    return [];
  }

  if (typeof body.getAll === 'function') {
    return body.getAll(name);
  }

  const parts = (body as FormData & { _parts?: [string, unknown][] })._parts ?? [];
  return parts.filter(([key]) => key === name).map(([, value]) => value);
}

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
    },
  });
}

function emptyResponse(status: number): Response {
  return new Response(null, { status });
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
  const isLostReportPath = normalizedPath.startsWith('/lost-reports');

  if (
    (isFoundItemPath || isCenterPath || isLostReportPath) &&
    !hasValidMockToken(options.headers)
  ) {
    return errorResponse(401, 'UNAUTHENTICATED', '로그인이 필요합니다.');
  }

  if (method === 'POST' && normalizedPath === '/lost-reports') {
    const request = parseJsonBody<CreateLostReportRequest>(options.body);
    const details: ErrorDetail[] = [];
    const waypoints = Array.isArray(request?.waypoints) ? request.waypoints : [];

    if (!request || normalizeString(request.category).length === 0) {
      details.push({ field: 'category', reason: 'Required.' });
    }
    if (!request || normalizeString(request.description).length === 0) {
      details.push({ field: 'description', reason: 'Required.' });
    }
    if (!request || Number.isNaN(Date.parse(request.lostAtFrom))) {
      details.push({ field: 'lostAtFrom', reason: 'Must be RFC 3339.' });
    }
    if (!request || Number.isNaN(Date.parse(request.lostAtTo))) {
      details.push({ field: 'lostAtTo', reason: 'Must be RFC 3339.' });
    }
    if (
      request &&
      !Number.isNaN(Date.parse(request.lostAtFrom)) &&
      !Number.isNaN(Date.parse(request.lostAtTo)) &&
      Date.parse(request.lostAtFrom) > Date.parse(request.lostAtTo)
    ) {
      details.push({ field: 'lostAtFrom', reason: 'Must not be later than lostAtTo.' });
    }
    if (!request || request.searchRadiusMeters !== LOST_REPORT_RADIUS_METERS) {
      details.push({
        field: 'searchRadiusMeters',
        reason: `Must be ${LOST_REPORT_RADIUS_METERS}.`,
      });
    }
    if (
      !request ||
      waypoints.length < MIN_WAYPOINT_COUNT ||
      waypoints.length > MAX_WAYPOINT_COUNT
    ) {
      details.push({
        field: 'waypoints',
        reason: `Must contain ${MIN_WAYPOINT_COUNT} to ${MAX_WAYPOINT_COUNT} waypoints.`,
      });
    } else {
      waypoints.forEach((waypoint, index) => {
        if (waypoint.ordinal !== index + 1 || !isValidGeoPoint(waypoint.point)) {
          details.push({ field: `waypoints[${index}]`, reason: 'Invalid waypoint.' });
        }
        if ('placeName' in waypoint) {
          details.push({ field: `waypoints[${index}].placeName`, reason: 'Not writable.' });
        }
      });
    }

    if (!request || details.length > 0) {
      return errorResponse(422, 'VALIDATION_ERROR', '입력값을 확인해 주세요.', details);
    }

    nextLostReportId += 1;
    const timestamp = nowIso();
    const report: LostReportResponse = {
      ...request,
      id: String(nextLostReportId),
      reporterId: MOCK_USER_ID,
      status: 'OPEN',
      expiredAt: isoAfterDays(new Date(timestamp), LOST_REPORT_RETENTION_DAYS),
      lastMatchedAt: timestamp,
      candidatesStale: false,
      resolvedCandidateId: null,
      resolvedAt: null,
      createdAt: timestamp,
      updatedAt: timestamp,
    };
    mockLostReports.set(report.id, report);
    return jsonResponse(201, report);
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

  if (method === 'POST' && normalizedPath === '/found-items/drafts') {
    const images = formDataValues(options.body, 'images');
    const totalImageCount = Number(formDataValues(options.body, 'totalImageCount')[0]);
    const details: ErrorDetail[] = [];

    if (
      !Number.isInteger(totalImageCount) ||
      totalImageCount < 1 ||
      totalImageCount > MAX_IMAGE_COUNT
    ) {
      details.push({ field: 'totalImageCount', reason: `Must be between 1 and ${MAX_IMAGE_COUNT}.` });
    }
    if (images.length !== totalImageCount) {
      details.push({ field: 'images', reason: 'Must match totalImageCount.' });
    }
    if (details.length > 0) {
      return errorResponse(422, 'VALIDATION_ERROR', '입력값을 확인해 주세요.', details);
    }

    nextFoundItemId += 1;
    const draft: FoundItemDraftResponse & { pollCount: number } = {
      id: String(nextFoundItemId),
      status: 'DRAFT',
      uploadedImageCount: images.length,
      expectedImageCount: totalImageCount,
      visionStatus: 'PENDING',
      draftExpiresAt: new Date(Date.now() + 60 * 60 * 1000)
        .toISOString()
        .replace(/\.\d{3}Z$/, 'Z'),
      pollCount: 0,
    };
    mockFoundDrafts.set(draft.id, draft);
    const { pollCount: _, ...response } = draft;
    return jsonResponse(201, response);
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

  const draftDetailMatch = method === 'GET' ? matchPath('/found-items/*', normalizedPath) : null;
  if (draftDetailMatch) {
    const draft = mockFoundDrafts.get(draftDetailMatch[0]);
    if (draft) {
      const isReady = draft.pollCount > 0;
      const nextDraft: FoundItemDraftResponse & { pollCount: number } = {
        ...draft,
        pollCount: draft.pollCount + 1,
        visionStatus: isReady ? 'READY' : 'PENDING',
        ...(isReady
          ? {
              visionSuggestion: {
                color: 'BLACK',
                publicDescription: '검은 카드 지갑',
              },
            }
          : {}),
      };
      mockFoundDrafts.set(nextDraft.id, nextDraft);
      return jsonResponse(200, {
        id: nextDraft.id,
        status: nextDraft.status,
        visionStatus: nextDraft.visionStatus,
        visionSuggestion: nextDraft.visionSuggestion,
        draftExpiresAt: nextDraft.draftExpiresAt,
      } satisfies FoundItemDraftResponse);
    }
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

  const confirmHandoverMatch =
    method === 'POST'
      ? normalizedPath.match(/^\/found-items\/([^/]+):confirm-handover$/)
      : null;
  if (confirmHandoverMatch) {
    const request = parseJsonBody<Record<string, unknown>>(options.body);
    if (!request || Object.keys(request).length > 0) {
      return errorResponse(422, 'VALIDATION_ERROR', '입력값을 확인해 주세요.', [
        { field: 'body', reason: 'Must be an empty JSON object.' },
      ]);
    }

    const item = mockFoundItems.get(confirmHandoverMatch[1]);
    if (!item) {
      return errorResponse(404, 'NOT_FOUND', '요청한 정보를 찾을 수 없습니다.');
    }
    const center = MOCK_LOST_CENTERS.find((value) => value.id === item.centerId);
    if (item.storageMethod !== 'HANDED_TO_CENTER' || !center?.isActive) {
      return errorResponse(
        422,
        'INVALID_STATE_TRANSITION',
        '현재 상태에서는 변경할 수 없습니다.',
      );
    }
    if (item.handedAt) {
      return emptyResponse(204);
    }

    const handedAt = nowIso();
    mockFoundItems.set(item.id, {
      ...item,
      handedAt,
      expiredAt: isoAfterDays(
        new Date(handedAt),
        center.retentionDays ?? DEFAULT_RETENTION_DAYS,
      ),
      updatedAt: handedAt,
    });
    return emptyResponse(204);
  }

  const updateItemMatch =
    method === 'PATCH' ? matchPath('/found-items/*', normalizedPath) : null;
  if (updateItemMatch) {
    const draft = mockFoundDrafts.get(updateItemMatch[0]);
    if (draft) {
      const request = parseJsonBody<CompleteFoundItemDraftRequest>(options.body);
      const details: ErrorDetail[] = [];

      if (!request || normalizeString(request.category).length === 0) {
        details.push({ field: 'category', reason: 'Required.' });
      }
      if (!request?.foundAt || !Number.isFinite(Date.parse(request.foundAt))) {
        details.push({ field: 'foundAt', reason: 'Required.' });
      } else if (Date.parse(request.foundAt) > Date.now()) {
        details.push({ field: 'foundAt', reason: 'Must not be in the future.' });
      }
      if (!request || !isValidGeoPoint(request.foundLocation)) {
        details.push({ field: 'foundLocation', reason: 'Required.' });
      }
      if (!request || normalizeString(request.confirmedFeatures?.color).length === 0) {
        details.push({ field: 'confirmedFeatures', reason: 'Color is required.' });
      }
      if (!request || normalizeString(request.confirmedFeatures?.publicDescription).length === 0) {
        details.push({ field: 'confirmedFeatures', reason: 'Public description is required.' });
      }
      if (
        !request ||
        !['LEFT_IN_PLACE', 'MOVED_TO_SAFE_PLACE', 'HANDED_TO_CENTER'].includes(
          request.storageMethod,
        )
      ) {
        details.push({ field: 'storageMethod', reason: 'Required.' });
      }
      if (request) {
        for (const [field, reason] of Object.entries(validateStorageFields(request))) {
          details.push({
            field,
            reason: reason === 'REQUIRED' ? 'Required.' : 'Not allowed for this storage method.',
          });
        }
        const serverManagedFields = [
          'handedAt',
          'expiredAt',
          'expectedImageCount',
          'uploadedImageCount',
          'visionStatus',
          'status',
          'draftExpiresAt',
        ];
        if (serverManagedFields.some((field) => field in request)) {
          details.push({ field: 'body', reason: 'Contains server-managed fields.' });
        }
        if (request.storageMethod === 'HANDED_TO_CENTER') {
          const center = MOCK_LOST_CENTERS.find((value) => value.id === request.centerId);
          if (!center?.isActive) {
            details.push({ field: 'centerId', reason: 'Must reference an active center.' });
          }
        }
      }
      if (draft.visionStatus !== 'READY') {
        return errorResponse(
          422,
          'INVALID_STATE_TRANSITION',
          '현재 상태에서는 변경할 수 없습니다.',
        );
      }
      if (!request || details.length > 0) {
        return errorResponse(422, 'VALIDATION_ERROR', '입력값을 확인해 주세요.', details);
      }

      const timestamp = nowIso();
      const item: FoundItemResponse = {
        id: draft.id,
        finderId: MOCK_USER_ID,
        category: normalizeString(request.category),
        foundAt: request.foundAt,
        location: request.foundLocation,
        storageMethod: request.storageMethod,
        storageDesc: normalizeString(request.storageDesc) || null,
        centerId: request.centerId ?? null,
        handedAt: null,
        expectedImageCount: draft.expectedImageCount ?? draft.uploadedImageCount ?? 1,
        status: 'PROCESSING',
        expiredAt: isoAfterDays(new Date(request.foundAt), DEFAULT_RETENTION_DAYS),
        returnSource: null,
        createdAt: timestamp,
        updatedAt: timestamp,
      };
      mockFoundDrafts.delete(draft.id);
      mockFoundItems.set(item.id, item);

      const featureValues = [
        ['COLOR', request.confirmedFeatures.color],
        ['PUBLIC_DESCRIPTION', request.confirmedFeatures.publicDescription],
      ] as const;
      const features = featureValues.map(([kind, value], ordinal): ItemFeatureResponse => {
        nextFeatureId += 1;
        return {
          id: String(nextFeatureId),
          itemId: item.id,
          kind,
          value,
          source: 'FINDER',
          visibility: 'CANDIDATE_VIEW',
          ordinal,
          createdAt: timestamp,
          updatedAt: timestamp,
        };
      });
      mockFeatures.set(item.id, features);
      return jsonResponse(200, item);
    }

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

    const serverManagedFields = [
      'handedAt',
      'expiredAt',
      'expectedImageCount',
      'uploadedImageCount',
      'visionStatus',
      'status',
    ];
    if (serverManagedFields.some((field) => field in request)) {
      return errorResponse(422, 'VALIDATION_ERROR', '입력값을 확인해 주세요.', [
        { field: 'body', reason: 'Contains server-managed fields.' },
      ]);
    }

    if (
      item.handedAt &&
      (('centerId' in request && request.centerId !== item.centerId) ||
        ('storageMethod' in request && request.storageMethod !== item.storageMethod))
    ) {
      return errorResponse(
        422,
        'INVALID_STATE_TRANSITION',
        '현재 상태에서는 변경할 수 없습니다.',
      );
    }

    const currentFeatures = mockFeatures.get(item.id) ?? [];
    const currentColor = currentFeatures.find((feature) => feature.kind === 'COLOR')?.value ?? '';
    const currentDescription =
      currentFeatures.find((feature) => feature.kind === 'PUBLIC_DESCRIPTION')?.value ?? '';
    const candidate = {
      category: 'category' in request ? normalizeString(request.category) : item.category,
      foundAt: request.foundAt ?? item.foundAt,
      foundLocation: request.foundLocation ?? item.location,
      confirmedFeatures: request.confirmedFeatures ?? {
        color: currentColor,
        publicDescription: currentDescription,
      },
      storageMethod: request.storageMethod ?? item.storageMethod,
      storageDesc: 'storageDesc' in request ? request.storageDesc : item.storageDesc,
      centerId: 'centerId' in request ? request.centerId : item.centerId,
    };
    const details: ErrorDetail[] = [];
    if (candidate.category.length === 0) {
      details.push({ field: 'category', reason: 'Required.' });
    }
    if (!Number.isFinite(Date.parse(candidate.foundAt))) {
      details.push({ field: 'foundAt', reason: 'Required.' });
    } else if (Date.parse(candidate.foundAt) > Date.now()) {
      details.push({ field: 'foundAt', reason: 'Must not be in the future.' });
    } else if (item.handedAt && Date.parse(candidate.foundAt) > Date.parse(item.handedAt)) {
      details.push({ field: 'foundAt', reason: 'Must not be after handedAt.' });
    }
    if (!isValidGeoPoint(candidate.foundLocation)) {
      details.push({ field: 'foundLocation', reason: 'Required.' });
    }
    if (normalizeString(candidate.confirmedFeatures?.color).length === 0) {
      details.push({ field: 'confirmedFeatures', reason: 'Color is required.' });
    }
    if (normalizeString(candidate.confirmedFeatures?.publicDescription).length === 0) {
      details.push({ field: 'confirmedFeatures', reason: 'Public description is required.' });
    }
    if (
      !['LEFT_IN_PLACE', 'MOVED_TO_SAFE_PLACE', 'HANDED_TO_CENTER'].includes(
        candidate.storageMethod,
      )
    ) {
      details.push({ field: 'storageMethod', reason: 'Required.' });
    }
    for (const [field, reason] of Object.entries(validateStorageFields(candidate))) {
      details.push({
        field,
        reason: reason === 'REQUIRED' ? 'Required.' : 'Not allowed for this storage method.',
      });
    }
    if (candidate.storageMethod === 'HANDED_TO_CENTER') {
      const center = MOCK_LOST_CENTERS.find((value) => value.id === candidate.centerId);
      if (!center?.isActive) {
        details.push({ field: 'centerId', reason: 'Must reference an active center.' });
      }
    }
    if (details.length > 0) {
      return errorResponse(422, 'VALIDATION_ERROR', '입력값을 확인해 주세요.', details);
    }

    const timestamp = nowIso();
    const updated: FoundItemResponse = {
      ...item,
      category: candidate.category,
      foundAt: candidate.foundAt,
      location: candidate.foundLocation,
      storageMethod: candidate.storageMethod,
      storageDesc: candidate.storageDesc ?? null,
      centerId: candidate.centerId ?? null,
      expiredAt: item.handedAt
        ? item.expiredAt
        : isoAfterDays(new Date(candidate.foundAt), DEFAULT_RETENTION_DAYS),
      updatedAt: timestamp,
    };
    mockFoundItems.set(updated.id, updated);

    if (request.confirmedFeatures) {
      const replacedKinds = new Set(['COLOR', 'PUBLIC_DESCRIPTION']);
      const retainedFeatures = currentFeatures.filter((feature) => !replacedKinds.has(feature.kind));
      const confirmedValues = [
        ['COLOR', request.confirmedFeatures.color],
        ['PUBLIC_DESCRIPTION', request.confirmedFeatures.publicDescription],
      ] as const;
      const confirmedFeatures = confirmedValues.map(([kind, value], ordinal) => {
        const existing = currentFeatures.find((feature) => feature.kind === kind);
        if (!existing) {
          nextFeatureId += 1;
        }
        return {
          id: existing?.id ?? String(nextFeatureId),
          itemId: item.id,
          kind,
          value,
          source: 'FINDER' as const,
          visibility: 'CANDIDATE_VIEW' as const,
          ordinal,
          createdAt: existing?.createdAt ?? timestamp,
          updatedAt: timestamp,
        };
      });
      mockFeatures.set(item.id, [...retainedFeatures, ...confirmedFeatures]);
    }
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
