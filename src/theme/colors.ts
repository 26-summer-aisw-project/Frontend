import { Platform } from 'react-native';

import { useColorScheme } from '@/components/useColorScheme';

const lightColors = {
  page: '#F3F6F4',
  surface: '#FFFFFF',
  surfaceMuted: '#EDF1EF',
  pine100: '#E4F0ED',
  pine500: '#2A756C',
  pine700: '#14403B',
  action: '#1C5B54',
  actionText: '#1C5B54',
  ink: '#21282A',
  ink2: '#54605D',
  muted: '#64726B',
  line: '#E5E9E6',
  lineStrong: '#D8DED9',
  brick: '#B0463B',
  brickBorder: '#B0463B4D',
  heroAccent: '#E7D3AB',
  heroSub: '#CFE2DD',
  heroChrome: '#FFFFFFE0',
  heroTint: '#FFFFFF24',
  heroHairline: '#FFFFFF33',
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
  pine500: '#256B61',
  pine700: '#0B2A26',
  action: '#2A7A6E',
  actionText: '#6FBAAC',
  ink: '#EAF1EE',
  ink2: '#B9C7C2',
  muted: '#8A9993',
  line: '#26312D',
  lineStrong: '#33403B',
  brick: '#E38377',
  brickBorder: '#E3837766',
  heroAccent: '#E7D3AB',
  heroSub: '#BDD6D0',
  heroChrome: '#FFFFFFE0',
  heroTint: '#FFFFFF24',
  heroHairline: '#FFFFFF33',
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
