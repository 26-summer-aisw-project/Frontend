import { NaverRegisterLocationMap } from '@/components/naver-register-location-map';
import type { RegisterLocationMapProps } from '@/components/register-location-map.types';
import { MapPreview } from '@/components/register-ui';
import { NAVER_MAP_ENABLED } from '@/src/config/env';
import type { GeoPoint } from '@/src/types/found-item';

const DEFAULT_MAP_CENTER: GeoPoint = { latitude: 37.4963, longitude: 126.9572 };

export type {
  RegisterLocationMapProps,
  RegisterMapMarker,
} from '@/components/register-location-map.types';

export function RegisterLocationMap(props: RegisterLocationMapProps) {
  if (!NAVER_MAP_ENABLED) {
    return <MapPreview height={props.height} markers={props.markers.length} />;
  }

  return (
    <NaverRegisterLocationMap
      {...props}
      center={props.center ?? DEFAULT_MAP_CENTER}
    />
  );
}
