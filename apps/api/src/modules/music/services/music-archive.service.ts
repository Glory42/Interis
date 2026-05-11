import { MusicArchiveRepository } from "../repositories/music-archive.repository";
import { MusicSeedService } from "./music-seed.service";
import type { NormalizedMusicArchiveQuery } from "../dto/music.dto";
import type { MusicArchiveResponse, MusicArchiveItem } from "../types/music.types";

export class MusicArchiveService {
  static async getArchive(input: NormalizedMusicArchiveQuery & { viewerUserId?: string | null }): Promise<MusicArchiveResponse> {
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
      avgRatingOutOfFive:
        r.avgRatingOutOfTen !== null ? Math.round((r.avgRatingOutOfTen / 2) * 10) / 10 : null,
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
}
