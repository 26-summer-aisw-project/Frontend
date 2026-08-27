import type { LostLocationMapProps } from '@/components/lost-location-map.types';
import { MockLostLocationMap } from '@/components/mock-lost-location-map';
import { NaverLostLocationMap } from '@/components/naver-lost-location-map';
import { NAVER_MAP_ENABLED } from '@/src/config/env';

export type { LostLocationMapProps } from '@/components/lost-location-map.types';

export function LostLocationMap(props: LostLocationMapProps) {
  if (!NAVER_MAP_ENABLED) {
    return <MockLostLocationMap {...props} />;
  }

  return <NaverLostLocationMap {...props} />;
}
