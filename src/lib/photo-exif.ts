import { isValidGeoPoint, type GeoPoint } from '@/src/types/found-item';

export type ExifMap = Record<string, unknown>;

export type ExifHints = {
  location: GeoPoint | null;
  takenAt: Date | null;
};

function parseRational(token: string): number | null {
  const trimmed = token.trim();
  if (trimmed.length === 0) {
    return null;
  }

  if (trimmed.includes('/')) {
    const [rawNumerator, rawDenominator] = trimmed.split('/');
    const numerator = Number(rawNumerator);
    const denominator = Number(rawDenominator);
    if (!Number.isFinite(numerator) || !Number.isFinite(denominator) || denominator === 0) {
      return null;
    }
    return numerator / denominator;
  }

  const value = Number(trimmed);
  return Number.isFinite(value) ? value : null;
}

function fromDegreesMinutesSeconds(parts: (number | null)[]): number | null {
  if (parts.some((part) => part === null)) {
    return null;
  }

  const [degrees, minutes = 0, seconds = 0] = parts as number[];
  return degrees + minutes / 60 + seconds / 3600;
}

function toDecimalDegrees(value: unknown): number | null {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null;
  }

  if (Array.isArray(value)) {
    const parts = value.map((part) =>
      typeof part === 'number' ? part : typeof part === 'string' ? parseRational(part) : null,
    );
    return fromDegreesMinutesSeconds(parts.slice(0, 3));
  }

  if (typeof value === 'string') {
    const tokens = value.split(',');
    if (tokens.length > 1) {
      return fromDegreesMinutesSeconds(tokens.slice(0, 3).map(parseRational));
    }
    return parseRational(value);
  }

  return null;
}

function applyHemisphere(value: number, ref: unknown, negativeRef: string): number {
  const normalized = typeof ref === 'string' ? ref.trim().toUpperCase() : '';
  if (normalized === negativeRef) {
    return -Math.abs(value);
  }
  return value;
}

function parseExifDateTime(value: unknown): Date | null {
  if (typeof value !== 'string') {
    return null;
  }

  const match = value
    .trim()
    .match(/^(\d{4})[:-](\d{2})[:-](\d{2})[T ](\d{2}):(\d{2})(?::(\d{2}))?/);
  if (!match) {
    return null;
  }

  const [, year, month, day, hour, minute, second] = match;
  const parsed = new Date(
    Number(year),
    Number(month) - 1,
    Number(day),
    Number(hour),
    Number(minute),
    Number(second ?? '0'),
  );

  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  if (parsed.getTime() > Date.now()) {
    return null;
  }

  return parsed;
}

function readKey(exif: ExifMap, key: string): unknown {
  if (exif[key] !== undefined) {
    return exif[key];
  }

  const gps = exif.GPS;
  if (gps && typeof gps === 'object') {
    const nested = gps as ExifMap;
    const withoutPrefix = key.startsWith('GPS') ? key.slice(3) : key;
    return nested[key] ?? nested[withoutPrefix];
  }

  return undefined;
}

export function readExifHints(exif: ExifMap | null | undefined): ExifHints {
  const empty: ExifHints = { location: null, takenAt: null };
  if (!exif || typeof exif !== 'object') {
    return empty;
  }

  try {
    const rawLatitude = toDecimalDegrees(readKey(exif, 'GPSLatitude'));
    const rawLongitude = toDecimalDegrees(readKey(exif, 'GPSLongitude'));

    let location: GeoPoint | null = null;
    if (rawLatitude !== null && rawLongitude !== null) {
      const candidate: GeoPoint = {
        latitude: applyHemisphere(rawLatitude, readKey(exif, 'GPSLatitudeRef'), 'S'),
        longitude: applyHemisphere(rawLongitude, readKey(exif, 'GPSLongitudeRef'), 'W'),
      };
      location =
        isValidGeoPoint(candidate) && (candidate.latitude !== 0 || candidate.longitude !== 0)
          ? candidate
          : null;
    }

    const takenAt =
      parseExifDateTime(readKey(exif, 'DateTimeOriginal')) ??
      parseExifDateTime(readKey(exif, 'DateTimeDigitized')) ??
      parseExifDateTime(readKey(exif, 'DateTime'));

    return { location, takenAt };
  } catch {
    return empty;
  }
}
