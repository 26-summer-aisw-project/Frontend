/**
 * 액세스 토큰 보관.
 *
 * 백엔드에 리프레시 토큰·로그아웃 엔드포인트가 없고 액세스 토큰 TTL이 15분이라
 * 여기서 하는 일은 저장 / 조회 / 삭제가 전부다. 만료는 재로그인으로 처리한다.
 *
 * SecureStore는 네이티브 전용이다. web에서는 동작하지 않아 no-op으로 두었다
 * (지원 대상은 Android/iOS이고 web은 개발 편의용이다).
 */
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const ACCESS_TOKEN_KEY = 'lostory.accessToken';

const isNative = Platform.OS !== 'web';

export async function getAccessToken(): Promise<string | null> {
  if (!isNative) return null;
  return SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
}

export async function saveAccessToken(token: string): Promise<void> {
  if (!isNative) return;
  await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, token);
}

export async function clearAccessToken(): Promise<void> {
  if (!isNative) return;
  await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY);
}
