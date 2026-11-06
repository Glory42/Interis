import { z } from "zod";
import { genreSchema, mediaTypeSchema } from "./common";
import { favoriteGenreSchema } from "./auth";

export const userStatsSchema = z.object({
  movieEntryCount: z.number().int().nonnegative(),
  serialEntryCount: z.number().int().nonnegative().optional(),
  reviewCount: z.number().int().nonnegative(),
  movieCount: z.number().int().nonnegative().optional(),
  listCount: z.number().int().nonnegative().optional(),
  followerCount: z.number().int().nonnegative().optional(),
  followingCount: z.number().int().nonnegative().optional(),
});

export const publicProfileSchema = z
  .object({
    id: z.string(),
    displayUsername: z.string().nullish(),
    username: z.string(),
    bio: z.string().nullish(),
    location: z.string().nullish(),
    avatarUrl: z.string().nullish(),
    favoriteGenres: z.array(favoriteGenreSchema).nullish(),
    themeId: z.string().optional(),
    isAdmin: z.boolean(),
    createdAt: z.string().optional(),
    stats: userStatsSchema.optional(),
  })
  .passthrough();

export const topPicksSchema = z.object({
  categories: z.array(
    z.object({
      id: z.number().int(),
      key: z.enum(["movie", "serial"]),
      supported: z.boolean(),
      items: z.array(
        z.object({
          slot: z.number().int(),
          mediaType: mediaTypeSchema,
          tmdbId: z.number().int().nullable(),
          title: z.string().nullable(),
          posterPath: z.string().nullable(),
          releaseYear: z.number().int().nullable(),
        }),
      ),
    }),
  ),
});

export const diaryItemSchema = z.object({
  id: z.string(),
  mediaType: mediaTypeSchema,
  watchedDate: z.string(),
  rating: z.number().nullable(),
  rewatch: z.boolean(),
  createdAt: z.string(),
  media: z.object({
    tmdbId: z.number().int(),
    title: z.string(),
    posterPath: z.string().nullable(),
    releaseYear: z.number().int().nullable(),
  }),
  review: z
    .object({
      id: z.string(),
      content: z.string(),
      containsSpoilers: z.boolean(),
    })
    .nullable(),
});

export const userReviewSchema = z
  .object({
    id: z.string(),
    content: z.string(),
    containsSpoilers: z.boolean(),
    rating: z.number().nullable().optional(),
    createdAt: z.string(),
    tmdbId: z.number().int(),
    title: z.string(),
    posterPath: z.string().nullable(),
    releaseYear: z.number().int().nullable(),
    mediaType: mediaTypeSchema.default("movie"),
  })
  .passthrough();

export const userInteractionMediaSchema = z
  .object({
    tmdbId: z.number().int(),
    title: z.string(),
    posterPath: z.string().nullable(),
    releaseYear: z.number().int().nullable(),
    genres: z.array(genreSchema).nullish(),
    mediaType: mediaTypeSchema.default("movie"),
    lastInteractionAt: z.string(),
  })
  .passthrough();

export const currentlyWatchingSchema = z.object({
  tmdbId: z.number().int(),
  title: z.string(),
  posterPath: z.string().nullable(),
  numberOfEpisodes: z.number().int().nullable(),
  watchedEpisodesCount: z.number().int(),
  progressPercent: z.number(),
  currentEpisode: z
    .object({
      seasonNumber: z.number().int(),
      episodeNumber: z.number().int(),
      name: z.string(),
    })
    .nullable(),
});

export const followUserSchema = z.object({
  id: z.string(),
  username: z.string(),
  displayUsername: z.string().nullish(),
  avatarUrl: z.string().nullish(),
});

export type PublicProfile = z.infer<typeof publicProfileSchema>;
export type TopPicks = z.infer<typeof topPicksSchema>;
export type DiaryItem = z.infer<typeof diaryItemSchema>;
export type UserReview = z.infer<typeof userReviewSchema>;
export type UserInteractionMedia = z.infer<typeof userInteractionMediaSchema>;
export type CurrentlyWatching = z.infer<typeof currentlyWatchingSchema>;
export type FollowUser = z.infer<typeof followUserSchema>;
