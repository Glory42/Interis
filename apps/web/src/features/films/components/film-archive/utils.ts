import type { ArchiveFilm } from "@/features/films/api";
import type { ArchiveRatingSource } from "@/features/media/types";

export const getReleaseYearLabel = (movie: ArchiveFilm): string => {
  if (movie.releaseYear !== null) {
    return String(movie.releaseYear);
  }

  if (movie.releaseDate && movie.releaseDate.length >= 4) {
    return movie.releaseDate.slice(0, 4);
  }

  return "Unknown";
};

export const getFilmStateLabel = (
  movie: ArchiveFilm,
): "Watched" | "Queued" | null => {
  if (movie.viewerHasLogged) {
    return "Watched";
  }

  if (movie.viewerWatchlisted) {
    return "Queued";
  }

  return null;
};

export const getRating = (
  movie: ArchiveFilm,
  ratingSource: ArchiveRatingSource,
): number | null =>
  ratingSource === "tmdb" ? movie.tmdbRatingOutOfTen : movie.avgRatingOutOfTen;
