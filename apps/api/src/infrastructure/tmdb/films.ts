import { z } from "zod";
import { fetchTMDB } from "./base-client";
import { createCachedTmdbFetcher } from "./tmdb-cache.helper";
import {
  TMDBDiscoverFilmSchema,
  TMDBDiscoverFilmsSchema,
  TMDBFilmCreditsSchema,
  TMDBFilmDetailSchema,
  TMDBFilmGenreListSchema,
  TMDBSearchFilmSchema,
} from "./dto/films-response.dto";
import type {
  TMDBDiscoverFilm,
  TMDBDiscoverSortBy,
  TMDBFilmGenre,
  TMDBSearchFilm,
} from "./dto/films-response.dto";

export type {
  TMDBDiscoverFilm,
  TMDBDiscoverFilms,
  TMDBDiscoverSortBy,
  TMDBFilmCredits,
  TMDBFilmDetail,
  TMDBFilmGenre,
  TMDBSearchFilm,
} from "./dto/films-response.dto";

const FILM_GENRE_CACHE_TTL_MS = 6 * 60 * 60 * 1000;

type GenreCacheEntry = {
  value: TMDBFilmGenre[];
  expiresAt: number;
};

let filmGenreCache: GenreCacheEntry | null = null;

export const searchFilms = async (
  query: string,
): Promise<TMDBSearchFilm[]> => {
  const data = await fetchTMDB(
    `/search/movie?query=${encodeURIComponent(query)}&include_adult=false&language=en-US&page=1`,
  );
  const results = (data as { results?: unknown }).results ?? [];
  return z.array(TMDBSearchFilmSchema).parse(results);
};

export const searchFilmByTitleAndYear = async (
  title: string,
  year: number,
): Promise<TMDBSearchFilm[]> => {
  const params = new URLSearchParams({
    query: title,
    include_adult: "false",
    language: "en-US",
    page: "1",
  });
  if (year > 0) params.set("year", String(year));

  const data = await fetchTMDB(`/search/movie?${params.toString()}`);
  const results = (data as { results?: unknown }).results ?? [];
  return z.array(TMDBSearchFilmSchema).parse(results);
};

// Public, unauthenticated, no-param endpoints rendered on the homepage -
// cached so every visitor doesn't trigger its own live TMDB round trip.
export const getNowPlayingFilms = createCachedTmdbFetcher(
  async (): Promise<TMDBSearchFilm[]> => {
    const data = await fetchTMDB(
      "/movie/now_playing?language=en-US&page=1&region=US",
    );
    const results = (data as { results?: unknown }).results ?? [];
    return z.array(TMDBSearchFilmSchema).parse(results);
  },
  { keyFn: () => "now_playing" },
);

export const getTrendingFilms = async (
  timeWindow: "day" | "week" = "week",
): Promise<TMDBSearchFilm[]> => {
  const trendingPage = await getTrendingFilmsPage(timeWindow);
  return trendingPage.results;
};

export const getTrendingFilmsPage = createCachedTmdbFetcher(
  async (
    timeWindow: "day" | "week" = "week",
    input: { page?: number; limit?: number } = {},
  ): Promise<{
    page: number;
    totalPages: number;
    totalResults: number;
    results: TMDBDiscoverFilm[];
  }> => {
    const page = Math.max(1, Math.floor(input.page ?? 1));
    const limit = Math.max(1, Math.min(50, Math.floor(input.limit ?? 20)));

    const data = await fetchTMDB(
      `/trending/movie/${timeWindow}?language=en-US&page=${page}`,
    );
    const parsed = TMDBDiscoverFilmsSchema.parse(data);

    const results = z.array(TMDBDiscoverFilmSchema).parse(parsed.results).slice(0, limit);

    return {
      page: parsed.page,
      totalPages: parsed.total_pages,
      totalResults: parsed.total_results,
      results,
    };
  },
  { keyFn: (timeWindow = "week", input = {}) => `${timeWindow}:${input.page ?? 1}:${input.limit ?? 20}` },
);

export const getFilmGenres = async (): Promise<TMDBFilmGenre[]> => {
  const now = Date.now();

  if (filmGenreCache && filmGenreCache.expiresAt > now) {
    return filmGenreCache.value;
  }

  const data = await fetchTMDB("/genre/movie/list?language=en-US");
  const parsed = TMDBFilmGenreListSchema.parse(data);

  filmGenreCache = {
    value: parsed.genres,
    expiresAt: now + FILM_GENRE_CACHE_TTL_MS,
  };

  return parsed.genres;
};

export const discoverFilms = async (input: {
  page?: number;
  limit?: number;
  genreId?: number;
  languageCode?: string;
  releaseDateGte?: string;
  releaseDateLte?: string;
  minVoteCount?: number;
  sortBy?: TMDBDiscoverSortBy;
}): Promise<{
  page: number;
  totalPages: number;
  totalResults: number;
  results: TMDBDiscoverFilm[];
}> => {
  const page = Math.max(1, Math.floor(input.page ?? 1));
  const limit = Math.max(1, Math.min(50, Math.floor(input.limit ?? 20)));
  const minVoteCount = Math.max(0, Math.floor(input.minVoteCount ?? 15));
  const sortBy = input.sortBy ?? "primary_release_date.desc";

  const searchParams = new URLSearchParams({
    include_adult: "false",
    include_video: "false",
    language: "en-US",
    page: String(page),
    sort_by: sortBy,
    "vote_count.gte": String(minVoteCount),
    "with_runtime.gte": "40",
  });

  if (input.genreId && Number.isFinite(input.genreId)) {
    searchParams.set("with_genres", String(Math.floor(input.genreId)));
  }

  if (input.languageCode && /^[a-z]{2,3}$/i.test(input.languageCode)) {
    searchParams.set(
      "with_original_language",
      input.languageCode.toLowerCase(),
    );
  }

  if (
    input.releaseDateGte &&
    /^\d{4}-\d{2}-\d{2}$/.test(input.releaseDateGte)
  ) {
    searchParams.set("primary_release_date.gte", input.releaseDateGte);
  }

  if (
    input.releaseDateLte &&
    /^\d{4}-\d{2}-\d{2}$/.test(input.releaseDateLte)
  ) {
    searchParams.set("primary_release_date.lte", input.releaseDateLte);
  }

  const data = await fetchTMDB(`/discover/movie?${searchParams.toString()}`);
  const parsed = TMDBDiscoverFilmsSchema.parse(data);

  const cappedResults = parsed.results.slice(0, limit);

  return {
    page: parsed.page,
    totalPages: parsed.total_pages,
    totalResults: parsed.total_results,
    results: cappedResults,
  };
};

export const getFilmDetails = createCachedTmdbFetcher(async (tmdbId) => {
  const data = await fetchTMDB(`/movie/${tmdbId}?language=en-US`);
  return TMDBFilmDetailSchema.parse(data);
});

export const getFilmCredits = createCachedTmdbFetcher(async (tmdbId) => {
  const data = await fetchTMDB(`/movie/${tmdbId}/credits?language=en-US`);
  return TMDBFilmCreditsSchema.parse(data);
});

export const getFilmDirector = createCachedTmdbFetcher(async (tmdbId) => {
  const credits = await getFilmCredits(tmdbId);
  return credits.crew.find((member) => member.job === "Director")?.name ?? null;
});

export const getSimilarFilms = createCachedTmdbFetcher(async (tmdbId) => {
  try {
    const data = await fetchTMDB(`/movie/${tmdbId}/recommendations?language=en-US&page=1`);
    const parsed = TMDBDiscoverFilmsSchema.parse(data);
    if (parsed.results.length > 0) {
      return parsed.results;
    }
  } catch {
    // Fail silently to try similar fallback
  }

  try {
    const data = await fetchTMDB(`/movie/${tmdbId}/similar?language=en-US&page=1`);
    const parsed = TMDBDiscoverFilmsSchema.parse(data);
    return parsed.results;
  } catch {
    return [];
  }
});
