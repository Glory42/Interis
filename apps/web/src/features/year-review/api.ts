import { z } from "zod";
import { apiRequest } from "@/lib/api-client";

const mediaTypeSchema = z.enum(["movie", "tv"]);

const titleSchema = z.object({
  mediaType: mediaTypeSchema,
  tmdbId: z.number(),
  title: z.string(),
  posterPath: z.string().nullable(),
  backdropPath: z.string().nullable(),
  releaseYear: z.number().nullable(),
});

const rankedTitleSchema = titleSchema.extend({
  rating: z.number().nullable(),
  logCount: z.number(),
  watchedDate: z.string(),
});

const spotlightTitleSchema = rankedTitleSchema.extend({
  review: z
    .object({
      id: z.string(),
      excerpt: z.string(),
      containsSpoilers: z.boolean(),
    })
    .nullable(),
});

const personaSchema = z.object({
  id: z.enum([
    "time-traveller",
    "completionist",
    "rewatcher",
    "marathoner",
    "curator",
    "critic",
    "romantic",
    "explorer",
    "devotee",
  ]),
  name: z.string(),
  tagline: z.string(),
  description: z.string(),
  traits: z.array(z.string()),
  score: z.number(),
});

const yearReviewSchema = z.object({
  year: z.number(),
  isPartialYear: z.boolean(),
  depth: z.enum(["empty", "thin", "full"]),
  user: z.object({ username: z.string(), displayName: z.string(), avatarUrl: z.string().nullable() }),
  totals: z.object({
    films: z.number(),
    series: z.number(),
    logs: z.number(),
    filmLogs: z.number(),
    seriesLogs: z.number(),
    rewatchLogs: z.number(),
    episodes: z.number(),
    hoursWatched: z.number(),
    filmHours: z.number(),
    seriesHours: z.number(),
  }),
  previousYear: z.object({ films: z.number(), series: z.number(), hoursWatched: z.number() }).nullable(),
  months: z.array(z.object({ month: z.number(), count: z.number() })),
  busiestMonth: z.object({ month: z.number(), count: z.number() }).nullable(),
  busiestDay: z.object({ day: z.string(), count: z.number() }).nullable(),
  logsPerDay: z.array(z.object({ day: z.string(), count: z.number() })),
  longestStreak: z.object({ days: z.number(), start: z.string(), end: z.string() }).nullable(),
  firstWatch: titleSchema.extend({ watchedDate: z.string() }).nullable(),
  lastWatch: titleSchema.extend({ watchedDate: z.string() }).nullable(),
  topGenres: z.array(z.object({ genre: z.string(), count: z.number() })),
  distinctGenres: z.number(),
  topDirectors: z.array(z.object({ director: z.string(), count: z.number(), slug: z.string().nullable() })),
  directorTitles: z.array(titleSchema),
  distinctDirectors: z.number(),
  decades: z.array(z.object({ decade: z.number(), count: z.number() })),
  viewingAge: z.number().nullable(),
  pre1980Share: z.number().nullable(),
  topRated: z.array(titleSchema.extend({ rating: z.number() })),
  topFilms: z.array(rankedTitleSchema),
  topSeries: z.array(rankedTitleSchema),
  topFilm: spotlightTitleSchema.nullable(),
  topSeriesSpotlight: spotlightTitleSchema.nullable(),
  mostRewatched: titleSchema.extend({ logCount: z.number() }).nullable(),
  ratings: z.object({ average: z.number().nullable(), ratedLogs: z.number(), communityAverage: z.number().nullable() }),
  highRatings: z.number(),
  reviews: z.object({
    count: z.number(),
    mostLiked: z
      .object({
        id: z.string(),
        mediaType: mediaTypeSchema,
        tmdbId: z.number().nullable(),
        mediaTitle: z.string(),
        posterPath: z.string().nullable(),
        likeCount: z.number(),
        containsSpoilers: z.boolean(),
        excerpt: z.string(),
      })
      .nullable(),
  }),
  listsCreated: z.number(),
  newFollowers: z.number(),
  goal: z
    .object({
      targetFilms: z.number().nullable(),
      targetSeries: z.number().nullable(),
      filmsWatched: z.number(),
      seriesWatched: z.number(),
      reached: z.boolean(),
    })
    .nullable(),
  persona: personaSchema.nullable(),
  posterPaths: z.array(z.string()),
  availableYears: z.array(z.number()),
});

export type YearReview = z.infer<typeof yearReviewSchema>;
export type YearReviewTitle = z.infer<typeof titleSchema>;

export const getYearReview = async (
  username: string,
  year: number,
  options: { signal?: AbortSignal } = {},
): Promise<YearReview> => {
  const response = await apiRequest<unknown>(`/api/users/${encodeURIComponent(username)}/year/${year}`, {
    method: "GET",
    signal: options.signal,
  });
  return yearReviewSchema.parse(response);
};
