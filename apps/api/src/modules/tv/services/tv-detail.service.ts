import {
  getSeriesAggregateCredits as tmdbGetAggregateCredits,
  getSeriesDetails as tmdbGetDetails,
  getSeriesSeasonDetails as tmdbGetSeasonDetails,
} from "../../../infrastructure/tmdb/tv";
import type { TvDetailTmdbClient } from "./tv-detail-tmdb-client";
import { defaultTvDetailTmdbClient } from "./tv-detail-tmdb-client";
import { TvSeasonInteractionsRepository } from "../repositories/tv-season-interactions.repository";
import { TvEpisodeInteractionsRepository } from "../repositories/tv-episode-interactions.repository";
import {
  toNormalizedSeasonDetail,
  toDistinctValues,
  toNullableTrimmedText,
} from "../helpers/tv-normalization.helper";
import { loadReviewEngagement } from "../../media/helpers/review-engagement.helper";
import { WatchLogStores } from "../../media/repositories/watch-log.repository";
import { YourRatingService } from "../../media-interactions/services/your-rating.service";
import { TvReviewsRepository } from "../repositories/tv-reviews.repository";
import { TvSeasonEpisodeReviewsRepository } from "../repositories/tv-season-episode-reviews.repository";
import { resolveSeasonEpisodeReviewItems } from "../helpers/tv-review-context.helper";
import { calculateViewerTracking } from "../helpers/tv-tracking.helper";
import {
  assembleSeriesDetail,
  assembleSeriesReviewsPage,
  type SeriesDetailInputs,
} from "../helpers/assemble-series-detail.helper";
import { TvCacheService } from "./tv-cache.service";
import { createTtlCache } from "../../../infrastructure/cache/ttl-cache.helper";
import {
  ANONYMOUS_DETAIL_CACHE_MAX_ENTRIES,
  ANONYMOUS_DETAIL_CACHE_TTL_MS,
} from "../../media/constants/anonymous-detail-cache.constants";
import { PeopleCacheService } from "../../people/services/people-cache.service";
import type { SeriesDetailReviewSort } from "../dto/tv.dto";
import type {
  SeriesDetailResponse,
  SeriesReviewsPageResponse,
  SeriesSeasonDetailResponse,
} from "../types/tv.types";

type SeriesRow = NonNullable<Awaited<ReturnType<typeof TvCacheService.findForRead>>>;
type TmdbSeriesDetail = NonNullable<Awaited<ReturnType<typeof tmdbGetDetails>>>;
type TmdbAggregateCredits = NonNullable<Awaited<ReturnType<typeof tmdbGetAggregateCredits>>>;

const RELEVANT_CREW_DEPARTMENTS = new Set(["Directing", "Writing", "Production"]);

const creatorSeeds = (tmdbDetail: TmdbSeriesDetail | null) =>
  (tmdbDetail?.created_by ?? []).map((creator) => ({
    tmdbPersonId: creator.id,
    name: creator.name,
    profilePath: creator.profile_path,
    knownForDepartment: creator.known_for_department,
    routeRole: "director" as const,
    job: "Creator",
    department: "Production",
  }));

const castSeeds = (credits: TmdbAggregateCredits | null) =>
  [...(credits?.cast ?? [])]
    .sort((leftMember, rightMember) => leftMember.order - rightMember.order)
    .slice(0, 24)
    .map((castMember) => {
      const castCharacters = toDistinctValues(castMember.roles.map((role) => role.character));
      return {
        tmdbPersonId: castMember.id,
        name: castMember.name,
        profilePath: castMember.profile_path,
        knownForDepartment: castMember.known_for_department,
        popularity: castMember.popularity,
        routeRole: "actor" as const,
        character: castCharacters.length > 0 ? castCharacters.slice(0, 2).join(" / ") : null,
        department: "Acting",
      };
    });

const crewSeeds = (credits: TmdbAggregateCredits | null) =>
  [...(credits?.crew ?? [])]
    .filter((crewMember) => RELEVANT_CREW_DEPARTMENTS.has(crewMember.department))
    .sort(
      (leftMember, rightMember) =>
        rightMember.total_episode_count - leftMember.total_episode_count,
    )
    .slice(0, 20)
    .map((crewMember) => {
      const crewJobs = toDistinctValues(crewMember.jobs.map((job) => job.job));
      return {
        tmdbPersonId: crewMember.id,
        name: crewMember.name,
        profilePath: crewMember.profile_path,
        knownForDepartment:
          crewMember.known_for_department ?? toNullableTrimmedText(crewMember.department),
        popularity: crewMember.popularity,
        routeRole: "director" as const,
        job: crewJobs.length > 0 ? crewJobs.slice(0, 2).join(", ") : null,
        department: toNullableTrimmedText(crewMember.department),
      };
    });

type DetailInput = {
  tmdbId: number;
  viewerUserId?: string | null;
  reviewsSort: SeriesDetailReviewSort;
  reviewsPage: number;
  reviewsLimit: number;
};

const getCachedAnonymousDetail = createTtlCache(
  (input: DetailInput, tmdbClient: TvDetailTmdbClient) => TvDetailService.loadDetail(input, tmdbClient),
  {
    ttlMs: ANONYMOUS_DETAIL_CACHE_TTL_MS,
    maxEntries: ANONYMOUS_DETAIL_CACHE_MAX_ENTRIES,
    keyFn: (input) =>
      `${input.tmdbId}:${input.reviewsSort}:${input.reviewsPage}:${input.reviewsLimit}`,
  },
);

export class TvDetailService {
  static async getDetail(
    input: DetailInput,
    tmdbClient: TvDetailTmdbClient = defaultTvDetailTmdbClient,
  ): Promise<SeriesDetailResponse | null> {
    if (!input.viewerUserId) {
      return getCachedAnonymousDetail(input, tmdbClient);
    }

    return TvDetailService.loadDetail(input, tmdbClient);
  }

  // Uncached detail load - getDetail routes logged-out viewers through the shared cache.
  static async loadDetail(
    input: DetailInput,
    tmdbClient: TvDetailTmdbClient = defaultTvDetailTmdbClient,
  ): Promise<SeriesDetailResponse | null> {
    const cachedSeries = await TvCacheService.findForRead(input.tmdbId);
    if (!cachedSeries) {
      return null;
    }

    const inputs = await TvDetailService.gather(cachedSeries, input, tmdbClient);
    return assembleSeriesDetail(inputs);
  }

  // Mirrors MoviesDetailService.getReviews - series-level reviews only.
  static async getReviews(input: {
    tmdbId: number;
    viewerUserId?: string | null;
    sort: SeriesDetailReviewSort;
    page: number;
    limit: number;
  }): Promise<SeriesReviewsPageResponse | null> {
    const cachedSeries = await TvCacheService.findForRead(input.tmdbId);
    if (!cachedSeries) {
      return null;
    }

    const viewerUserId = input.viewerUserId ?? null;
    const offset = (input.page - 1) * input.limit;

    const { rows: reviewRows, totalCount } = await TvReviewsRepository.getReviewRowsBySeriesId(
      cachedSeries.id,
      { sort: input.sort, limit: input.limit, offset },
    );

    const engagement = await loadReviewEngagement(
      TvReviewsRepository,
      reviewRows.map((reviewRow) => reviewRow.id),
      viewerUserId,
    );

    return assembleSeriesReviewsPage({
      reviewRows,
      engagement,
      sort: input.sort,
      page: input.page,
      limit: input.limit,
      totalCount,
    });
  }

  // Every IO the detail response depends on: TMDB reads, series repository
  // reads, review engagement, the season/episode review items (which need
  // a TMDB season fetch for episode names), the three person-link groups,
  // viewer season interactions, viewer diary/review, and the viewer
  // tracking calculation. Returns a fully-resolved SerialDetailInputs for
  // the pure assembleSerialDetail step.
  private static async gather(
    cachedSeries: SeriesRow,
    input: {
      tmdbId: number;
      viewerUserId?: string | null;
      reviewsSort: SeriesDetailReviewSort;
      reviewsPage: number;
      reviewsLimit: number;
    },
    tmdbClient: TvDetailTmdbClient,
  ): Promise<SeriesDetailInputs> {
    const viewerUserId = input.viewerUserId ?? null;
    const reviewsOffset = (input.reviewsPage - 1) * input.reviewsLimit;

    const [
      tmdbDetail,
      tmdbAggregateCredits,
      logsCount,
      reviewsPage,
      tmdbSimilar,
      communityRatings,
      seasonEpisodeReviewRows,
    ] = await Promise.all([
      tmdbClient.getDetails(input.tmdbId).catch(() => null),
      tmdbClient.getAggregateCredits(input.tmdbId).catch(() => null),
      TvReviewsRepository.getLogsCountBySeriesId(cachedSeries.id),
      TvReviewsRepository.getReviewRowsBySeriesId(cachedSeries.id, {
        sort: input.reviewsSort,
        limit: input.reviewsLimit,
        offset: reviewsOffset,
      }),
      tmdbClient.getSimilar(input.tmdbId).catch(() => []),
      YourRatingService.communityRatings("tv", cachedSeries.id),
      TvSeasonEpisodeReviewsRepository.getReviewRowsBySeriesId(input.tmdbId, cachedSeries.id),
    ]);
    const { rows: reviewRows, totalCount: reviewsTotalCount } = reviewsPage;

    const reviewIds = [
      ...reviewRows.map((reviewRow) => reviewRow.id),
      ...seasonEpisodeReviewRows.map((row) => row.id),
    ];
    const engagement = await loadReviewEngagement(TvReviewsRepository, reviewIds, viewerUserId);

    const [seasonEpisodeReviews, creators, cast, crew] = await Promise.all([
      resolveSeasonEpisodeReviewItems(
        input.tmdbId,
        seasonEpisodeReviewRows,
        engagement.likeCountByReviewId,
        engagement.viewerLikedReviewIds,
      ),
      PeopleCacheService.ensurePersonLinks(creatorSeeds(tmdbDetail)),
      PeopleCacheService.ensurePersonLinks(castSeeds(tmdbAggregateCredits)),
      PeopleCacheService.ensurePersonLinks(crewSeeds(tmdbAggregateCredits)),
    ]);

    // Only viewerTracking depends on userSeasonInteractions, so the other
    // two fetches run concurrent with it instead of sequentially.
    const [[viewerDiary, viewerRating, viewerReviewRow], userSeasonInteractions] = viewerUserId
      ? await Promise.all([
          Promise.all([
            WatchLogStores.series.findLatest(viewerUserId, cachedSeries.id),
            YourRatingService.resolve("tv", viewerUserId, cachedSeries.id),
            TvReviewsRepository.getViewerReviewRows(viewerUserId, cachedSeries.id),
          ]),
          TvSeasonInteractionsRepository.getViewerSeasonInteractions(
            viewerUserId,
            cachedSeries.id,
            cachedSeries.tmdbId,
          ),
        ])
      : [[null, null, []], []];

    const viewerTracking = viewerUserId
      ? await calculateViewerTracking(
          viewerUserId,
          cachedSeries.id,
          cachedSeries.tmdbId,
          tmdbDetail,
          userSeasonInteractions,
        )
      : null;

    return {
      cachedSeries,
      tmdbDetail,
      creators,
      cast,
      crew,
      logsCount,
      reviewRows,
      engagement,
      seasonEpisodeReviews,
      communityRatings,
      tmdbSimilar,
      userSeasonInteractions,
      viewerDiary,
      viewerRating,
      viewerReview: viewerReviewRow[0] ?? null,
      viewerTracking,
      viewerUserId,
      reviewsSort: input.reviewsSort,
      reviewsPage: input.reviewsPage,
      reviewsLimit: input.reviewsLimit,
      reviewsTotalCount,
    };
  }

  static async getSeasonDetail(input: {
    tmdbId: number;
    seasonNumber: number;
    viewerUserId?: string | null;
  }): Promise<SeriesSeasonDetailResponse | null> {
    const cachedSeries = await TvCacheService.findForRead(input.tmdbId);
    if (!cachedSeries) {
      return null;
    }

    const tmdbSeasonDetail = await tmdbGetSeasonDetails(
      input.tmdbId,
      input.seasonNumber,
    ).catch(() => null);

    if (!tmdbSeasonDetail) {
      return null;
    }

    const normalizedSeasonDetail = toNormalizedSeasonDetail(input.tmdbId, tmdbSeasonDetail);

    const viewerUserId = input.viewerUserId ?? null;
    const userEpisodeInteractions = viewerUserId
      ? await TvEpisodeInteractionsRepository.getViewerEpisodeInteractions(
          viewerUserId,
          cachedSeries.id,
          cachedSeries.tmdbId,
          input.seasonNumber,
        )
      : [];

    const userEpisodeInteractionsMap = new Map<number, typeof userEpisodeInteractions[number]>(
      userEpisodeInteractions.map((i) => [i.episodeNumber, i]),
    );

    normalizedSeasonDetail.episodes = normalizedSeasonDetail.episodes.map((episode) => {
      const interaction = userEpisodeInteractionsMap.get(episode.episodeNumber);
      return {
        ...episode,
        viewerInteraction: viewerUserId
          ? {
              watched: interaction?.watched ?? false,
              liked: interaction?.liked ?? false,
              rating: interaction?.rating ?? null,
              hasReview: interaction?.hasReview ?? false,
            }
          : null,
      };
    });

    return normalizedSeasonDetail;
  }
}
