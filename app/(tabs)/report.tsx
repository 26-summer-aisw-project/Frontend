import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { View } from 'react-native';

import { LostReportCandidateDetailView } from '@/components/lost-report-candidate-detail-view';
import { LostReportCandidatesView } from '@/components/lost-report-candidates-view';
import { LostReportDetailsStep } from '@/components/lost-report-details-step';
import { LostReportLocationStep } from '@/components/lost-report-location-step';
import { MOCK_API } from '@/src/config/env';
import { ApiError } from '@/src/lib/api';
import {
  confirmLostReportRecovery,
  createLostReport,
  getLostReportCandidates,
  refreshLostReportCandidates,
  searchPlaces,
  toLostAtRange,
} from '@/src/lib/lost-report';
import type { GeoPoint } from '@/src/types/found-item';
import {
  LOST_REPORT_RADIUS_METERS,
  MAX_WAYPOINT_COUNT,
  type CreateLostReportRequest,
  type LostReportCandidate,
  type LostReportCandidatesResponse,
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

function apiErrorMessage(error: ApiError): string {
  if (error.code !== 'RATE_LIMITED' || error.retryAfterSeconds === null) {
    return error.message;
  }

  if (error.retryAfterSeconds >= 60) {
    return `${Math.ceil(error.retryAfterSeconds / 60)}분 후 다시 시도해 주세요.`;
  }
  return `${Math.max(1, error.retryAfterSeconds)}초 후 다시 시도해 주세요.`;
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
  const [isConfirming, setIsConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reportId, setReportId] = useState<string | null>(null);
  const [candidates, setCandidates] = useState<LostReportCandidatesResponse | null>(null);
  const [selectedCandidate, setSelectedCandidate] = useState<LostReportCandidate | null>(null);
  const [candidateError, setCandidateError] = useState<string | null>(null);
  const [candidateListError, setCandidateListError] = useState<string | null>(null);

  function clearError() {
    setError(null);
  }

  function resetReportFlow() {
    setStep(1);
    setCameraCenter(INITIAL_CENTER);
    setPins([]);
    setSearchQuery('');
    setDate(null);
    setTimeBand(null);
    setItemName('');
    setCategory(null);
    setBrand('');
    setDescription('');
    setImageUris([]);
    setError(null);
    setReportId(null);
    setCandidates(null);
    setSelectedCandidate(null);
    setCandidateError(null);
    setCandidateListError(null);
  }

  function handleGoHome() {
    resetReportFlow();
    router.replace('/home');
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
      const currentCandidates = await getLostReportCandidates(createdReport.id);
      let candidateResponse = currentCandidates;
      setCandidateListError(null);
      if (currentCandidates.candidatesStale) {
        try {
          candidateResponse = await refreshLostReportCandidates(createdReport.id);
        } catch (caught) {
          if (caught instanceof ApiError && caught.code === 'UNAUTHENTICATED') {
            throw caught;
          }
          if (caught instanceof ApiError && caught.code === 'RATE_LIMITED') {
            setCandidateListError(apiErrorMessage(caught));
          }
        }
      }
      setReportId(createdReport.id);
      setCandidates(candidateResponse);
    } catch (caught) {
      if (caught instanceof ApiError && caught.code === 'UNAUTHENTICATED') {
        return;
      }
      setError(
        caught instanceof ApiError && caught.code === 'VALIDATION_ERROR'
          ? validationErrorMessage(caught)
          : caught instanceof ApiError
            ? apiErrorMessage(caught)
            : '분실물 검색을 시작하지 못했어요.',
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleConfirmRecovery() {
    if (!reportId || !selectedCandidate || isConfirming) {
      return;
    }

    setCandidateError(null);
    setIsConfirming(true);
    try {
      await confirmLostReportRecovery(reportId, {
        candidateId: selectedCandidate.candidateId,
      });
      handleGoHome();
    } catch (caught) {
      if (caught instanceof ApiError && caught.code === 'UNAUTHENTICATED') {
        return;
      }
      setCandidateError(
        caught instanceof ApiError
          ? apiErrorMessage(caught)
          : '요청을 처리하지 못했습니다. 잠시 후 다시 시도해 주세요.',
      );
    } finally {
      setIsConfirming(false);
    }
  }

  if (candidates && selectedCandidate) {
    return (
      <View style={{ flex: 1 }}>
        <StatusBar style="light" />
        <LostReportCandidateDetailView
          candidate={selectedCandidate}
          error={candidateError}
          isConfirming={isConfirming}
          onBack={() => {
            setCandidateError(null);
            setSelectedCandidate(null);
          }}
          onConfirm={() => void handleConfirmRecovery()}
        />
      </View>
    );
  }

  if (candidates) {
    return (
      <View style={{ flex: 1 }}>
        <StatusBar style="light" />
        <LostReportCandidatesView
          candidates={candidates}
          error={candidateListError}
          onBack={handleGoHome}
          onGoHome={handleGoHome}
          onSelectCandidate={(candidate) => {
            setCandidateError(null);
            setSelectedCandidate(candidate);
          }}
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
          featureSuggestions={
            MOCK_API && imageUris.length > 0 ? MOCK_FEATURE_SUGGESTIONS : []
          }
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
