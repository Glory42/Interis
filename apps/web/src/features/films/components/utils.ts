export const toReleaseYear = (
  releaseDate: string | null | undefined,
): string | null => {
  if (!releaseDate || releaseDate.length < 4) {
    return null;
  }

  return releaseDate.slice(0, 4);
};

export const formatRuntimeLabel = (
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

  const normalizedMinutes = Math.floor(runtimeMinutes);
  const hours = Math.floor(normalizedMinutes / 60);
  const minutes = normalizedMinutes % 60;

  if (hours === 0) {
    return `${minutes} min`;
  }

  if (minutes === 0) {
    return `${hours}h`;
  }

  return `${hours}h ${minutes} min`;
};
