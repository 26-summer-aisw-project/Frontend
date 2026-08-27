import { NaverMapMarkerOverlay, NaverMapView } from '@mj-studio/react-native-naver-map';
import { View } from 'react-native';

import type { RegisterLocationMapProps } from '@/components/register-location-map.types';

export function NaverRegisterLocationMap({
  center,
  height,
  markers,
  onSelectMarker,
}: RegisterLocationMapProps) {
  if (!center) {
    return null;
  }

  return (
    <View style={{ height, overflow: 'hidden', borderRadius: 10 }}>
      <NaverMapView
        animationDuration={300}
        camera={{ ...center, zoom: 14, bearing: 0, tilt: 0 }}
        isRotateGesturesEnabled={false}
        isShowZoomControls={false}
        isTiltGesturesEnabled={false}
        style={{ height }}>
        {markers.map((marker) => (
          <NaverMapMarkerOverlay
            key={marker.id}
            {...marker.point}
            caption={
              marker.label
                ? {
                    text: marker.label,
                    color: '#14403B',
                    haloColor: '#FFFFFF',
                    textSize: 12,
                  }
                : undefined
            }
            image={{ symbol: marker.selected ? 'green' : 'gray' }}
            onTap={onSelectMarker ? () => onSelectMarker(marker.id) : undefined}
          />
        ))}
      </NaverMapView>
    </View>
  );
}
