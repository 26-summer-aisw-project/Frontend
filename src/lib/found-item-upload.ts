import * as Crypto from 'expo-crypto';
import { File } from 'expo-file-system';

import { MOCK_API } from '@/src/config/env';
import { apiRequest } from '@/src/lib/api';
import {
  MAX_IMAGE_BYTES,
  type AllowedImageContentType,
  type FinalizeImageRequest,
  type FoundItemImageResponse,
  type ImageUploadGrant,
  type RequestImageUploadRequest,
} from '@/src/types/found-item';

export interface FoundItemUploadSource {
  uri: string;
  contentType: AllowedImageContentType;
}

function toHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer), (byte) => byte.toString(16).padStart(2, '0')).join('');
}

export async function uploadFoundItemImage(
  itemId: string,
  source: FoundItemUploadSource,
  sortOrder: number,
): Promise<FoundItemImageResponse> {
  const bytes = await new File(source.uri).bytes();
  if (bytes.byteLength < 1 || bytes.byteLength > MAX_IMAGE_BYTES) {
    throw new Error('INVALID_IMAGE_SIZE');
  }

  const digest = await Crypto.digest(Crypto.CryptoDigestAlgorithm.SHA256, bytes);
  const request: RequestImageUploadRequest = {
    contentType: source.contentType,
    byteSize: bytes.byteLength,
    sha256: toHex(digest),
    sortOrder,
  };
  const grant = await apiRequest<ImageUploadGrant>(
    `/found-items/${itemId}/image-upload-requests`,
    { method: 'POST', json: request },
  );

  if (bytes.byteLength > grant.maxByteSize) {
    throw new Error('IMAGE_EXCEEDS_UPLOAD_GRANT');
  }

  if (!MOCK_API) {
    const uploadResponse = await fetch(grant.uploadUrl, {
      method: grant.method,
      headers: grant.requiredHeaders,
      body: bytes.buffer,
    });
    if (!uploadResponse.ok) {
      throw new Error('OBJECT_STORAGE_UPLOAD_FAILED');
    }
  }

  const finalizeRequest: FinalizeImageRequest = { uploadToken: grant.uploadToken };
  return apiRequest<FoundItemImageResponse>(`/found-items/${itemId}/images`, {
    method: 'POST',
    json: finalizeRequest,
  });
}
