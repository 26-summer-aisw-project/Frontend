export type FoundItemStatus = 'DRAFT' | 'PROCESSING' | 'ACTIVE' | 'EXPIRED' | 'RETURNED';

export type RegisteredFoundItemStatus = Exclude<FoundItemStatus, 'DRAFT'>;

export type VisionStatus = 'PENDING' | 'READY';

export type StorageMethod = 'LEFT_IN_PLACE' | 'MOVED_TO_SAFE_PLACE' | 'HANDED_TO_CENTER';

export type ReturnSource = 'REPORTER_CONFIRMED' | 'CENTER_CONFIRMED';

export interface GeoPoint {
  latitude: number;
  longitude: number;
}

export function isValidGeoPoint(point: GeoPoint | null | undefined): point is GeoPoint {
  return (
    !!point &&
    Number.isFinite(point.latitude) &&
    Number.isFinite(point.longitude) &&
    Math.abs(point.latitude) <= 90 &&
    Math.abs(point.longitude) <= 180
  );
}

export interface VisionSuggestion {
  color: string;
  publicDescription: string;
}

export interface FoundItemDraftResponse {
  id: string;
  status: 'DRAFT';
  uploadedImageCount?: number;
  expectedImageCount?: number;
  visionStatus: VisionStatus;
  visionSuggestion?: VisionSuggestion;
  draftExpiresAt: string;
}

export interface ConfirmedFeatures {
  color: string;
  publicDescription: string;
}

export interface CompleteFoundItemDraftRequest {
  category: string;
  foundAt: string;
  foundLocation: GeoPoint;
  confirmedFeatures: ConfirmedFeatures;
  storageMethod: StorageMethod;
  storageDesc?: string | null;
  centerId?: string | null;
}

export type UpdateFoundItemRequest = Partial<CompleteFoundItemDraftRequest>;

export interface FoundItemResponse {
  id: string;
  finderId: string;
  category: string;
  foundAt: string;
  location: GeoPoint;
  storageMethod: StorageMethod;
  storageDesc: string | null;
  centerId: string | null;
  handedAt: string | null;
  expectedImageCount: number;
  status: RegisteredFoundItemStatus;
  expiredAt: string;
  returnSource: ReturnSource | null;
  createdAt: string;
  updatedAt: string;
}

export type FoundItemDetailResponse = FoundItemDraftResponse | FoundItemResponse;

export interface LostCenter {
  id: string;
  name: string;
  address: string;
  contactPhone: string | null;
  location: GeoPoint | null;
  retentionDays: number | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export const DEFAULT_RETENTION_DAYS = 14;

export type ThumbnailStatus = 'PENDING' | 'READY' | 'FAILED';

export const ALLOWED_IMAGE_CONTENT_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;

export type AllowedImageContentType = (typeof ALLOWED_IMAGE_CONTENT_TYPES)[number];

export interface RequestImageUploadRequest {
  contentType: AllowedImageContentType;
  byteSize: number;
  sha256: string;
  sortOrder?: number;
  replacementImageId?: string;
}

export interface ImageUploadGrant {
  uploadToken: string;
  uploadUrl: string;
  method: 'PUT';
  requiredHeaders: Record<string, string>;
  expiresAt: string;
  maxByteSize: number;
}

export interface FinalizeImageRequest {
  uploadToken: string;
}

export interface FoundItemImageResponse {
  id: string;
  itemId: string;
  contentType: AllowedImageContentType;
  byteSize: number;
  sha256: string;
  sortOrder: number;
  thumbnailStatus: ThumbnailStatus;
  originalUrl?: string;
  thumbnailUrl?: string;
  urlExpiresAt?: string;
  createdAt: string;
}

export type ItemFeatureSource = 'FINDER' | 'AI' | 'SYSTEM';

export type ItemFeatureVisibility = 'CANDIDATE_VIEW' | 'MATCH_ONLY';

export interface CreateItemFeatureRequest {
  kind: string;
  value: string;
  visibility: ItemFeatureVisibility;
  ordinal?: number;
}

export interface ItemFeatureResponse {
  id: string;
  itemId: string;
  kind: string;
  value: string;
  source: ItemFeatureSource;
  visibility: ItemFeatureVisibility;
  ordinal: number;
  confidence?: number;
  createdAt: string;
  updatedAt: string;
}

export const MAX_IMAGE_COUNT = 5;

export const MAX_IMAGE_BYTES = 10 * 1024 * 1024;

export interface PagedResponse<T> {
  data: T[];
  meta: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
  };
}

export function validateStorageFields(input: {
  storageMethod: StorageMethod;
  storageDesc?: string | null;
  centerId?: string | null;
  handedAt?: string | null;
}): Partial<Record<'storageDesc' | 'centerId' | 'handedAt', string>> {
  const errors: Partial<Record<'storageDesc' | 'centerId' | 'handedAt', string>> = {};
  const hasStorageDesc = (input.storageDesc ?? '').trim().length > 0;
  const hasCenterId = (input.centerId ?? '').trim().length > 0;
  const hasHandedAt = (input.handedAt ?? '').trim().length > 0;

  if (input.storageMethod === 'MOVED_TO_SAFE_PLACE' && !hasStorageDesc) {
    errors.storageDesc = 'REQUIRED';
  }

  if (input.storageMethod === 'HANDED_TO_CENTER') {
    if (!hasCenterId) {
      errors.centerId = 'REQUIRED';
    }
  }

  if (input.storageMethod !== 'MOVED_TO_SAFE_PLACE' && hasStorageDesc) {
    errors.storageDesc = 'FORBIDDEN';
  }

  if (input.storageMethod !== 'HANDED_TO_CENTER' && hasCenterId) {
    errors.centerId = 'FORBIDDEN';
  }

  if (hasHandedAt) {
    errors.handedAt = 'FORBIDDEN';
  }

  return errors;
}
