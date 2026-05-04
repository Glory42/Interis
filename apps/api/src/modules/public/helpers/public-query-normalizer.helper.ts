const DEFAULT_PUBLIC_RECENT_LIMIT = 10;
const MAX_PUBLIC_RECENT_LIMIT = 20;
const DEFAULT_PUBLIC_ACTIVITY_LIMIT = 30;
const MAX_PUBLIC_ACTIVITY_LIMIT = 100;
const DEFAULT_PUBLIC_COLLECTION_LIMIT = 50;
const MAX_PUBLIC_COLLECTION_LIMIT = 200;

const normalizePositiveLimit = (
  rawLimit: unknown,
  fallback: number,
  max: number,
): number => {
  const parsed = Number(rawLimit);
  if (Number.isNaN(parsed) || parsed <= 0) {
    return fallback;
  }

  return Math.min(max, Math.floor(parsed));
};

export const normalizePublicRecentLimit = (rawLimit: unknown): number => {
  return normalizePositiveLimit(
    rawLimit,
    DEFAULT_PUBLIC_RECENT_LIMIT,
    MAX_PUBLIC_RECENT_LIMIT,
  );
};

export const normalizePublicActivityLimit = (rawLimit: unknown): number => {
  return normalizePositiveLimit(
    rawLimit,
    DEFAULT_PUBLIC_ACTIVITY_LIMIT,
    MAX_PUBLIC_ACTIVITY_LIMIT,
  );
};

export const normalizePublicCollectionLimit = (rawLimit: unknown): number => {
  return normalizePositiveLimit(
    rawLimit,
    DEFAULT_PUBLIC_COLLECTION_LIMIT,
    MAX_PUBLIC_COLLECTION_LIMIT,
  );
};
