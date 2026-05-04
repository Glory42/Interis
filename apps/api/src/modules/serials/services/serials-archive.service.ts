import type { SerialArchivePeriod, SerialArchiveSort } from "../dto/serials.dto";
import type { SerialArchiveResponse } from "../types/serials.types";
import { getArchiveFromLocalCache } from "./archive/serials-archive-local.service";
import { getArchiveFromTmdb } from "./archive/serials-archive-tmdb.service";

export class SerialsArchiveService {
  static async getArchive(input: {
    genre: string | null;
    language: string | null;
    sort: SerialArchiveSort;
    period: SerialArchivePeriod;
    page: number;
    limit: number;
    viewerUserId?: string | null;
  }): Promise<SerialArchiveResponse> {
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
