/**
 * Parses an untrusted query-param value into a bounded integer.
 * Returns `fallback` when the value is missing, non-numeric, or non-positive.
 * Clamps to `max` when provided.
 */
export const parseIntParam = (raw: unknown, fallback: number, max?: number): number => {
  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  const floored = Math.floor(parsed);
  return max !== undefined ? Math.min(max, floored) : floored;
};
