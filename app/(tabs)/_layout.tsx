import { Redirect, Stack } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { getAccessToken } from '@/src/lib/auth-token';
import { useAppColors } from '@/src/theme/colors';

export const unstable_settings = {
  initialRouteName: 'home',
};

export default function AuthenticatedLayout() {
  const colors = useAppColors();
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
      <View style={[styles.checking, { backgroundColor: colors.page }]}>
        <ActivityIndicator color={colors.action} />
      </View>
    );
  }

  if (!hasToken) {
    return <Redirect href="/login" />;
  }

  return (
    <Stack initialRouteName="home" screenOptions={{ headerShown: false }}>
      <Stack.Screen name="home" />
      <Stack.Screen name="register" />
      <Stack.Screen name="report" />
      <Stack.Screen name="mypage" />
    </Stack>
  );
}

const styles = StyleSheet.create({
  checking: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
