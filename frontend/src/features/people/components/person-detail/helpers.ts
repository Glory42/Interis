import { formatDateLabel } from "@/lib/time";

const TMDB_IMAGE_BASE = "https://image.tmdb.org/t/p";

export const getProfileImageUrl = (profilePath: string | null): string => {
  if (!profilePath) {
    return "https://placehold.co/500x750/151931/cfd7ff?text=No+Profile";
  }

  return `${TMDB_IMAGE_BASE}/w500${profilePath}`;
};

export const getCreditPosterUrl = (posterPath: string | null): string => {
  if (!posterPath) {
    return "https://placehold.co/300x450/1f1b2b/e8e3f7?text=No+Poster";
  }

  return `${TMDB_IMAGE_BASE}/w342${posterPath}`;
};

export const toDisplayDate = (isoDate: string | null): string | null => {
  if (!isoDate) {
    return null;
  }

  return formatDateLabel(isoDate);
};
