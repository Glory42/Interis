import { eq } from "drizzle-orm";
import { db } from "../../../infrastructure/database/db";
import { albums } from "../music.entity";

export class MusicCacheRepository {
  static async findByMbid(mbid: string) {
    const [row] = await db.select().from(albums).where(eq(albums.mbid, mbid)).limit(1);
    return row ?? null;
  }

  static async upsert(input: {
    mbid: string;
    title: string;
    artistName: string;
    artistMbid: string | null;
    coverArtUrl: string | null;
    primaryType: string | null;
    secondaryTypes: string[];
    firstReleaseDate: string | null;
    firstReleaseYear: number | null;
    genres: { name: string; count: number }[];
    disambiguation: string | null;
  }) {
    const [inserted] = await db
      .insert(albums)
      .values({
        mbid: input.mbid,
        title: input.title,
        artistName: input.artistName,
        artistMbid: input.artistMbid,
        coverArtUrl: input.coverArtUrl,
        primaryType: input.primaryType,
        secondaryTypes: input.secondaryTypes,
        firstReleaseDate: input.firstReleaseDate,
        firstReleaseYear: input.firstReleaseYear,
        genres: input.genres,
        disambiguation: input.disambiguation,
      })
      .onConflictDoUpdate({
        target: albums.mbid,
        set: {
          title: input.title,
          artistName: input.artistName,
          artistMbid: input.artistMbid,
          coverArtUrl: input.coverArtUrl,
          primaryType: input.primaryType,
          secondaryTypes: input.secondaryTypes,
          firstReleaseDate: input.firstReleaseDate,
          firstReleaseYear: input.firstReleaseYear,
          genres: input.genres,
          disambiguation: input.disambiguation,
          cachedAt: new Date(),
        },
      })
      .returning();

    return inserted ?? null;
  }
}
