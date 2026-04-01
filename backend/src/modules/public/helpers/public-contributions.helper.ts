import { CONTRIBUTION_MEDIA_MASK_BITS } from "../constants/public-contributions.constants";
import type {
  ContributionMediaCounts,
  ContributionMediaType,
  PublicContributionDay,
} from "../types/public-contributions.types";

export const emptyMediaCounts = (): ContributionMediaCounts => ({
  film: 0,
  tv: 0,
  book: 0,
  music: 0,
});

export const toUtcDateKey = (value: Date): string => {
  const year = value.getUTCFullYear();
  const month = `${value.getUTCMonth() + 1}`.padStart(2, "0");
  const day = `${value.getUTCDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const parseMetadata = (raw: string | null): Record<string, unknown> => {
  if (!raw) {
    return {};
  }

  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object") {
      return parsed as Record<string, unknown>;
    }
  } catch {
    return {};
  }

  return {};
};

const toContributionMediaType = (value: unknown): ContributionMediaType | null => {
  if (value === "film" || value === "movie") {
    return "film";
  }

  if (value === "tv" || value === "serial") {
    return "tv";
  }

  if (value === "book" || value === "music") {
    return value;
  }

  return null;
};

export const resolveContributionMediaTypes = (
  activityType: string,
  metadata: string | null,
): ContributionMediaType[] => {
  const parsedMetadata = parseMetadata(metadata);
  const mediaTypesFromMetadata = parsedMetadata.mediaTypes;

  if (Array.isArray(mediaTypesFromMetadata)) {
    const normalized = mediaTypesFromMetadata
      .map((item) => toContributionMediaType(item))
      .filter((item): item is ContributionMediaType => item !== null);

    if (normalized.length > 0) {
      return [...new Set(normalized)];
    }
  }

  const mediaType = toContributionMediaType(parsedMetadata.mediaType);
  if (mediaType) {
    return [mediaType];
  }

  if (activityType === "diary_entry" || activityType === "review") {
    return ["film"];
  }

  return [];
};

export const createEmptyContributionDay = (
  date: string,
): PublicContributionDay => ({
  date,
  totalCount: 0,
  logCount: 0,
  reviewCount: 0,
  mediaCounts: emptyMediaCounts(),
  mediaMask: 0,
});

export const applyContributionMediaTypes = (
  day: PublicContributionDay,
  mediaTypes: ContributionMediaType[],
): void => {
  for (const mediaType of mediaTypes) {
    day.mediaCounts[mediaType] += 1;
    day.mediaMask |= CONTRIBUTION_MEDIA_MASK_BITS[mediaType];
  }
};
