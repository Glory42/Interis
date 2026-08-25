import { BooksArchiveRepository } from "../repositories/books-archive.repository";
import { BooksSeedService } from "./books-seed.service";
import type { NormalizedBooksArchiveQuery } from "../dto/books.dto";
import type { BooksArchiveResponse, BooksArchiveItem } from "../types/books.types";

export class BooksArchiveService {
  static async getArchive(input: NormalizedBooksArchiveQuery & { viewerUserId?: string | null }): Promise<BooksArchiveResponse> {
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
}
