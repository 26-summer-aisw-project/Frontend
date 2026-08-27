import { MapPreview } from '@/components/register-ui';
import type { RegisterLocationMapProps } from '@/components/register-location-map.types';

export type {
  RegisterLocationMapProps,
  RegisterMapMarker,
} from '@/components/register-location-map.types';

export function RegisterLocationMap(props: RegisterLocationMapProps) {
  return <MapPreview height={props.height} markers={props.markers.length} />;
}
