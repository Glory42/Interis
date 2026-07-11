export const normalizeVoteAverage = (raw: number | null | undefined): number | null => {
  if (raw == null || !Number.isFinite(raw) || raw <= 0) return null;
  return Number(raw.toFixed(1));
};
