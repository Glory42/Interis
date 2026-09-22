import { getMovieDirector } from "../../../../infrastructure/tmdb/movies";
import { MoviesRepository } from "../../repositories/movies.repository";
import type { MovieArchiveResponse } from "../../types/movies.types";

// Deep module: owns the N+1 TMDB director backfill for archive rows that
// were cached before the director column existed. Callers hand it a page
// of items; it owns concurrency and the "one item's lookup/persist failure
// never fails the batch" policy internally, so that guarantee holds
// regardless of which adapter is plugged in — an adapter that forgets to
// catch its own errors (e.g. a test fake) can't take down the whole page.
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
