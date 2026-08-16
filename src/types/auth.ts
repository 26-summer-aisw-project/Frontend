/**
 * 회원가입 / 로그인 API 타입.
 *
 * 출처: `http://localhost:8080/v3/api-docs` (schemas: AuthRequest, UserResponse, LoginResponse)
 * + Backend `auth/AuthRequest.java`, `auth/AuthService.java`, `auth/PasswordByteLength.java`.
 *
 * OpenAPI 스펙 단독으로는 부정확한 지점이 있어 아래 주석에 표시해 두었다.
 */

import type { ErrorCode } from './error';

/** JWT `roles` 클레임에 허용되는 값. 그 외 값은 토큰 검증 단계에서 거부된다. */
export type UserRole = 'USER' | 'ADMIN';

/**
 * 회원가입·로그인 공통 요청 바디. 두 엔드포인트가 같은 스키마를 쓴다.
 *
 * - `email`: 서버가 `trim().toLowerCase()`로 정규화하므로 클라이언트가 대소문자를 맞출 필요는 없다.
 *   최대 320자, `@Email` 형식 검증.
 * - `password`: **문자 수가 아니라 UTF-8 바이트 수로 8~72바이트**를 요구한다.
 *   OpenAPI 스펙에는 `minLength: 1`로만 나오는데, springdoc이 커스텀 애너테이션
 *   `@PasswordByteLength`를 읽지 못해서 생긴 누락이다. 스펙을 믿고 1자만 검증하면
 *   서버에서 400(COMMON-001)이 떨어진다. `isValidPasswordLength`로 사전 검증할 것.
 */
export interface AuthRequest {
  email: string;
  password: string;
}

/** 사용자 정보. 비밀번호 해시 등 민감 필드는 포함되지 않는다. */
export interface UserResponse {
  id: number;
  email: string;
  /** 서버는 정렬된 문자열 배열로 내려준다. 스펙상 `string[]`이지만 실제 값은 UserRole. */
  roles: UserRole[];
}

/** 로그인 성공 응답. */
export interface LoginResponse {
  accessToken: string;
  /** 항상 `"Bearer"` 고정. */
  tokenType: 'Bearer';
  /** ISO-8601 instant. 기본 TTL 15분이며 리프레시 엔드포인트가 없다. */
  expiresAt: string;
  user: UserResponse;
}

/**
 * `POST /api/v1/auth/signup` — 인증 불필요.
 * 성공: 201 + UserResponse (토큰은 내려오지 않는다. 가입 후 별도 로그인 필요)
 */
export type SignupRequest = AuthRequest;
export type SignupResponse = UserResponse;

/**
 * `POST /api/v1/auth/login` — 인증 불필요.
 * 성공: 200 + LoginResponse
 */
export type LoginRequest = AuthRequest;

/** signup에서 발생 가능한 에러 코드. */
export type SignupErrorCode = Extract<ErrorCode, 'COMMON-001' | 'AUTH-001'>;

/** login에서 발생 가능한 에러 코드. */
export type LoginErrorCode = Extract<ErrorCode, 'COMMON-001' | 'AUTH-002'>;

/** 비밀번호 최소/최대 길이 (UTF-8 바이트 기준). */
export const PASSWORD_MIN_BYTES = 8;
export const PASSWORD_MAX_BYTES = 72;
export const EMAIL_MAX_LENGTH = 320;

/**
 * 문자열의 UTF-8 바이트 길이.
 *
 * `String.length`는 UTF-16 코드 유닛 수라서 서버 검증과 어긋난다.
 * 한글은 글자당 3바이트이므로 "비밀번호12"(10자)는 26바이트다.
 * 반대로 8자 한글이면 24바이트로 통과하지만, 3자 한글(9바이트)도 통과한다는 점에 유의.
 */
export function utf8ByteLength(value: string): number {
  let bytes = 0;
  for (let i = 0; i < value.length; i += 1) {
    const code = value.charCodeAt(i);
    if (code < 0x80) {
      bytes += 1;
    } else if (code < 0x800) {
      bytes += 2;
    } else if (code >= 0xd800 && code <= 0xdbff) {
      // 서로게이트 페어(이모지 등)는 4바이트이고 코드 유닛 2개를 차지한다.
      bytes += 4;
      i += 1;
    } else {
      bytes += 3;
    }
  }
  return bytes;
}

/** 서버의 `@PasswordByteLength` 검증과 동일한 규칙. 폼 제출 전 사용. */
export function isValidPasswordLength(password: string): boolean {
  const bytes = utf8ByteLength(password);
  return bytes >= PASSWORD_MIN_BYTES && bytes <= PASSWORD_MAX_BYTES;
}
