import { randomInt, randomUUID } from "node:crypto";
import { db } from "../../../src/infrastructure/database/db";
import { movies } from "../../../src/modules/movies/movies.entity";
import { tvSeries } from "../../../src/modules/serials/serials.entity";
import { albums, tracks } from "../../../src/modules/music/music.entity";

// MoviesCacheService/SerialsCacheService.findOrCreate() checks the DB by
// tmdbId before ever hitting the TMDB API — seeding rows directly here lets
// list-item tests exercise the real add/remove flow without any network
// call or a live TMDB_ACCESS_TOKEN.
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

export const seedTestAlbum = async (
  title = "Test Album",
): Promise<{ id: number; mbid: string }> => {
  const mbid = randomUUID();
  const [row] = await db
    .insert(albums)
    .values({ mbid, title, artistName: "Test Artist" })
    .returning({ id: albums.id, mbid: albums.mbid });

  if (!row) {
    throw new Error("Failed to seed test album");
  }

  return row;
};

export const seedTestTrack = async (
  title = "Test Track",
): Promise<{ id: number; mbid: string }> => {
  const mbid = randomUUID();
  const [row] = await db
    .insert(tracks)
    .values({ mbid, title, artistName: "Test Artist" })
    .returning({ id: tracks.id, mbid: tracks.mbid });

  if (!row) {
    throw new Error("Failed to seed test track");
  }

  return row;
};
