import {
  getSeriesAggregateCredits as tmdbGetAggregateCredits,
  getSeriesDetails as tmdbGetDetails,
  getSeriesSeasonDetails as tmdbGetSeasonDetails,
} from "../../../infrastructure/tmdb/serials";
import {
  normalizeSeriesGenres,
  toNormalizedSeasonDetail,
  normalizeTmdbSeriesDetail,
  toNormalizedSeasonItems,
  toRatingBreakdownBucket,
  toRatingOutOfFive,
  toTmdbRatingOutOfTen,
} from "../helpers/serials-normalization.helper";
import { buildMediaRatingBreakdown } from "../../media/helpers/media-rating-breakdown.helper";
import { SerialsInteractionsRepository } from "../repositories/serials-interactions.repository";
import { SerialsReviewsRepository } from "../repositories/serials-reviews.repository";
import { SerialsCacheService } from "./serials-cache.service";
import { PeopleCacheService } from "../../people/services/people-cache.service";
import type { SerialDetailReviewSort } from "../dto/serials.dto";
import type {
  SerialDetailRatingBreakdownBucket,
  SerialDetailResponse,
  SerialDetailReviewItem,
  SerialSeasonDetailResponse,
} from "../types/serials.types";

const RELEVANT_CREW_DEPARTMENTS = new Set(["Directing", "Writing", "Production"]);

const toNullableTrimmedText = (value: string | null | undefined): string | null => {
  if (!value) {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

const toDistinctValues = (values: Array<string | null | undefined>): string[] => {
  const seen = new Set<string>();

  for (const value of values) {
    const normalized = toNullableTrimmedText(value);
    if (!normalized) {
      continue;
    }

    seen.add(normalized);
  }

  return [...seen];
};

export class SerialsDetailService {
  static async getDetail(input: {
    tmdbId: number;
    viewerUserId?: string | null;
    reviewsSort: SerialDetailReviewSort;
  }): Promise<SerialDetailResponse | null> {
    const cachedSeries = await SerialsCacheService.findOrCreate(input.tmdbId);
    if (!cachedSeries) {
      return null;
    }

    const reviewsSort = input.reviewsSort;
    const viewerUserId = input.viewerUserId ?? null;

    const [tmdbDetail, tmdbAggregateCredits, logsCount, reviewRows] = await Promise.all([
      tmdbGetDetails(input.tmdbId).catch(() => null),
      tmdbGetAggregateCredits(input.tmdbId).catch(() => null),
      SerialsReviewsRepository.getLogsCountBySeriesId(cachedSeries.id),
      SerialsReviewsRepository.getReviewRowsBySeriesId(cachedSeries.id),
    ]);

    const normalizedTmdbDetail = tmdbDetail ? normalizeTmdbSeriesDetail(tmdbDetail) : null;

    const tmdbRatingOutOfTen = tmdbDetail
      ? toTmdbRatingOutOfTen({
          voteAverage: tmdbDetail.vote_average,
          voteCount: tmdbDetail.vote_count,
        })
      : null;

    const reviewIds = reviewRows.map((reviewRow) => reviewRow.id);

    const [likeRows, viewerLikedRows] = await Promise.all([
      SerialsReviewsRepository.getReviewLikeCounts(reviewIds),
      viewerUserId
        ? SerialsReviewsRepository.getViewerLikedReviewRows(viewerUserId, reviewIds)
        : Promise.resolve([]),
    ]);

    const likeCountByReviewId = new Map<string, number>(
      likeRows.map((likeRow) => [likeRow.reviewId, likeRow.likeCount]),
    );
    const viewerLikedReviewIds = new Set<string>(
      viewerLikedRows.map((likedRow) => likedRow.reviewId),
    );

    const reviewsWithEngagement: SerialDetailReviewItem[] = reviewRows.map((reviewRow) => {
      const ratingOutOfTen = reviewRow.ratingOutOfTen;

      return {
        id: reviewRow.id,
        content: reviewRow.content,
        containsSpoilers: reviewRow.containsSpoilers,
        createdAt: reviewRow.createdAt,
        updatedAt: reviewRow.updatedAt,
        watchedDate: reviewRow.watchedDate,
        ratingOutOfTen,
        ratingOutOfFive: toRatingOutOfFive(ratingOutOfTen),
        likeCount: likeCountByReviewId.get(reviewRow.id) ?? 0,
        viewerHasLiked: viewerLikedReviewIds.has(reviewRow.id),
        author: {
          id: reviewRow.userId,
          username: reviewRow.authorUsername,
          displayUsername: reviewRow.authorDisplayUsername,
          image: reviewRow.authorImage,
          avatarUrl: reviewRow.authorAvatarUrl,
        },
      };
    });

    const sortedReviews = [...reviewsWithEngagement];
    if (reviewsSort === "popular") {
      sortedReviews.sort((leftReview, rightReview) => {
        if (rightReview.likeCount !== leftReview.likeCount) {
          return rightReview.likeCount - leftReview.likeCount;
        }

        return rightReview.createdAt.getTime() - leftReview.createdAt.getTime();
      });
    } else {
      sortedReviews.sort(
        (leftReview, rightReview) =>
          rightReview.createdAt.getTime() - leftReview.createdAt.getTime(),
      );
    }

    const ratingBreakdown = buildMediaRatingBreakdown(
      reviewsWithEngagement,
      toRatingBreakdownBucket,
    );

    const [viewerDiaryRow, viewerReviewRow] = viewerUserId
      ? await Promise.all([
          SerialsInteractionsRepository.getViewerDiaryRows(viewerUserId, cachedSeries.id),
          SerialsReviewsRepository.getViewerReviewRows(viewerUserId, cachedSeries.id),
        ])
      : [[], []];

    const viewerDiary = viewerDiaryRow[0] ?? null;
    const viewerReview = viewerReviewRow[0] ?? null;

    const creators = await PeopleCacheService.ensurePersonLinks(
      (tmdbDetail?.created_by ?? []).map((creator) => ({
        tmdbPersonId: creator.id,
        name: creator.name,
        profilePath: creator.profile_path,
        knownForDepartment: creator.known_for_department,
        routeRole: "director" as const,
        job: "Creator",
        department: "Production",
      })),
    );

    const cast = await PeopleCacheService.ensurePersonLinks(
      [...(tmdbAggregateCredits?.cast ?? [])]
        .sort((leftMember, rightMember) => leftMember.order - rightMember.order)
        .slice(0, 24)
        .map((castMember) => {
          const castCharacters = toDistinctValues(
            castMember.roles.map((role) => role.character),
          );

          return {
            tmdbPersonId: castMember.id,
            name: castMember.name,
            profilePath: castMember.profile_path,
            knownForDepartment: castMember.known_for_department,
            popularity: castMember.popularity,
            routeRole: "actor" as const,
            character:
              castCharacters.length > 0 ? castCharacters.slice(0, 2).join(" / ") : null,
            department: "Acting",
          };
        }),
    );

    const crew = await PeopleCacheService.ensurePersonLinks(
      [...(tmdbAggregateCredits?.crew ?? [])]
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
        }),
    );

    const resolvedCreatorName =
      creators[0]?.name ?? cachedSeries.creator ?? normalizedTmdbDetail?.creator ?? null;

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
        creators,
        cast,
        crew,
        network: cachedSeries.network ?? normalizedTmdbDetail?.network ?? null,
        episodeRuntime:
          cachedSeries.episodeRuntime ?? normalizedTmdbDetail?.episodeRuntime ?? null,
        numberOfSeasons:
          cachedSeries.numberOfSeasons ?? normalizedTmdbDetail?.numberOfSeasons ?? null,
        numberOfEpisodes:
          cachedSeries.numberOfEpisodes ?? normalizedTmdbDetail?.numberOfEpisodes ?? null,
        status: cachedSeries.status ?? normalizedTmdbDetail?.status ?? null,
        overview: cachedSeries.overview,
        tagline: cachedSeries.tagline,
        languageCode: cachedSeries.languageCode ?? normalizedTmdbDetail?.languageCode ?? null,
        genres: normalizeSeriesGenres(cachedSeries.genres),
        globalRatingOutOfTen: tmdbRatingOutOfTen,
        globalRatingOutOfFive: toRatingOutOfFive(tmdbRatingOutOfTen),
        globalRatingVoteCount:
          tmdbDetail && tmdbDetail.vote_count > 0 ? tmdbDetail.vote_count : null,
        inProduction: tmdbDetail ? tmdbDetail.in_production : null,
        seasons: tmdbDetail ? toNormalizedSeasonItems(tmdbDetail) : [],
      },
      logsCount,
      reviewCount: reviewsWithEngagement.length,
      userRating: viewerUserId
        ? {
            diaryEntryId: viewerDiary?.id ?? null,
            reviewId: viewerReview?.id ?? null,
            watchedDate: viewerDiary?.watchedDate ?? null,
            rewatch: viewerDiary?.rewatch ?? false,
            ratingOutOfTen: viewerDiary?.ratingOutOfTen ?? null,
            ratingOutOfFive: toRatingOutOfFive(viewerDiary?.ratingOutOfTen ?? null),
            reviewContent: viewerReview?.content ?? null,
            reviewContainsSpoilers: viewerReview?.containsSpoilers ?? null,
          }
        : null,
      reviewsSort,
      reviews: sortedReviews,
      ratingBreakdown: {
        totalRatedReviews: ratingBreakdown.totalRatedReviews,
        averageRatingOutOfFive: ratingBreakdown.averageRatingOutOfFive,
        buckets: ratingBreakdown.buckets as SerialDetailRatingBreakdownBucket[],
      },
    };
  }

  static async getSeasonDetail(input: {
    tmdbId: number;
    seasonNumber: number;
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

    return toNormalizedSeasonDetail(input.tmdbId, tmdbSeasonDetail);
  }
}
