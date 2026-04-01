import { z } from "zod";

export const TMDBSearchSeriesSchema = z.object({
  id: z.number(),
  name: z.string(),
  poster_path: z.string().nullable(),
  first_air_date: z.string().nullable().default(null),
  overview: z.string().default(""),
});

export const TMDBSeriesGenreSchema = z.object({
  id: z.number(),
  name: z.string(),
});

export const TMDBSeriesGenreListSchema = z.object({
  genres: z.array(TMDBSeriesGenreSchema),
});

export const TMDBDiscoverSeriesSchema = z.object({
  id: z.number(),
  name: z.string(),
  poster_path: z.string().nullable(),
  backdrop_path: z.string().nullable(),
  first_air_date: z.string().nullable().default(null),
  original_language: z.string().default(""),
  vote_average: z.number().default(0),
  vote_count: z.number().int().default(0),
  overview: z.string().default(""),
  genre_ids: z.array(z.number()).default([]),
});

export const TMDBDiscoverSeriesListSchema = z.object({
  page: z.number().int().positive(),
  total_pages: z.number().int().positive(),
  total_results: z.number().int().nonnegative(),
  results: z.array(TMDBDiscoverSeriesSchema),
});

export const TMDBSeriesDetailSchema = z.object({
  id: z.number(),
  name: z.string(),
  original_name: z.string().default(""),
  poster_path: z.string().nullable(),
  backdrop_path: z.string().nullable(),
  first_air_date: z.string().nullable().default(null),
  last_air_date: z.string().nullable().default(null),
  vote_average: z.number().default(0),
  vote_count: z.number().int().default(0),
  original_language: z.string().default(""),
  episode_run_time: z.array(z.number().int()).default([]),
  overview: z.string().default(""),
  tagline: z.string().default(""),
  genres: z.array(TMDBSeriesGenreSchema).default([]),
  status: z.string().default(""),
  in_production: z.boolean().default(false),
  number_of_seasons: z.number().int().nullable(),
  number_of_episodes: z.number().int().nullable(),
  created_by: z
    .array(
      z.object({
        id: z.number(),
        name: z.string().default(""),
      }),
    )
    .default([]),
  networks: z
    .array(
      z.object({
        id: z.number(),
        name: z.string().default(""),
      }),
    )
    .default([]),
  seasons: z
    .array(
      z.object({
        id: z.number(),
        name: z.string().default(""),
        season_number: z.number().int(),
        episode_count: z.number().int().nullable(),
        air_date: z.string().nullable().default(null),
        poster_path: z.string().nullable(),
      }),
    )
    .default([]),
});

export const TMDBSeriesSeasonDetailSchema = z.object({
  id: z.number(),
  name: z.string().default(""),
  season_number: z.number().int(),
  air_date: z.string().nullable().default(null),
  overview: z.string().default(""),
  poster_path: z.string().nullable(),
  episodes: z
    .array(
      z.object({
        id: z.number(),
        name: z.string().default(""),
        overview: z.string().default(""),
        episode_number: z.number().int(),
        season_number: z.number().int(),
        still_path: z.string().nullable(),
        air_date: z.string().nullable().default(null),
        runtime: z.number().int().nullable().optional(),
      }),
    )
    .default([]),
});

export type TMDBSearchSeries = z.infer<typeof TMDBSearchSeriesSchema>;
export type TMDBSeriesGenre = z.infer<typeof TMDBSeriesGenreSchema>;
export type TMDBDiscoverSeries = z.infer<typeof TMDBDiscoverSeriesSchema>;
export type TMDBDiscoverSeriesList = z.infer<typeof TMDBDiscoverSeriesListSchema>;
export type TMDBSeriesDetail = z.infer<typeof TMDBSeriesDetailSchema>;
export type TMDBSeriesSeasonDetail = z.infer<typeof TMDBSeriesSeasonDetailSchema>;
export type TMDBDiscoverSeriesSortBy =
  | "popularity.desc"
  | "vote_average.desc"
  | "first_air_date.desc"
  | "first_air_date.asc"
  | "name.asc";
