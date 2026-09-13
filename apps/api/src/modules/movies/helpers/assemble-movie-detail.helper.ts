import { normalizeMovieGenres } from "./movies-format.helper";
import { normalizeVoteAverage } from "../../media/helpers/media-vote-average.helper";
import { buildMediaRatingBreakdown } from "../../media/helpers/media-rating-breakdown.helper";
import {
  sortReviewsByEngagement,
  type ReviewEngagementIndex,
} from "../../media/helpers/review-engagement.helper";
import type { getMovieDetails, getSimilarMovies } from "../../../infrastructure/tmdb/cinemas";
import type { PersonLinkItem } from "../../people/types/people.types";
import type { MoviesCacheService } from "../services/movies-cache.service";
import type { MoviesRepository } from "../repositories/movies.repository";
import type { MoviesReviewsRepository } from "../repositories/movies-reviews.repository";
import type { MovieDetailReviewSort } from "../dto/movies.dto";
import type {
  MovieDetailRatingBreakdownBucket,
  MovieDetailResponse,
  MovieDetailReviewItem,
  MovieReviewsPageResponse,
} from "../types/movies.types";

// The pure half of MoviesDetailService.getDetail: every IO the response
// depends on has already been resolved into this object by the service's
// gather() step, so the shaping - review engagement mapping + sort, rating
// breakdown, the similar list, and the response envelope - is a plain
// synchronous transform that unit tests can drive with fixtures (including
// the TMDB-present branches the integration test can't reach).

type MovieRow = NonNullable<Awaited<ReturnType<typeof MoviesCacheService.findOrCreate>>>;
type TmdbMovieDetail = NonNullable<Awaited<ReturnType<typeof getMovieDetails>>>;
type TmdbSimilarMovies = Awaited<ReturnType<typeof getSimilarMovies>>;
type MovieReviewRow = Awaited<
  ReturnType<typeof MoviesReviewsRepository.getReviewRowsByMovieId>
>["rows"][number];
type ViewerDiaryRow = Awaited<
  ReturnType<typeof MoviesRepository.getViewerDiaryRows>
>[number];
type ViewerReviewRow = Awaited<
  ReturnType<typeof MoviesRepository.getViewerReviewRows>
>[number];

export type MovieDetailInputs = {
  movie: MovieRow;
  tmdbDetail: TmdbMovieDetail | null;
  // Already resolved (person links upserted) by gather().
  directors: PersonLinkItem[];
  cast: PersonLinkItem[];
  // Credits-derived name, falling back to the stored movie.director.
  resolvedDirectorName: string | null;
  logsCount: number;
  reviewRows: MovieReviewRow[];
  engagement: ReviewEngagementIndex;
  communityRatings: { rating: number }[];
  tmdbSimilar: TmdbSimilarMovies;
  viewerDiary: ViewerDiaryRow | null;
  viewerReview: ViewerReviewRow | null;
  viewerUserId: string | null;
  reviewsSort: MovieDetailReviewSort;
  reviewsPage: number;
  reviewsLimit: number;
  reviewsTotalCount: number;
};

// Shared with assembleMovieReviewsPage below.
const toReviewItems = (
  reviewRows: MovieReviewRow[],
  engagement: ReviewEngagementIndex,
): MovieDetailReviewItem[] =>
  reviewRows.map((reviewRow) => ({
    id: reviewRow.id,
    content: reviewRow.content,
    containsSpoilers: reviewRow.containsSpoilers,
    createdAt: reviewRow.createdAt,
    updatedAt: reviewRow.updatedAt,
    watchedDate: reviewRow.watchedDate,
    rating: reviewRow.rating,
    likeCount: engagement.likeCountFor(reviewRow.id),
    viewerHasLiked: engagement.viewerHasLiked(reviewRow.id),
    author: {
      id: reviewRow.userId,
      username: reviewRow.authorUsername,
      displayUsername: reviewRow.authorDisplayUsername,
      avatarUrl: reviewRow.authorAvatarUrl,
    },
  }));

export type AssembleMovieReviewsPageInputs = {
  reviewRows: MovieReviewRow[];
  engagement: ReviewEngagementIndex;
  sort: MovieDetailReviewSort;
  page: number;
  limit: number;
  totalCount: number;
};

export const assembleMovieReviewsPage = (
  inputs: AssembleMovieReviewsPageInputs,
): MovieReviewsPageResponse => {
  const items = sortReviewsByEngagement(
    toReviewItems(inputs.reviewRows, inputs.engagement),
    inputs.sort,
  );

  return {
    items,
    sort: inputs.sort,
    page: inputs.page,
    limit: inputs.limit,
    totalCount: inputs.totalCount,
    hasMore: inputs.page * inputs.limit < inputs.totalCount,
  };
};

export const assembleMovieDetail = (inputs: MovieDetailInputs): MovieDetailResponse => {
  const { movie, tmdbDetail } = inputs;

  const sortedReviews = sortReviewsByEngagement(
    toReviewItems(inputs.reviewRows, inputs.engagement),
    inputs.reviewsSort,
  );
  const ratingBreakdown = buildMediaRatingBreakdown(inputs.communityRatings);

  const similar = (inputs.tmdbSimilar ?? []).slice(0, 12).map((sim) => {
    const releaseYear = sim.release_date
      ? Number.parseInt(sim.release_date.slice(0, 4), 10)
      : null;

    return {
      tmdbId: sim.id,
      title: sim.title,
      posterPath: sim.poster_path,
      releaseYear: Number.isNaN(releaseYear) ? null : releaseYear,
    };
  });

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
      director: inputs.resolvedDirectorName,
      directors: inputs.directors,
      cast: inputs.cast,
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
      globalRating: normalizeVoteAverage(tmdbDetail?.vote_average),
      globalRatingVoteCount:
        tmdbDetail && tmdbDetail.vote_count > 0 ? tmdbDetail.vote_count : null,
    },
    logsCount: inputs.logsCount,
    reviewCount: inputs.reviewsTotalCount,
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
    reviewsPage: inputs.reviewsPage,
    reviewsLimit: inputs.reviewsLimit,
    reviewsHasMore: inputs.reviewsPage * inputs.reviewsLimit < inputs.reviewsTotalCount,
    ratingBreakdown: {
      totalRatedReviews: ratingBreakdown.totalRatedReviews,
      averageRating: ratingBreakdown.averageRating,
      buckets: ratingBreakdown.buckets as MovieDetailRatingBreakdownBucket[],
    },
    similar,
  };
};
