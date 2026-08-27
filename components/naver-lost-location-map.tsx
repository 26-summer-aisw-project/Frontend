import {
  NaverMapCircleOverlay,
  NaverMapMarkerOverlay,
  NaverMapPathOverlay,
  NaverMapPolygonOverlay,
  NaverMapView,
} from '@mj-studio/react-native-naver-map';
import { StyleSheet } from 'react-native';

import type { LostLocationMapProps } from '@/components/lost-location-map.types';
import type { GeoPoint } from '@/src/types/found-item';
import { LOST_REPORT_RADIUS_METERS } from '@/src/types/lost-report';

const METERS_PER_LATITUDE_DEGREE = 111_320;

/**
 * 두 경로점 사이에 검색 반경을 적용한 지도 폴리곤을 만든다.
 *
 * @param start 선분의 시작 좌표.
 * @param end 선분의 끝 좌표.
 * @returns 닫힌 폴리곤 좌표 또는 길이가 없는 선분이면 `null`.
 */
function corridorPolygon(start: GeoPoint, end: GeoPoint): GeoPoint[] | null {
  const averageLatitudeRadians = ((start.latitude + end.latitude) / 2) * (Math.PI / 180);
  const metersPerLongitudeDegree =
    METERS_PER_LATITUDE_DEGREE * Math.cos(averageLatitudeRadians);
  const eastMeters = (end.longitude - start.longitude) * metersPerLongitudeDegree;
  const northMeters = (end.latitude - start.latitude) * METERS_PER_LATITUDE_DEGREE;
  const segmentLength = Math.sqrt(eastMeters * eastMeters + northMeters * northMeters);

  if (segmentLength === 0 || metersPerLongitudeDegree === 0) {
    return null;
  }

  const offsetEast = (-northMeters / segmentLength) * LOST_REPORT_RADIUS_METERS;
  const offsetNorth = (eastMeters / segmentLength) * LOST_REPORT_RADIUS_METERS;
  const offsetLatitude = offsetNorth / METERS_PER_LATITUDE_DEGREE;
  const offsetLongitude = offsetEast / metersPerLongitudeDegree;

  const firstPoint = {
    latitude: start.latitude + offsetLatitude,
    longitude: start.longitude + offsetLongitude,
  };

  return [
    firstPoint,
    {
      latitude: end.latitude + offsetLatitude,
      longitude: end.longitude + offsetLongitude,
    },
    {
      latitude: end.latitude - offsetLatitude,
      longitude: end.longitude - offsetLongitude,
    },
    {
      latitude: start.latitude - offsetLatitude,
      longitude: start.longitude - offsetLongitude,
    },
    firstPoint,
  ];
}

export function NaverLostLocationMap({ center, pins, onTap }: LostLocationMapProps) {
  const corridors = pins.slice(0, -1).flatMap((pin, index) => {
    const polygon = corridorPolygon(pin, pins[index + 1]);
    return polygon ? [polygon] : [];
  });

  return (
    <NaverMapView
      animationDuration={300}
      camera={{ ...center, zoom: 14, bearing: 0, tilt: 0 }}
      isRotateGesturesEnabled={false}
      isShowZoomControls={false}
      isTiltGesturesEnabled={false}
      isZoomGesturesEnabled={false}
      maxZoom={14}
      minZoom={14}
      onTapMap={({ latitude, longitude }) => onTap({ latitude, longitude })}
      style={styles.map}>
      {corridors.map((coords, index) => (
        <NaverMapPolygonOverlay
          key={`corridor-${index}`}
          color="#1C5B5433"
          coords={coords}
          outlineColor="#1C5B5466"
          outlineWidth={1}
        />
      ))}
      {pins.map((pin, index) => (
        <NaverMapCircleOverlay
          key={`radius-${index}`}
          {...pin}
          color="#1C5B5433"
          outlineColor="#1C5B5466"
          outlineWidth={1}
          radius={LOST_REPORT_RADIUS_METERS}
        />
      ))}
      {pins.length > 1 ? (
        <NaverMapPathOverlay
          color="#1C5B54"
          coords={pins}
          outlineColor="#FFFFFF"
          outlineWidth={2}
          width={4}
        />
      ) : null}
      {pins.map((pin, index) => (
        <NaverMapMarkerOverlay
          key={`pin-${index}`}
          {...pin}
          caption={{
            text: `핀 ${index + 1}`,
            color: '#14403B',
            haloColor: '#FFFFFF',
            textSize: 12,
          }}
          image={{ symbol: 'green' }}
        />
      ))}
    </NaverMapView>
  );
}

const styles = StyleSheet.create({
  map: {
    height: 296,
    overflow: 'hidden',
    borderRadius: 16,
  },
});
