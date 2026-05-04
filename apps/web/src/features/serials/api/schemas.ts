import { z } from "zod";
import { personLinkSchema } from "@/features/people/shared";

export const tmdbSearchSeriesSchema = z.object({
  id: z.number().int().positive(),
  name: z.string(),
  poster_path: z.string().nullable(),
  first_air_date: z.string(),
  overview: z.string(),
});

const serialGenreSchema = z.object({
  id: z.number().int(),
  name: z.string(),
});

const serialArchiveItemSchema = z.object({
  tmdbId: z.number().int().positive(),
  title: z.string(),
  posterPath: z.string().nullable(),
  backdropPath: z.string().nullable(),
  firstAirDate: z.string().nullable(),
  firstAirYear: z.number().int().nullable(),
  creator: z.string().nullable(),
  network: z.string().nullable(),
  languageCode: z.string().nullable(),
  genres: z.array(serialGenreSchema),
  primaryGenre: z.string().nullable(),
  logCount: z.number().int().nonnegative(),
  avgRatingOutOfTen: z.number().nullable(),
  tmdbRatingOutOfTen: z.number().nullable(),
  ratedLogCount: z.number().int().nonnegative(),
  viewerHasLogged: z.boolean(),
  viewerWatchlisted: z.boolean(),
});

const serialArchiveFeaturedSchema = z.object({
  tmdbId: z.number().int().positive(),
  title: z.string(),
  posterPath: z.string().nullable(),
  backdropPath: z.string().nullable(),
  firstAirDate: z.string().nullable(),
  firstAirYear: z.number().int().nullable(),
  creator: z.string().nullable(),
  network: z.string().nullable(),
});

const serialArchiveGenreCountSchema = z.object({
  id: z.number().int().nullable().optional(),
  name: z.string(),
  count: z.number().int().nonnegative().nullable(),
});

export const serialArchiveSortSchema = z.enum([
  "trending",
  "first_air_desc",
  "first_air_asc",
  "logs_desc",
  "rating_user_desc",
  "rating_tmdb_desc",
  "title_asc",
]);

export const serialArchivePeriodSchema = z.enum([
  "all_time",
  "this_year",
  "last_10_years",
  "this_week",
  "today",
]);

export const serialArchiveResponseSchema = z.object({
  totalCount: z.number().int().nonnegative(),
  filteredCount: z.number().int().nonnegative(),
  selectedGenre: z.string().nullable(),
  selectedLanguage: z.string().nullable(),
  selectedSort: serialArchiveSortSchema,
  selectedPeriod: serialArchivePeriodSchema,
  featuredSeries: serialArchiveFeaturedSchema.nullable(),
  availableGenres: z.array(serialArchiveGenreCountSchema),
  page: z.number().int().positive(),
  limit: z.number().int().positive(),
  hasMore: z.boolean(),
  nextPage: z.number().int().positive().nullable(),
  items: z.array(serialArchiveItemSchema),
});

const serialDetailSeasonSchema = z.object({
  id: z.number().int().positive(),
  seasonNumber: z.number().int(),
  name: z.string(),
  episodeCount: z.number().int().nullable(),
  airDate: z.string().nullable(),
  posterPath: z.string().nullable(),
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
  globalRatingOutOfTen: z.number().nullable(),
  globalRatingOutOfFive: z.number().nullable(),
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
    ratingOutOfTen: z.number().nullable(),
    ratingOutOfFive: z.number().nullable(),
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
  ratingOutOfTen: z.number().nullable(),
  ratingOutOfFive: z.number().nullable(),
  likeCount: z.number().int().nonnegative(),
  viewerHasLiked: z.boolean(),
  author: z.object({
    id: z.string(),
    username: z.string(),
    displayUsername: z.string().nullable(),
    image: z.string().nullable(),
    avatarUrl: z.string().nullable(),
  }),
});

const serialDetailRatingBreakdownBucketSchema = z.object({
  ratingValueOutOfFive: z.number().int().min(1).max(5),
  count: z.number().int().nonnegative(),
  percentage: z.number().int().min(0).max(100),
});

export const serialDetailResponseSchema = z.object({
  series: serialDetailSeriesSchema,
  logsCount: z.number().int().nonnegative(),
  reviewCount: z.number().int().nonnegative(),
  userRating: serialDetailUserRatingSchema,
  reviewsSort: serialDetailReviewSortSchema,
  reviews: z.array(serialDetailReviewSchema),
  ratingBreakdown: z.object({
    totalRatedReviews: z.number().int().nonnegative(),
    averageRatingOutOfFive: z.number().nullable(),
    buckets: z.array(serialDetailRatingBreakdownBucketSchema),
  }),
});

const serialSeasonDetailEpisodeSchema = z.object({
  id: z.number().int().positive(),
  seasonNumber: z.number().int().nonnegative(),
  episodeNumber: z.number().int().positive(),
  name: z.string(),
  overview: z.string().nullable(),
  airDate: z.string().nullable(),
  stillPath: z.string().nullable(),
  runtimeMinutes: z.number().int().nullable(),
  runtimeLabel: z.string().nullable(),
});

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
  episodes: z.array(serialSeasonDetailEpisodeSchema),
});

export const serialInteractionSchema = z
  .object({
    liked: z.boolean(),
    watchlisted: z.boolean(),
    ratingOutOfFive: z.number().min(0.5).max(5).multipleOf(0.5).nullable(),
  })
  .passthrough();

export const updateSerialInteractionInputSchema = z
  .object({
    liked: z.boolean().optional(),
    watchlisted: z.boolean().optional(),
    ratingOutOfFive: z.number().min(0.5).max(5).multipleOf(0.5).nullable().optional(),
  })
  .refine(
    (payload) =>
      payload.liked !== undefined ||
      payload.watchlisted !== undefined ||
      payload.ratingOutOfFive !== undefined,
    {
      message: "At least one interaction field is required",
    },
  );

const serialLogRatingOutOfFiveSchema = z.number().min(0.5).max(5).multipleOf(0.5);

export const createSeriesLogInputSchema = z.object({
  watchedDate: z.string(),
  ratingOutOfFive: serialLogRatingOutOfFiveSchema.optional(),
  rewatch: z.boolean().optional(),
  review: z.string().max(5000).optional(),
  containsSpoilers: z.boolean().optional(),
});

export const createSeriesLogResponseSchema = z.object({
  entry: z
    .object({
      id: z.string(),
      userId: z.string(),
      seriesId: z.number().int(),
      watchedDate: z.string(),
      rating: z.number().int().nullable(),
      rewatch: z.boolean(),
      createdAt: z.string(),
      updatedAt: z.string(),
    })
    .passthrough(),
  series: z
    .object({
      id: z.number().int(),
      tmdbId: z.number().int(),
      title: z.string(),
      posterPath: z.string().nullable(),
      firstAirYear: z.number().int().nullable(),
    })
    .passthrough(),
  review: z
    .object({
      id: z.string(),
      content: z.string(),
      containsSpoilers: z.boolean(),
    })
    .nullable(),
});

export const cachedSeriesSchema = z
  .object({
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
    network: z.string().nullable(),
    episodeRuntime: z.number().int().nullable(),
    numberOfSeasons: z.number().int().nullable(),
    numberOfEpisodes: z.number().int().nullable(),
    status: z.string().nullable(),
    overview: z.string().nullable(),
    tagline: z.string().nullable(),
    languageCode: z.string().nullable(),
    genres: z.array(serialGenreSchema).nullish(),
    cachedAt: z.string(),
  })
  .passthrough();

export const trendingSeriesSchema = z.object({
  tmdbId: z.number().int().positive(),
  title: z.string(),
  posterPath: z.string().nullable(),
  firstAirYear: z.number().int().nullable(),
});

export const trendingSeriesListSchema = z.array(trendingSeriesSchema);
export const tmdbSearchSeriesListSchema = z.array(tmdbSearchSeriesSchema);

export { serialArchiveItemSchema };
