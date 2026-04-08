const DEFAULT_PUBLIC_RECENT_LIMIT = 10;
const MAX_PUBLIC_RECENT_LIMIT = 20;

export const normalizePublicRecentLimit = (rawLimit: unknown): number => {
  const parsed = Number(rawLimit);
  if (Number.isNaN(parsed) || parsed <= 0) {
    return DEFAULT_PUBLIC_RECENT_LIMIT;
  }

  return Math.min(MAX_PUBLIC_RECENT_LIMIT, parsed);
};
