import type { ConfigContext, ExpoConfig } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => {
  const naverMapClientId = process.env.EXPO_PUBLIC_NAVER_MAP_CLIENT_ID?.trim();
  const plugins = [...(config.plugins ?? [])];

  if (naverMapClientId) {
    plugins.push([
      '@mj-studio/react-native-naver-map',
      { client_id: naverMapClientId },
    ]);
  }

  return {
    ...config,
    name: config.name ?? 'LOSTORY',
    slug: config.slug ?? 'lostory',
    plugins,
  };
};
