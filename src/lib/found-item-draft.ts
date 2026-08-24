import { apiRequest } from '@/src/lib/api';
import type {
  AllowedImageContentType,
  CompleteFoundItemDraftRequest,
  FoundItemDetailResponse,
  FoundItemDraftResponse,
} from '@/src/types/found-item';

export type DraftImage = {
  uri: string;
  contentType: AllowedImageContentType;
  file?: File;
};

export async function createFoundItemDraft(
  images: DraftImage[],
): Promise<FoundItemDraftResponse> {
  const formData = new FormData();

  images.forEach((image, index) => {
    const filePart = image.file ?? {
      uri: image.uri,
      name: `found-item-${index + 1}.${image.contentType.split('/')[1]}`,
      type: image.contentType,
    };
    // React Native FormData는 DOM 타입에 없는 파일 descriptor 객체를 지원한다.
    formData.append('images', filePart as Blob);
  });
  formData.append('totalImageCount', String(images.length));

  return apiRequest<FoundItemDraftResponse>('/found-items/drafts', {
    method: 'POST',
    body: formData,
  });
}

export async function getFoundItem(itemId: string): Promise<FoundItemDetailResponse> {
  return apiRequest<FoundItemDetailResponse>(`/found-items/${itemId}`);
}

export async function completeFoundItemDraft(
  itemId: string,
  request: CompleteFoundItemDraftRequest,
): Promise<void> {
  await apiRequest<unknown>(`/found-items/${itemId}`, {
    method: 'PATCH',
    json: request,
  });
}

export async function confirmFoundItemHandover(itemId: string): Promise<void> {
  await apiRequest<unknown>(`/found-items/${itemId}:confirm-handover`, {
    method: 'POST',
    json: {},
  });
}
