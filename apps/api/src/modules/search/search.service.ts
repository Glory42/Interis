import { MoviesService } from "../movies/movies.service";
import { SerialsService } from "../serials/serials.service";
import type { MediaType } from "../media/constants/media-type.constant";

const MAX_RESULTS = 20;

export type UnifiedSearchResult = {
  mediaType: MediaType;
  tmdbId: number;
  title: string;
  posterPath: string | null;
  releaseDate: string | null;
  popularity: number;
  // Director (film) or creator (TV), only when the title is already cached.
  credit: string | null;
};

export class SearchService {
  static async searchTitles(query: string): Promise<UnifiedSearchResult[]> {
    const [movies, series] = await Promise.all([
      MoviesService.search(query),
      SerialsService.search(query),
    ]);

    const movieResults: UnifiedSearchResult[] = movies.map((movie) => ({
      mediaType: "movie",
      tmdbId: movie.id,
      title: movie.title,
      posterPath: movie.poster_path,
      releaseDate: movie.release_date || null,
      popularity: movie.popularity,
      credit: null,
    }));

    const seriesResults: UnifiedSearchResult[] = series.map((show) => ({
      mediaType: "tv",
      tmdbId: show.id,
      title: show.name,
      posterPath: show.poster_path,
      releaseDate: show.first_air_date,
      popularity: show.popularity,
      credit: null,
    }));

    const results = [...movieResults, ...seriesResults]
      .sort((a, b) => b.popularity - a.popularity)
      .slice(0, MAX_RESULTS);

    const idsOf = (mediaType: MediaType) =>
      results.filter((result) => result.mediaType === mediaType).map((result) => result.tmdbId);
    const [directors, creators] = await Promise.all([
      MoviesService.findCachedDirectors(idsOf("movie")),
      SerialsService.findCachedCreators(idsOf("tv")),
    ]);

    return results.map((result) => ({
      ...result,
      credit: (result.mediaType === "movie" ? directors : creators).get(result.tmdbId) ?? null,
    }));
  }
}
