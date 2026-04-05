import { z } from "zod";

export const TMDBSearchMovieSchema = z.object({
  id: z.number(),
  title: z.string(),
  poster_path: z.string().nullable(),
  release_date: z.string().default(""),
  overview: z.string().default(""),
});

export const TMDBMovieDetailSchema = z.object({
  id: z.number(),
  title: z.string(),
  original_title: z.string().default(""),
  poster_path: z.string().nullable(),
  backdrop_path: z.string().nullable(),
  release_date: z.string().default(""),
  vote_average: z.number().default(0),
  vote_count: z.number().int().default(0),
  original_language: z.string().default(""),
  runtime: z.number().nullable(),
  overview: z.string().default(""),
  tagline: z.string().default(""),
  production_countries: z
    .array(
      z.object({
        iso_3166_1: z.string(),
        name: z.string(),
      }),
    )
    .default([]),
  budget: z.number().int().nonnegative().default(0),
  revenue: z.number().int().nonnegative().default(0),
  genres: z.array(z.object({ id: z.number(), name: z.string() })).default([]),
});

export const TMDBMovieGenreSchema = z.object({
  id: z.number(),
  name: z.string(),
});

export const TMDBMovieGenreListSchema = z.object({
  genres: z.array(TMDBMovieGenreSchema),
});

export const TMDBDiscoverMovieSchema = z.object({
  id: z.number(),
  title: z.string(),
  poster_path: z.string().nullable(),
  backdrop_path: z.string().nullable(),
  release_date: z.string().default(""),
  original_language: z.string().default(""),
  vote_average: z.number().default(0),
  vote_count: z.number().int().default(0),
  overview: z.string().default(""),
  genre_ids: z.array(z.number()).default([]),
});

export const TMDBDiscoverMoviesSchema = z.object({
  page: z.number().int().positive(),
  total_pages: z.number().int().positive(),
  total_results: z.number().int().nonnegative(),
  results: z.array(TMDBDiscoverMovieSchema),
});

export const TMDBMovieCreditsSchema = z.object({
  crew: z
    .array(
      z.object({
        job: z.string().default(""),
        name: z.string().default(""),
      }),
    )
    .default([]),
});

export type TMDBSearchMovie = z.infer<typeof TMDBSearchMovieSchema>;
export type TMDBMovieDetail = z.infer<typeof TMDBMovieDetailSchema>;
export type TMDBMovieGenre = z.infer<typeof TMDBMovieGenreSchema>;
export type TMDBDiscoverMovie = z.infer<typeof TMDBDiscoverMovieSchema>;
export type TMDBDiscoverMovies = z.infer<typeof TMDBDiscoverMoviesSchema>;
export type TMDBDiscoverSortBy =
  | "popularity.desc"
  | "vote_average.desc"
  | "primary_release_date.desc"
  | "primary_release_date.asc"
  | "original_title.asc";
