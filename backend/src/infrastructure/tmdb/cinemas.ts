import { z } from "zod";
import { fetchTMDB } from "./base-client";
import {
  TMDBDiscoverMoviesSchema,
  TMDBMovieCreditsSchema,
  TMDBMovieDetailSchema,
  TMDBMovieGenreListSchema,
  TMDBSearchMovieSchema,
} from "./dto/cinemas-response.dto";
import type {
  TMDBDiscoverMovie,
  TMDBDiscoverSortBy,
  TMDBMovieDetail,
  TMDBMovieGenre,
  TMDBSearchMovie,
} from "./dto/cinemas-response.dto";

export type {
  TMDBDiscoverMovie,
  TMDBDiscoverMovies,
  TMDBDiscoverSortBy,
  TMDBMovieDetail,
  TMDBMovieGenre,
  TMDBSearchMovie,
} from "./dto/cinemas-response.dto";

const DIRECTOR_CACHE_TTL_MS = 30 * 60 * 1000;
const DIRECTOR_CACHE_MAX_ENTRIES = 1_000;
const MOVIE_GENRE_CACHE_TTL_MS = 6 * 60 * 60 * 1000;

type DirectorCacheEntry = {
  value: string | null;
  expiresAt: number;
};

type GenreCacheEntry = {
  value: TMDBMovieGenre[];
  expiresAt: number;
};

const directorCache = new Map<number, DirectorCacheEntry>();
const directorInFlight = new Map<number, Promise<string | null>>();
let movieGenreCache: GenreCacheEntry | null = null;

const pruneDirectorCache = (now: number): void => {
  for (const [cachedTmdbId, cacheEntry] of directorCache) {
    if (cacheEntry.expiresAt <= now) {
      directorCache.delete(cachedTmdbId);
    }
  }

  if (directorCache.size <= DIRECTOR_CACHE_MAX_ENTRIES) {
    return;
  }

  const overflow = directorCache.size - DIRECTOR_CACHE_MAX_ENTRIES;
  const cacheKeys = directorCache.keys();

  for (let index = 0; index < overflow; index += 1) {
    const nextKey = cacheKeys.next();
    if (nextKey.done) {
      break;
    }

    directorCache.delete(nextKey.value);
  }
};

export const searchMovies = async (
  query: string,
): Promise<TMDBSearchMovie[]> => {
  const data = await fetchTMDB(
    `/search/movie?query=${encodeURIComponent(query)}&include_adult=false&language=en-US&page=1`,
  );
  const results = (data as { results?: unknown }).results ?? [];
  return z.array(TMDBSearchMovieSchema).parse(results);
};

export const getNowPlayingMovies = async (): Promise<TMDBSearchMovie[]> => {
  const data = await fetchTMDB(
    "/movie/now_playing?language=en-US&page=1&region=US",
  );
  const results = (data as { results?: unknown }).results ?? [];
  return z.array(TMDBSearchMovieSchema).parse(results);
};

export const getTrendingMovies = async (
  timeWindow: "day" | "week" = "week",
): Promise<TMDBSearchMovie[]> => {
  const data = await fetchTMDB(
    `/trending/movie/${timeWindow}?language=en-US`,
  );
  const results = (data as { results?: unknown }).results ?? [];
  return z.array(TMDBSearchMovieSchema).parse(results);
};

export const getMovieGenres = async (): Promise<TMDBMovieGenre[]> => {
  const now = Date.now();

  if (movieGenreCache && movieGenreCache.expiresAt > now) {
    return movieGenreCache.value;
  }

  const data = await fetchTMDB("/genre/movie/list?language=en-US");
  const parsed = TMDBMovieGenreListSchema.parse(data);

  movieGenreCache = {
    value: parsed.genres,
    expiresAt: now + MOVIE_GENRE_CACHE_TTL_MS,
  };

  return parsed.genres;
};

export const discoverMovies = async (input: {
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
  results: TMDBDiscoverMovie[];
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
    searchParams.set("with_original_language", input.languageCode.toLowerCase());
  }

  if (input.releaseDateGte && /^\d{4}-\d{2}-\d{2}$/.test(input.releaseDateGte)) {
    searchParams.set("primary_release_date.gte", input.releaseDateGte);
  }

  if (input.releaseDateLte && /^\d{4}-\d{2}-\d{2}$/.test(input.releaseDateLte)) {
    searchParams.set("primary_release_date.lte", input.releaseDateLte);
  }

  const data = await fetchTMDB(`/discover/movie?${searchParams.toString()}`);
  const parsed = TMDBDiscoverMoviesSchema.parse(data);

  const cappedResults = parsed.results.slice(0, limit);

  return {
    page: parsed.page,
    totalPages: parsed.total_pages,
    totalResults: parsed.total_results,
    results: cappedResults,
  };
};

export const getMovieDetails = async (
  tmdbId: number,
): Promise<TMDBMovieDetail> => {
  const data = await fetchTMDB(`/movie/${tmdbId}?language=en-US`);
  return TMDBMovieDetailSchema.parse(data);
};

export const getMovieDirector = async (tmdbId: number): Promise<string | null> => {
  const now = Date.now();
  const cached = directorCache.get(tmdbId);

  if (cached && cached.expiresAt > now) {
    return cached.value;
  }

  if (cached) {
    directorCache.delete(tmdbId);
  }

  const inFlightRequest = directorInFlight.get(tmdbId);
  if (inFlightRequest) {
    return inFlightRequest;
  }

  const requestPromise = (async () => {
    const data = await fetchTMDB(`/movie/${tmdbId}/credits?language=en-US`);
    const credits = TMDBMovieCreditsSchema.parse(data);
    const director = credits.crew.find((member) => member.job === "Director")?.name ?? null;

    directorCache.set(tmdbId, {
      value: director,
      expiresAt: Date.now() + DIRECTOR_CACHE_TTL_MS,
    });
    pruneDirectorCache(Date.now());

    return director;
  })();

  directorInFlight.set(tmdbId, requestPromise);

  try {
    return await requestPromise;
  } finally {
    directorInFlight.delete(tmdbId);
  }
};
