/**
 * 로그인 후 하단 탭.
 *
 * 탭은 "목적지"만 담는다. 습득물 등록처럼 여러 단계로 이어지는 작업은 탭 안에서
 * Stack으로 이어붙이고, 탭 자체를 액션 버튼처럼 쓰지 않는다.
 *
 * 아이콘은 `expo-symbols`의 `SymbolView`를 쓴다. iOS에서는 SF Symbols,
 * Android에서는 Material Symbols로 각각 매핑되므로 컨트롤은 OS 규범을 따르고
 * 브랜드는 색으로만 표현한다는 원칙(`.claude/PRODUCT.md`)과 맞는다.
 *
 * 홈 화면 파일명은 `index.tsx`가 아니라 `home.tsx`다. `(tabs)`는 경로 세그먼트를
 * 만들지 않아서 `app/index.tsx`와 `app/(tabs)/index.tsx`가 둘 다 `/`로 충돌한다.
 *
 * 이 레이아웃은 보호 영역 가드를 겸한다. 명세상 signup/login을 뺀 모든 경로가
 * 인증을 전제하므로(`.claude/api-spec-v1.md` §3.1), 토큰 없이 `/home`, `/register`,
 * `/report`, `/mypage`에 직접 진입하는 것을 여기서 막는다.
 *
 * `app/index.tsx`에도 토큰 확인이 있지만 역할이 다르다. 그쪽은 앱을 처음 열었을 때
 * 어디로 보낼지 정하는 "진입 분기"이고, 여기는 경로로 직접 들어오는 경우까지 포함해
 * 보호 영역을 지키는 "가드"다. 진입점을 거치지 않는 경로가 있으므로 둘 다 필요하다.
 */
import { Redirect, Tabs } from 'expo-router';
import { SymbolView, type SymbolViewProps } from 'expo-symbols';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { getAccessToken } from '@/src/lib/auth-token';
import { useAppColors } from '@/src/theme/colors';

const ACTIVE = '#1C5B54';
const INACTIVE = '#899490';

type TabDef = {
  name: string;
  title: string;
  symbol: SymbolViewProps['name'];
};

const TABS: TabDef[] = [
  { name: 'home', title: '홈', symbol: { ios: 'house', android: 'home', web: 'home' } },
  {
    name: 'register',
    title: '습득물 등록',
    symbol: { ios: 'camera', android: 'photo_camera', web: 'photo_camera' },
  },
  {
    name: 'report',
    title: '분실 신고',
    symbol: { ios: 'magnifyingglass', android: 'search', web: 'search' },
  },
  {
    name: 'mypage',
    title: '마이페이지',
    symbol: { ios: 'person.crop.circle', android: 'account_circle', web: 'account_circle' },
  },
];

export default function TabsLayout() {
  const colors = useAppColors();
  const [hasToken, setHasToken] = useState<boolean | null>(null);

  useEffect(() => {
    let cancelled = false;
    getAccessToken()
      .then((token) => {
        if (!cancelled) setHasToken(token !== null);
      })
      .catch(() => {
        // 저장소를 읽지 못하면 인증되지 않은 것으로 본다.
        if (!cancelled) setHasToken(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (hasToken === null) {
    return (
      <View style={[styles.checking, { backgroundColor: colors.page }]}>
        <ActivityIndicator color={colors.action} />
      </View>
    );
  }

  if (!hasToken) {
    return <Redirect href="/login" />;
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: ACTIVE,
        tabBarInactiveTintColor: INACTIVE,
      }}>
      {TABS.map(({ name, title, symbol }) => (
        <Tabs.Screen
          key={name}
          name={name}
          options={{
            title,
            tabBarIcon: ({ color }) => <SymbolView name={symbol} tintColor={color} size={26} />,
          }}
        />
      ))}
    </Tabs>
  );
}

const styles = StyleSheet.create({
  checking: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
