import type { GeoPoint } from '@/src/types/found-item';

export type LostLocationMapProps = {
  center: GeoPoint;
  pins: GeoPoint[];
  onTap: (point: GeoPoint) => void;
};
