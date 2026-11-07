import { randomInt } from "node:crypto";
import { db } from "../../../src/infrastructure/database/db";
import { films } from "../../../src/modules/films/films.entity";
import { tvSeries } from "../../../src/modules/tv/tv.entity";

// MoviesCacheService/SerialsCacheService.findOrCreate() checks the DB by
// tmdbId before ever hitting the TMDB API — seeding rows directly here lets
// list-item tests exercise the real add/remove flow without any network
// call or a live TMDB_ACCESS_TOKEN.
const randomTmdbId = (): number => randomInt(1_000_000, 999_000_000);

export const seedTestFilm = async (
  title = "Test Movie",
): Promise<{ id: number; tmdbId: number }> => {
  const tmdbId = randomTmdbId();
  const [row] = await db
    .insert(films)
    .values({ tmdbId, title })
    .returning({ id: films.id, tmdbId: films.tmdbId });

  if (!row) {
    throw new Error("Failed to seed test movie");
  }

  return row;
};

export const seedTestSeries = async (
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
