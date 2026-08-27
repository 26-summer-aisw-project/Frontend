import type { GeoPoint } from '@/src/types/found-item';

export type RegisterMapMarker = {
  id: string;
  label?: string;
  point: GeoPoint;
  selected?: boolean;
};

export type RegisterLocationMapProps = {
  center: GeoPoint | null;
  height: number;
  markers: RegisterMapMarker[];
  onSelectMarker?: (markerId: string) => void;
};
