import { useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  type GestureResponderEvent,
  type LayoutChangeEvent,
} from 'react-native';

import type { LostLocationMapProps } from '@/components/lost-location-map.types';
import { MockLostRoute } from '@/components/mock-lost-route';
import { appFontFamily, useAppColors } from '@/src/theme/colors';

type MapSize = { width: number; height: number };

const LATITUDE_SPAN = 0.018;
const LONGITUDE_SPAN = 0.022;

function pointToPosition(
  point: LostLocationMapProps['center'],
  center: LostLocationMapProps['center'],
  size: MapSize,
) {
  return {
    left: size.width / 2 + ((point.longitude - center.longitude) / LONGITUDE_SPAN) * size.width,
    top: size.height / 2 - ((point.latitude - center.latitude) / LATITUDE_SPAN) * size.height,
  };
}

export function MockLostLocationMap({ center, pins, onTap }: LostLocationMapProps) {
  const colors = useAppColors();
  const [size, setSize] = useState<MapSize>({ width: 358, height: 296 });

  function handleLayout(event: LayoutChangeEvent) {
    setSize(event.nativeEvent.layout);
  }

  function handlePress(event: GestureResponderEvent) {
    const { locationX, locationY } = event.nativeEvent;
    onTap({
      latitude: center.latitude + (0.5 - locationY / size.height) * LATITUDE_SPAN,
      longitude: center.longitude + (locationX / size.width - 0.5) * LONGITUDE_SPAN,
    });
  }

  return (
    <Pressable
      accessibilityLabel="분실 경로 지도"
      accessibilityRole="button"
      onLayout={handleLayout}
      onPress={handlePress}
      style={[styles.map, { backgroundColor: colors.mapBase, borderColor: colors.line }]}>
      <View style={[styles.greenBlock, styles.greenTop, { backgroundColor: colors.mapGreen }]} />
      <View style={[styles.greenBlock, styles.greenBottom, { backgroundColor: colors.mapGreen }]} />
      <View style={[styles.road, styles.roadHorizontal, { backgroundColor: colors.mapRoad }]} />
      <View style={[styles.road, styles.roadVertical, { backgroundColor: colors.mapRoad }]} />
      <View style={[styles.road, styles.roadDiagonal, { backgroundColor: colors.mapRoadAlt }]} />

      <MockLostRoute center={center} pins={pins} size={size} />

      {pins.map((pin, index) => {
        const position = pointToPosition(pin, center, size);
        return (
          <View
            key={`${pin.latitude}-${pin.longitude}-${index}`}
            pointerEvents="none"
            style={[styles.pinArea, position]}>
            <View style={[styles.radius, { backgroundColor: colors.pinHalo }]} />
            <View style={[styles.marker, { backgroundColor: colors.action, borderColor: '#FFFFFF' }]}>
              <Text style={styles.markerText}>{index + 1}</Text>
            </View>
          </View>
        );
      })}

      <View style={[styles.radiusChip, { backgroundColor: colors.surface }]} pointerEvents="none">
        <View style={[styles.radiusDot, { backgroundColor: colors.action }]} />
        <Text style={[styles.radiusText, { color: colors.ink2 }]}>경로 주변 500m</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  map: {
    height: 296,
    overflow: 'hidden',
    borderWidth: 1,
    borderRadius: 16,
  },
  greenBlock: {
    position: 'absolute',
    height: 74,
    borderRadius: 12,
  },
  greenTop: {
    top: 18,
    left: 28,
    width: 104,
  },
  greenBottom: {
    right: 22,
    bottom: 22,
    width: 116,
  },
  road: {
    position: 'absolute',
  },
  roadHorizontal: {
    top: 144,
    right: -20,
    left: -20,
    height: 18,
    transform: [{ rotate: '-7deg' }],
  },
  roadVertical: {
    top: -20,
    bottom: -20,
    left: 160,
    width: 16,
    transform: [{ rotate: '8deg' }],
  },
  roadDiagonal: {
    top: 70,
    right: -30,
    width: 260,
    height: 12,
    transform: [{ rotate: '36deg' }],
  },
  pinArea: {
    position: 'absolute',
    width: 72,
    height: 72,
    marginTop: -36,
    marginLeft: -36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radius: {
    position: 'absolute',
    width: 72,
    height: 72,
    borderRadius: 36,
  },
  marker: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderRadius: 14,
  },
  markerText: {
    color: '#FFFFFF',
    fontFamily: appFontFamily,
    fontSize: 12,
    fontWeight: '800',
  },
  radiusChip: {
    position: 'absolute',
    top: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 7,
    paddingHorizontal: 10,
    borderRadius: 12,
  },
  radiusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  radiusText: {
    fontFamily: appFontFamily,
    fontSize: 11,
    fontWeight: '700',
  },
});
