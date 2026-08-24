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
    title: '분실물 찾기',
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
