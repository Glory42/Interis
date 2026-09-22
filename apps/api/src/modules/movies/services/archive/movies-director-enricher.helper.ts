import { getMovieDirector } from "../../../../infrastructure/tmdb/movies";
import { MoviesRepository } from "../../repositories/movies.repository";
import type { MovieArchiveResponse } from "../../types/movies.types";

// Owns the "one item's failure can't fail the batch" guarantee itself,
// regardless of which adapter is plugged in.
type DirectorLookup = (tmdbId: number) => Promise<string | null>;
type DirectorPersist = (tmdbId: number, director: string) => Promise<void>;

const defaultLookupDirector: DirectorLookup = (tmdbId) => getMovieDirector(tmdbId);

const defaultPersistDirector: DirectorPersist = (tmdbId, director) =>
  MoviesRepository.updateDirectorByTmdbId(tmdbId, director);

export const enrichMissingDirectors = async (
  items: MovieArchiveResponse["items"],
  deps: {
    lookupDirector?: DirectorLookup;
    persistDirector?: DirectorPersist;
  } = {},
): Promise<MovieArchiveResponse["items"]> => {
  const lookupDirector = deps.lookupDirector ?? defaultLookupDirector;
  const persistDirector = deps.persistDirector ?? defaultPersistDirector;

  const missingDirectorItems = items.filter((item) => item.director === null);

  if (missingDirectorItems.length === 0) {
    return items;
  }

  const hydratedDirectors = await Promise.all(
    missingDirectorItems.map(async (item) => {
      const director = await lookupDirector(item.tmdbId).catch(() => null);
      if (!director) {
        return null;
      }

      await persistDirector(item.tmdbId, director).catch(() => undefined);

      return [item.tmdbId, director] as const;
    }),
  );

  const hydratedDirectorByTmdbId = new Map<number, string>(
    hydratedDirectors.filter(
      (entry): entry is readonly [number, string] => entry !== null,
    ),
  );

  if (hydratedDirectorByTmdbId.size === 0) {
    return items;
  }

  return items.map((item) => ({
    ...item,
    director: hydratedDirectorByTmdbId.get(item.tmdbId) ?? item.director,
  }));
};
