import { NotFoundError } from "../../../commons/errors/app-error";
import { isUuid } from "../../../commons/helpers/uuid.helper";
import { FilmsService } from "../../films/films.service";
import { TvService } from "../../tv/tv.service";
import { PeopleRepository } from "../../people/repositories/people.repository";
import { PublicShareRepository } from "../repositories/public-share.repository";
import { displayNameOf, seasonLabel } from "../helpers/share-meta-format.helper";

export type ShareMediaKind = "film" | "series";

// A content version for card URLs, so an edit gets a fresh image past every cache.
const versionOf = (date: Date) => Math.floor(date.getTime() / 1000).toString(36);

const nullIfNotFound = <T>(promise: Promise<T>): Promise<T | null> =>
  promise.catch((error: unknown) => {
    if (error instanceof NotFoundError) return null;
    throw error;
  });

const genreNames = (genres: { name: string }[] | null | undefined) => (genres ?? []).map((genre) => genre.name);

// Normalised, public-only reads behind link previews and share cards. Never writes
// (Films and Series go through findForRead).
export class PublicShareReadService {
  static async getReview(reviewId: string) {
    if (!isUuid(reviewId)) return null;
    const row = await PublicShareRepository.findReview(reviewId);
    if (!row) return null;

    const isFilm = row.mediaType === "movie";
    const baseTitle = isFilm ? row.filmTitle : row.seriesTitle;
    let mediaTitle = baseTitle ?? (isFilm ? "Unknown movie" : "Unknown series");
    if (!isFilm && row.seasonNumber !== null) {
      const label = row.episodeNumber !== null ? `S${row.seasonNumber}E${row.episodeNumber}` : seasonLabel(row.seasonNumber);
      mediaTitle = `${mediaTitle} · ${label}`;
    }

    return {
      id: row.id,
      version: versionOf(row.updatedAt),
      authorUsername: row.authorUsername,
      authorName: displayNameOf({ username: row.authorUsername, displayUsername: row.authorDisplayUsername }),
      authorAvatarUrl: row.authorAvatarUrl,
      content: row.content,
      containsSpoilers: row.containsSpoilers,
      mediaKind: (isFilm ? "film" : "series") as ShareMediaKind,
      mediaTitle,
      year: isFilm ? row.filmYear : row.seriesYear,
      posterPath: isFilm ? row.filmPosterPath : row.seriesPosterPath,
      backdropPath: isFilm ? row.filmBackdropPath : row.seriesBackdropPath,
      rating: (isFilm ? row.filmLogRating : (row.episodeRating ?? row.seasonRating ?? row.seriesLogRating)) ?? null,
    };
  }

  static async getProfile(username: string) {
    const row = await PublicShareRepository.findProfile(username);
    if (!row) return null;
    return { ...row, displayName: displayNameOf(row) };
  }

  static async getList(listId: string) {
    if (!isUuid(listId)) return null;
    const row = await PublicShareRepository.findPublicList(listId);
    if (!row) return null;
    return {
      ...row,
      version: versionOf(row.updatedAt),
      ownerName: displayNameOf({ username: row.ownerUsername, displayUsername: row.ownerDisplayUsername }),
    };
  }

  static async getFilm(tmdbId: number, options: { withRating: boolean }) {
    const [film, communityRating] = await Promise.all([
      nullIfNotFound(FilmsService.findForRead(tmdbId)),
      options.withRating ? PublicShareRepository.getCommunityRating("movie", tmdbId) : null,
    ]);
    if (!film) return null;
    return {
      mediaKind: "film" as ShareMediaKind,
      tmdbId,
      title: film.title,
      year: film.releaseYear,
      credit: film.director ? `Directed by ${film.director}` : null,
      genres: genreNames(film.genres),
      overview: film.overview,
      posterPath: film.posterPath,
      backdropPath: film.backdropPath,
      communityRating,
    };
  }

  static async getSeries(tmdbId: number, options: { withRating: boolean }) {
    const [series, communityRating] = await Promise.all([
      nullIfNotFound(TvService.findForRead(tmdbId)),
      options.withRating ? PublicShareRepository.getCommunityRating("tv", tmdbId) : null,
    ]);
    if (!series) return null;
    return {
      mediaKind: "series" as ShareMediaKind,
      tmdbId,
      title: series.title,
      year: series.firstAirYear,
      credit: series.creator ? `Created by ${series.creator}` : null,
      genres: genreNames(series.genres),
      overview: series.overview,
      posterPath: series.posterPath,
      backdropPath: series.backdropPath,
      numberOfSeasons: series.numberOfSeasons,
      communityRating,
    };
  }

  // Cached People only, like the in-app page: an unknown slug is a 404 there too.
  static async getPerson(slug: string) {
    const resolved = await PeopleRepository.findByCanonicalOrAliasSlug(slug);
    return resolved?.person ?? null;
  }
}
