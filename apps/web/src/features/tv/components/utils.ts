export const formatEpisodeRuntimeLabel = (
  runtimeMinutes: number | null | undefined,
): string | null => {
  if (
    runtimeMinutes === null ||
    runtimeMinutes === undefined ||
    !Number.isFinite(runtimeMinutes) ||
    runtimeMinutes <= 0
  ) {
    return null;
  }

  return `${Math.floor(runtimeMinutes)} min / ep`;
};
