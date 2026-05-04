const APP_ORIGIN = "http://tic.local";

const normalizePathLikeValue = (value: unknown): string | null => {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim();
  if (normalized.length === 0) {
    return null;
  }

  if (!normalized.startsWith("/")) {
    return null;
  }

  if (normalized.startsWith("//")) {
    return null;
  }

  return normalized;
};

export const normalizeInternalRedirectPath = (value: unknown): string | null => {
  const normalized = normalizePathLikeValue(value);
  if (!normalized) {
    return null;
  }

  try {
    const parsed = new URL(normalized, APP_ORIGIN);
    if (parsed.origin !== APP_ORIGIN) {
      return null;
    }

    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return null;
  }
};

export const getSafeRedirectPath = (
  value: unknown,
  fallbackPath = "/",
): string => {
  return normalizeInternalRedirectPath(value) ?? fallbackPath;
};
