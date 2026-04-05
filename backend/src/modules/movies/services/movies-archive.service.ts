import {
  normalizeArchiveGenre,
  normalizeArchiveLanguage,
  normalizeArchiveLimit,
  normalizeArchivePage,
  normalizeArchivePeriod,
  normalizeArchiveSort,
} from "../helpers/movies-query-normalizer.helper";
import type { CinemaArchiveResponse } from "../types/movies.types";
import { getArchiveFromLocalCatalog } from "./archive/movies-archive-local.service";
import { getArchiveFromTmdbCatalog } from "./archive/movies-archive-tmdb.service";

export class MoviesArchiveService {
  static async getArchive(input: {
    genre?: string;
    language?: string;
    sort?: string;
    period?: string;
    page?: string;
    limit?: string;
    viewerUserId?: string | null;
  }): Promise<CinemaArchiveResponse> {
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
      viewerUserId: input.viewerUserId ?? null,
    };

    if (sortBy === "logs_desc" || sortBy === "rating_user_desc") {
      return getArchiveFromLocalCatalog(normalizedInput);
    }

    try {
      return await getArchiveFromTmdbCatalog(normalizedInput);
    } catch {
      return getArchiveFromLocalCatalog(normalizedInput);
    }
  }
}
