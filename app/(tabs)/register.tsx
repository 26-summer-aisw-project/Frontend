import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SymbolView } from 'expo-symbols';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { RegisterCompletionView } from '@/components/register-completion-view';
import {
  DESCRIPTION_MAX_LENGTH,
  LOCATION_MAX_LENGTH,
  NAME_MAX_LENGTH,
  RegisterFoundInfoStep,
  RegisterItemInfoStep,
  RegisterPhotoStep,
  RegisterStorageStep,
} from '@/components/register-form-steps';
import { RegisterHandoverView } from '@/components/register-handover-view';
import {
  DateTimeSheet,
  ErrorBanner,
  ICONS,
  StepHero,
} from '@/components/register-ui';
import { ApiError, apiRequest } from '@/src/lib/api';
import {
  completeFoundItemDraft,
  confirmFoundItemHandover,
  createFoundItemDraft,
  getFoundItem,
} from '@/src/lib/found-item-draft';
import { readExifHints, type ExifMap } from '@/src/lib/photo-exif';
import { appFontFamily, useAppColors } from '@/src/theme/colors';
import {
  MAX_IMAGE_BYTES,
  MAX_IMAGE_COUNT,
  type AllowedImageContentType,
  type CompleteFoundItemDraftRequest,
  type FoundItemDraftResponse,
  type FoundItemResponse,
  type GeoPoint,
  type LostCenter,
  type PagedResponse,
  type StorageMethod,
} from '@/src/types/found-item';

const CATEGORIES: { value: string; label: string }[] = [
  { value: 'WALLET', label: '지갑 / 카드' },
  { value: 'ELECTRONICS', label: '휴대폰 / 전자기기' },
  { value: 'BAG', label: '가방 / 파우치' },
  { value: 'ID_CARD', label: '신분증 / 학생증' },
  { value: 'KEY', label: '열쇠 / 키홀더' },
  { value: 'CLOTHING', label: '의류 / 잡화' },
  { value: 'BOOK', label: '도서 / 문구' },
  { value: 'ACCESSORY', label: '액세서리' },
  { value: 'ETC', label: '기타' },
];

const FIELD_STEPS: Record<string, number> = {
  expectedImageCount: 1,
  foundAt: 2,
  foundLocationText: 2,
  foundLocation: 2,
  location: 2,
  name: 3,
  category: 3,
  description: 3,
  storageMethod: 4,
  storageDesc: 4,
  centerId: 4,
  handedAt: 4,
};

const FIELD_ERROR_MESSAGES: Record<string, string> = {
  name: '물품명을 다시 확인해 주세요.',
  category: '카테고리를 선택해 주세요.',
  description: '분실물 특징을 다시 확인해 주세요.',
  expectedImageCount: `사진은 1~${MAX_IMAGE_COUNT}장까지 올릴 수 있어요.`,
  foundAt: '습득 일시를 다시 확인해 주세요.',
  foundLocationText: '습득 장소를 다시 확인해 주세요.',
  foundLocation: '습득 장소를 다시 확인해 주세요.',
  location: '습득한 자리에서 "현위치"를 눌러 좌표를 확인해 주세요.',
  storageMethod: '보관 상태를 선택해 주세요.',
  storageDesc: '어디에 옮겼는지 적어 주세요.',
  centerId: '인계한 보관처를 선택해 주세요.',
  handedAt: '인계 시각을 다시 확인해 주세요.',
};

const MISSING_LOCATION_BANNER = {
  title: '습득 위치를 확인해야 등록할 수 있어요',
};

type PickedImage = {
  uri: string;
  contentType: AllowedImageContentType;
  sizeBytes: number;
  sortOrder: number;
  file?: File;
};

type FieldErrors = Partial<Record<keyof typeof FIELD_STEPS, string>>;

function toUtcIso(date: Date): string {
  return date.toISOString().replace(/\.\d{3}Z$/, 'Z');
}

function isDraftExpired(draft: FoundItemDraftResponse): boolean {
  const expiresAt = Date.parse(draft.draftExpiresAt);
  return Number.isFinite(expiresAt) && expiresAt <= Date.now();
}

function formatPlace(place: Location.LocationGeocodedAddress | undefined): string | null {
  if (!place) {
    return null;
  }

  const parts = [place.region, place.city, place.district, place.street, place.name]
    .filter((part): part is string => typeof part === 'string' && part.length > 0)
    .filter((part, index, all) => all.indexOf(part) === index);

  return parts.length > 0 ? parts.join(' ').slice(0, LOCATION_MAX_LENGTH) : null;
}

function guessContentType(
  uri: string,
  mimeType?: string | null,
): AllowedImageContentType | null {
  if (mimeType === 'image/jpeg' || mimeType === 'image/png' || mimeType === 'image/webp') {
    return mimeType;
  }
  const extension = uri.split('?')[0].split('.').pop()?.toLowerCase();
  if (extension === 'png') return 'image/png';
  if (extension === 'webp') return 'image/webp';
  if (extension === 'jpg' || extension === 'jpeg') return 'image/jpeg';
  return null;
}

function distanceInMeters(from: GeoPoint, to: GeoPoint): number {
  const earthRadius = 6_371_000;
  const toRadians = (degrees: number) => (degrees * Math.PI) / 180;
  const deltaLat = toRadians(to.latitude - from.latitude);
  const deltaLng = toRadians(to.longitude - from.longitude);
  const a =
    Math.sin(deltaLat / 2) ** 2 +
    Math.cos(toRadians(from.latitude)) *
      Math.cos(toRadians(to.latitude)) *
      Math.sin(deltaLng / 2) ** 2;

  return Math.round(earthRadius * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

export default function RegisterScreen() {
  const colors = useAppColors();
  const insets = useSafeAreaInsets();
  const isMounted = useRef(true);
  const { handoverCenterId, handoverFoundAt, handoverItemId } = useLocalSearchParams<{
    handoverCenterId?: string;
    handoverFoundAt?: string;
    handoverItemId?: string;
  }>();
  const shouldResumeHandover =
    typeof handoverCenterId === 'string' &&
    typeof handoverFoundAt === 'string' &&
    typeof handoverItemId === 'string';

  const [step, setStep] = useState(1);
  const [images, setImages] = useState<PickedImage[]>([]);
  const [name, setName] = useState('');
  const [category, setCategory] = useState<string | null>(null);
  const [description, setDescription] = useState('');
  const [foundLocationText, setFoundLocationText] = useState('');
  const [foundCoords, setFoundCoords] = useState<GeoPoint | null>(null);
  const [foundAt, setFoundAt] = useState<Date | null>(null);
  const [autoFilled, setAutoFilled] = useState<{ location: boolean; foundAt: boolean }>({
    location: false,
    foundAt: false,
  });
  const [storageMethod, setStorageMethod] = useState<StorageMethod | null>(null);
  const [storageDesc, setStorageDesc] = useState('');
  const [centerId, setCenterId] = useState<string | null>(null);
  const [handedAt, setHandedAt] = useState<Date | null>(null);

  const [centers, setCenters] = useState<LostCenter[]>([]);
  const [centersError, setCentersError] = useState<string | null>(null);
  const [isLoadingCenters, setIsLoadingCenters] = useState(false);

  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [banner, setBanner] = useState<{ title: string; body?: string } | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [created, setCreated] = useState<FoundItemResponse | null>(null);
  const [draft, setDraft] = useState<FoundItemDraftResponse | null>(null);
  const [confirmedColor, setConfirmedColor] = useState<string | null>(null);
  const [isHandoverOpen, setIsHandoverOpen] = useState(false);
  const [isHandoverCompleted, setIsHandoverCompleted] = useState(false);
  const [resumedHandoverItemId, setResumedHandoverItemId] = useState<string | null>(null);
  const [isLoadingPendingHandover, setIsLoadingPendingHandover] =
    useState(shouldResumeHandover);

  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const [dateTarget, setDateTarget] = useState<'foundAt' | 'handedAt' | null>(null);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  useEffect(() => {
    if (!shouldResumeHandover) return;

    let cancelled = false;
    apiRequest<LostCenter>(`/lost-centers/${handoverCenterId}`)
      .then((center) => {
        if (cancelled) return;
        const parsedFoundAt = new Date(handoverFoundAt);
        if (!Number.isFinite(parsedFoundAt.getTime())) {
          router.replace('/home');
          return;
        }

        setResumedHandoverItemId(handoverItemId);
        setCenters([center]);
        setCenterId(center.id);
        setFoundAt(parsedFoundAt);
        setStorageMethod('HANDED_TO_CENTER');
        setIsHandoverOpen(true);
      })
      .catch(() => {
        if (!cancelled) router.replace('/home');
      })
      .finally(() => {
        if (!cancelled) setIsLoadingPendingHandover(false);
      });

    return () => {
      cancelled = true;
    };
  }, [handoverCenterId, handoverFoundAt, handoverItemId, shouldResumeHandover]);

  useEffect(() => {
    if (!draft) {
      return;
    }

    const draftId = draft.id;
    let cancelled = false;
    let pollTimer: ReturnType<typeof setTimeout> | undefined;
    let expiryTimer: ReturnType<typeof setTimeout> | undefined;

    function discardExpiredDraft() {
      if (cancelled) return;
      setDraft(null);
      setConfirmedColor(null);
      setStep(1);
      setBanner({
        title: '등록하지 못했어요',
        body: '잠시 후 다시 시도해 주세요.',
      });
    }

    const expiresAt = Date.parse(draft.draftExpiresAt);
    if (Number.isFinite(expiresAt)) {
      const remainingMs = expiresAt - Date.now();
      if (remainingMs <= 0) {
        discardExpiredDraft();
        return;
      }
      expiryTimer = setTimeout(discardExpiredDraft, remainingMs);
    }

    if (draft.visionStatus === 'READY') {
      return () => {
        cancelled = true;
        if (expiryTimer) clearTimeout(expiryTimer);
      };
    }

    async function pollVision() {
      try {
        const response = await getFoundItem(draftId);
        if (cancelled || response.status !== 'DRAFT') return;

        setDraft(response);
        if (response.visionStatus === 'READY') {
          return;
        }
      } catch (error) {
        if (error instanceof ApiError && error.code === 'NOT_FOUND') {
          discardExpiredDraft();
          return;
        }
      }

      if (!cancelled) {
        pollTimer = setTimeout(() => void pollVision(), 1500);
      }
    }

    pollTimer = setTimeout(() => void pollVision(), 1500);
    return () => {
      cancelled = true;
      if (pollTimer) clearTimeout(pollTimer);
      if (expiryTimer) clearTimeout(expiryTimer);
    };
  }, [draft]);

  const loadCenters = useCallback(async () => {
    setIsLoadingCenters(true);
    setCentersError(null);

    try {
      const response = await apiRequest<PagedResponse<LostCenter>>('/lost-centers?pageSize=20');
      if (!isMounted.current) return;
      setCenters(response.data.filter((center) => center.isActive));
    } catch (error) {
      if (!isMounted.current) return;
      setCentersError(
        error instanceof ApiError
          ? error.message
          : '분실물센터 목록을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.',
      );
    } finally {
      if (isMounted.current) {
        setIsLoadingCenters(false);
      }
    }
  }, []);

  const hasLoadedCenters = useRef(false);

  useEffect(() => {
    if (step !== 4 || hasLoadedCenters.current) {
      return;
    }
    hasLoadedCenters.current = true;
    void loadCenters();
  }, [step, loadCenters]);

  const displayedCenters = useMemo(() => {
    const rows = centers.map((center) => ({
      center,
      distance:
        foundCoords && center.location ? distanceInMeters(foundCoords, center.location) : undefined,
    }));
    return foundCoords
      ? rows.sort((left, right) => (left.distance ?? Infinity) - (right.distance ?? Infinity))
      : rows;
  }, [centers, foundCoords]);

  const selectedCenter = useMemo(
    () => centers.find((center) => center.id === centerId) ?? null,
    [centers, centerId],
  );

  function clearFieldError(field: keyof typeof FIELD_STEPS) {
    setBanner(null);
    setFieldErrors((current) => {
      if (!current[field]) return current;
      const next = { ...current };
      delete next[field];
      return next;
    });
  }

  function acceptAssets(assets: ImagePicker.ImagePickerAsset[]): ImagePicker.ImagePickerAsset[] {
    const imageLimit = MAX_IMAGE_COUNT;
    const room = imageLimit - images.length;
    const usedSortOrders = new Set(images.map((image) => image.sortOrder));
    const availableSortOrders = Array.from(
      { length: imageLimit },
      (_, sortOrder) => sortOrder,
    ).filter((sortOrder) => !usedSortOrders.has(sortOrder));
    const accepted: PickedImage[] = [];
    const acceptedAssets: ImagePicker.ImagePickerAsset[] = [];
    let rejection: string | null = null;

    for (const asset of assets) {
      if (accepted.length >= room) {
        rejection = `사진은 최대 ${imageLimit}장까지 올릴 수 있어요.`;
        break;
      }

      const contentType = guessContentType(asset.uri, asset.mimeType);
      const sizeBytes = asset.fileSize ?? 0;

      if (!contentType) {
        rejection = 'JPEG, PNG, WebP 사진만 올릴 수 있어요.';
        continue;
      }
      if (sizeBytes > MAX_IMAGE_BYTES) {
        rejection = '사진 한 장은 10MB를 넘을 수 없어요.';
        continue;
      }

      accepted.push({
        uri: asset.uri,
        contentType,
        sizeBytes,
        sortOrder: availableSortOrders[accepted.length],
        file: asset.file,
      });
      acceptedAssets.push(asset);
    }

    if (accepted.length > 0) {
      setDraft(null);
      setConfirmedColor(null);
      setImages((current) => [...current, ...accepted]);
    }

    if (rejection) {
      setFieldErrors((current) => ({ ...current, expectedImageCount: rejection }));
    } else if (accepted.length > 0) {
      clearFieldError('expectedImageCount');
    }

    return acceptedAssets;
  }

  async function applyExifHints(asset: ImagePicker.ImagePickerAsset) {
    const hints = readExifHints(asset.exif as ExifMap | null | undefined);

    if (hints.takenAt && !foundAt) {
      setFoundAt(hints.takenAt);
      setAutoFilled((current) => ({ ...current, foundAt: true }));
      clearFieldError('foundAt');
    }

    if (!hints.location) {
      return;
    }

    setFoundCoords(hints.location);
    setAutoFilled((current) => ({ ...current, location: true }));

    if (foundLocationText.trim().length > 0) {
      return;
    }

    try {
      const [place] = await Location.reverseGeocodeAsync(hints.location);
      if (!isMounted.current) return;

      const address = formatPlace(place);
      if (address) {
        setFoundLocationText(address);
        clearFieldError('foundLocationText');
      }
    } catch {}
  }

  async function handleTakePhoto() {
    const imageLimit = MAX_IMAGE_COUNT;
    if (images.length >= imageLimit) {
      setFieldErrors((current) => ({
        ...current,
        expectedImageCount: `사진은 최대 ${imageLimit}장까지 올릴 수 있어요.`,
      }));
      return;
    }

    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        setFieldErrors((current) => ({
          ...current,
          expectedImageCount: '카메라 권한이 없어 촬영할 수 없어요. 설정에서 허용해 주세요.',
        }));
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        quality: 0.7,
        exif: true,
      });
      if (result.canceled) {
        return;
      }

      const isFirstPhoto = images.length === 0;
      const [firstAccepted] = acceptAssets(result.assets);
      if (isFirstPhoto && firstAccepted) {
        await applyExifHints(firstAccepted);
      }
    } catch {
      setFieldErrors((current) => ({
        ...current,
        expectedImageCount: '카메라를 열지 못했어요. 잠시 후 다시 시도해 주세요.',
      }));
    }
  }

  function handleRemovePhoto(index: number) {
    setDraft(null);
    setConfirmedColor(null);
    setImages((current) => current.filter((_, position) => position !== index));
    clearFieldError('expectedImageCount');
  }

  async function handleUseCurrentLocation() {
    setIsLocating(true);
    clearFieldError('foundLocationText');
    clearFieldError('location');
    let measuredCoordinates: GeoPoint | null = null;

    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (!permission.granted) {
        setFieldErrors((current) => ({
          ...current,
          location: '위치 권한을 허용해야 습득 위치를 확인하고 등록할 수 있어요.',
        }));
        return;
      }

      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      measuredCoordinates = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      };

      setFoundCoords(measuredCoordinates);
      setAutoFilled((current) => ({ ...current, location: false }));

      const [place] = await Location.reverseGeocodeAsync(measuredCoordinates);
      const address = formatPlace(place);

      if (!address) {
        setFieldErrors((current) => ({
          ...current,
          foundLocationText: '현위치의 주소를 찾지 못했어요. 직접 입력해 주세요.',
        }));
        return;
      }

      setFoundLocationText(address);
    } catch {
      setFieldErrors((current) => ({
        ...current,
        [measuredCoordinates ? 'foundLocationText' : 'location']: measuredCoordinates
          ? '현위치의 주소를 찾지 못했어요. 직접 입력해 주세요.'
          : '현위치를 가져오지 못했어요. 잠시 후 다시 눌러 주세요.',
      }));
    } finally {
      if (isMounted.current) {
        setIsLocating(false);
      }
    }
  }

  function handleSelectCenter(center: LostCenter) {
    setCenterId(center.id);
    setStorageMethod('HANDED_TO_CENTER');
    setStorageDesc('');
    setHandedAt((current) => current ?? new Date());
    clearFieldError('centerId');
    clearFieldError('handedAt');
    clearFieldError('storageMethod');
  }

  function handleSelectStorageMethod(method: StorageMethod) {
    setStorageMethod(method);
    clearFieldError('storageMethod');

    // 금지 필드가 이전 선택에서 남아 422가 되지 않도록 즉시 비운다.
    if (method !== 'HANDED_TO_CENTER') {
      setCenterId(null);
      setHandedAt(null);
      clearFieldError('centerId');
      clearFieldError('handedAt');
    } else {
      setHandedAt((current) => current ?? new Date());
    }
    if (method !== 'MOVED_TO_SAFE_PLACE') {
      setStorageDesc('');
      clearFieldError('storageDesc');
    }
  }

  function validateStep(target: number): FieldErrors {
    const errors: FieldErrors = {};

    if (target === 1) {
      if (images.length === 0) {
        errors.expectedImageCount = '사진을 최소 한 장 촬영해 주세요.';
      }
    }

    if (target === 3) {
      if (name.trim().length === 0) {
        errors.name = '물품명을 입력해 주세요.';
      } else if (name.trim().length > NAME_MAX_LENGTH) {
        errors.name = `물품명은 ${NAME_MAX_LENGTH}자까지 쓸 수 있어요.`;
      }
      if (!category) {
        errors.category = '카테고리를 선택해 주세요.';
      }
      if (description.trim().length === 0) {
        errors.description = '분실물 특징을 입력해 주세요.';
      } else if (description.trim().length > DESCRIPTION_MAX_LENGTH) {
        errors.description = `특징은 ${DESCRIPTION_MAX_LENGTH}자까지 쓸 수 있어요.`;
      }
    }

    if (target === 2) {
      if (foundLocationText.trim().length === 0) {
        errors.foundLocationText = '습득 장소를 입력해 주세요.';
      } else if (foundLocationText.trim().length > LOCATION_MAX_LENGTH) {
        errors.foundLocationText = `습득 장소는 ${LOCATION_MAX_LENGTH}자까지 쓸 수 있어요.`;
      }
      if (!foundAt) {
        errors.foundAt = '습득 일시를 선택해 주세요.';
      } else if (foundAt.getTime() > Date.now()) {
        errors.foundAt = '습득 일시는 미래일 수 없어요.';
      }

      if (!foundCoords) {
        errors.location = FIELD_ERROR_MESSAGES.location;
      }
    }

    return errors;
  }

  function validateFormStep(target: number): FieldErrors {
    if (target !== 4) {
      return validateStep(target);
    }

    const errors: FieldErrors = {};

    if (!storageMethod) {
      errors.storageMethod = FIELD_ERROR_MESSAGES.storageMethod;
      return errors;
    }

    if (storageMethod === 'MOVED_TO_SAFE_PLACE' && storageDesc.trim().length === 0) {
      errors.storageDesc = FIELD_ERROR_MESSAGES.storageDesc;
    }

    if (storageMethod === 'HANDED_TO_CENTER' && !centerId) {
      errors.centerId = FIELD_ERROR_MESSAGES.centerId;
    }

    return errors;
  }

  async function handleNext() {
    const errors = validateFormStep(step);
    setFieldErrors(errors);

    if (Object.keys(errors).length > 0) {
      setBanner({
        title: '아직 채우지 않은 항목이 있어요',
        body: '빨간 글씨로 표시한 항목을 채우면 다음 단계로 넘어갈 수 있어요.',
      });
      return;
    }

    if (step === 1 && (!draft || isDraftExpired(draft))) {
      setIsSubmitting(true);
      setBanner(null);
      try {
        const createdDraft = await createFoundItemDraft(images);
        if (!isMounted.current) return;
        setDraft(createdDraft);
      } catch (error) {
        if (!isMounted.current) return;
        if (error instanceof ApiError && error.code === 'UNAUTHENTICATED') return;
        setBanner({
          title: '사진을 모두 올리지 못했어요',
          body: error instanceof ApiError ? error.message : '잠시 후 다시 시도해 주세요.',
        });
        return;
      } finally {
        if (isMounted.current) setIsSubmitting(false);
      }
    }

    setBanner(null);
    setStep((current) => Math.min(4, current + 1));
  }

  function handleBack() {
    setBanner(null);
    if (step > 1) {
      setStep((current) => current - 1);
      return;
    }
    router.replace('/home');
  }

  async function handleSubmit() {
    const errors = validateFormStep(4);
    setFieldErrors(errors);

    if (Object.keys(errors).length > 0 || !storageMethod || !foundAt || !category) {
      setBanner({
        title: '보관 상태를 확인해 주세요',
        body: '빨간 글씨로 표시한 항목을 채우면 등록할 수 있어요.',
      });
      return;
    }

    if (!foundCoords) {
      setStep(2);
      setFieldErrors({ location: FIELD_ERROR_MESSAGES.location });
      setBanner(MISSING_LOCATION_BANNER);
      return;
    }

    if (!draft || isDraftExpired(draft)) {
      setDraft(null);
      setConfirmedColor(null);
      setStep(1);
      setBanner({
        title: '등록하지 못했어요',
        body: '잠시 후 다시 시도해 주세요.',
      });
      return;
    }

    setIsSubmitting(true);
    setBanner(null);

    try {
      const featureColor = confirmedColor ?? draft.visionSuggestion?.color;
      if (!featureColor) {
        setStep(3);
        setFieldErrors({ description: FIELD_ERROR_MESSAGES.description });
        setBanner({
          title: '입력한 내용을 다시 확인해 주세요',
          body: '표시한 항목을 고치면 등록할 수 있어요.',
        });
        return;
      }

      const request: CompleteFoundItemDraftRequest = {
        category,
        foundAt: toUtcIso(foundAt),
        foundLocation: foundCoords,
        confirmedFeatures: {
          color: featureColor,
          publicDescription: `${name.trim()}: ${description.trim()}`,
        },
        storageMethod,
        ...(storageMethod === 'MOVED_TO_SAFE_PLACE'
          ? { storageDesc: storageDesc.trim() }
          : {}),
        ...(storageMethod === 'HANDED_TO_CENTER' ? { centerId } : {}),
      };
      await completeFoundItemDraft(draft.id, request);
      const item = await getFoundItem(draft.id);
      if (!isMounted.current) return;
      if (item.status === 'DRAFT') {
        throw new Error('Draft completion did not transition the item.');
      }

      setDraft(null);
      setIsHandoverOpen(false);
      setCreated(item);
    } catch (error) {
      if (!isMounted.current) return;

      if (
        error instanceof ApiError &&
        (error.code === 'NOT_FOUND' || error.code === 'INVALID_STATE_TRANSITION')
      ) {
        setDraft(null);
        setConfirmedColor(null);
        setStep(1);
        setBanner({
          title: '등록하지 못했어요',
          body: '잠시 후 다시 시도해 주세요.',
        });
        return;
      }

      if (error instanceof ApiError && error.code === 'VALIDATION_ERROR') {
        const nextErrors: FieldErrors = {};
        let earliestStep = 4;

        for (const detail of error.details) {
          const field = detail.field as keyof typeof FIELD_STEPS;
          if (FIELD_STEPS[field]) {
            nextErrors[field] = FIELD_ERROR_MESSAGES[field] ?? '입력한 내용을 다시 확인해 주세요.';
            earliestStep = Math.min(earliestStep, FIELD_STEPS[field]);
          }
        }

        setFieldErrors(nextErrors);
        setStep(earliestStep);
        setBanner({
          title: '입력한 내용을 다시 확인해 주세요',
          body:
            Object.keys(nextErrors).length > 0
              ? '표시한 항목을 고치면 등록할 수 있어요.'
              : '일부 항목이 규칙과 맞지 않아요.',
        });
        return;
      }

      if (error instanceof ApiError && error.code === 'UNAUTHENTICATED') {
        return;
      }

      setBanner({
        title: '등록하지 못했어요',
        body:
          error instanceof ApiError
            ? error.message
            : '잠시 후 다시 시도해 주세요.',
      });
    } finally {
      if (isMounted.current) {
        setIsSubmitting(false);
      }
    }
  }

  function handleFinalStepSubmit() {
    const errors = validateFormStep(4);
    setFieldErrors(errors);

    if (Object.keys(errors).length > 0 || !storageMethod || !foundAt || !category) {
      setBanner({
        title: '보관 상태를 확인해 주세요.',
        body: '빨간 글씨로 표시된 항목을 채우면 등록할 수 있어요.',
      });
      return;
    }

    if (!foundCoords) {
      setStep(2);
      setFieldErrors({ location: FIELD_ERROR_MESSAGES.location });
      setBanner(MISSING_LOCATION_BANNER);
      return;
    }

    void handleSubmit();
  }

  function handleRegisterAnother() {
    setCreated(null);
    setDraft(null);
    setConfirmedColor(null);
    setIsHandoverOpen(false);
    setIsHandoverCompleted(false);
    setResumedHandoverItemId(null);
    setStep(1);
    setImages([]);
    setName('');
    setCategory(null);
    setDescription('');
    setFoundLocationText('');
    setFoundCoords(null);
    setFoundAt(null);
    setAutoFilled({ location: false, foundAt: false });
    setStorageMethod(null);
    setStorageDesc('');
    setCenterId(null);
    setHandedAt(null);
    setFieldErrors({});
    setBanner(null);
  }

  function handleGoHome() {
    handleRegisterAnother();
    router.replace('/home');
  }

  async function handleCompleteHandover() {
    const targetItemId = created?.id ?? resumedHandoverItemId;
    if (!targetItemId || !centerId || !handedAt || !foundAt) {
      setFieldErrors((current) => ({
        ...current,
        handedAt: !handedAt ? FIELD_ERROR_MESSAGES.handedAt : current.handedAt,
      }));
      return;
    }

    if (handedAt.getTime() < foundAt.getTime() || handedAt.getTime() > Date.now()) {
      setFieldErrors((current) => ({
        ...current,
        handedAt:
          handedAt.getTime() < foundAt.getTime()
            ? '인계 시각은 습득 일시보다 빠를 수 없어요.'
            : '인계 시각은 미래일 수 없어요.',
      }));
      return;
    }

    setIsSubmitting(true);
    setBanner(null);
    try {
      await confirmFoundItemHandover(targetItemId);
      if (!isMounted.current) return;
      setResumedHandoverItemId(null);
      setIsHandoverCompleted(true);
    } catch (error) {
      if (!isMounted.current) return;
      setBanner({
        title: '인계 정보를 등록하지 못했어요',
        body: error instanceof ApiError ? error.message : '잠시 후 다시 시도해 주세요.',
      });
    } finally {
      if (isMounted.current) {
        setIsSubmitting(false);
      }
    }
  }

  const showsCenterHandoverCompletion =
    created !== null &&
    storageMethod === 'HANDED_TO_CENTER' &&
    selectedCenter !== null &&
    !isHandoverCompleted;
  const dateTimeSheet = (
    <DateTimeSheet
      editableParts={dateTarget ? ['minute'] : undefined}
      maximumDate={null}
      minimumDate={null}
      onCancel={() => setDateTarget(null)}
      onConfirm={(next) => {
        if (dateTarget === 'foundAt') {
          setFoundAt(next);
          clearFieldError('foundAt');
        } else if (dateTarget === 'handedAt') {
          setHandedAt(next);
          clearFieldError('handedAt');
        }
        setDateTarget(null);
      }}
      title={dateTarget === 'handedAt' ? '인계 시각' : '습득 일시'}
      value={(dateTarget === 'handedAt' ? handedAt : foundAt) ?? new Date()}
      visible={dateTarget !== null}
    />
  );

  if (isLoadingPendingHandover) {
    return (
      <View style={[styles.loadingScreen, { backgroundColor: colors.page }]}>
        <ActivityIndicator color={colors.action} />
      </View>
    );
  }

  if (isHandoverOpen && selectedCenter && foundAt) {
    return (
      <>
        <RegisterHandoverView
          banner={banner}
          center={selectedCenter}
          handedAt={handedAt}
          isCompleting={isSubmitting}
          isCompleted={isHandoverCompleted}
          onBack={() => {
            setBanner(null);
            if (resumedHandoverItemId && !created) {
              router.replace('/home');
            } else {
              setIsHandoverOpen(false);
            }
          }}
          onChangeHandedAt={() => setDateTarget('handedAt')}
          onComplete={() => void handleCompleteHandover()}
          onGoHome={handleGoHome}
          onSetCurrentTime={() => {
            setHandedAt(new Date());
            clearFieldError('handedAt');
          }}
          timeError={fieldErrors.handedAt}
        />
        {dateTimeSheet}
      </>
    );
  }

  if (created) {
    return (
      <RegisterCompletionView
        item={created}
        itemName={name.trim()}
        centerName={selectedCenter?.name ?? null}
        featureSaveFailed={false}
        onGoHome={handleGoHome}
        onOpenHandover={() => {
          setIsHandoverCompleted(false);
          setIsHandoverOpen(true);
        }}
        showHandoverAction={showsCenterHandoverCompletion}
      />
    );
  }

  const categoryLabel = CATEGORIES.find((option) => option.value === category)?.label ?? null;

  return (
    <View style={[styles.screen, { backgroundColor: colors.page }]}>
      <StatusBar style="light" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <StepHero step={step} onBack={handleBack} />

          <View style={styles.stack}>
            {banner ? <ErrorBanner title={banner.title} body={banner.body} /> : null}

            {step === 1 ? (
              <RegisterPhotoStep
                canRemovePhoto={() => true}
                errors={fieldErrors}
                imageLimit={MAX_IMAGE_COUNT}
                images={images}
                onRemovePhoto={handleRemovePhoto}
                onTakePhoto={handleTakePhoto}
              />
            ) : null}

            {step === 2 ? (
              <RegisterFoundInfoStep
                autoFilled={autoFilled}
                errors={fieldErrors}
                foundAt={foundAt}
                foundCoords={foundCoords}
                foundLocationText={foundLocationText}
                isLocating={isLocating}
                onChangeLocationText={(value) => {
                  setFoundLocationText(value);
                  clearFieldError('foundLocationText');
                }}
                onOpenFoundAt={() => setDateTarget('foundAt')}
                onSetFoundAtNow={() => {
                  setFoundAt(new Date());
                  clearFieldError('foundAt');
                }}
                onUseCurrentLocation={handleUseCurrentLocation}
              />
            ) : null}

            {step === 3 ? (
              <RegisterItemInfoStep
                categoryLabel={categoryLabel}
                confirmedColor={confirmedColor}
                description={description}
                errors={fieldErrors}
                isCategoryOpen={isCategoryOpen}
                name={name}
                onConfirmColor={(color) => {
                  setConfirmedColor(color);
                  clearFieldError('description');
                }}
                onChangeDescription={(value) => {
                  setDescription(value);
                  clearFieldError('description');
                }}
                onChangeName={(value) => {
                  setName(value);
                  clearFieldError('name');
                }}
                onOpenCategory={() => setIsCategoryOpen(true)}
                visionSuggestion={draft?.visionSuggestion ?? null}
              />
            ) : null}

            {step === 4 ? (
              <RegisterStorageStep
                centerId={centerId}
                centers={displayedCenters}
                centersError={centersError}
                errors={fieldErrors}
                foundCoords={foundCoords}
                isLoadingCenters={isLoadingCenters}
                onChangeStorageDesc={(value) => {
                  setStorageDesc(value);
                  clearFieldError('storageDesc');
                }}
                onRetryCenters={() => void loadCenters()}
                onSelectCenter={handleSelectCenter}
                onSelectStorageMethod={handleSelectStorageMethod}
                selectedCenter={selectedCenter}
                storageDesc={storageDesc}
                storageMethod={storageMethod}
              />
            ) : null}
          </View>
        </ScrollView>

        <View
          style={[
            styles.bottomBar,
            {
              backgroundColor: colors.page,
              borderTopColor: colors.line,
              paddingBottom: Math.max(insets.bottom, 24),
            },
          ]}>
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ busy: isSubmitting, disabled: isSubmitting }}
            disabled={isSubmitting}
            onPress={step === 4 ? handleFinalStepSubmit : () => void handleNext()}
            style={({ pressed }) => [
              styles.primaryButton,
              { backgroundColor: colors.action },
              pressed && styles.pressed,
              isSubmitting && styles.disabled,
            ]}>
            {isSubmitting ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.primaryButtonText}>{step === 4 ? '등록하기' : '다음'}</Text>
            )}
          </Pressable>
        </View>
      </KeyboardAvoidingView>

      <Modal
        animationType="fade"
        onRequestClose={() => setIsCategoryOpen(false)}
        transparent
        visible={isCategoryOpen}>
        <Pressable
          accessibilityLabel="닫기"
          accessibilityRole="button"
          onPress={() => setIsCategoryOpen(false)}
          style={styles.scrim}
        />
        <View
          style={[styles.sheet, { backgroundColor: colors.surface, borderColor: colors.line }]}>
          <Text style={[styles.cardTitle, { color: colors.ink }]}>카테고리 선택</Text>
          <ScrollView showsVerticalScrollIndicator={false} style={styles.sheetList}>
            {CATEGORIES.map((option) => (
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ selected: option.value === category }}
                key={option.value}
                onPress={() => {
                  setCategory(option.value);
                  setIsCategoryOpen(false);
                  clearFieldError('category');
                }}
                style={({ pressed }) => [styles.sheetItem, pressed && styles.pressed]}>
                <Text
                  style={[
                    styles.sheetItemText,
                    {
                      color: option.value === category ? colors.actionText : colors.ink,
                      fontWeight: option.value === category ? '700' : '400',
                    },
                  ]}>
                  {option.label}
                </Text>
                {option.value === category ? (
                  <SymbolView name={ICONS.check} size={15} tintColor={colors.actionText} />
                ) : null}
              </Pressable>
            ))}
          </ScrollView>
        </View>
      </Modal>

      {dateTimeSheet}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  loadingScreen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  stack: {
    gap: 12,
    padding: 16,
  },
  cardTitle: {
    fontFamily: appFontFamily,
    fontSize: 13,
    fontWeight: '700',
  },
  bottomBar: {
    gap: 8,
    paddingTop: 12,
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderTopWidth: 1,
  },
  primaryButton: {
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 11,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontFamily: appFontFamily,
    fontSize: 14,
    fontWeight: '700',
  },
  scrim: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: '#0E151299',
  },
  sheet: {
    position: 'absolute',
    right: 12,
    bottom: 12,
    left: 12,
    gap: 8,
    padding: 16,
    borderWidth: 1,
    borderRadius: 16,
  },
  sheetList: {
    maxHeight: 320,
  },
  sheetItem: {
    minHeight: 46,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  sheetItemText: {
    fontFamily: appFontFamily,
    fontSize: 14,
  },
  pressed: {
    opacity: 0.76,
  },
  disabled: {
    opacity: 0.55,
  },
});
