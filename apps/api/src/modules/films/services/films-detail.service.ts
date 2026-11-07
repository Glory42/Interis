import { getFilmCredits } from "../../../infrastructure/tmdb/films";
import type { FilmsDetailTmdbClient } from "./films-detail-tmdb-client";
import { defaultFilmsDetailTmdbClient } from "./films-detail-tmdb-client";
import { loadReviewEngagement } from "../../media/helpers/review-engagement.helper";
import {
  assembleFilmDetail,
  assembleFilmReviewsPage,
  type FilmDetailInputs,
} from "../helpers/assemble-film-detail.helper";
import { FilmsRepository } from "../repositories/films.repository";
import { WatchLogStores } from "../../media/repositories/watch-log.repository";
import { YourRatingService } from "../../media-interactions/services/your-rating.service";
import { FilmsReviewsRepository } from "../repositories/films-reviews.repository";
import { FilmsCacheService } from "./films-cache.service";
import { createTtlCache } from "../../../infrastructure/cache/ttl-cache.helper";
import {
  ANONYMOUS_DETAIL_CACHE_MAX_ENTRIES,
  ANONYMOUS_DETAIL_CACHE_TTL_MS,
} from "../../media/constants/anonymous-detail-cache.constants";
import { PeopleCacheService } from "../../people/services/people-cache.service";
import { UNSAVED_MEDIA_ID } from "../../media/constants/unsaved-media.constants";
import type { FilmDetailReviewSort } from "../dto/films.dto";
import type { FilmDetailResponse, FilmReviewsPageResponse } from "../types/films.types";

type FilmRow = NonNullable<Awaited<ReturnType<typeof FilmsCacheService.findForRead>>>;
type TmdbCredits = NonNullable<Awaited<ReturnType<typeof getFilmCredits>>>;

const toNullableTrimmedText = (value: string | null | undefined): string | null => {
  if (!value) {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

// TMDB lists a director once per department credit; keep the first
// occurrence of each person id.
const dedupeDirectorCredits = (credits: TmdbCredits | null) => {
  const directorCredits = (credits?.crew ?? []).filter(
    (crewMember) => crewMember.job === "Director",
  );
  const unique = new Map<number, (typeof directorCredits)[number]>();
  for (const directorCredit of directorCredits) {
    if (!unique.has(directorCredit.id)) {
      unique.set(directorCredit.id, directorCredit);
    }
  }
  return [...unique.values()];
};

type DetailInput = {
  tmdbId: number;
  viewerUserId?: string | null;
  reviewsSort: FilmDetailReviewSort;
  reviewsPage: number;
  reviewsLimit: number;
};

const getCachedAnonymousDetail = createTtlCache(
  (input: DetailInput, tmdbClient: FilmsDetailTmdbClient) => FilmsDetailService.loadDetail(input, tmdbClient),
  {
    ttlMs: ANONYMOUS_DETAIL_CACHE_TTL_MS,
    maxEntries: ANONYMOUS_DETAIL_CACHE_MAX_ENTRIES,
    keyFn: (input) =>
      `${input.tmdbId}:${input.reviewsSort}:${input.reviewsPage}:${input.reviewsLimit}`,
  },
);

export class FilmsDetailService {
  static async getDetail(
    input: DetailInput,
    tmdbClient: FilmsDetailTmdbClient = defaultFilmsDetailTmdbClient,
  ): Promise<FilmDetailResponse | null> {
    if (!input.viewerUserId) {
      return getCachedAnonymousDetail(input, tmdbClient);
    }

    return FilmsDetailService.loadDetail(input, tmdbClient);
  }

  // Uncached detail load - getDetail routes logged-out viewers through the shared cache.
  static async loadDetail(
    input: DetailInput,
    tmdbClient: FilmsDetailTmdbClient = defaultFilmsDetailTmdbClient,
  ): Promise<FilmDetailResponse | null> {
    const movie = await FilmsCacheService.findForRead(input.tmdbId);
    if (!movie) {
      return null;
    }

    const inputs = await FilmsDetailService.gather(movie, input, tmdbClient);
    return assembleFilmDetail(inputs);
  }

  // The dedicated "load more reviews" endpoint - skips re-fetching TMDB/cast.
  static async getReviews(input: {
    tmdbId: number;
    viewerUserId?: string | null;
    sort: FilmDetailReviewSort;
    page: number;
    limit: number;
  }): Promise<FilmReviewsPageResponse | null> {
    const movie = await FilmsCacheService.findForRead(input.tmdbId);
    if (!movie) {
      return null;
    }

    const viewerUserId = input.viewerUserId ?? null;
    const offset = (input.page - 1) * input.limit;

    const { rows: reviewRows, totalCount } = await FilmsReviewsRepository.getReviewRowsByMovieId(
      movie.id,
      { sort: input.sort, limit: input.limit, offset },
    );

    const engagement = await loadReviewEngagement(
      FilmsReviewsRepository,
      reviewRows.map((reviewRow) => reviewRow.id),
      viewerUserId,
    );

    return assembleFilmReviewsPage({
      reviewRows,
      engagement,
      sort: input.sort,
      page: input.page,
      limit: input.limit,
      totalCount,
    });
  }

  // Every IO the detail response depends on: TMDB reads, movie repository
  // reads, the director backfill write, person-link resolution, review
  // engagement, and the viewer-only reads. Returns a fully-resolved
  // MovieDetailInputs for the pure assembleMovieDetail step.
  private static async gather(
    movie: FilmRow,
    input: {
      tmdbId: number;
      viewerUserId?: string | null;
      reviewsSort: FilmDetailReviewSort;
      reviewsPage: number;
      reviewsLimit: number;
    },
    tmdbClient: FilmsDetailTmdbClient,
  ): Promise<FilmDetailInputs> {
    const viewerUserId = input.viewerUserId ?? null;
    const reviewsOffset = (input.reviewsPage - 1) * input.reviewsLimit;

    const [tmdbDetail, tmdbCredits, logsCount, reviewsPage, tmdbSimilar, communityRatings] =
      await Promise.all([
        tmdbClient.getDetails(input.tmdbId).catch(() => null),
        tmdbClient.getCredits(input.tmdbId).catch(() => null),
        FilmsRepository.getLogsCountByMovieId(movie.id),
        FilmsReviewsRepository.getReviewRowsByMovieId(movie.id, {
          sort: input.reviewsSort,
          limit: input.reviewsLimit,
          offset: reviewsOffset,
        }),
        tmdbClient.getSimilar(input.tmdbId).catch(() => []),
        YourRatingService.communityRatings("movie", movie.id),
      ]);
    const { rows: reviewRows, totalCount: reviewsTotalCount } = reviewsPage;

    const uniqueDirectorCredits = dedupeDirectorCredits(tmdbCredits);

    const resolvedDirectorName =
      uniqueDirectorCredits
        .map((directorCredit) => toNullableTrimmedText(directorCredit.name))
        .find((directorName): directorName is string => Boolean(directorName)) ?? movie.director;

    if (!movie.director && resolvedDirectorName && movie.id !== UNSAVED_MEDIA_ID) {
      await FilmsRepository.updateDirectorByTmdbId(input.tmdbId, resolvedDirectorName).catch(
        () => undefined,
      );
    }

    const [directors, cast] = await Promise.all([
      PeopleCacheService.ensurePersonLinks(
        uniqueDirectorCredits.map((directorCredit) => ({
          tmdbPersonId: directorCredit.id,
          name: directorCredit.name,
          profilePath: directorCredit.profile_path,
          knownForDepartment: directorCredit.known_for_department,
          popularity: directorCredit.popularity,
          routeRole: "director" as const,
          job: directorCredit.job,
          department: directorCredit.department,
        })),
      ),
      PeopleCacheService.ensurePersonLinks(
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
      ),
    ]);

    const engagement = await loadReviewEngagement(
      FilmsReviewsRepository,
      reviewRows.map((reviewRow) => reviewRow.id),
      viewerUserId,
    );

    const [viewerDiary, viewerRating, viewerReviewRow] = viewerUserId
      ? await Promise.all([
          WatchLogStores.film.findLatest(viewerUserId, movie.id),
          YourRatingService.resolve("movie", viewerUserId, movie.id),
          FilmsRepository.getViewerReviewRows(viewerUserId, movie.id),
        ])
      : [null, null, []];

    return {
      movie,
      tmdbDetail,
      directors,
      cast,
      resolvedDirectorName,
      logsCount,
      reviewRows,
      engagement,
      communityRatings,
      tmdbSimilar,
      viewerDiary,
      viewerRating,
      viewerReview: viewerReviewRow[0] ?? null,
      viewerUserId,
      reviewsSort: input.reviewsSort,
      reviewsPage: input.reviewsPage,
      reviewsLimit: input.reviewsLimit,
      reviewsTotalCount,
    };
  }

  static async getLogsByTmdbId(tmdbId: number, limit?: number, offset?: number) {
    const movie = await FilmsCacheService.findForRead(tmdbId);
    return FilmsRepository.getLogsByMovieId(movie.id, limit, offset);
  }
}
