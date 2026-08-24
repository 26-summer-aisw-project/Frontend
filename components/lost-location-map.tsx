import { useEffect, useState, type ComponentType } from 'react';
import { Platform } from 'react-native';

import { MockLostLocationMap } from '@/components/mock-lost-location-map';
import { NAVER_MAP_ENABLED } from '@/src/config/env';
import type { GeoPoint } from '@/src/types/found-item';

export type LostLocationMapProps = {
  center: GeoPoint;
  pins: GeoPoint[];
  onTap: (point: GeoPoint) => void;
};

export function LostLocationMap(props: LostLocationMapProps) {
  const [NativeMap, setNativeMap] = useState<ComponentType<LostLocationMapProps> | null>(null);

  useEffect(() => {
    if (Platform.OS === 'web' || !NAVER_MAP_ENABLED) {
      return;
    }

    let active = true;
    // 웹 번들에서 네이티브 지도 모듈을 불러오지 않도록 런타임에 로드한다.
    void import('@/components/naver-lost-location-map').then((module) => {
      if (active) {
        setNativeMap(() => module.NaverLostLocationMap);
      }
    });

    return () => {
      active = false;
    };
  }, []);

  if (!NativeMap) {
    return <MockLostLocationMap {...props} />;
  }

  return <NativeMap {...props} />;
}
