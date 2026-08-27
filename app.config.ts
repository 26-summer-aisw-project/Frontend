import type { ConfigContext, ExpoConfig } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => {
  const naverMapClientId = process.env.EXPO_PUBLIC_NAVER_MAP_CLIENT_ID?.trim();
  const plugins: NonNullable<ExpoConfig['plugins']> = [
    ...(config.plugins ?? []),
    [
      'expo-build-properties',
      {
        android: {
          extraMavenRepos: ['https://repository.map.naver.com/archive/maven'],
        },
      },
    ],
  ];

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
