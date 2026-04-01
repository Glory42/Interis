import {
  normalizeArchiveGenre,
  normalizeArchiveLanguage,
  normalizeArchiveLimit,
  normalizeArchivePage,
  normalizeArchivePeriod,
  normalizeArchiveSort,
} from "../helpers/serials-query-normalizer.helper";
import type { SerialArchiveResponse } from "../types/serials.types";
import { getArchiveFromLocalCache } from "./archive/serials-archive-local.service";
import { getArchiveFromTmdb } from "./archive/serials-archive-tmdb.service";

export class SerialsArchiveService {
  static async getArchive(input: {
    genre?: string;
    language?: string;
    sort?: string;
    period?: string;
    page?: string;
    limit?: string;
  }): Promise<SerialArchiveResponse> {
    const selectedGenre = normalizeArchiveGenre(input.genre);
    const selectedLanguage = normalizeArchiveLanguage(input.language);
    const sortBy = normalizeArchiveSort(input.sort);
    const selectedPeriod = normalizeArchivePeriod(input.period);
    const page = normalizeArchivePage(input.page);
    const limit = normalizeArchiveLimit(input.limit);

    const normalizedInput = {
      selectedGenre,
      selectedLanguage,
      selectedPeriod,
      sortBy,
      page,
      limit,
    };

    try {
      return await getArchiveFromTmdb(normalizedInput);
    } catch {
      return getArchiveFromLocalCache(normalizedInput);
    }
  }
}
