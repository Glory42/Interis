import { z } from "zod";
import {
  archiveGenreCountSchema,
  archivePeriodSchema,
  genreSchema,
  personLinkSchema,
  ratingBreakdownSchema,
  reviewSortSchema,
  viewerUserRatingSchema,
} from "./common";
import { mediaReviewSchema } from "./movies";

export const serialArchiveSortSchema = z.enum([
  "trending",
  "first_air_desc",
  "first_air_asc",
  "logs_desc",
  "rating_user_desc",
  "rating_tmdb_desc",
  "title_asc",
]);
export type SerialArchiveSort = z.infer<typeof serialArchiveSortSchema>;

export const serialArchiveItemSchema = z.object({
  tmdbId: z.number().int().positive(),
  title: z.string(),
  posterPath: z.string().nullable(),
  backdropPath: z.string().nullable(),
  firstAirDate: z.string().nullable(),
  firstAirYear: z.number().int().nullable(),
  creator: z.string().nullable(),
  network: z.string().nullable(),
  genres: z.array(genreSchema),
  primaryGenre: z.string().nullable(),
  logCount: z.number().int().nonnegative(),
  avgRatingOutOfTen: z.number().nullable(),
  tmdbRatingOutOfTen: z.number().nullable(),
  numberOfEpisodes: z.number().int().nullable(),
  viewerHasLogged: z.boolean(),
  viewerWatchlisted: z.boolean(),
  viewerFullyWatched: z.boolean(),
  viewerHasProgress: z.boolean(),
});

export const serialArchiveResponseSchema = z.object({
  totalCount: z.number().int().nonnegative(),
  filteredCount: z.number().int().nonnegative(),
  selectedGenre: z.string().nullable(),
  selectedSort: serialArchiveSortSchema,
  selectedPeriod: archivePeriodSchema,
  availableGenres: z.array(archiveGenreCountSchema),
  page: z.number().int().positive(),
  limit: z.number().int().positive(),
  hasMore: z.boolean(),
  nextPage: z.number().int().positive().nullable(),
  items: z.array(serialArchiveItemSchema),
});

const viewerInteractionSchema = z
  .object({
    watched: z.boolean(),
    liked: z.boolean(),
    rating: z.number().nullable(),
    hasReview: z.boolean(),
  })
  .nullable();

export const serialDetailResponseSchema = z.object({
  series: z.object({
    id: z.number().int().nonnegative(),
    tmdbId: z.number().int().positive(),
    title: z.string(),
    originalTitle: z.string().nullable(),
    posterPath: z.string().nullable(),
    backdropPath: z.string().nullable(),
    firstAirDate: z.string().nullable(),
    firstAirYear: z.number().int().nullable(),
    lastAirDate: z.string().nullable(),
    creator: z.string().nullable(),
    creators: z.array(personLinkSchema).default([]),
    cast: z.array(personLinkSchema).default([]),
    network: z.string().nullable(),
    episodeRuntime: z.number().int().nullable(),
    numberOfSeasons: z.number().int().nullable(),
    numberOfEpisodes: z.number().int().nullable(),
    status: z.string().nullable(),
    overview: z.string().nullable(),
    tagline: z.string().nullable(),
    genres: z.array(genreSchema),
    globalRating: z.number().nullable(),
    globalRatingVoteCount: z.number().int().nullable(),
    seasons: z.array(
      z.object({
        id: z.number().int().positive(),
        seasonNumber: z.number().int(),
        name: z.string(),
        episodeCount: z.number().int().nullable(),
        airDate: z.string().nullable(),
        posterPath: z.string().nullable(),
        viewerInteraction: viewerInteractionSchema,
      }),
    ),
  }),
  logsCount: z.number().int().nonnegative(),
  reviewCount: z.number().int().nonnegative(),
  userRating: viewerUserRatingSchema,
  reviewsSort: reviewSortSchema,
  reviews: z.array(mediaReviewSchema),
  reviewsHasMore: z.boolean(),
  ratingBreakdown: ratingBreakdownSchema,
  similar: z.array(
    z.object({
      tmdbId: z.number().int(),
      title: z.string(),
      posterPath: z.string().nullable(),
      firstAirYear: z.number().int().nullable(),
    }),
  ),
  viewerTracking: z
    .object({
      watchedEpisodesCount: z.number().int().nonnegative(),
      currentEpisode: z
        .object({
          seasonNumber: z.number().int(),
          episodeNumber: z.number().int(),
          name: z.string(),
        })
        .nullable(),
    })
    .passthrough()
    .nullable(),
});

export const serialWatchStatusSchema = z.enum(["watching", "paused", "dropped", "completed"]);
export type SerialWatchStatus = z.infer<typeof serialWatchStatusSchema>;
export type UserSetSerialWatchStatus = Exclude<SerialWatchStatus, "completed">;

export const serialInteractionSchema = z
  .object({
    liked: z.boolean(),
    watchlisted: z.boolean(),
    rating: z.number().nullable(),
    watched: z.boolean(),
    watchStatus: serialWatchStatusSchema.nullable().default(null),
  })
  .passthrough();

export const serialSeasonDetailSchema = z.object({
  tmdbId: z.number().int().positive(),
  season: z.object({
    id: z.number().int().positive(),
    seasonNumber: z.number().int().nonnegative(),
    name: z.string(),
    overview: z.string().nullable(),
    airDate: z.string().nullable(),
    posterPath: z.string().nullable(),
    episodeCount: z.number().int().nonnegative(),
  }),
  episodes: z.array(
    z.object({
      id: z.number().int().positive(),
      seasonNumber: z.number().int().nonnegative(),
      episodeNumber: z.number().int().positive(),
      name: z.string(),
      overview: z.string().nullable(),
      airDate: z.string().nullable(),
      stillPath: z.string().nullable(),
      runtimeLabel: z.string().nullable(),
      viewerInteraction: viewerInteractionSchema,
    }),
  ),
});

export type SerialArchiveItem = z.infer<typeof serialArchiveItemSchema>;
export type SerialArchiveResponse = z.infer<typeof serialArchiveResponseSchema>;
export type SerialDetailResponse = z.infer<typeof serialDetailResponseSchema>;
export type SerialInteraction = z.infer<typeof serialInteractionSchema>;
export type SerialSeasonDetail = z.infer<typeof serialSeasonDetailSchema>;
export type UpdateSerialInteractionInput = {
  liked?: boolean;
  watchlisted?: boolean;
  rating?: number | null;
  watched?: boolean;
  watchStatus?: UserSetSerialWatchStatus;
};
