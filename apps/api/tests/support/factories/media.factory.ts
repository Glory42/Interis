import { randomInt } from "node:crypto";
import { db } from "../../../src/infrastructure/database/db";
import { movies } from "../../../src/modules/movies/movies.entity";
import { tvSeries } from "../../../src/modules/serials/serials.entity";

// findOrCreate() checks the DB by tmdbId before hitting the TMDB API -
// seeding rows directly here lets tests exercise the real flow without any
// network call or a live TMDB_ACCESS_TOKEN.
const randomTmdbId = (): number => randomInt(1_000_000, 999_000_000);

export const seedTestMovie = async (
  title = "Test Movie",
): Promise<{ id: number; tmdbId: number }> => {
  const tmdbId = randomTmdbId();
  const [row] = await db
    .insert(movies)
    .values({ tmdbId, title })
    .returning({ id: movies.id, tmdbId: movies.tmdbId });

  if (!row) {
    throw new Error("Failed to seed test movie");
  }

  return row;
};

export const seedTestSerial = async (
  title = "Test Serial",
): Promise<{ id: number; tmdbId: number }> => {
  const tmdbId = randomTmdbId();
  const [row] = await db
    .insert(tvSeries)
    .values({ tmdbId, title })
    .returning({ id: tvSeries.id, tmdbId: tvSeries.tmdbId });

  if (!row) {
    throw new Error("Failed to seed test serial");
  }

  return row;
};
