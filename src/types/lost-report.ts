import type { GeoPoint } from '@/src/types/found-item';

export const LOST_REPORT_RADIUS_METERS = 500;
export const MIN_WAYPOINT_COUNT = 1;
export const MAX_WAYPOINT_COUNT = 5;

export type LostTimeBand =
  | 'MORNING'
  | 'LUNCH'
  | 'AFTERNOON'
  | 'EVENING'
  | 'NIGHT'
  | null;

export type LostReportStatus = 'OPEN' | 'CLOSED' | 'EXPIRED';

export type LostWaypoint = {
  ordinal: number;
  point: GeoPoint;
};

export type CreateLostReportRequest = {
  category: string;
  description: string;
  lostAtFrom: string;
  lostAtTo: string;
  searchRadiusMeters: number;
  waypoints: LostWaypoint[];
};

export type LostReportResponse = CreateLostReportRequest & {
  id: string;
  reporterId: string;
  status: LostReportStatus;
  expiredAt: string;
  lastMatchedAt: string | null;
  candidatesStale: boolean;
  resolvedCandidateId: string | null;
  resolvedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

