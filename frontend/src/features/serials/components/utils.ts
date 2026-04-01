const TMDB_IMAGE_BASE = "https://image.tmdb.org/t/p";

export const getPosterUrl = (posterPath: string | null | undefined): string => {
  if (!posterPath) {
    return "https://placehold.co/500x750/172533/e2e8f0?text=No+Poster";
  }

  return `${TMDB_IMAGE_BASE}/w500${posterPath}`;
};

export const getBackdropUrl = (
  backdropPath: string | null | undefined,
): string => {
  if (!backdropPath) {
    return "https://placehold.co/1600x900/12202d/e2e8f0?text=No+Backdrop";
  }

  return `${TMDB_IMAGE_BASE}/w1280${backdropPath}`;
};

export const getStillUrl = (stillPath: string | null | undefined): string => {
  if (!stillPath) {
    return "https://placehold.co/400x225/0f1728/94a3b8?text=No+Still";
  }

  return `${TMDB_IMAGE_BASE}/w500${stillPath}`;
};

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

export const toLanguageLabel = (languageCode: string | null): string | null => {
  if (!languageCode) {
    return null;
  }

  try {
    const displayNames = new Intl.DisplayNames(["en"], { type: "language" });
    return displayNames.of(languageCode) ?? languageCode.toUpperCase();
  } catch {
    return languageCode.toUpperCase();
  }
};
