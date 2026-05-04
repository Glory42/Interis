import type { ArchiveMovie } from "@/features/films/api";

export const getReleaseYearLabel = (movie: ArchiveMovie): string => {
  if (movie.releaseYear !== null) {
    return String(movie.releaseYear);
  }

  if (movie.releaseDate && movie.releaseDate.length >= 4) {
    return movie.releaseDate.slice(0, 4);
  }

  return "Unknown";
};

export const getMovieStateLabel = (
  movie: ArchiveMovie,
): "Watched" | "Queued" | null => {
  if (movie.viewerHasLogged) {
    return "Watched";
  }

  if (movie.viewerWatchlisted) {
    return "Queued";
  }

  return null;
};

export const formatArchiveCount = (count: number): string => {
  if (count === 1) {
    return "1 title";
  }

  return `${count.toLocaleString()} titles`;
};
