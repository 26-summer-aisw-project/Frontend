/**
 * 루트 레이아웃.
 *
 * `(auth)`(비로그인)와 `(tabs)`(로그인 후)를 한 Stack에 등록한다.
 * 실제 분기는 `app/index.tsx`가 저장된 토큰을 확인해 리다이렉트하는 방식이다.
 */
import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { useColorScheme } from '@/components/useColorScheme';

export {
  // 네비게이션 트리에서 발생한 에러를 잡는다.
  ErrorBoundary,
} from 'expo-router';

export const unstable_settings = {
  initialRouteName: 'index',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <StatusBar style="auto" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
      </Stack>
    </ThemeProvider>
  );
}
