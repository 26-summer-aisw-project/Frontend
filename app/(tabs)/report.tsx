import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { View } from 'react-native';

import { LostReportDetailsStep } from '@/components/lost-report-details-step';
import { LostReportLocationStep } from '@/components/lost-report-location-step';
import { ScreenPlaceholder } from '@/components/screen-placeholder';
import { MOCK_API } from '@/src/config/env';
import { ApiError } from '@/src/lib/api';
import { createLostReport, searchPlaces, toLostAtRange } from '@/src/lib/lost-report';
import type { GeoPoint } from '@/src/types/found-item';
import {
  LOST_REPORT_RADIUS_METERS,
  MAX_WAYPOINT_COUNT,
  type CreateLostReportRequest,
  type LostTimeBand,
} from '@/src/types/lost-report';

const INITIAL_CENTER: GeoPoint = { latitude: 37.4963, longitude: 126.9572 };
const MOCK_FEATURE_SUGGESTIONS = ['검정색', '검은 카드 지갑'];
const MAX_LOST_REPORT_IMAGE_COUNT = 5;
const MAX_LOST_REPORT_DESCRIPTION_LENGTH = 1000;

function validationErrorMessage(error: ApiError): string {
  const field = error.details[0]?.field ?? '';
  if (field === 'category') {
    return '카테고리를 확인해 주세요.';
  }
  if (field === 'description') {
    return '분실물 특징을 확인해 주세요.';
  }
  if (field === 'lostAtFrom' || field === 'lostAtTo') {
    return '분실 날짜와 시간을 확인해 주세요.';
  }
  if (field === 'searchRadiusMeters' || field.startsWith('waypoints')) {
    return '분실 경로를 확인해 주세요.';
  }
  return error.message;
}

export default function ReportScreen() {
  const [step, setStep] = useState<1 | 2>(1);
  const [cameraCenter, setCameraCenter] = useState(INITIAL_CENTER);
  const [pins, setPins] = useState<GeoPoint[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [date, setDate] = useState<Date | null>(null);
  const [timeBand, setTimeBand] = useState<LostTimeBand>(null);
  const [itemName, setItemName] = useState('');
  const [category, setCategory] = useState<string | null>(null);
  const [brand, setBrand] = useState('');
  const [description, setDescription] = useState('');
  const [imageUris, setImageUris] = useState<string[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mockReportId, setMockReportId] = useState<string | null>(null);

  function clearError() {
    setError(null);
  }

  function handleTapMap(point: GeoPoint) {
    setPins((current) =>
      current.length >= MAX_WAYPOINT_COUNT ? current : [...current, point],
    );
  }

  async function handleSearch() {
    if (searchQuery.trim().length === 0 || isSearching) {
      return;
    }

    setIsSearching(true);
    try {
      const response = await searchPlaces(searchQuery);
      const first = response.data[0];
      if (first) {
        setCameraCenter(first.point);
      }
    } catch {
    } finally {
      setIsSearching(false);
    }
  }

  async function handleUseCurrentLocation() {
    setIsLocating(true);
    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (!permission.granted) {
        return;
      }
      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      setCameraCenter({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      });
    } catch {
    } finally {
      setIsLocating(false);
    }
  }

  async function handlePickImage() {
    const remainingCount = MAX_LOST_REPORT_IMAGE_COUNT - imageUris.length;
    if (remainingCount <= 0) {
      return;
    }

    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
      allowsMultipleSelection: true,
      selectionLimit: remainingCount,
    });
    if (!result.canceled) {
      setImageUris((current) =>
        [...new Set([...current, ...result.assets.map((asset) => asset.uri)])].slice(
          0,
          MAX_LOST_REPORT_IMAGE_COUNT,
        ),
      );
      clearError();
    }
  }

  async function handleSubmit() {
    setError(null);

    if (!date || pins.length === 0) {
      setError('분실 날짜와 경로를 다시 확인해 주세요.');
      return;
    }

    if (!itemName.trim() || !category || description.trim().length === 0) {
      setError('입력한 내용을 다시 확인해 주세요.');
      return;
    }

    setIsSubmitting(true);
    const { lostAtFrom, lostAtTo } = toLostAtRange(date, timeBand);
    const normalizedItemName = itemName.trim();
    const normalizedBrand = brand.trim();
    const normalizedDescription = [
      `물품명: ${normalizedItemName}`,
      normalizedBrand ? `브랜드: ${normalizedBrand}` : null,
      description.trim(),
    ]
      .filter((value): value is string => value !== null)
      .join('\n')
      .slice(0, MAX_LOST_REPORT_DESCRIPTION_LENGTH);
    const request: CreateLostReportRequest = {
      category,
      description: normalizedDescription,
      lostAtFrom,
      lostAtTo,
      searchRadiusMeters: LOST_REPORT_RADIUS_METERS,
      waypoints: pins.map((point, index) => ({ ordinal: index + 1, point })),
    };

    try {
      const createdReport = await createLostReport(request);
      if (MOCK_API) {
        setMockReportId(createdReport.id);
        return;
      }
      router.replace('/home');
    } catch (caught) {
      if (caught instanceof ApiError && caught.code === 'UNAUTHENTICATED') {
        return;
      }
      setError(
        caught instanceof ApiError && caught.code === 'VALIDATION_ERROR'
          ? validationErrorMessage(caught)
          : caught instanceof ApiError
            ? caught.message
            : '분실물 검색을 시작하지 못했어요.',
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  if (mockReportId) {
    return (
      <View style={{ flex: 1 }}>
        <StatusBar style="dark" />
        <ScreenPlaceholder
          badge="접수 완료"
          name="분실 신고"
          note={`신고 번호 ${mockReportId}`}
        />
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <StatusBar style="light" />
      {step === 1 ? (
        <LostReportLocationStep
          cameraCenter={cameraCenter}
          date={date}
          isLocating={isLocating}
          isSearching={isSearching}
          onBack={() => router.back()}
          onChangeSearchQuery={setSearchQuery}
          onNext={() => setStep(2)}
          onRemovePin={(index) =>
            setPins((current) => current.filter((_, position) => position !== index))
          }
          onSearch={() => void handleSearch()}
          onSelectDate={setDate}
          onSelectTimeBand={setTimeBand}
          onTapMap={handleTapMap}
          onUseCurrentLocation={() => void handleUseCurrentLocation()}
          pins={pins}
          searchQuery={searchQuery}
          timeBand={timeBand}
        />
      ) : (
        <LostReportDetailsStep
          brand={brand}
          category={category}
          description={description}
          error={error}
          featureSuggestions={imageUris.length > 0 ? MOCK_FEATURE_SUGGESTIONS : []}
          imageUris={imageUris}
          isImageLimitReached={imageUris.length >= MAX_LOST_REPORT_IMAGE_COUNT}
          isSubmitting={isSubmitting}
          itemName={itemName}
          onBack={() => {
            setError(null);
            setStep(1);
          }}
          onChangeBrand={(value) => {
            setBrand(value);
            clearError();
          }}
          onChangeDescription={(value) => {
            setDescription(value);
            clearError();
          }}
          onChangeItemName={(value) => {
            setItemName(value);
            clearError();
          }}
          onPickImage={() => void handlePickImage()}
          onRemoveImage={(index) => {
            setImageUris((current) => current.filter((_, position) => position !== index));
            clearError();
          }}
          onSelectCategory={(value) => {
            setCategory(value);
            clearError();
          }}
          onSubmit={() => void handleSubmit()}
        />
      )}
    </View>
  );
}
