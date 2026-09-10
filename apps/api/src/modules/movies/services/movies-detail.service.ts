import {
  getMovieCredits,
  getMovieDetails as tmdbGetDetails,
  getSimilarMovies,
} from "../../../infrastructure/tmdb/cinemas";
import { loadReviewEngagement } from "../../media/helpers/review-engagement.helper";
import {
  assembleMovieDetail,
  type MovieDetailInputs,
} from "../helpers/assemble-movie-detail.helper";
import { MoviesRepository } from "../repositories/movies.repository";
import { MoviesReviewsRepository } from "../repositories/movies-reviews.repository";
import { MoviesCacheService } from "./movies-cache.service";
import { PeopleCacheService } from "../../people/services/people-cache.service";
import type { MovieDetailReviewSort } from "../dto/movies.dto";
import type { MovieDetailResponse } from "../types/movies.types";

type MovieRow = NonNullable<Awaited<ReturnType<typeof MoviesCacheService.findOrCreate>>>;
type TmdbCredits = NonNullable<Awaited<ReturnType<typeof getMovieCredits>>>;

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

export class MoviesDetailService {
  static async getDetail(input: {
    tmdbId: number;
    viewerUserId?: string | null;
    reviewsSort: MovieDetailReviewSort;
  }): Promise<MovieDetailResponse | null> {
    const movie = await MoviesCacheService.findOrCreate(input.tmdbId);
    if (!movie) {
      return null;
    }

    const inputs = await MoviesDetailService.gather(movie, input);
    return assembleMovieDetail(inputs);
  }

  // Every IO the detail response depends on: TMDB reads, movie repository
  // reads, the director backfill write, person-link resolution, review
  // engagement, and the viewer-only reads. Returns a fully-resolved
  // MovieDetailInputs for the pure assembleMovieDetail step.
  private static async gather(
    movie: MovieRow,
    input: { tmdbId: number; viewerUserId?: string | null; reviewsSort: MovieDetailReviewSort },
  ): Promise<MovieDetailInputs> {
    const viewerUserId = input.viewerUserId ?? null;

    const [tmdbDetail, tmdbCredits, logsCount, reviewRows, tmdbSimilar, communityRatings] =
      await Promise.all([
        tmdbGetDetails(input.tmdbId).catch(() => null),
        getMovieCredits(input.tmdbId).catch(() => null),
        MoviesRepository.getLogsCountByMovieId(movie.id),
        MoviesReviewsRepository.getReviewRowsByMovieId(movie.id),
        getSimilarMovies(input.tmdbId).catch(() => []),
        MoviesRepository.getCommunityRatingsByMovieId(movie.id),
      ]);

    const uniqueDirectorCredits = dedupeDirectorCredits(tmdbCredits);

    const resolvedDirectorName =
      uniqueDirectorCredits
        .map((directorCredit) => toNullableTrimmedText(directorCredit.name))
        .find((directorName): directorName is string => Boolean(directorName)) ?? movie.director;

    if (!movie.director && resolvedDirectorName) {
      await MoviesRepository.updateDirectorByTmdbId(input.tmdbId, resolvedDirectorName).catch(
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
      MoviesReviewsRepository,
      reviewRows.map((reviewRow) => reviewRow.id),
      viewerUserId,
    );

    const [viewerDiaryRow, viewerReviewRow] = viewerUserId
      ? await Promise.all([
          MoviesRepository.getViewerDiaryRows(viewerUserId, movie.id),
          MoviesRepository.getViewerReviewRows(viewerUserId, movie.id),
        ])
      : [[], []];

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
      viewerDiary: viewerDiaryRow[0] ?? null,
      viewerReview: viewerReviewRow[0] ?? null,
      viewerUserId,
      reviewsSort: input.reviewsSort,
    };
  }

  static async getLogsByTmdbId(tmdbId: number) {
    const movie = await MoviesCacheService.findOrCreate(tmdbId);
    return MoviesRepository.getLogsByMovieId(movie.id);
  }
}
