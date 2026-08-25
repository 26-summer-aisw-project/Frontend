import { apiRequest } from '@/src/lib/api';
import { MOCK_API } from '@/src/config/env';
import type { GeoPoint } from '@/src/types/found-item';
import type {
  ConfirmLostReportRecoveryRequest,
  ConfirmLostReportRecoveryResponse,
  CreateLostReportRequest,
  LostReportCandidatesResponse,
  LostReportResponse,
  LostTimeBand,
} from '@/src/types/lost-report';

type PlaceSearchResult = {
  name: string;
  point: GeoPoint;
};

type PlaceSearchResponse = {
  data: PlaceSearchResult[];
};

const MOCK_PLACES: PlaceSearchResult[] = [
  {
    name: '숭실대학교',
    point: { latitude: 37.4963, longitude: 126.9572 },
  },
  {
    name: '숭실대입구역',
    point: { latitude: 37.496, longitude: 126.9538 },
  },
  {
    name: '상도역',
    point: { latitude: 37.5028, longitude: 126.9479 },
  },
];

const TIME_BAND_HOURS: Record<Exclude<LostTimeBand, null>, [number, number]> = {
  MORNING: [6, 11],
  LUNCH: [11, 14],
  AFTERNOON: [14, 18],
  EVENING: [18, 21],
  NIGHT: [21, 24],
};

function toUtcIso(date: Date): string {
  return date.toISOString().replace(/\.\d{3}Z$/, 'Z');
}

export function toLostAtRange(
  selectedDate: Date,
  timeBand: LostTimeBand,
): { lostAtFrom: string; lostAtTo: string } {
  const from = new Date(selectedDate);
  const to = new Date(selectedDate);

  if (timeBand === null) {
    from.setHours(0, 0, 0, 0);
    to.setHours(23, 59, 59, 999);
  } else {
    const [startHour, endHour] = TIME_BAND_HOURS[timeBand];
    from.setHours(startHour, 0, 0, 0);
    to.setHours(endHour, 0, 0, 0);
    to.setMilliseconds(to.getMilliseconds() - 1);
  }

  return {
    lostAtFrom: toUtcIso(from),
    lostAtTo: toUtcIso(to),
  };
}

export async function searchPlaces(query: string): Promise<PlaceSearchResponse> {
  const normalized = query.trim();
  if (!MOCK_API) {
    return { data: [] };
  }

  return {
    data: MOCK_PLACES.filter((place) =>
      place.name.toLowerCase().includes(normalized.toLowerCase()),
    ),
  };
}

export async function createLostReport(
  request: CreateLostReportRequest,
): Promise<LostReportResponse> {
  return apiRequest<LostReportResponse>('/lost-reports', {
    method: 'POST',
    json: request,
  });
}

export async function getLostReportCandidates(
  reportId: string,
): Promise<LostReportCandidatesResponse> {
  return apiRequest<LostReportCandidatesResponse>(`/lost-reports/${reportId}/candidates`);
}

export async function refreshLostReportCandidates(
  reportId: string,
): Promise<LostReportCandidatesResponse> {
  return apiRequest<LostReportCandidatesResponse>(
    `/lost-reports/${reportId}/candidates:refresh`,
    { method: 'POST' },
  );
}

export async function confirmLostReportRecovery(
  reportId: string,
  request: ConfirmLostReportRecoveryRequest,
): Promise<ConfirmLostReportRecoveryResponse> {
  return apiRequest<ConfirmLostReportRecoveryResponse>(
    `/lost-reports/${reportId}:confirm-recovered`,
    {
      method: 'POST',
      json: request,
    },
  );
}
