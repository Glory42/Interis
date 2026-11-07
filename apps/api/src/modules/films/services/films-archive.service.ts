import type { FilmArchivePeriod, FilmArchiveSort } from "../dto/films.dto";
import type { FilmArchiveResponse } from "../types/films.types";
import { getArchiveFromLocalCatalog } from "./archive/films-archive-local.service";
import { getArchiveFromTmdbCatalog } from "./archive/films-archive-tmdb.service";

export class FilmsArchiveService {
  static async getArchive(input: {
    genre: string | null;
    language: string | null;
    sort: FilmArchiveSort;
    period: FilmArchivePeriod;
    page: number;
    limit: number;
    viewerUserId?: string | null;
  }): Promise<FilmArchiveResponse> {
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
