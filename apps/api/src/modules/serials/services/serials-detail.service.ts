import {
  getSeriesAggregateCredits as tmdbGetAggregateCredits,
  getSeriesDetails as tmdbGetDetails,
  getSeriesSeasonDetails as tmdbGetSeasonDetails,
} from "../../../infrastructure/tmdb/serials";
import type { SerialsDetailTmdbClient } from "./serials-detail-tmdb-client";
import { defaultSerialsDetailTmdbClient } from "./serials-detail-tmdb-client";
import { SerialsSeasonInteractionsRepository } from "../repositories/serials-season-interactions.repository";
import { SerialsEpisodeInteractionsRepository } from "../repositories/serials-episode-interactions.repository";
import {
  toNormalizedSeasonDetail,
  toDistinctValues,
  toNullableTrimmedText,
} from "../helpers/serials-normalization.helper";
import { loadReviewEngagement } from "../../media/helpers/review-engagement.helper";
import { SerialsInteractionsRepository } from "../repositories/serials-interactions.repository";
import { SerialsReviewsRepository } from "../repositories/serials-reviews.repository";
import { SerialsSeasonEpisodeReviewsRepository } from "../repositories/serials-season-episode-reviews.repository";
import { resolveSeasonEpisodeReviewItems } from "../helpers/serials-review-context.helper";
import { calculateViewerTracking } from "../helpers/serials-tracking.helper";
import {
  assembleSerialDetail,
  assembleSerialReviewsPage,
  type SerialDetailInputs,
} from "../helpers/assemble-serial-detail.helper";
import { SerialsCacheService } from "./serials-cache.service";
import { PeopleCacheService } from "../../people/services/people-cache.service";
import type { SerialDetailReviewSort } from "../dto/serials.dto";
import type {
  SerialDetailResponse,
  SerialReviewsPageResponse,
  SerialSeasonDetailResponse,
} from "../types/serials.types";

type SeriesRow = NonNullable<Awaited<ReturnType<typeof SerialsCacheService.findOrCreate>>>;
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

export class SerialsDetailService {
  static async getDetail(
    input: {
      tmdbId: number;
      viewerUserId?: string | null;
      reviewsSort: SerialDetailReviewSort;
      reviewsPage: number;
      reviewsLimit: number;
    },
    tmdbClient: SerialsDetailTmdbClient = defaultSerialsDetailTmdbClient,
  ): Promise<SerialDetailResponse | null> {
    const cachedSeries = await SerialsCacheService.findOrCreate(input.tmdbId);
    if (!cachedSeries) {
      return null;
    }

    const inputs = await SerialsDetailService.gather(cachedSeries, input, tmdbClient);
    return assembleSerialDetail(inputs);
  }

  // Mirrors MoviesDetailService.getReviews - series-level reviews only.
  static async getReviews(input: {
    tmdbId: number;
    viewerUserId?: string | null;
    sort: SerialDetailReviewSort;
    page: number;
    limit: number;
  }): Promise<SerialReviewsPageResponse | null> {
    const cachedSeries = await SerialsCacheService.findOrCreate(input.tmdbId);
    if (!cachedSeries) {
      return null;
    }

    const viewerUserId = input.viewerUserId ?? null;
    const offset = (input.page - 1) * input.limit;

    const { rows: reviewRows, totalCount } = await SerialsReviewsRepository.getReviewRowsBySeriesId(
      cachedSeries.id,
      { sort: input.sort, limit: input.limit, offset },
    );

    const engagement = await loadReviewEngagement(
      SerialsReviewsRepository,
      reviewRows.map((reviewRow) => reviewRow.id),
      viewerUserId,
    );

    return assembleSerialReviewsPage({
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
      reviewsSort: SerialDetailReviewSort;
      reviewsPage: number;
      reviewsLimit: number;
    },
    tmdbClient: SerialsDetailTmdbClient,
  ): Promise<SerialDetailInputs> {
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
      SerialsReviewsRepository.getLogsCountBySeriesId(cachedSeries.id),
      SerialsReviewsRepository.getReviewRowsBySeriesId(cachedSeries.id, {
        sort: input.reviewsSort,
        limit: input.reviewsLimit,
        offset: reviewsOffset,
      }),
      tmdbClient.getSimilar(input.tmdbId).catch(() => []),
      SerialsInteractionsRepository.getCommunityRatingsBySeriesId(cachedSeries.id),
      SerialsSeasonEpisodeReviewsRepository.getReviewRowsBySeriesId(input.tmdbId, cachedSeries.id),
    ]);
    const { rows: reviewRows, totalCount: reviewsTotalCount } = reviewsPage;

    const reviewIds = [
      ...reviewRows.map((reviewRow) => reviewRow.id),
      ...seasonEpisodeReviewRows.map((row) => row.id),
    ];
    const engagement = await loadReviewEngagement(SerialsReviewsRepository, reviewIds, viewerUserId);

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
    const [[viewerDiaryRow, viewerReviewRow], userSeasonInteractions] = viewerUserId
      ? await Promise.all([
          Promise.all([
            SerialsInteractionsRepository.getViewerDiaryRows(viewerUserId, cachedSeries.id),
            SerialsReviewsRepository.getViewerReviewRows(viewerUserId, cachedSeries.id),
          ]),
          SerialsSeasonInteractionsRepository.getViewerSeasonInteractions(
            viewerUserId,
            cachedSeries.id,
            cachedSeries.tmdbId,
          ),
        ])
      : [[[], []], []];

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
      viewerDiary: viewerDiaryRow[0] ?? null,
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
  }): Promise<SerialSeasonDetailResponse | null> {
    const cachedSeries = await SerialsCacheService.findOrCreate(input.tmdbId);
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
      ? await SerialsEpisodeInteractionsRepository.getViewerEpisodeInteractions(
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
