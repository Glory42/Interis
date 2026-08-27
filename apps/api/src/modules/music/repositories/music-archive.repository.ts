import { SQL, asc, desc, eq, ilike, inArray, sql } from "drizzle-orm";
import { db } from "../../../infrastructure/database/db";
import { albums, musicDiaryEntries, musicInteractions } from "../music.entity";
import type { MusicArchiveSort } from "../dto/music.dto";

export class MusicArchiveRepository {
  static async getArchiveRows(input: {
    genre: string | null;
    type: string | null;
    sort: MusicArchiveSort;
    page: number;
    limit: number;
    viewerUserId?: string | null;
  }) {
    const orderBy = {
      popular_lastfm: sql`${albums.lastfmListeners} desc nulls last`,
      logs_desc: desc(sql<number>`count(${musicDiaryEntries.id})`),
      release_desc: desc(albums.firstReleaseYear),
      release_asc: asc(albums.firstReleaseYear),
      rating_desc: desc(sql<number>`avg(${musicDiaryEntries.rating})`),
      title_asc: asc(albums.title),
      // Never reached - MusicArchiveService.getArchive short-circuits to
      // getTrendingArchive before this repository method is called.
      trending: undefined,
    }[input.sort] ?? desc(sql<number>`count(${musicDiaryEntries.id})`);

    const conditions: SQL[] = [];

    if (input.genre) {
      conditions.push(
        sql`EXISTS (
          SELECT 1 FROM jsonb_array_elements(${albums.genres}) g
          WHERE lower(g->>'name') = lower(${input.genre})
        )`,
      );
    }

    if (input.type) {
      conditions.push(ilike(albums.primaryType, input.type));
    }

    const whereClause =
      conditions.length > 0
        ? conditions.reduce((acc, cond) => sql`${acc} AND ${cond}`)
        : undefined;

    const offset = (input.page - 1) * input.limit;

    const baseQuery = db
      .select({
        mbid: albums.mbid,
        title: albums.title,
        artistName: albums.artistName,
        coverArtUrl: albums.coverArtUrl,
        primaryType: albums.primaryType,
        firstReleaseYear: albums.firstReleaseYear,
        genres: albums.genres,
        logCount: sql<number>`count(${musicDiaryEntries.id})::int`.as("logCount"),
        avgRatingOutOfTen: sql<number | null>`avg(${musicDiaryEntries.rating})::double precision`.as("avgRatingOutOfTen"),
      })
      .from(albums)
      .leftJoin(musicDiaryEntries, eq(musicDiaryEntries.albumId, albums.id));

    const rows = await (whereClause ? baseQuery.where(whereClause) : baseQuery)
      .groupBy(albums.id)
      .orderBy(orderBy)
      .limit(input.limit)
      .offset(offset);

    return rows;
  }

  static async getArchiveRowsByMbids(mbids: string[]) {
    if (mbids.length === 0) return [];

    const rows = await db
      .select({
        mbid: albums.mbid,
        title: albums.title,
        artistName: albums.artistName,
        coverArtUrl: albums.coverArtUrl,
        primaryType: albums.primaryType,
        firstReleaseYear: albums.firstReleaseYear,
        genres: albums.genres,
        logCount: sql<number>`count(${musicDiaryEntries.id})::int`.as("logCount"),
        avgRatingOutOfTen: sql<number | null>`avg(${musicDiaryEntries.rating})::double precision`.as("avgRatingOutOfTen"),
      })
      .from(albums)
      .leftJoin(musicDiaryEntries, eq(musicDiaryEntries.albumId, albums.id))
      .where(inArray(albums.mbid, mbids))
      .groupBy(albums.id);

    return rows;
  }

  static async getTotalCount(): Promise<number> {
    const [row] = await db.select({ count: sql<number>`count(*)::int` }).from(albums);
    return row?.count ?? 0;
  }

  static async getTopGenres(limit = 50): Promise<{ name: string; count: number }[]> {
    const rows = await db.select({ genres: albums.genres }).from(albums);
    const genreMap = new Map<string, number>();
    for (const row of rows) {
      for (const g of row.genres ?? []) {
        genreMap.set(g.name, (genreMap.get(g.name) ?? 0) + 1);
      }
    }
    return [...genreMap.entries()]
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
  }

  static async getViewerLoggedMbids(userId: string, mbids: string[]) {
    if (mbids.length === 0) return [];
    const rows = await db
      .select({ mbid: albums.mbid })
      .from(musicDiaryEntries)
      .innerJoin(albums, eq(albums.id, musicDiaryEntries.albumId))
      .where(eq(musicDiaryEntries.userId, userId))
      .groupBy(albums.mbid);
    const set = new Set(rows.map((r) => r.mbid));
    return mbids.filter((m) => set.has(m));
  }

  static async getViewerWantToListenMbids(userId: string, mbids: string[]) {
    if (mbids.length === 0) return [];
    const rows = await db
      .select({ mbid: albums.mbid })
      .from(musicInteractions)
      .innerJoin(albums, eq(albums.id, musicInteractions.albumId))
      .where(
        sql`${musicInteractions.userId} = ${userId} AND ${musicInteractions.wantToListen} = true`,
      )
      .groupBy(albums.mbid);
    const set = new Set(rows.map((r) => r.mbid));
    return mbids.filter((m) => set.has(m));
  }
}
