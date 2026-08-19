/**
 * 백엔드가 응답하는 안정적인 에러 코드. HTTP 상태보다 이 값을 우선한다.
 *
 * `.claude/api-spec-v1.md` §2.3 표 전체를 담는다. 주석의 HTTP 상태는 명세가
 * 규정한 값이며, 분기는 상태가 아니라 코드로 한다.
 */
export type ErrorCode =
  // 400
  | 'INVALID_JSON'
  | 'INVALID_QUERY'
  | 'INVALID_SORT'
  // 401
  | 'UNAUTHENTICATED'
  | 'INVALID_CREDENTIALS'
  // 403
  | 'FORBIDDEN'
  | 'USER_BLOCKED'
  // 404
  | 'NOT_FOUND'
  // 409
  | 'EMAIL_ALREADY_EXISTS'
  | 'UNIQUE_CONFLICT'
  | 'IDEMPOTENCY_CONFLICT'
  // 422
  | 'VALIDATION_ERROR'
  | 'INVALID_STATE_TRANSITION'
  | 'LAST_IMAGE_REQUIRED'
  | 'THUMBNAIL_NOT_READY'
  // 429
  | 'RATE_LIMITED';

/** 입력 필드 단위의 검증 실패 정보. */
export interface ErrorDetail {
  field: string;
  reason: string;
}

/**
 * `details`와 `requestId`는 optional이다.
 *
 * 명세 §2.3은 네 필드를 갖춘 형태 하나만 제시하지만, 필드 에러가 없는 응답이나
 * 시큐리티 필터 단계에서 나가는 401처럼 봉투가 달라질 여지가 있는 경로가 있다.
 * 이 둘을 필수로 두면 그런 응답에서 `code`를 통째로 잃고, 결과적으로
 * `UNAUTHENTICATED` 분기에 도달하지 못해 토큰 삭제와 재로그인이 걸리지 않는다.
 */
export interface ErrorBody {
  code: ErrorCode;
  message: string;
  details?: ErrorDetail[];
  requestId?: string;
}

/** 모든 API 에러는 `error` 객체로 한 번 감싸서 내려온다. */
export interface ErrorResponse {
  error: ErrorBody;
}

/**
 * `code`와 `message`만으로 판정한다.
 *
 * `details`·`requestId`가 없거나 형태가 달라도 에러 응답으로 인정한다. 여기서
 * 엄격하게 굴면 인식 실패가 곧 인증 흐름 중단으로 이어지기 때문이다. 대신
 * 형태가 어긋난 `details`는 `toErrorDetails`가 걸러낸다.
 */
export function isErrorResponse(value: unknown): value is ErrorResponse {
  if (typeof value !== 'object' || value === null || !('error' in value)) {
    return false;
  }

  const error = (value as { error?: unknown }).error;
  if (typeof error !== 'object' || error === null) {
    return false;
  }

  const candidate = error as Partial<ErrorBody>;
  return typeof candidate.code === 'string' && typeof candidate.message === 'string';
}

/** `details`가 없거나 형태가 어긋나면 빈 배열로 정규화한다. */
export function toErrorDetails(value: unknown): ErrorDetail[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter(
    (detail): detail is ErrorDetail =>
      typeof detail === 'object' &&
      detail !== null &&
      typeof (detail as Partial<ErrorDetail>).field === 'string' &&
      typeof (detail as Partial<ErrorDetail>).reason === 'string',
  );
}
