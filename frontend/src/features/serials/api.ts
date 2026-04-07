import { z } from "zod";
import { apiRequest } from "@/lib/api-client";
import { personLinkSchema } from "@/features/people/shared";

const tmdbSearchSeriesSchema = z.object({
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

const serialArchiveSortSchema = z.enum([
  "trending",
  "first_air_desc",
  "first_air_asc",
  "logs_desc",
  "rating_user_desc",
  "rating_tmdb_desc",
  "title_asc",
]);

const serialArchivePeriodSchema = z.enum([
  "all_time",
  "this_year",
  "last_10_years",
  "this_week",
  "today",
]);

const serialArchiveResponseSchema = z.object({
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

const serialDetailReviewSortSchema = z.enum(["popular", "recent"]);

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

const serialDetailResponseSchema = z.object({
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

const serialSeasonDetailSchema = z.object({
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

const serialInteractionSchema = z
  .object({
    liked: z.boolean(),
    watchlisted: z.boolean(),
  })
  .passthrough();

const updateSerialInteractionInputSchema = z
  .object({
    liked: z.boolean().optional(),
    watchlisted: z.boolean().optional(),
  })
  .refine((payload) => payload.liked !== undefined || payload.watchlisted !== undefined, {
    message: "At least one interaction field is required",
  });

const serialLogRatingOutOfFiveSchema = z.number().min(0.5).max(5).multipleOf(0.5);

const createSeriesLogInputSchema = z.object({
  watchedDate: z.string(),
  ratingOutOfFive: serialLogRatingOutOfFiveSchema.optional(),
  rewatch: z.boolean().optional(),
  review: z.string().max(5000).optional(),
  containsSpoilers: z.boolean().optional(),
});

const createSeriesLogResponseSchema = z.object({
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

const cachedSeriesSchema = z
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

const trendingSeriesSchema = z.object({
  tmdbId: z.number().int().positive(),
  title: z.string(),
  posterPath: z.string().nullable(),
  firstAirYear: z.number().int().nullable(),
});

const trendingSeriesListSchema = z.array(trendingSeriesSchema);
const tmdbSearchSeriesListSchema = z.array(tmdbSearchSeriesSchema);

export type TmdbSearchSeries = z.infer<typeof tmdbSearchSeriesSchema>;
export type SerialArchiveSort = z.infer<typeof serialArchiveSortSchema>;
export type SerialArchivePeriod = z.infer<typeof serialArchivePeriodSchema>;
export type SerialDetailReviewSort = z.infer<typeof serialDetailReviewSortSchema>;
export type SerialArchiveItem = z.infer<typeof serialArchiveItemSchema>;
export type SerialArchiveResponse = z.infer<typeof serialArchiveResponseSchema>;
export type SerialDetailResponse = z.infer<typeof serialDetailResponseSchema>;
export type SerialSeasonDetailResponse = z.infer<typeof serialSeasonDetailSchema>;
export type CachedSeries = z.infer<typeof cachedSeriesSchema>;
export type TrendingSeries = z.infer<typeof trendingSeriesSchema>;
export type SerialInteraction = z.infer<typeof serialInteractionSchema>;
export type UpdateSerialInteractionInput = z.infer<
  typeof updateSerialInteractionInputSchema
>;
export type CreateSeriesLogInput = z.infer<typeof createSeriesLogInputSchema>;
export type CreateSeriesLogResponse = z.infer<typeof createSeriesLogResponseSchema>;

type QueryRequestOptions = {
  signal?: AbortSignal;
};

export const searchSeries = async (
  query: string,
  options: QueryRequestOptions = {},
): Promise<TmdbSearchSeries[]> => {
  const normalizedQuery = query.trim();
  if (normalizedQuery.length === 0) {
    return [];
  }

  const response = await apiRequest<unknown>(
    `/api/serials/search?query=${encodeURIComponent(normalizedQuery)}`,
    {
      method: "GET",
      signal: options.signal,
    },
  );

  return tmdbSearchSeriesListSchema.parse(response);
};

export const getTrendingSeries = async (
  options: QueryRequestOptions = {},
): Promise<TrendingSeries[]> => {
  const response = await apiRequest<unknown>("/api/serials/trending", {
    method: "GET",
    signal: options.signal,
  });

  return trendingSeriesListSchema.parse(response);
};

export const getSeriesArchive = async (
  input: {
    genre?: string;
    language?: string;
    sort?: SerialArchiveSort;
    period?: SerialArchivePeriod;
    page?: number;
    limit?: number;
  },
  options: QueryRequestOptions = {},
): Promise<SerialArchiveResponse> => {
  const searchParams = new URLSearchParams();

  if (input.genre && input.genre.trim().length > 0) {
    searchParams.set("genre", input.genre.trim());
  }

  if (input.language && input.language.trim().length > 0) {
    searchParams.set("language", input.language.trim());
  }

  if (input.sort) {
    searchParams.set("sort", input.sort);
  }

  if (input.period) {
    searchParams.set("period", input.period);
  }

  if (typeof input.page === "number" && Number.isFinite(input.page)) {
    searchParams.set("page", String(Math.max(1, Math.floor(input.page))));
  }

  if (typeof input.limit === "number" && Number.isFinite(input.limit)) {
    searchParams.set("limit", String(Math.max(1, Math.floor(input.limit))));
  }

  const query = searchParams.toString();
  const path = query ? `/api/serials/archive?${query}` : "/api/serials/archive";

  const response = await apiRequest<unknown>(path, {
    method: "GET",
    signal: options.signal,
    cache: "no-store",
  });

  return serialArchiveResponseSchema.parse(response);
};

export const getSeriesByTmdbId = async (
  tmdbId: number,
  options: QueryRequestOptions = {},
): Promise<CachedSeries> => {
  const response = await apiRequest<unknown>(`/api/serials/${tmdbId}`, {
    method: "GET",
    signal: options.signal,
  });

  return cachedSeriesSchema.parse(response);
};

export const getSeriesDetail = async (
  tmdbId: number,
  input: {
    reviewsSort?: SerialDetailReviewSort;
  } = {},
  options: QueryRequestOptions = {},
): Promise<SerialDetailResponse> => {
  const searchParams = new URLSearchParams();

  if (input.reviewsSort) {
    searchParams.set("reviewsSort", input.reviewsSort);
  }

  const query = searchParams.toString();
  const path = query
    ? `/api/serials/${tmdbId}/detail?${query}`
    : `/api/serials/${tmdbId}/detail`;

  const response = await apiRequest<unknown>(path, {
    method: "GET",
    signal: options.signal,
    cache: "no-store",
  });

  return serialDetailResponseSchema.parse(response);
};

export const getSeriesInteraction = async (
  tmdbId: number,
): Promise<SerialInteraction> => {
  const response = await apiRequest<unknown>(`/api/serials/${tmdbId}/interaction`, {
    method: "GET",
  });

  return serialInteractionSchema.parse(response);
};

export const getSeriesSeasonDetail = async (
  tmdbId: number,
  seasonNumber: number,
  options: QueryRequestOptions = {},
): Promise<SerialSeasonDetailResponse> => {
  const response = await apiRequest<unknown>(
    `/api/serials/${tmdbId}/seasons/${seasonNumber}`,
    {
      method: "GET",
      signal: options.signal,
      cache: "no-store",
    },
  );

  return serialSeasonDetailSchema.parse(response);
};

export const updateSeriesInteraction = async (
  tmdbId: number,
  input: UpdateSerialInteractionInput,
): Promise<SerialInteraction> => {
  const payload = updateSerialInteractionInputSchema.parse(input);
  const response = await apiRequest<unknown, UpdateSerialInteractionInput>(
    `/api/serials/${tmdbId}/interaction`,
    {
      method: "PUT",
      body: payload,
    },
  );

  return serialInteractionSchema.parse(response);
};

export const createSeriesLog = async (
  tmdbId: number,
  input: CreateSeriesLogInput,
): Promise<CreateSeriesLogResponse> => {
  const payload = createSeriesLogInputSchema.parse(input);
  const response = await apiRequest<unknown, CreateSeriesLogInput>(
    `/api/serials/${tmdbId}/log`,
    {
      method: "POST",
      body: payload,
    },
  );

  return createSeriesLogResponseSchema.parse(response);
};
