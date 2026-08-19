/**
 * 액세스 토큰 보관.
 *
 * 백엔드에 리프레시 토큰·로그아웃 엔드포인트가 없고 액세스 토큰 TTL이 15분이라
 * 여기서 하는 일은 저장 / 조회 / 삭제가 전부다. 만료는 재로그인으로 처리한다.
 *
 * Android/iOS는 기존처럼 SecureStore를 사용한다. web은 지원 대상이 아니지만
 * Mock 흐름 검증을 위해 메모리 변수에만 토큰을 보관한다. 따라서 새로고침하면
 * 토큰이 사라진다.
 */
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const TOKEN_KEY = 'lostory.accessToken';

// TODO: 웹 정식 지원 시 memoryToken을 httpOnly cookie 또는
// 안전한 웹 스토리지로 교체할 것. 현재는 개발 테스트 전용.
let memoryToken: string | null = null;

export async function getToken(): Promise<string | null> {
  if (Platform.OS === 'web') {
    return memoryToken;
  }

  return SecureStore.getItemAsync(TOKEN_KEY);
}

export async function saveToken(token: string): Promise<void> {
  if (Platform.OS === 'web') {
    memoryToken = token;
    return;
  }

  await SecureStore.setItemAsync(TOKEN_KEY, token);
}

export async function deleteToken(): Promise<void> {
  if (Platform.OS === 'web') {
    memoryToken = null;
    return;
  }

  await SecureStore.deleteItemAsync(TOKEN_KEY);
}

export const getAccessToken = getToken;
export const saveAccessToken = saveToken;
export const clearAccessToken = deleteToken;
