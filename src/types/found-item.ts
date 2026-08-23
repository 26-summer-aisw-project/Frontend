export type FoundItemStatus = 'PROCESSING' | 'ACTIVE' | 'EXPIRED' | 'RETURNED';

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

export interface CreateFoundItemRequest {
  category: string;
  foundAt: string;
  location: GeoPoint;
  storageMethod: StorageMethod;
  storageDesc?: string | null;
  centerId?: string | null;
  handedAt?: string | null;
  expectedImageCount: number;
}

export type UpdateFoundItemRequest = Partial<
  Pick<
    CreateFoundItemRequest,
    | 'category'
    | 'foundAt'
    | 'location'
    | 'storageMethod'
    | 'storageDesc'
    | 'centerId'
    | 'handedAt'
    | 'expectedImageCount'
  >
>;

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
  status: FoundItemStatus;
  expiredAt: string;
  returnSource: ReturnSource | null;
  createdAt: string;
  updatedAt: string;
}

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
    if (!hasHandedAt) {
      errors.handedAt = 'REQUIRED';
    }
  }

  if (input.storageMethod !== 'MOVED_TO_SAFE_PLACE' && hasStorageDesc) {
    errors.storageDesc = 'FORBIDDEN';
  }

  if (input.storageMethod !== 'HANDED_TO_CENTER') {
    if (hasCenterId) {
      errors.centerId = 'FORBIDDEN';
    }
    if (hasHandedAt) {
      errors.handedAt = 'FORBIDDEN';
    }
  }

  return errors;
}

export function normalizeStorageFields(input: {
  storageMethod: StorageMethod;
  storageDesc?: string | null;
  centerId?: string | null;
  handedAt?: string | null;
}): Partial<Pick<CreateFoundItemRequest, 'storageDesc' | 'centerId' | 'handedAt'>> {
  switch (input.storageMethod) {
    case 'MOVED_TO_SAFE_PLACE':
      return {
        storageDesc: (input.storageDesc ?? '').trim() || null,
      };
    case 'HANDED_TO_CENTER':
      return {
        centerId: input.centerId ?? null,
        handedAt: input.handedAt ?? null,
      };
    case 'LEFT_IN_PLACE':
    default:
      return {};
  }
}
