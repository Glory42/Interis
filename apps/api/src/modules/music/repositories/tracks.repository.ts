import { asc, eq, inArray } from "drizzle-orm";
import { db } from "../../../infrastructure/database/db";
import { editionTracks, editions, tracks } from "../music.entity";
import type { MBTrackStub } from "../../../infrastructure/musicbrainz/editions";

export class TracksRepository {
  static async findByMbid(mbid: string) {
    const [row] = await db.select().from(tracks).where(eq(tracks.mbid, mbid)).limit(1);
    return row ?? null;
  }

  // Returns recordingMbid -> track.id so the caller can build edition_track
  // join rows without a second round-trip lookup per track.
  static async upsertMany(trackStubs: MBTrackStub[]): Promise<Map<string, number>> {
    const rows = await Promise.all(trackStubs.map((stub) => this.upsertOne(stub)));

    const idByMbid = new Map<string, number>();
    rows.forEach((row, index) => {
      const stub = trackStubs[index];
      if (row && stub) {
        idByMbid.set(stub.recordingMbid, row.id);
      }
    });
    return idByMbid;
  }

  static async upsertOne(stub: MBTrackStub) {
    const [row] = await db
      .insert(tracks)
      .values({
        mbid: stub.recordingMbid,
        title: stub.title,
        artistName: stub.artistName,
        length: stub.length,
        disambiguation: stub.disambiguation,
      })
      .onConflictDoUpdate({
        target: tracks.mbid,
        set: {
          title: stub.title,
          artistName: stub.artistName,
          length: stub.length,
          disambiguation: stub.disambiguation,
          cachedAt: new Date(),
        },
      })
      .returning();
    return row ?? null;
  }

  // Idempotent replace - re-caching an edition's tracklist should reflect
  // exactly what MusicBrainz reports now, not accumulate stale slots.
  static async replaceEditionTracklist(
    editionId: number,
    entries: Array<{ trackId: number; discNumber: number; position: number }>,
  ) {
    await db.delete(editionTracks).where(eq(editionTracks.editionId, editionId));
    if (entries.length === 0) return;

    await db.insert(editionTracks).values(
      entries.map((entry) => ({
        editionId,
        trackId: entry.trackId,
        discNumber: entry.discNumber,
        position: entry.position,
      })),
    );
  }

  static async findByEditionId(editionId: number) {
    return db
      .select({
        id: tracks.id,
        mbid: tracks.mbid,
        title: tracks.title,
        artistName: tracks.artistName,
        length: tracks.length,
        disambiguation: tracks.disambiguation,
        discNumber: editionTracks.discNumber,
        position: editionTracks.position,
      })
      .from(editionTracks)
      .innerJoin(tracks, eq(tracks.id, editionTracks.trackId))
      .where(eq(editionTracks.editionId, editionId))
      .orderBy(asc(editionTracks.discNumber), asc(editionTracks.position));
  }

  // The Album's Track list per ADR-0002: the union of every distinct Track
  // across all of its Editions, deduplicated - not any single edition's
  // tracklist.
  static async findUnionByAlbumId(albumId: number) {
    const albumEditions = await db
      .select({ id: editions.id })
      .from(editions)
      .where(eq(editions.albumId, albumId));

    if (albumEditions.length === 0) return [];

    return db
      .selectDistinctOn([tracks.id], {
        id: tracks.id,
        mbid: tracks.mbid,
        title: tracks.title,
        artistName: tracks.artistName,
        length: tracks.length,
        disambiguation: tracks.disambiguation,
      })
      .from(editionTracks)
      .innerJoin(tracks, eq(tracks.id, editionTracks.trackId))
      .where(
        inArray(
          editionTracks.editionId,
          albumEditions.map((e) => e.id),
        ),
      );
  }
}
