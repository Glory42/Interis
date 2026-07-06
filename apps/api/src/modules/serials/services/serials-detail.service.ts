import {
  getSeriesAggregateCredits as tmdbGetAggregateCredits,
  getSeriesDetails as tmdbGetDetails,
  getSeriesSeasonDetails as tmdbGetSeasonDetails,
  getSimilarSeries,
} from "../../../infrastructure/tmdb/serials";
import { SerialsSeasonInteractionsRepository } from "../repositories/serials-season-interactions.repository";
import { SerialsEpisodeInteractionsRepository } from "../repositories/serials-episode-interactions.repository";
import {
  normalizeSeriesGenres,
  toNormalizedSeasonDetail,
  normalizeTmdbSeriesDetail,
  toNormalizedSeasonItems,
  toTmdbRatingOutOfTen,
  toDistinctValues,
  toNullableTrimmedText,
} from "../helpers/serials-normalization.helper";
import { buildMediaRatingBreakdown } from "../../media/helpers/media-rating-breakdown.helper";
import { SerialsInteractionsRepository } from "../repositories/serials-interactions.repository";
import { SerialsReviewsRepository } from "../repositories/serials-reviews.repository";
import { calculateViewerTracking } from "../helpers/serials-tracking.helper";
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

    const [tmdbDetail, tmdbAggregateCredits, logsCount, reviewRows, tmdbSimilar] = await Promise.all([
      tmdbGetDetails(input.tmdbId).catch(() => null),
      tmdbGetAggregateCredits(input.tmdbId).catch(() => null),
      SerialsReviewsRepository.getLogsCountBySeriesId(cachedSeries.id),
      SerialsReviewsRepository.getReviewRowsBySeriesId(cachedSeries.id),
      getSimilarSeries(input.tmdbId).catch(() => []),
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
      const ratingOutOfTen = reviewRow.rating;

      return {
        id: reviewRow.id,
        content: reviewRow.content,
        containsSpoilers: reviewRow.containsSpoilers,
        createdAt: reviewRow.createdAt,
        updatedAt: reviewRow.updatedAt,
        watchedDate: reviewRow.watchedDate,
        rating: ratingOutOfTen,
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
      reviewsWithEngagement.map((r) => ({ rating: r.rating })),
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

    const userSeasonInteractions = viewerUserId
      ? await SerialsSeasonInteractionsRepository.getViewerSeasonInteractions(
          viewerUserId,
          cachedSeries.id,
          cachedSeries.tmdbId,
        )
      : [];

    const userSeasonInteractionsMap = new Map<number, typeof userSeasonInteractions[number]>(
      userSeasonInteractions.map((i) => [i.seasonNumber, i])
    );

    const mappedSeasons = (tmdbDetail ? toNormalizedSeasonItems(tmdbDetail) : []).map((season) => {
      const interaction = userSeasonInteractionsMap.get(season.seasonNumber);
      return {
        ...season,
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

    const response = {
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
        globalRating: tmdbRatingOutOfTen,
        globalRatingVoteCount:
          tmdbDetail && tmdbDetail.vote_count > 0 ? tmdbDetail.vote_count : null,
        inProduction: tmdbDetail ? tmdbDetail.in_production : null,
        seasons: mappedSeasons,
      },
      logsCount,
      reviewCount: reviewsWithEngagement.length,
      userRating: viewerUserId
        ? {
            diaryEntryId: viewerDiary?.id ?? null,
            reviewId: viewerReview?.id ?? null,
            watchedDate: viewerDiary?.watchedDate ?? null,
            rewatch: viewerDiary?.rewatch ?? false,
            rating: viewerDiary?.rating ?? null,
            reviewContent: viewerReview?.content ?? null,
            reviewContainsSpoilers: viewerReview?.containsSpoilers ?? null,
          }
        : null,
      reviewsSort,
      reviews: sortedReviews,
      ratingBreakdown: {
        totalRatedReviews: ratingBreakdown.totalRatedReviews,
        averageRating: ratingBreakdown.averageRating,
        buckets: ratingBreakdown.buckets as SerialDetailRatingBreakdownBucket[],
      },
    };

    const viewerTracking = viewerUserId
      ? await calculateViewerTracking(
          viewerUserId,
          cachedSeries.id,
          cachedSeries.tmdbId,
          tmdbDetail,
          userSeasonInteractions,
        )
      : null;

    const similar = (tmdbSimilar ?? []).slice(0, 12).map((sim) => {
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
      ...response,
      similar,
      viewerTracking,
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
      userEpisodeInteractions.map((i) => [i.episodeNumber, i])
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
