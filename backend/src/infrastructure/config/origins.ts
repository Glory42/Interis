const normalizeOrigin = (value: string): string => {
  return value.trim().replace(/\/+$/, "");
};

const parseOriginFromValue = (value: string): string | null => {
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  try {
    const parsed = new URL(trimmed);
    return normalizeOrigin(parsed.origin);
  } catch {
    return null;
  }
};

export const getTrustedOriginsFromEnv = (): string[] => {
  const rawOrigins = process.env.CORS_ORIGIN ?? "";

  const trustedOrigins = rawOrigins
    .split(",")
    .map((value) => parseOriginFromValue(value))
    .filter((value): value is string => Boolean(value));

  if (trustedOrigins.length === 0) {
    return ["http://localhost:5173", "http://127.0.0.1:5173"];
  }

  return [...new Set(trustedOrigins)];
};

export const isTrustedOrigin = (
  origin: string,
  trustedOrigins: string[],
): boolean => {
  const normalizedOrigin = parseOriginFromValue(origin);
  if (!normalizedOrigin) {
    return false;
  }

  return trustedOrigins.includes(normalizedOrigin);
};

export const getOriginFromReferer = (referer: string): string | null => {
  try {
    const parsed = new URL(referer);
    return normalizeOrigin(parsed.origin);
  } catch {
    return null;
  }
};
