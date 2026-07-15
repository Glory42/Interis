import { z } from "zod";
import { personLinkSchema } from "@/features/people/shared";
import { serialGenreSchema, viewerInteractionSchema } from "./shared";

const serialDetailSeasonSchema = z.object({
  id: z.number().int().positive(),
  seasonNumber: z.number().int(),
  name: z.string(),
  episodeCount: z.number().int().nullable(),
  airDate: z.string().nullable(),
  posterPath: z.string().nullable(),
  viewerInteraction: viewerInteractionSchema,
});

const serialDetailSeriesSchema = z.object({
  id: z.number().int().positive(),
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
  crew: z.array(personLinkSchema).default([]),
  network: z.string().nullable(),
  episodeRuntime: z.number().int().nullable(),
  numberOfSeasons: z.number().int().nullable(),
  numberOfEpisodes: z.number().int().nullable(),
  status: z.string().nullable(),
  overview: z.string().nullable(),
  tagline: z.string().nullable(),
  languageCode: z.string().nullable(),
  genres: z.array(serialGenreSchema),
  globalRating: z.number().nullable(),
  globalRatingVoteCount: z.number().int().nullable(),
  inProduction: z.boolean().nullable(),
  seasons: z.array(serialDetailSeasonSchema),
});

export const serialDetailReviewSortSchema = z.enum(["popular", "recent"]);

const serialDetailUserRatingSchema = z
  .object({
    diaryEntryId: z.string().nullable(),
    reviewId: z.string().nullable(),
    watchedDate: z.string().nullable(),
    rewatch: z.boolean(),
    rating: z.number().nullable(),
    reviewContent: z.string().nullable(),
    reviewContainsSpoilers: z.boolean().nullable(),
  })
  .nullable();

const serialDetailReviewSchema = z.object({
  id: z.string(),
  content: z.string(),
  containsSpoilers: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
  watchedDate: z.string().nullable(),
  rating: z.number().nullable(),
  likeCount: z.number().int().nonnegative(),
  viewerHasLiked: z.boolean(),
  author: z.object({
    id: z.string(),
    username: z.string(),
    displayUsername: z.string().nullable(),
    image: z.string().nullable(),
    avatarUrl: z.string().nullable(),
  }),
  context: z
    .object({
      seasonNumber: z.number().int(),
      episodeNumber: z.number().int().nullable(),
      episodeName: z.string().nullable(),
    })
    .nullable(),
});

const serialDetailRatingBreakdownBucketSchema = z.object({
  ratingValue: z.number().int().min(1).max(10),
  count: z.number().int().nonnegative(),
  percentage: z.number().int().min(0).max(100),
});

const similarSeriesItemSchema = z.object({
  tmdbId: z.number().int(),
  title: z.string(),
  posterPath: z.string().nullable(),
  firstAirYear: z.number().int().nullable(),
});

const serialDetailViewerTrackingSchema = z
  .object({
    watchedEpisodesCount: z.number().int().nonnegative(),
    watchedEpisodes: z.array(
      z.object({
        seasonNumber: z.number().int(),
        episodeNumber: z.number().int(),
      }),
    ),
    currentEpisode: z
      .object({
        seasonNumber: z.number().int(),
        episodeNumber: z.number().int(),
        name: z.string(),
      })
      .nullable(),
    ratingsCount: z.number().int().nonnegative(),
    likesCount: z.number().int().nonnegative(),
    reviewsCount: z.number().int().nonnegative(),
  })
  .nullable();

export const serialDetailResponseSchema = z.object({
  series: serialDetailSeriesSchema,
  logsCount: z.number().int().nonnegative(),
  reviewCount: z.number().int().nonnegative(),
  userRating: serialDetailUserRatingSchema,
  reviewsSort: serialDetailReviewSortSchema,
  reviews: z.array(serialDetailReviewSchema),
  ratingBreakdown: z.object({
    totalRatedReviews: z.number().int().nonnegative(),
    averageRating: z.number().nullable(),
    buckets: z.array(serialDetailRatingBreakdownBucketSchema),
  }),
  similar: z.array(similarSeriesItemSchema),
  viewerTracking: serialDetailViewerTrackingSchema,
});
