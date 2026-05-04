import { z } from "zod";
import { fetchTMDB } from "./base-client";
import {
  TMDBSeriesAggregateCreditsSchema,
  TMDBDiscoverSeriesListSchema,
  TMDBSeriesDetailSchema,
  TMDBSeriesGenreListSchema,
  TMDBSeriesSeasonDetailSchema,
  TMDBSearchSeriesSchema,
} from "./dto/serials-response.dto";
import type {
  TMDBSeriesAggregateCredits,
  TMDBDiscoverSeries,
  TMDBDiscoverSeriesSortBy,
  TMDBSeriesDetail,
  TMDBSeriesGenre,
  TMDBSeriesSeasonDetail,
  TMDBSearchSeries,
} from "./dto/serials-response.dto";

export type {
  TMDBSeriesAggregateCredits,
  TMDBDiscoverSeries,
  TMDBDiscoverSeriesList,
  TMDBDiscoverSeriesSortBy,
  TMDBSeriesDetail,
  TMDBSeriesGenre,
  TMDBSeriesSeasonDetail,
  TMDBSearchSeries,
} from "./dto/serials-response.dto";

const SERIES_GENRE_CACHE_TTL_MS = 6 * 60 * 60 * 1000;

type GenreCacheEntry = {
  value: TMDBSeriesGenre[];
  expiresAt: number;
};

let seriesGenreCache: GenreCacheEntry | null = null;

export const searchSeries = async (
  query: string,
): Promise<TMDBSearchSeries[]> => {
  const data = await fetchTMDB(
    `/search/tv?query=${encodeURIComponent(query)}&include_adult=false&language=en-US&page=1`,
  );
  const results = (data as { results?: unknown }).results ?? [];
  return z.array(TMDBSearchSeriesSchema).parse(results);
};

export const getTrendingSeries = async (
  timeWindow: "day" | "week" = "week",
): Promise<TMDBSearchSeries[]> => {
  const trendingPage = await getTrendingSeriesPage(timeWindow);
  return trendingPage.results;
};

export const getTrendingSeriesPage = async (
  timeWindow: "day" | "week" = "week",
  input: { page?: number; limit?: number } = {},
): Promise<{
  page: number;
  totalPages: number;
  totalResults: number;
  results: TMDBDiscoverSeries[];
}> => {
  const page = Math.max(1, Math.floor(input.page ?? 1));
  const limit = Math.max(1, Math.min(50, Math.floor(input.limit ?? 20)));

  const data = await fetchTMDB(
    `/trending/tv/${timeWindow}?language=en-US&page=${page}`,
  );
  const parsed = TMDBDiscoverSeriesListSchema.parse(data);

  return {
    page: parsed.page,
    totalPages: parsed.total_pages,
    totalResults: parsed.total_results,
    results: parsed.results.slice(0, limit),
  };
};

export const getSeriesGenres = async (): Promise<TMDBSeriesGenre[]> => {
  const now = Date.now();

  if (seriesGenreCache && seriesGenreCache.expiresAt > now) {
    return seriesGenreCache.value;
  }

  const data = await fetchTMDB("/genre/tv/list?language=en-US");
  const parsed = TMDBSeriesGenreListSchema.parse(data);

  seriesGenreCache = {
    value: parsed.genres,
    expiresAt: now + SERIES_GENRE_CACHE_TTL_MS,
  };

  return parsed.genres;
};

export const discoverSeries = async (input: {
  page?: number;
  limit?: number;
  genreId?: number;
  languageCode?: string;
  firstAirDateGte?: string;
  firstAirDateLte?: string;
  minVoteCount?: number;
  sortBy?: TMDBDiscoverSeriesSortBy;
}): Promise<{
  page: number;
  totalPages: number;
  totalResults: number;
  results: TMDBDiscoverSeries[];
}> => {
  const page = Math.max(1, Math.floor(input.page ?? 1));
  const limit = Math.max(1, Math.min(50, Math.floor(input.limit ?? 20)));
  const minVoteCount = Math.max(0, Math.floor(input.minVoteCount ?? 15));
  const sortBy = input.sortBy ?? "popularity.desc";

  const searchParams = new URLSearchParams({
    include_adult: "false",
    language: "en-US",
    page: String(page),
    sort_by: sortBy,
    "vote_count.gte": String(minVoteCount),
  });

  if (input.genreId && Number.isFinite(input.genreId)) {
    searchParams.set("with_genres", String(Math.floor(input.genreId)));
  }

  if (input.languageCode && /^[a-z]{2,3}$/i.test(input.languageCode)) {
    searchParams.set("with_original_language", input.languageCode.toLowerCase());
  }

  if (input.firstAirDateGte && /^\d{4}-\d{2}-\d{2}$/.test(input.firstAirDateGte)) {
    searchParams.set("first_air_date.gte", input.firstAirDateGte);
  }

  if (input.firstAirDateLte && /^\d{4}-\d{2}-\d{2}$/.test(input.firstAirDateLte)) {
    searchParams.set("first_air_date.lte", input.firstAirDateLte);
  }

  const data = await fetchTMDB(`/discover/tv?${searchParams.toString()}`);
  const parsed = TMDBDiscoverSeriesListSchema.parse(data);

  return {
    page: parsed.page,
    totalPages: parsed.total_pages,
    totalResults: parsed.total_results,
    results: parsed.results.slice(0, limit),
  };
};

export const getSeriesDetails = async (
  tmdbId: number,
): Promise<TMDBSeriesDetail> => {
  const data = await fetchTMDB(`/tv/${tmdbId}?language=en-US`);
  return TMDBSeriesDetailSchema.parse(data);
};

export const getSeriesSeasonDetails = async (
  tmdbId: number,
  seasonNumber: number,
): Promise<TMDBSeriesSeasonDetail> => {
  const data = await fetchTMDB(`/tv/${tmdbId}/season/${seasonNumber}?language=en-US`);
  return TMDBSeriesSeasonDetailSchema.parse(data);
};

export const getSeriesAggregateCredits = async (
  tmdbId: number,
): Promise<TMDBSeriesAggregateCredits> => {
  const data = await fetchTMDB(`/tv/${tmdbId}/aggregate_credits?language=en-US`);
  return TMDBSeriesAggregateCreditsSchema.parse(data);
};
