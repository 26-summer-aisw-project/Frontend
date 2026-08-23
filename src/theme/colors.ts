import { Platform } from 'react-native';

import { useColorScheme } from '@/components/useColorScheme';

const lightColors = {
  page: '#F3F6F4',
  surface: '#FFFFFF',
  surfaceMuted: '#EDF1EF',
  pine100: '#E4F0ED',
  pine200: '#C3DBD5',
  pine500: '#2A756C',
  pine700: '#14403B',
  action: '#1C5B54',
  actionText: '#1C5B54',
  onTint: '#14403B',
  ink: '#21282A',
  ink2: '#54605D',
  muted: '#64726B',
  line: '#E5E9E6',
  lineStrong: '#D8DED9',
  brick: '#B0463B',
  brickBorder: '#B0463B4D',
  dangerBg: '#FBEDEB',
  dangerBorder: '#F0CFC9',
  bronze100: '#F6EEDF',
  bronze200: '#E7D3AB',
  bronze700: '#8A5A22',
  mapBase: '#E7EDE8',
  mapGreen: '#D6E3D4',
  mapRoad: '#FFFFFF',
  mapRoadAlt: '#F4F7F4',
  pinHalo: '#1C5B5433',
  markerRing: '#FFFFFF',
  heroAccent: '#E7D3AB',
  heroSub: '#CFE2DD',
  heroChrome: '#FFFFFFE0',
  heroTint: '#FFFFFF24',
  heroTintStrong: '#FFFFFF29',
  heroFaint: '#FFFFFF14',
  heroHairline: '#FFFFFF33',
  heroHairlineSoft: '#FFFFFF3D',
  heroRule: '#FFFFFFB3',
  heroTextMuted: '#FFFFFF99',
  heroTextSoft: '#FFFFFF8C',
  shadow: '#14403B',
} as const;

export type ColorPalette = {
  [Key in keyof typeof lightColors]: string;
};

const darkColors: ColorPalette = {
  page: '#0E1512',
  surface: '#17201D',
  surfaceMuted: '#1E2926',
  pine100: '#12312C',
  pine200: '#1E4A43',
  pine500: '#256B61',
  pine700: '#0B2A26',
  action: '#2A7A6E',
  actionText: '#6FBAAC',
  onTint: '#9FD3C8',
  ink: '#EAF1EE',
  ink2: '#B9C7C2',
  muted: '#8A9993',
  line: '#26312D',
  lineStrong: '#33403B',
  brick: '#E38377',
  brickBorder: '#E3837766',
  dangerBg: '#38201C',
  dangerBorder: '#5A2F28',
  bronze100: '#3A2E18',
  bronze200: '#5C4720',
  bronze700: '#D7A860',
  mapBase: '#16211D',
  mapGreen: '#1B2C24',
  mapRoad: '#232F2A',
  mapRoadAlt: '#1E2925',
  pinHalo: '#7CC0B440',
  markerRing: '#C9DAD5',
  heroAccent: '#E7D3AB',
  heroSub: '#BDD6D0',
  heroChrome: '#FFFFFFE0',
  heroTint: '#FFFFFF24',
  heroTintStrong: '#FFFFFF29',
  heroFaint: '#FFFFFF14',
  heroHairline: '#FFFFFF33',
  heroHairlineSoft: '#FFFFFF3D',
  heroRule: '#FFFFFFB3',
  heroTextMuted: '#FFFFFF99',
  heroTextSoft: '#FFFFFF8C',
  shadow: '#000000',
};

export const appFontFamily = Platform.select({
  android: 'sans-serif',
  ios: 'System',
  default: 'sans-serif',
});

export const brandFontFamily = Platform.select({
  android: 'serif',
  ios: 'Georgia',
  default: 'serif',
});

export function useAppColors(): ColorPalette {
  return useColorScheme() === 'dark' ? darkColors : lightColors;
}
