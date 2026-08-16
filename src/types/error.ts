/**
 * 백엔드 공통 에러 응답 타입.
 *
 * 주의: `/v3/api-docs`에는 에러 응답이 **전혀 문서화되어 있지 않다**(성공 응답만 존재).
 * 아래 타입은 Backend `common/exception/ErrorCode.java`, `common/response/ErrorResponse.java`,
 * `common/exception/GlobalExceptionHandler.java` 를 직접 읽어 작성했다.
 * OpenAPI 스펙만으로 코드를 생성하면 에러 처리가 통째로 빠지므로 이 파일을 함께 써야 한다.
 */

/** 모든 엔드포인트가 공유하는 에러 코드. */
export type ErrorCode =
  | 'COMMON-001' // 잘못된 요청 (400)
  | 'COMMON-002' // 인증 필요 (401)
  | 'COMMON-003' // 권한 없음 (403)
  | 'COMMON-004' // 리소스 없음 (404)
  | 'COMMON-005' // 서버 오류 (500)
  | 'AUTH-001' // 이메일 중복 (409)
  | 'AUTH-002' // 자격 증명 오류 (401)
  | 'AUTH-003'; // 토큰 무효 (401)

/** 필드 단위 검증 실패 상세. Bean Validation 위반 시에만 채워진다. */
export interface FieldErrorDetail {
  field: string;
  message: string;
}

/**
 * 전 엔드포인트 공통 에러 바디.
 *
 * `fieldErrors`는 항상 배열이며(서버가 `List.of()`로 보장), 검증 실패가 아니면 빈 배열이다.
 */
export interface ErrorResponse {
  code: ErrorCode;
  message: string;
  fieldErrors: FieldErrorDetail[];
  /** ISO-8601 instant. 예: "2026-08-13T04:21:00.123Z" */
  timestamp: string;
}

/**
 * HTTP 상태가 아니라 `code`로 분기하는 편이 안정적이다.
 * 401 하나에 COMMON-002 / AUTH-002 / AUTH-003 세 가지가 몰려 있어
 * 상태 코드만으로는 "로그인 안 함", "비밀번호 틀림", "토큰 만료"를 구분할 수 없다.
 */
export function isErrorResponse(value: unknown): value is ErrorResponse {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  const candidate = value as Partial<ErrorResponse>;
  return (
    typeof candidate.code === 'string' &&
    typeof candidate.message === 'string' &&
    Array.isArray(candidate.fieldErrors)
  );
}
