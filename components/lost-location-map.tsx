import { MockLostLocationMap } from '@/components/mock-lost-location-map';
import type { LostLocationMapProps } from '@/components/lost-location-map.types';

export type { LostLocationMapProps } from '@/components/lost-location-map.types';

export function LostLocationMap(props: LostLocationMapProps) {
  return <MockLostLocationMap {...props} />;
}
