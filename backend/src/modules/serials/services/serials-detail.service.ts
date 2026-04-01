import {
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
import { normalizeDetailReviewSort } from "../helpers/serials-query-normalizer.helper";
import { SerialsRepository } from "../repositories/serials.repository";
import { SerialsCacheService } from "./serials-cache.service";
import type {
  SerialDetailRatingBreakdownBucket,
  SerialDetailResponse,
  SerialDetailReviewItem,
  SerialSeasonDetailResponse,
} from "../types/serials.types";

export class SerialsDetailService {
  static async getDetail(input: {
    tmdbId: number;
    viewerUserId?: string | null;
    reviewsSort?: string;
  }): Promise<SerialDetailResponse | null> {
    const cachedSeries = await SerialsCacheService.findOrCreate(input.tmdbId);
    if (!cachedSeries) {
      return null;
    }

    const reviewsSort = normalizeDetailReviewSort(input.reviewsSort);
    const viewerUserId = input.viewerUserId ?? null;

    const [tmdbDetail, logsCount, reviewRows] = await Promise.all([
      tmdbGetDetails(input.tmdbId).catch(() => null),
      SerialsRepository.getLogsCountBySeriesId(cachedSeries.id),
      SerialsRepository.getReviewRowsBySeriesId(cachedSeries.id),
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
      SerialsRepository.getReviewLikeCounts(reviewIds),
      viewerUserId
        ? SerialsRepository.getViewerLikedReviewRows(viewerUserId, reviewIds)
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

    const ratedReviewRows = reviewsWithEngagement.filter(
      (reviewRow) => reviewRow.ratingOutOfTen !== null,
    );

    const ratingBucketCount = new Map<1 | 2 | 3 | 4 | 5, number>([
      [1, 0],
      [2, 0],
      [3, 0],
      [4, 0],
      [5, 0],
    ]);

    for (const ratedReviewRow of ratedReviewRows) {
      if (ratedReviewRow.ratingOutOfTen === null) {
        continue;
      }

      const bucket = toRatingBreakdownBucket(ratedReviewRow.ratingOutOfTen);
      ratingBucketCount.set(bucket, (ratingBucketCount.get(bucket) ?? 0) + 1);
    }

    const totalRatedReviews = ratedReviewRows.length;
    const averageRatingOutOfFive =
      totalRatedReviews > 0
        ? Number(
            (
              ratedReviewRows.reduce((sum, ratedReviewRow) => {
                return sum + (ratedReviewRow.ratingOutOfFive ?? 0);
              }, 0) / totalRatedReviews
            ).toFixed(2),
          )
        : null;

    const ratingBreakdownBuckets: SerialDetailRatingBreakdownBucket[] = [
      5, 4, 3, 2, 1,
    ].map((ratingValueOutOfFive) => {
      const ratingCount =
        ratingBucketCount.get(ratingValueOutOfFive as 1 | 2 | 3 | 4 | 5) ?? 0;

      return {
        ratingValueOutOfFive: ratingValueOutOfFive as 1 | 2 | 3 | 4 | 5,
        count: ratingCount,
        percentage:
          totalRatedReviews > 0
            ? Math.round((ratingCount / totalRatedReviews) * 100)
            : 0,
      };
    });

    const [viewerDiaryRow, viewerReviewRow] = viewerUserId
      ? await Promise.all([
          SerialsRepository.getViewerDiaryRows(viewerUserId, cachedSeries.id),
          SerialsRepository.getViewerReviewRows(viewerUserId, cachedSeries.id),
        ])
      : [[], []];

    const viewerDiary = viewerDiaryRow[0] ?? null;
    const viewerReview = viewerReviewRow[0] ?? null;

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
        creator: cachedSeries.creator ?? normalizedTmdbDetail?.creator ?? null,
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
        totalRatedReviews,
        averageRatingOutOfFive,
        buckets: ratingBreakdownBuckets,
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
