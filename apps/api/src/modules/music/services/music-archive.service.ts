import { MusicArchiveRepository } from "../repositories/music-archive.repository";
import { MusicCacheService } from "./music-cache.service";
import { MusicSeedService } from "./music-seed.service";
import { LastfmTrendingCacheService } from "./lastfm-trending-cache.service";
import { LASTFM_TRENDING_CHART_KEY } from "../constants/music.constants";
import type { NormalizedMusicArchiveQuery } from "../dto/music.dto";
import type { MusicArchiveResponse, MusicArchiveItem } from "../types/music.types";

export class MusicArchiveService {
  static async getArchive(input: NormalizedMusicArchiveQuery & { viewerUserId?: string | null }): Promise<MusicArchiveResponse> {
    if (input.sort === "trending") {
      return this.getTrendingArchive(input);
    }

    await MusicSeedService.seedIfEmpty().catch(() => undefined);

    const [rows, totalCount, availableGenres] = await Promise.all([
      MusicArchiveRepository.getArchiveRows(input),
      MusicArchiveRepository.getTotalCount(),
      MusicArchiveRepository.getTopGenres(),
    ]);

    const mbids = rows.map((r) => r.mbid);
    const [loggedMbids, wantToListenMbids] = input.viewerUserId
      ? await Promise.all([
          MusicArchiveRepository.getViewerLoggedMbids(input.viewerUserId, mbids),
          MusicArchiveRepository.getViewerWantToListenMbids(input.viewerUserId, mbids),
        ])
      : [[], []];

    const loggedSet = new Set(loggedMbids);
    const wantToListenSet = new Set(wantToListenMbids);

    const items: MusicArchiveItem[] = rows.map((r) => ({
      mbid: r.mbid,
      title: r.title,
      artistName: r.artistName,
      coverArtUrl: r.coverArtUrl,
      primaryType: r.primaryType,
      firstReleaseYear: r.firstReleaseYear,
      genres: (r.genres ?? []) as { name: string; count: number }[],
      logCount: r.logCount,
      avgRating: r.avgRatingOutOfTen !== null ? Math.round(r.avgRatingOutOfTen * 10) / 10 : null,
      viewerHasLogged: loggedSet.has(r.mbid),
      viewerWantToListen: wantToListenSet.has(r.mbid),
    }));

    const hasMore = items.length === input.limit;

    return {
      totalCount,
      filteredCount: totalCount,
      selectedGenre: input.genre,
      selectedSort: input.sort,
      availableGenres: availableGenres.slice(0, 30),
      page: input.page,
      limit: input.limit,
      hasMore,
      nextPage: hasMore ? input.page + 1 : null,
      items,
    };
  }

  private static async getTrendingArchive(
    input: NormalizedMusicArchiveQuery & { viewerUserId?: string | null },
  ): Promise<MusicArchiveResponse> {
    const trending = await LastfmTrendingCacheService.getTrendingList(LASTFM_TRENDING_CHART_KEY);

    // One flaky MusicBrainz/cache lookup shouldn't 500 the whole trending
    // list - drop that entry and keep the rest.
    await Promise.all(
      trending.map((entry) => MusicCacheService.findOrCreate(entry.mbid).catch(() => null)),
    );

    const mbids = trending.map((entry) => entry.mbid);

    const [rows, loggedMbids, wantToListenMbids] = await Promise.all([
      MusicArchiveRepository.getArchiveRowsByMbids(mbids),
      input.viewerUserId
        ? MusicArchiveRepository.getViewerLoggedMbids(input.viewerUserId, mbids)
        : Promise.resolve([]),
      input.viewerUserId
        ? MusicArchiveRepository.getViewerWantToListenMbids(input.viewerUserId, mbids)
        : Promise.resolve([]),
    ]);

    const rowByMbid = new Map(rows.map((row) => [row.mbid, row]));
    const loggedSet = new Set(loggedMbids);
    const wantToListenSet = new Set(wantToListenMbids);

    const items: MusicArchiveItem[] = trending.flatMap((entry) => {
      const row = rowByMbid.get(entry.mbid);
      if (!row) return [];

      return [
        {
          mbid: row.mbid,
          title: row.title,
          artistName: row.artistName,
          coverArtUrl: row.coverArtUrl,
          primaryType: row.primaryType,
          firstReleaseYear: row.firstReleaseYear,
          genres: (row.genres ?? []) as { name: string; count: number }[],
          logCount: row.logCount,
          avgRating:
            row.avgRatingOutOfTen !== null ? Math.round(row.avgRatingOutOfTen * 10) / 10 : null,
          viewerHasLogged: loggedSet.has(row.mbid),
          viewerWantToListen: wantToListenSet.has(row.mbid),
        },
      ];
    });

    return {
      totalCount: items.length,
      filteredCount: items.length,
      selectedGenre: input.genre,
      selectedSort: input.sort,
      availableGenres: [],
      page: 1,
      limit: items.length,
      hasMore: false,
      nextPage: null,
      items,
    };
  }
}
