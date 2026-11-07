import type { SeriesArchivePeriod, SeriesArchiveSort } from "../dto/tv.dto";
import type { SeriesArchiveResponse } from "../types/tv.types";
import { getArchiveFromLocalCache } from "./archive/tv-archive-local.service";
import { getArchiveFromTmdb } from "./archive/tv-archive-tmdb.service";

export class TvArchiveService {
  static async getArchive(input: {
    genre: string | null;
    language: string | null;
    sort: SeriesArchiveSort;
    period: SeriesArchivePeriod;
    page: number;
    limit: number;
    viewerUserId?: string | null;
  }): Promise<SeriesArchiveResponse> {
    const normalizedInput = {
      selectedGenre: input.genre,
      selectedLanguage: input.language,
      selectedPeriod: input.period,
      sortBy: input.sort,
      page: input.page,
      limit: input.limit,
      viewerUserId: input.viewerUserId ?? null,
    };

    try {
      return await getArchiveFromTmdb(normalizedInput);
    } catch {
      return getArchiveFromLocalCache(normalizedInput);
    }
  }
}
