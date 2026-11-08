import { normalizeFilmGenres } from "./films-format.helper";
import { normalizeVoteAverage } from "../../media/helpers/media-vote-average.helper";
import { buildMediaRatingBreakdown } from "../../media/helpers/media-rating-breakdown.helper";
import {
  sortReviewsByEngagement,
  type ReviewEngagementIndex,
} from "../../media/helpers/review-engagement.helper";
import type { getFilmDetails, getSimilarFilms } from "../../../infrastructure/tmdb/films";
import type { PersonLinkItem } from "../../people/types/people.types";
import type { FilmsCacheService } from "../services/films-cache.service";
import type { FilmsRepository } from "../repositories/films.repository";
import type { FilmsReviewsRepository } from "../repositories/films-reviews.repository";
import type { FilmDetailReviewSort } from "../dto/films.dto";
import type {
  FilmDetailRatingBreakdownBucket,
  FilmDetailResponse,
  FilmDetailReviewItem,
  FilmReviewsPageResponse,
} from "../types/films.types";
import type { WatchLogRow } from "../../media/types/watch-log.types";

// The pure half of MoviesDetailService.getDetail: every IO the response
// depends on has already been resolved into this object by the service's
// gather() step, so the shaping - review engagement mapping + sort, rating
// breakdown, the similar list, and the response envelope - is a plain
// synchronous transform that unit tests can drive with fixtures (including
// the TMDB-present branches the integration test can't reach).

type FilmRow = NonNullable<Awaited<ReturnType<typeof FilmsCacheService.findForRead>>>;
type TmdbFilmDetail = NonNullable<Awaited<ReturnType<typeof getFilmDetails>>>;
type TmdbSimilarFilms = Awaited<ReturnType<typeof getSimilarFilms>>;
type FilmReviewRow = Awaited<
  ReturnType<typeof FilmsReviewsRepository.getReviewRowsByMovieId>
>["rows"][number];
// The viewer's newest log; their rating is resolved separately (Your Rating).
type ViewerDiaryRow = Pick<WatchLogRow, "id" | "watchedDate" | "rewatch">;
type ViewerReviewRow = Awaited<
  ReturnType<typeof FilmsRepository.getViewerReviewRows>
>[number];

export type FilmDetailInputs = {
  movie: FilmRow;
  tmdbDetail: TmdbFilmDetail | null;
  // Already resolved (person links upserted) by gather().
  directors: PersonLinkItem[];
  cast: PersonLinkItem[];
  // Credits-derived name, falling back to the stored movie.director.
  resolvedDirectorName: string | null;
  logsCount: number;
  reviewRows: FilmReviewRow[];
  engagement: ReviewEngagementIndex;
  communityRatings: { rating: number }[];
  tmdbSimilar: TmdbSimilarFilms;
  viewerDiary: ViewerDiaryRow | null;
  viewerRating: number | null;
  viewerReview: ViewerReviewRow | null;
  viewerUserId: string | null;
  reviewsSort: FilmDetailReviewSort;
  reviewsPage: number;
  reviewsLimit: number;
  reviewsTotalCount: number;
};

// Shared with assembleMovieReviewsPage below.
const toReviewItems = (
  reviewRows: FilmReviewRow[],
  engagement: ReviewEngagementIndex,
): FilmDetailReviewItem[] =>
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

export type AssembleFilmReviewsPageInputs = {
  reviewRows: FilmReviewRow[];
  engagement: ReviewEngagementIndex;
  sort: FilmDetailReviewSort;
  page: number;
  limit: number;
  totalCount: number;
};

export const assembleFilmReviewsPage = (
  inputs: AssembleFilmReviewsPageInputs,
): FilmReviewsPageResponse => {
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

export const assembleFilmDetail = (inputs: FilmDetailInputs): FilmDetailResponse => {
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
      genres: normalizeFilmGenres(movie.genres),
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
          rating: inputs.viewerRating,
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
      buckets: ratingBreakdown.buckets as FilmDetailRatingBreakdownBucket[],
    },
    similar,
  };
};
