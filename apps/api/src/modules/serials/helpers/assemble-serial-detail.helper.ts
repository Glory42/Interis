import { buildMediaRatingBreakdown } from "../../media/helpers/media-rating-breakdown.helper";
import {
  sortReviewsByEngagement,
  type ReviewEngagementIndex,
} from "../../media/helpers/review-engagement.helper";
import {
  normalizeSeriesGenres,
  normalizeTmdbSeriesDetail,
  toNormalizedSeasonItems,
  toTmdbRatingOutOfTen,
} from "./serials-normalization.helper";
import { resolveSeriesReviewItems } from "./serials-review-context.helper";
import type { getSeriesDetails, getSimilarSeries } from "../../../infrastructure/tmdb/serials";
import type { PersonLinkItem } from "../../people/types/people.types";
import type { SerialsCacheService } from "../services/serials-cache.service";
import type { SerialsReviewsRepository } from "../repositories/serials-reviews.repository";
import type { SerialsInteractionsRepository } from "../repositories/serials-interactions.repository";
import type { SerialsSeasonInteractionsRepository } from "../repositories/serials-season-interactions.repository";
import type { calculateViewerTracking } from "./serials-tracking.helper";
import type { SerialDetailReviewSort } from "../dto/serials.dto";
import type {
  SerialDetailRatingBreakdownBucket,
  SerialDetailResponse,
  SerialDetailReviewItem,
} from "../types/serials.types";

// The pure half of SerialsDetailService.getDetail. gather() has resolved
// every await - TMDB reads, the three person-link groups, review
// engagement, the season/episode review items (which need a TMDB
// season-detail fetch for episode names), viewer season interactions, and
// the viewer-tracking calculation - so the response shaping is a plain
// synchronous transform that fixtures can drive, including the TMDB-present
// branches (season list, rating, network/status/runtime fallbacks) the
// integration path can't reach.

type SeriesRow = NonNullable<Awaited<ReturnType<typeof SerialsCacheService.findOrCreate>>>;
type TmdbSeriesDetail = NonNullable<Awaited<ReturnType<typeof getSeriesDetails>>>;
type TmdbSimilarSeries = Awaited<ReturnType<typeof getSimilarSeries>>;
type SeriesReviewRow = Awaited<
  ReturnType<typeof SerialsReviewsRepository.getReviewRowsBySeriesId>
>[number];
type ViewerSeasonInteraction = Awaited<
  ReturnType<typeof SerialsSeasonInteractionsRepository.getViewerSeasonInteractions>
>[number];
type ViewerDiaryRow = Awaited<
  ReturnType<typeof SerialsInteractionsRepository.getViewerDiaryRows>
>[number];
type ViewerReviewRow = Awaited<
  ReturnType<typeof SerialsReviewsRepository.getViewerReviewRows>
>[number];
type ViewerTracking = Awaited<ReturnType<typeof calculateViewerTracking>>;

export type SerialDetailInputs = {
  cachedSeries: SeriesRow;
  tmdbDetail: TmdbSeriesDetail | null;
  creators: PersonLinkItem[];
  cast: PersonLinkItem[];
  crew: PersonLinkItem[];
  logsCount: number;
  reviewRows: SeriesReviewRow[];
  engagement: ReviewEngagementIndex;
  // Pre-resolved by gather() - building these needs a TMDB season fetch.
  seasonEpisodeReviews: SerialDetailReviewItem[];
  communityRatings: { rating: number }[];
  tmdbSimilar: TmdbSimilarSeries;
  userSeasonInteractions: ViewerSeasonInteraction[];
  viewerDiary: ViewerDiaryRow | null;
  viewerReview: ViewerReviewRow | null;
  viewerTracking: ViewerTracking | null;
  viewerUserId: string | null;
  reviewsSort: SerialDetailReviewSort;
};

export const assembleSerialDetail = (inputs: SerialDetailInputs): SerialDetailResponse => {
  const { cachedSeries, tmdbDetail } = inputs;

  const normalizedTmdbDetail = tmdbDetail ? normalizeTmdbSeriesDetail(tmdbDetail) : null;
  const tmdbRatingOutOfTen = tmdbDetail
    ? toTmdbRatingOutOfTen({
        voteAverage: tmdbDetail.vote_average,
        voteCount: tmdbDetail.vote_count,
      })
    : null;

  const seriesReviews = resolveSeriesReviewItems(
    inputs.reviewRows,
    inputs.engagement.likeCountByReviewId,
    inputs.engagement.viewerLikedReviewIds,
  );

  const reviewsWithEngagement: SerialDetailReviewItem[] = [
    ...seriesReviews,
    ...inputs.seasonEpisodeReviews,
  ];
  const sortedReviews = sortReviewsByEngagement(reviewsWithEngagement, inputs.reviewsSort);
  const ratingBreakdown = buildMediaRatingBreakdown(inputs.communityRatings);

  const resolvedCreatorName =
    inputs.creators[0]?.name ??
    cachedSeries.creator ??
    normalizedTmdbDetail?.creator ??
    null;

  const userSeasonInteractionsMap = new Map<number, ViewerSeasonInteraction>(
    inputs.userSeasonInteractions.map((interaction) => [interaction.seasonNumber, interaction]),
  );

  const mappedSeasons = (tmdbDetail ? toNormalizedSeasonItems(tmdbDetail) : []).map((season) => {
    const interaction = userSeasonInteractionsMap.get(season.seasonNumber);
    return {
      ...season,
      viewerInteraction: inputs.viewerUserId
        ? {
            watched: interaction?.watched ?? false,
            liked: interaction?.liked ?? false,
            rating: interaction?.rating ?? null,
            hasReview: interaction?.hasReview ?? false,
          }
        : null,
    };
  });

  const similar = (inputs.tmdbSimilar ?? []).slice(0, 12).map((sim) => {
    const firstAirYear = sim.first_air_date
      ? Number.parseInt(sim.first_air_date.slice(0, 4), 10)
      : null;

    return {
      tmdbId: sim.id,
      title: sim.name,
      posterPath: sim.poster_path,
      firstAirYear: Number.isNaN(firstAirYear) ? null : firstAirYear,
    };
  });

  return {
    series: {
      id: cachedSeries.id,
      tmdbId: cachedSeries.tmdbId,
      title: cachedSeries.title,
      originalTitle: cachedSeries.originalTitle,
      posterPath: cachedSeries.posterPath,
      backdropPath: cachedSeries.backdropPath,
      firstAirDate: cachedSeries.firstAirDate,
      firstAirYear: cachedSeries.firstAirYear,
      lastAirDate: cachedSeries.lastAirDate,
      creator: resolvedCreatorName,
      creators: inputs.creators,
      cast: inputs.cast,
      crew: inputs.crew,
      network: cachedSeries.network ?? normalizedTmdbDetail?.network ?? null,
      episodeRuntime:
        cachedSeries.episodeRuntime ?? normalizedTmdbDetail?.episodeRuntime ?? null,
      numberOfSeasons:
        cachedSeries.numberOfSeasons ?? normalizedTmdbDetail?.numberOfSeasons ?? null,
      numberOfEpisodes: tmdbDetail
        ? tmdbDetail.seasons
            .filter((season) => season.season_number > 0)
            .reduce((sum, season) => sum + (season.episode_count ?? 0), 0) || null
        : cachedSeries.numberOfEpisodes ?? normalizedTmdbDetail?.numberOfEpisodes ?? null,
      status: cachedSeries.status ?? normalizedTmdbDetail?.status ?? null,
      overview: cachedSeries.overview,
      tagline: cachedSeries.tagline,
      languageCode: cachedSeries.languageCode ?? normalizedTmdbDetail?.languageCode ?? null,
      genres: normalizeSeriesGenres(cachedSeries.genres),
      globalRating: tmdbRatingOutOfTen,
      globalRatingVoteCount:
        tmdbDetail && tmdbDetail.vote_count > 0 ? tmdbDetail.vote_count : null,
      inProduction: tmdbDetail ? tmdbDetail.in_production : null,
      seasons: mappedSeasons,
    },
    logsCount: inputs.logsCount,
    reviewCount: reviewsWithEngagement.length,
    userRating: inputs.viewerUserId
      ? {
          diaryEntryId: inputs.viewerDiary?.id ?? null,
          reviewId: inputs.viewerReview?.id ?? null,
          watchedDate: inputs.viewerDiary?.watchedDate ?? null,
          rewatch: inputs.viewerDiary?.rewatch ?? false,
          rating: inputs.viewerDiary?.rating ?? null,
          reviewContent: inputs.viewerReview?.content ?? null,
          reviewContainsSpoilers: inputs.viewerReview?.containsSpoilers ?? null,
        }
      : null,
    reviewsSort: inputs.reviewsSort,
    reviews: sortedReviews,
    ratingBreakdown: {
      totalRatedReviews: ratingBreakdown.totalRatedReviews,
      averageRating: ratingBreakdown.averageRating,
      buckets: ratingBreakdown.buckets as SerialDetailRatingBreakdownBucket[],
    },
    similar,
    viewerTracking: inputs.viewerTracking,
  };
};
