/**
 * 비로그인 그룹.
 *
 * 로그인과 회원가입만 있고, 두 화면 사이는 Stack으로 오간다.
 * 헤더는 각 화면이 브랜드 히어로 영역을 직접 그리는 구조라 숨긴다.
 */
import { Stack } from 'expo-router';

export default function AuthLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="login" />
      <Stack.Screen name="signup" />
    </Stack>
  );
}
