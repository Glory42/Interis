export const normalizeSocialFeedLimit = (
  limit: unknown,
  fallback = 20,
): number => {
  if (typeof limit !== "string") {
    return fallback;
  }

  const parsed = Number.parseInt(limit, 10);
  return Number.isNaN(parsed) ? fallback : parsed;
};
