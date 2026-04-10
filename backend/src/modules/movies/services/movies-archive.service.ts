import type { CinemaArchivePeriod, CinemaArchiveSort } from "../dto/movies.dto";
import type { CinemaArchiveResponse } from "../types/movies.types";
import { getArchiveFromLocalCatalog } from "./archive/movies-archive-local.service";
import { getArchiveFromTmdbCatalog } from "./archive/movies-archive-tmdb.service";

export class MoviesArchiveService {
  static async getArchive(input: {
    genre: string | null;
    language: string | null;
    sort: CinemaArchiveSort;
    period: CinemaArchivePeriod;
    page: number;
    limit: number;
    viewerUserId?: string | null;
  }): Promise<CinemaArchiveResponse> {
    const normalizedInput = {
      selectedGenre: input.genre,
      selectedLanguage: input.language,
      selectedPeriod: input.period,
      sortBy: input.sort,
      page: input.page,
      limit: input.limit,
      viewerUserId: input.viewerUserId ?? null,
    };

    if (input.sort === "logs_desc" || input.sort === "rating_user_desc") {
      return getArchiveFromLocalCatalog(normalizedInput);
    }

    try {
      return await getArchiveFromTmdbCatalog(normalizedInput);
    } catch {
      return getArchiveFromLocalCatalog(normalizedInput);
    }
  }
}
