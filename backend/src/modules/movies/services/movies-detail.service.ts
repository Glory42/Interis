import {
  getMovieCredits,
  getMovieDetails as tmdbGetDetails,
} from "../../../infrastructure/tmdb/cinemas";
import {
  normalizeMovieGenres,
  toRatingBreakdownBucket,
  toRatingOutOfFive,
} from "../helpers/movies-format.helper";
import { normalizeDetailReviewSort } from "../helpers/movies-query-normalizer.helper";
import { MoviesRepository } from "../repositories/movies.repository";
import { MoviesCacheService } from "./movies-cache.service";
import { PeopleService } from "../../people/people.service";
import type {
  MovieDetailRatingBreakdownBucket,
  MovieDetailResponse,
  MovieDetailReviewItem,
} from "../types/movies.types";

const toNullableTrimmedText = (value: string | null | undefined): string | null => {
  if (!value) {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

export class MoviesDetailService {
  static async getDetail(input: {
    tmdbId: number;
    viewerUserId?: string | null;
    reviewsSort?: string;
  }): Promise<MovieDetailResponse | null> {
    const movie = await MoviesCacheService.findOrCreate(input.tmdbId);
    if (!movie) {
      return null;
    }

    const reviewsSort = normalizeDetailReviewSort(input.reviewsSort);
    const viewerUserId = input.viewerUserId ?? null;

    const [tmdbDetail, tmdbCredits, logsCount, reviewRows] = await Promise.all([
      tmdbGetDetails(input.tmdbId).catch(() => null),
      getMovieCredits(input.tmdbId).catch(() => null),
      MoviesRepository.getLogsCountByMovieId(movie.id),
      MoviesRepository.getReviewRowsByMovieId(movie.id),
    ]);

    const directorCredits = (tmdbCredits?.crew ?? []).filter(
      (crewMember) => crewMember.job === "Director",
    );

    const uniqueDirectorCredits = new Map<number, (typeof directorCredits)[number]>();
    for (const directorCredit of directorCredits) {
      if (!uniqueDirectorCredits.has(directorCredit.id)) {
        uniqueDirectorCredits.set(directorCredit.id, directorCredit);
      }
    }

    const resolvedDirectorName =
      [...uniqueDirectorCredits.values()]
        .map((directorCredit) => toNullableTrimmedText(directorCredit.name))
        .find((directorName): directorName is string => Boolean(directorName)) ??
      movie.director;

    if (!movie.director && resolvedDirectorName) {
      await MoviesRepository.updateDirectorByTmdbId(input.tmdbId, resolvedDirectorName).catch(
        () => undefined,
      );
    }

    const directors = await PeopleService.ensurePersonLinks(
      [...uniqueDirectorCredits.values()].map((directorCredit) => ({
        tmdbPersonId: directorCredit.id,
        name: directorCredit.name,
        profilePath: directorCredit.profile_path,
        knownForDepartment: directorCredit.known_for_department,
        popularity: directorCredit.popularity,
        routeRole: "director" as const,
        job: directorCredit.job,
        department: directorCredit.department,
      })),
    );

    const cast = await PeopleService.ensurePersonLinks(
      [...(tmdbCredits?.cast ?? [])]
        .sort((leftMember, rightMember) => leftMember.order - rightMember.order)
        .slice(0, 20)
        .map((castMember) => ({
          tmdbPersonId: castMember.id,
          name: castMember.name,
          profilePath: castMember.profile_path,
          knownForDepartment: castMember.known_for_department,
          popularity: castMember.popularity,
          routeRole: "actor" as const,
          character: castMember.character,
          department: castMember.known_for_department,
        })),
    );

    const reviewIds = reviewRows.map((reviewRow) => reviewRow.id);

    const [likeRows, viewerLikedRows] = await Promise.all([
      MoviesRepository.getReviewLikeCounts(reviewIds),
      viewerUserId
        ? MoviesRepository.getViewerLikedReviewRows(viewerUserId, reviewIds)
        : Promise.resolve([]),
    ]);

    const likeCountByReviewId = new Map<string, number>(
      likeRows.map((likeRow) => [likeRow.reviewId, likeRow.likeCount]),
    );
    const viewerLikedReviewIds = new Set<string>(
      viewerLikedRows.map((likedRow) => likedRow.reviewId),
    );

    const reviewsWithEngagement: MovieDetailReviewItem[] = reviewRows.map((reviewRow) => {
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

    const ratingBreakdownBuckets: MovieDetailRatingBreakdownBucket[] = [
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
          MoviesRepository.getViewerDiaryRows(viewerUserId, movie.id),
          MoviesRepository.getViewerReviewRows(viewerUserId, movie.id),
        ])
      : [[], []];

    const viewerDiary = viewerDiaryRow[0] ?? null;
    const viewerReview = viewerReviewRow[0] ?? null;

    const globalRatingOutOfTen =
      tmdbDetail && Number.isFinite(tmdbDetail.vote_average)
        ? Number(tmdbDetail.vote_average.toFixed(1))
        : null;

    return {
      movie: {
        id: movie.id,
        tmdbId: movie.tmdbId,
        title: movie.title,
        originalTitle: movie.originalTitle,
        posterPath: movie.posterPath,
        backdropPath: movie.backdropPath,
        releaseDate: movie.releaseDate,
        releaseYear: movie.releaseYear,
        director: resolvedDirectorName,
        directors,
        cast,
        runtime: movie.runtime,
        overview: movie.overview,
        tagline: movie.tagline,
        genres: normalizeMovieGenres(movie.genres),
        languageCode:
          tmdbDetail && tmdbDetail.original_language.trim().length > 0
            ? tmdbDetail.original_language
            : null,
        productionCountries:
          tmdbDetail?.production_countries
            .map((country) => country.name.trim())
            .filter((countryName) => countryName.length > 0) ?? [],
        budget:
          tmdbDetail && tmdbDetail.budget > 0 && Number.isFinite(tmdbDetail.budget)
            ? tmdbDetail.budget
            : null,
        revenue:
          tmdbDetail && tmdbDetail.revenue > 0 && Number.isFinite(tmdbDetail.revenue)
            ? tmdbDetail.revenue
            : null,
        globalRatingOutOfTen,
        globalRatingOutOfFive: toRatingOutOfFive(globalRatingOutOfTen),
        globalRatingVoteCount:
          tmdbDetail && tmdbDetail.vote_count > 0 ? tmdbDetail.vote_count : null,
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

  static async getLogsByTmdbId(tmdbId: number) {
    const movie = await MoviesCacheService.findOrCreate(tmdbId);
    return MoviesRepository.getLogsByMovieId(movie.id);
  }
}
