import { asc, eq, sql } from "drizzle-orm";
import { db } from "../../../infrastructure/database/db";
import { editions } from "../music.entity";
import { parseReleaseYear, type MBReleaseStub } from "../../../infrastructure/musicbrainz/editions";

export class EditionsRepository {
  // No real popularity signal exists for a release (MusicBrainz doesn't
  // expose one, and we don't track per-edition plays yet) - officially
  // released first, then earliest release date, is the best available
  // proxy and matches how most discography sites default-sort pressings.
  static async findByAlbumId(albumId: number) {
    return db
      .select()
      .from(editions)
      .where(eq(editions.albumId, albumId))
      .orderBy(
        sql`case when ${editions.status} = 'Official' then 0 else 1 end`,
        asc(editions.releaseDate),
      );
  }

  static async findByMbid(mbid: string) {
    const [row] = await db.select().from(editions).where(eq(editions.mbid, mbid)).limit(1);
    return row ?? null;
  }

  static async upsertMany(albumId: number, releases: MBReleaseStub[]) {
    return Promise.all(releases.map((release) => this.upsertOne(albumId, release)));
  }

  private static async upsertOne(albumId: number, release: MBReleaseStub) {
    const releaseYear = parseReleaseYear(release.date);
    const [row] = await db
      .insert(editions)
      .values({
        albumId,
        mbid: release.mbid,
        title: release.title,
        status: release.status,
        packaging: release.packaging,
        country: release.country,
        releaseDate: release.date,
        releaseYear,
        disambiguation: release.disambiguation,
      })
      .onConflictDoUpdate({
        target: editions.mbid,
        set: {
          title: release.title,
          status: release.status,
          packaging: release.packaging,
          country: release.country,
          releaseDate: release.date,
          releaseYear,
          disambiguation: release.disambiguation,
          cachedAt: new Date(),
        },
      })
      .returning();
    return row ?? null;
  }

  static async updateTracklistMeta(
    editionId: number,
    input: { format: string | null; trackCount: number },
  ) {
    const [row] = await db
      .update(editions)
      .set({ format: input.format, trackCount: input.trackCount, cachedAt: new Date() })
      .where(eq(editions.id, editionId))
      .returning();
    return row ?? null;
  }
}
