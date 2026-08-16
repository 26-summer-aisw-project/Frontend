/**
 * 진입점.
 *
 * SecureStore에 저장된 액세스 토큰이 있으면 탭 홈으로, 없으면 로그인으로 보낸다.
 *
 * 지금은 토큰의 "존재"만 확인한다. 만료는 확인하지 않는데, 백엔드에 리프레시
 * 엔드포인트가 없어 어차피 첫 API 호출이 401(`AUTH-003`)로 떨어지면 재로그인시켜야
 * 하기 때문이다. 그 처리는 Phase 1에서 API 클라이언트와 함께 넣는다.
 */
import { Redirect } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { getAccessToken } from '@/src/lib/auth-token';

export default function Index() {
  const [hasToken, setHasToken] = useState<boolean | null>(null);

  useEffect(() => {
    let cancelled = false;
    getAccessToken()
      .then((token) => {
        if (!cancelled) setHasToken(token !== null);
      })
      .catch(() => {
        if (!cancelled) setHasToken(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (hasToken === null) {
    return (
      <View style={styles.container}>
        <ActivityIndicator color="#1C5B54" />
      </View>
    );
  }

  return <Redirect href={hasToken ? '/home' : '/login'} />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F3F6F4',
  },
});
