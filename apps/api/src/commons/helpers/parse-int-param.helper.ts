export const parseIntParam = (raw: unknown, fallback: number, max?: number): number => {
  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  const floored = Math.floor(parsed);
  return max !== undefined ? Math.min(max, floored) : floored;
};
