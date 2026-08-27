import { Fragment } from 'react';
import { StyleSheet, View } from 'react-native';

import type { LostLocationMapProps } from '@/components/lost-location-map.types';
import { useAppColors } from '@/src/theme/colors';

type MapSize = { width: number; height: number };
type ScreenPoint = { left: number; top: number };

const LATITUDE_SPAN = 0.018;
const LONGITUDE_SPAN = 0.022;
const CORRIDOR_WIDTH = 72;
const ROUTE_WIDTH = 4;

function pointToPosition(
  point: LostLocationMapProps['center'],
  center: LostLocationMapProps['center'],
  size: MapSize,
): ScreenPoint {
  return {
    left: size.width / 2 + ((point.longitude - center.longitude) / LONGITUDE_SPAN) * size.width,
    top: size.height / 2 - ((point.latitude - center.latitude) / LATITUDE_SPAN) * size.height,
  };
}

function segmentStyle(start: ScreenPoint, end: ScreenPoint, thickness: number) {
  const deltaX = end.left - start.left;
  const deltaY = end.top - start.top;
  const length = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

  return {
    left: (start.left + end.left - length) / 2,
    top: (start.top + end.top - thickness) / 2,
    width: length,
    height: thickness,
    borderRadius: thickness / 2,
    transform: [{ rotate: `${Math.atan2(deltaY, deltaX)}rad` }],
  };
}

export function MockLostRoute({
  center,
  pins,
  size,
}: Pick<LostLocationMapProps, 'center' | 'pins'> & { size: MapSize }) {
  const colors = useAppColors();
  const positions = pins.map((pin) => pointToPosition(pin, center, size));
  const segments = positions.slice(0, -1).map((start, index) => ({
    start,
    end: positions[index + 1],
  }));

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {segments.map(({ start, end }, index) => (
        <Fragment key={`corridor-${index}`}>
          <View
            style={[
              styles.segment,
              segmentStyle(start, end, CORRIDOR_WIDTH),
              { backgroundColor: colors.pinHalo },
            ]}
          />
          <View
            style={[
              styles.segment,
              segmentStyle(start, end, ROUTE_WIDTH),
              { backgroundColor: colors.action },
            ]}
          />
        </Fragment>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  segment: { position: 'absolute' },
});
