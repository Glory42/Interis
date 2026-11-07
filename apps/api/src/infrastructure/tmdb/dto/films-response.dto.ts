import { z } from "zod";

export const TMDBSearchFilmSchema = z.object({
  id: z.number(),
  title: z.string(),
  poster_path: z.string().nullable(),
  release_date: z.string().default(""),
  overview: z.string().default(""),
  popularity: z.number().default(0),
});

export const TMDBFilmDetailSchema = z.object({
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

export const TMDBFilmGenreSchema = z.object({
  id: z.number(),
  name: z.string(),
});

export const TMDBFilmGenreListSchema = z.object({
  genres: z.array(TMDBFilmGenreSchema),
});

export const TMDBDiscoverFilmSchema = z.object({
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
  popularity: z.number().default(0),
});

export const TMDBDiscoverFilmsSchema = z.object({
  page: z.number().int().positive(),
  total_pages: z.number().int().positive(),
  total_results: z.number().int().nonnegative(),
  results: z.array(TMDBDiscoverFilmSchema),
});

const TMDBFilmCreditCastSchema = z.object({
  id: z.number(),
  name: z.string().default(""),
  character: z.string().optional().default(""),
  known_for_department: z.string().nullable().optional().default(null),
  profile_path: z.string().nullable(),
  popularity: z.number().optional().default(0),
  order: z.number().int().optional().default(0),
});

const TMDBFilmCreditCrewSchema = z.object({
  id: z.number(),
  name: z.string().default(""),
  job: z.string().default(""),
  department: z.string().default(""),
  known_for_department: z.string().nullable().optional().default(null),
  profile_path: z.string().nullable(),
  popularity: z.number().optional().default(0),
});

export const TMDBFilmCreditsSchema = z.object({
  cast: z.array(TMDBFilmCreditCastSchema).default([]),
  crew: z.array(TMDBFilmCreditCrewSchema).default([]),
});

export type TMDBSearchFilm = z.infer<typeof TMDBSearchFilmSchema>;
export type TMDBFilmDetail = z.infer<typeof TMDBFilmDetailSchema>;
export type TMDBFilmGenre = z.infer<typeof TMDBFilmGenreSchema>;
export type TMDBDiscoverFilm = z.infer<typeof TMDBDiscoverFilmSchema>;
export type TMDBDiscoverFilms = z.infer<typeof TMDBDiscoverFilmsSchema>;

export type TMDBFilmCredits = z.infer<typeof TMDBFilmCreditsSchema>;
export type TMDBDiscoverSortBy =
  | "popularity.desc"
  | "vote_average.desc"
  | "primary_release_date.desc"
  | "primary_release_date.asc"
  | "original_title.asc";
