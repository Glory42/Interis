import { NYT_BESTSELLER_LIST } from "../constants/books.constants";
import { BooksArchiveRepository } from "../repositories/books-archive.repository";
import { BooksCacheService } from "./books-cache.service";
import { BooksSeedService } from "./books-seed.service";
import { NytBestsellersCacheService } from "./nyt-bestsellers-cache.service";
import type { NormalizedBooksArchiveQuery } from "../dto/books.dto";
import type { BooksArchiveResponse, BooksArchiveItem } from "../types/books.types";

export class BooksArchiveService {
  static async getArchive(input: NormalizedBooksArchiveQuery & { viewerUserId?: string | null }): Promise<BooksArchiveResponse> {
    if (input.sort === "trending") {
      return this.getTrendingArchive(input);
    }

    await BooksSeedService.seedIfEmpty().catch(() => undefined);

    const [rows, totalCount, availableGenres] = await Promise.all([
      BooksArchiveRepository.getArchiveRows(input),
      BooksArchiveRepository.getTotalCount(),
      BooksArchiveRepository.getTopGenres(),
    ]);

    const [loggedIds, wantToReadIds] = input.viewerUserId
      ? await Promise.all([
          BooksArchiveRepository.getViewerLoggedVolumeIds(input.viewerUserId),
          BooksArchiveRepository.getViewerWantToReadVolumeIds(input.viewerUserId),
        ])
      : [[], []];

    const loggedSet = new Set(loggedIds);
    const wantToReadSet = new Set(wantToReadIds);

    const items: BooksArchiveItem[] = rows.map((r) => ({
      googleVolumeId: r.googleVolumeId,
      title: r.title,
      authors: (r.authors ?? []) as string[],
      coverImageUrl: r.coverImageUrl,
      publishedYear: r.publishedYear,
      language: r.language,
      categories: (r.categories ?? []) as string[],
      logCount: r.logCount,
      avgRating: r.avgRatingOutOfTen !== null ? Math.round(r.avgRatingOutOfTen * 10) / 10 : null,
      viewerHasLogged: loggedSet.has(r.googleVolumeId),
      viewerWantToRead: wantToReadSet.has(r.googleVolumeId),
    }));

    const hasMore = items.length === input.limit;

    return {
      totalCount,
      filteredCount: totalCount,
      selectedGenre: input.genre,
      selectedLanguage: input.language,
      selectedSort: input.sort,
      availableGenres: availableGenres.slice(0, 30),
      page: input.page,
      limit: input.limit,
      hasMore,
      nextPage: hasMore ? input.page + 1 : null,
      items,
    };
  }

  // NYT's bestseller rank replaces the usual local-catalog query entirely -
  // a single ranked list (~15 books), not a paginated discover feed.
  private static async getTrendingArchive(
    input: NormalizedBooksArchiveQuery & { viewerUserId?: string | null },
  ): Promise<BooksArchiveResponse> {
    const bestsellers = await NytBestsellersCacheService.getTrendingList(NYT_BESTSELLER_LIST);

    // One flaky Google Books lookup shouldn't 500 the whole trending list -
    // drop that entry and keep the rest.
    const resolvedBooks = await Promise.all(
      bestsellers.map((entry) =>
        BooksCacheService.findOrCreateByIsbn(entry.isbn13).catch(() => null),
      ),
    );

    const volumeIdByIsbn = new Map<string, string>();
    resolvedBooks.forEach((book, index) => {
      const entry = bestsellers[index];
      if (book && entry) {
        volumeIdByIsbn.set(entry.isbn13, book.googleVolumeId);
      }
    });

    const volumeIds = [...volumeIdByIsbn.values()];

    const [rows, loggedIds, wantToReadIds] = await Promise.all([
      BooksArchiveRepository.getArchiveRowsByVolumeIds(volumeIds),
      input.viewerUserId
        ? BooksArchiveRepository.getViewerLoggedVolumeIds(input.viewerUserId)
        : Promise.resolve([]),
      input.viewerUserId
        ? BooksArchiveRepository.getViewerWantToReadVolumeIds(input.viewerUserId)
        : Promise.resolve([]),
    ]);

    const rowByVolumeId = new Map(rows.map((row) => [row.googleVolumeId, row]));
    const loggedSet = new Set(loggedIds);
    const wantToReadSet = new Set(wantToReadIds);

    const items: BooksArchiveItem[] = bestsellers.flatMap((entry) => {
      const volumeId = volumeIdByIsbn.get(entry.isbn13);
      const row = volumeId ? rowByVolumeId.get(volumeId) : undefined;
      if (!volumeId || !row) return [];

      return [
        {
          googleVolumeId: row.googleVolumeId,
          title: row.title,
          authors: (row.authors ?? []) as string[],
          coverImageUrl: row.coverImageUrl,
          publishedYear: row.publishedYear,
          language: row.language,
          categories: (row.categories ?? []) as string[],
          logCount: row.logCount,
          avgRating:
            row.avgRatingOutOfTen !== null ? Math.round(row.avgRatingOutOfTen * 10) / 10 : null,
          viewerHasLogged: loggedSet.has(row.googleVolumeId),
          viewerWantToRead: wantToReadSet.has(row.googleVolumeId),
        },
      ];
    });

    return {
      totalCount: items.length,
      filteredCount: items.length,
      selectedGenre: input.genre,
      selectedLanguage: input.language,
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
