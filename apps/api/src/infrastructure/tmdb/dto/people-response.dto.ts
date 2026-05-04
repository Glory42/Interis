import { z } from "zod";

const tmdbCreditBaseSchema = z.object({
  id: z.number(),
  poster_path: z.string().nullable(),
  backdrop_path: z.string().nullable(),
  title: z.string().optional().default(""),
  name: z.string().optional().default(""),
  original_title: z.string().optional().default(""),
  original_name: z.string().optional().default(""),
  release_date: z.string().optional().default(""),
  first_air_date: z.string().optional().default(""),
  vote_average: z.number().optional().default(0),
  vote_count: z.number().int().optional().default(0),
  episode_count: z.number().int().nullable().optional().default(null),
});

export const TMDBPersonDetailSchema = z.object({
  id: z.number(),
  name: z.string(),
  known_for_department: z.string().default(""),
  profile_path: z.string().nullable(),
  biography: z.string().default(""),
  birthday: z.string().nullable().optional().default(null),
  deathday: z.string().nullable().optional().default(null),
  place_of_birth: z.string().nullable().optional().default(null),
  popularity: z.number().optional().default(0),
  homepage: z.string().nullable().optional().default(null),
  also_known_as: z.array(z.string()).default([]),
  imdb_id: z.string().nullable().optional().default(null),
});

export const TMDBPersonExternalIdsSchema = z.object({
  imdb_id: z.string().nullable().optional().default(null),
  facebook_id: z.string().nullable().optional().default(null),
  instagram_id: z.string().nullable().optional().default(null),
  twitter_id: z.string().nullable().optional().default(null),
  wikidata_id: z.string().nullable().optional().default(null),
  tiktok_id: z.string().nullable().optional().default(null),
  youtube_id: z.string().nullable().optional().default(null),
});

export const TMDBPersonImagesSchema = z.object({
  profiles: z
    .array(
      z.object({
        file_path: z.string(),
        width: z.number().int(),
        height: z.number().int(),
        vote_average: z.number().optional().default(0),
        vote_count: z.number().int().optional().default(0),
      }),
    )
    .default([]),
});

export const TMDBPersonCombinedCreditCastSchema = tmdbCreditBaseSchema.extend({
  media_type: z.enum(["movie", "tv"]),
  character: z.string().optional().default(""),
  order: z.number().int().optional().default(0),
});

export const TMDBPersonCombinedCreditCrewSchema = tmdbCreditBaseSchema.extend({
  media_type: z.enum(["movie", "tv"]),
  job: z.string().optional().default(""),
  department: z.string().optional().default(""),
});

export const TMDBPersonCombinedCreditsSchema = z.object({
  cast: z.array(TMDBPersonCombinedCreditCastSchema).default([]),
  crew: z.array(TMDBPersonCombinedCreditCrewSchema).default([]),
});

export const TMDBPersonMovieCreditCastSchema = tmdbCreditBaseSchema.extend({
  character: z.string().optional().default(""),
  order: z.number().int().optional().default(0),
});

export const TMDBPersonMovieCreditCrewSchema = tmdbCreditBaseSchema.extend({
  job: z.string().optional().default(""),
  department: z.string().optional().default(""),
});

export const TMDBPersonMovieCreditsSchema = z.object({
  cast: z.array(TMDBPersonMovieCreditCastSchema).default([]),
  crew: z.array(TMDBPersonMovieCreditCrewSchema).default([]),
});

export const TMDBPersonTvCreditCastSchema = tmdbCreditBaseSchema.extend({
  character: z.string().optional().default(""),
});

export const TMDBPersonTvCreditCrewSchema = tmdbCreditBaseSchema.extend({
  job: z.string().optional().default(""),
  department: z.string().optional().default(""),
});

export const TMDBPersonTvCreditsSchema = z.object({
  cast: z.array(TMDBPersonTvCreditCastSchema).default([]),
  crew: z.array(TMDBPersonTvCreditCrewSchema).default([]),
});

export type TMDBPersonDetail = z.infer<typeof TMDBPersonDetailSchema>;
export type TMDBPersonExternalIds = z.infer<typeof TMDBPersonExternalIdsSchema>;
export type TMDBPersonImages = z.infer<typeof TMDBPersonImagesSchema>;
export type TMDBPersonCombinedCredits = z.infer<typeof TMDBPersonCombinedCreditsSchema>;
export type TMDBPersonMovieCredits = z.infer<typeof TMDBPersonMovieCreditsSchema>;
export type TMDBPersonTvCredits = z.infer<typeof TMDBPersonTvCreditsSchema>;
