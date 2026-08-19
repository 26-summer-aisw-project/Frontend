import type { ErrorCode } from './error';

export type UserRole = 'USER' | 'ADMIN';
export type UserStatus = 'ACTIVE' | 'BLOCKED' | 'DELETED';

export interface AuthRequest {
  email: string;
  password: string;
}

export type LoginRequest = AuthRequest;
export interface SignupRequest extends AuthRequest {
  displayName: string;
}

/** bigint ID는 JSON 숫자가 아닌 10진 문자열로 전달된다. */
export interface UserResponse {
  id: string;
  email: string;
  displayName: string;
  roles: UserRole[];
  status: UserStatus;
  createdAt: string;
  updatedAt: string;
}

export interface LoginResponse {
  accessToken: string;
  tokenType: 'Bearer';
  expiresAt: string;
  user: UserResponse;
}

export type SignupResponse = UserResponse;

/** 이번 Phase에서는 호출하지 않지만 변경된 사용자 관리 계약을 타입으로 보존한다. */
export interface UpdateMeRequest {
  displayName?: string;
  email?: string;
  password?: string;
}

export type UpdateMeResponse = UserResponse;
export type DeleteMeResponse = void;

export type SignupErrorCode = Extract<
  ErrorCode,
  'VALIDATION_ERROR' | 'EMAIL_ALREADY_EXISTS'
>;
export type LoginErrorCode = Extract<
  ErrorCode,
  'VALIDATION_ERROR' | 'INVALID_CREDENTIALS'
>;

export const PASSWORD_MIN_BYTES = 8;
export const PASSWORD_MAX_BYTES = 72;
export const EMAIL_MAX_LENGTH = 254;
export const DISPLAY_NAME_MAX_LENGTH = 100;

/** Java/Spring의 UTF-8 바이트 길이 검증과 같은 기준으로 계산한다. */
export function utf8ByteLength(value: string): number {
  let bytes = 0;

  for (let index = 0; index < value.length; index += 1) {
    const code = value.charCodeAt(index);

    if (code < 0x80) {
      bytes += 1;
    } else if (code < 0x800) {
      bytes += 2;
    } else if (code >= 0xd800 && code <= 0xdbff) {
      bytes += 4;
      index += 1;
    } else {
      bytes += 3;
    }
  }

  return bytes;
}
